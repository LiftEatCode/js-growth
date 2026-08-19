"use server";

import { revalidatePath } from "next/cache";

import { getInternalSession } from "@/lib/internal-auth";
import { prisma } from "@/lib/prisma";
import { MAX_OUTREACH_OUTCOME_NOTES_CHARS } from "@/lib/prospecting/outreach/constants";
import {
  canRecordOutcomeForMessageStatus,
  isBounceOutcomeAllowed,
  mergeProspectOutreachStatus,
  outreachStatusForOutcome,
} from "@/lib/prospecting/outreach/lifecycle";
import {
  isOutreachOutcomeValue,
  type OutreachOutcomeValue,
} from "@/lib/prospecting/outreach/outcome-types";
import {
  buildSuppressionTargets,
  suppressionReasonForBounce,
  suppressionReasonForNotInterested,
} from "@/lib/prospecting/suppression/apply";

export interface OutcomeActionResult {
  success: boolean;
  message?: string;
  campaignId?: string;
  prospectId?: string;
}

function revalidateProspect(campaignId: string, prospectId: string) {
  revalidatePath("/reports/prospecting");
  revalidatePath(`/reports/prospecting/${campaignId}`);
  revalidatePath(`/reports/prospecting/${campaignId}/prospects/${prospectId}`);
}

export async function recordOutreachOutcome(input: {
  campaignId: string;
  prospectId: string;
  messageId: string;
  outcome: string;
  notes?: string;
  occurredAt?: string;
  suppressFutureOutreach?: boolean;
  explicitOptOut?: boolean;
}): Promise<OutcomeActionResult> {
  const session = await getInternalSession();

  if (!session) {
    return {
      success: false,
      message: "You are not authorized to record outcomes.",
    };
  }

  if (!isOutreachOutcomeValue(input.outcome)) {
    return {
      success: false,
      message: "Select a valid outcome.",
    };
  }

  const notes = input.notes?.trim() ?? "";

  if (notes.length > MAX_OUTREACH_OUTCOME_NOTES_CHARS) {
    return {
      success: false,
      message: `Notes must be ${MAX_OUTREACH_OUTCOME_NOTES_CHARS.toLocaleString()} characters or fewer.`,
    };
  }

  const message = await prisma.outreachMessage.findFirst({
    where: {
      id: input.messageId,
      prospectId: input.prospectId,
      campaignId: input.campaignId,
    },
    include: {
      prospect: {
        select: {
          id: true,
          hostname: true,
          outreachStatus: true,
        },
      },
      contact: {
        select: {
          id: true,
          normalizedEmail: true,
          email: true,
        },
      },
    },
  });

  if (!message || !message.prospect) {
    return {
      success: false,
      message: "The outreach message could not be found.",
    };
  }

  if (!canRecordOutcomeForMessageStatus(message.status, message.channel)) {
    return {
      success: false,
      message: "Outcomes can only be recorded for completed outreach messages.",
    };
  }

  if (input.outcome === "BOUNCED" && !isBounceOutcomeAllowed(message.channel)) {
    return {
      success: false,
      message: "Bounced is only available for email outreach.",
    };
  }

  const occurredAt = input.occurredAt
    ? new Date(input.occurredAt)
    : new Date();

  if (Number.isNaN(occurredAt.getTime())) {
    return {
      success: false,
      message: "Enter a valid outcome date.",
    };
  }

  const outcome = input.outcome as OutreachOutcomeValue;
  const snapshotSubject = message.subject;
  const snapshotBody = message.bodyText;

  await prisma.$transaction(async (transaction) => {
    await transaction.outreachOutcome.create({
      data: {
        outreachMessageId: message.id,
        prospectId: message.prospectId,
        outcome,
        occurredAt,
        notes: notes || null,
        recordedByEmail: session.email,
      },
    });

    const nextStatus = outreachStatusForOutcome(outcome);

    if (nextStatus) {
      await transaction.prospect.update({
        where: { id: message.prospectId },
        data: {
          outreachStatus: mergeProspectOutreachStatus(
            message.prospect.outreachStatus,
            nextStatus,
          ),
        },
      });
    }

    if (outcome === "NOT_INTERESTED") {
      const reason = suppressionReasonForNotInterested({
        explicitOptOut: Boolean(input.explicitOptOut),
        suppressFutureOutreach: Boolean(input.suppressFutureOutreach),
      });

      if (reason) {
        const targets = buildSuppressionTargets({
          hostname: message.prospect.hostname,
          email:
            message.contact?.normalizedEmail ??
            message.contact?.email ??
            message.toEmail,
          reason,
          suppressHostname: true,
          suppressEmail: Boolean(
            message.contact?.normalizedEmail ??
              message.contact?.email ??
              message.toEmail,
          ),
        });

        for (const target of targets) {
          const existing = await transaction.suppressionEntry.findFirst({
            where: {
              type: target.type,
              value: target.value,
            },
            select: { id: true },
          });

          if (!existing) {
            await transaction.suppressionEntry.create({ data: target });
          }
        }
      }
    }

    if (outcome === "BOUNCED") {
      const email =
        message.contact?.normalizedEmail ??
        message.contact?.email ??
        message.toEmail;

      if (message.contact) {
        await transaction.prospectContact.update({
          where: { id: message.contact.id },
          data: { status: "SUPPRESSED" },
        });
      }

      const targets = buildSuppressionTargets({
        hostname: null,
        email,
        reason: suppressionReasonForBounce(),
        suppressHostname: false,
        suppressEmail: true,
      });

      for (const target of targets) {
        const existing = await transaction.suppressionEntry.findFirst({
          where: {
            type: target.type,
            value: target.value,
          },
          select: { id: true },
        });

        if (!existing) {
          await transaction.suppressionEntry.create({ data: target });
        }
      }
    }
  });

  const unchanged = await prisma.outreachMessage.findUnique({
    where: { id: message.id },
    select: {
      subject: true,
      bodyText: true,
      status: true,
    },
  });

  if (
    !unchanged ||
    unchanged.subject !== snapshotSubject ||
    unchanged.bodyText !== snapshotBody ||
    (message.channel === "EMAIL" && unchanged.status !== "SENT") ||
    (message.channel === "CONTACT_FORM" && unchanged.status !== "SUBMITTED")
  ) {
    throw new Error("Recording an outcome must not mutate sent message content.");
  }

  revalidateProspect(input.campaignId, input.prospectId);

  return {
    success: true,
    campaignId: input.campaignId,
    prospectId: input.prospectId,
    message: "Outcome recorded.",
  };
}
