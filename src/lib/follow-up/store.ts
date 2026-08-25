import "server-only";

import { createHash } from "node:crypto";

import type {
  FollowUpActivityType,
  FollowUpDirection,
  FollowUpOutcome,
  Prisma,
} from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import {
  isFollowUpActivityType,
  isFollowUpDirection,
  isFollowUpOutcome,
  type FollowUpSubjectKind,
} from "./constants";

export type RecordFollowUpActivityInput = {
  subjectKind: FollowUpSubjectKind;
  subjectId: string;
  activityType: string;
  direction: string;
  outcome: string;
  summary: string;
  occurredAt?: Date;
  nextFollowUpAt?: Date | null;
  clearFollowUp?: boolean;
  createdByEmail?: string | null;
  /** Client-generated key; rapid duplicates return existing row. */
  idempotencyKey?: string | null;
};

function assertExactlyOneSubject(input: RecordFollowUpActivityInput) {
  if (!input.subjectId?.trim()) {
    throw new Error("subjectId required");
  }
}

export async function recordFollowUpActivity(
  input: RecordFollowUpActivityInput,
): Promise<
  | { ok: true; id: string; deduplicated: boolean }
  | { ok: false; error: string }
> {
  try {
    assertExactlyOneSubject(input);
    if (!isFollowUpActivityType(input.activityType)) {
      return { ok: false, error: "invalid_activity_type" };
    }
    if (!isFollowUpDirection(input.direction)) {
      return { ok: false, error: "invalid_direction" };
    }
    if (!isFollowUpOutcome(input.outcome)) {
      return { ok: false, error: "invalid_outcome" };
    }
    const summary = input.summary.trim().slice(0, 4000);
    if (!summary) {
      return { ok: false, error: "summary_required" };
    }

    const idempotencyKey = input.idempotencyKey?.trim()
      ? input.idempotencyKey.trim().slice(0, 120)
      : null;

    if (idempotencyKey) {
      const existing = await prisma.followUpActivity.findUnique({
        where: { idempotencyKey },
        select: { id: true },
      });
      if (existing) {
        return { ok: true, id: existing.id, deduplicated: true };
      }
    }

    // Suppression / DNC gate for outbound attempts on prospects
    if (
      input.subjectKind === "PROSPECT" &&
      input.direction === "OUTBOUND" &&
      input.outcome !== "DO_NOT_CONTACT"
    ) {
      const blocked = await isProspectOutboundBlocked(input.subjectId);
      if (blocked) {
        return { ok: false, error: "do_not_contact" };
      }
    }

    const data: Prisma.FollowUpActivityCreateInput = {
      activityType: input.activityType as FollowUpActivityType,
      direction: input.direction as FollowUpDirection,
      outcome: input.outcome as FollowUpOutcome,
      summary,
      occurredAt: input.occurredAt ?? new Date(),
      nextFollowUpAt: input.clearFollowUp
        ? null
        : (input.nextFollowUpAt ?? undefined),
      createdByEmail: input.createdByEmail?.trim().toLowerCase() || null,
      idempotencyKey,
      ...(input.subjectKind === "LEAD"
        ? { lead: { connect: { id: input.subjectId } } }
        : {}),
      ...(input.subjectKind === "PROSPECT"
        ? { prospect: { connect: { id: input.subjectId } } }
        : {}),
      ...(input.subjectKind === "OPPORTUNITY"
        ? { opportunity: { connect: { id: input.subjectId } } }
        : {}),
    };

    const row = await prisma.$transaction(async (tx) => {
      const created = await tx.followUpActivity.create({
        data,
        select: { id: true },
      });

      if (input.subjectKind === "LEAD") {
        if (input.clearFollowUp) {
          await tx.lead.update({
            where: { id: input.subjectId },
            data: { followUpAt: null },
          });
        } else if (input.nextFollowUpAt) {
          await tx.lead.update({
            where: { id: input.subjectId },
            data: { followUpAt: input.nextFollowUpAt },
          });
        }
        if (input.outcome === "DO_NOT_CONTACT") {
          await tx.lead.update({
            where: { id: input.subjectId },
            data: { status: "LOST", followUpAt: null },
          });
        } else if (
          input.outcome === "QUALIFIED" ||
          input.outcome === "INTERESTED"
        ) {
          const lead = await tx.lead.findUnique({
            where: { id: input.subjectId },
            select: { status: true },
          });
          if (lead && (lead.status === "NEW" || lead.status === "CONTACTED")) {
            await tx.lead.update({
              where: { id: input.subjectId },
              data: { status: "QUALIFIED", contacted: true },
            });
          }
        } else if (input.direction === "OUTBOUND") {
          const lead = await tx.lead.findUnique({
            where: { id: input.subjectId },
            select: { status: true },
          });
          if (lead?.status === "NEW") {
            await tx.lead.update({
              where: { id: input.subjectId },
              data: { status: "CONTACTED", contacted: true },
            });
          }
        }
      }

      if (input.subjectKind === "PROSPECT") {
        if (input.clearFollowUp) {
          await tx.prospect.update({
            where: { id: input.subjectId },
            data: { followUpAt: null },
          });
        } else if (input.nextFollowUpAt) {
          await tx.prospect.update({
            where: { id: input.subjectId },
            data: { followUpAt: input.nextFollowUpAt },
          });
        }
      }

      if (input.subjectKind === "OPPORTUNITY" && input.nextFollowUpAt) {
        await tx.opportunity.update({
          where: { id: input.subjectId },
          data: {
            nextActionAt: input.nextFollowUpAt,
            nextAction: summary.slice(0, 200),
          },
        });
      }

      return created;
    });

    return { ok: true, id: row.id, deduplicated: false };
  } catch (error) {
    console.error("recordFollowUpActivity failed:", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "persist_failed",
    };
  }
}

async function isProspectOutboundBlocked(prospectId: string): Promise<boolean> {
  const prospect = await prisma.prospect.findUnique({
    where: { id: prospectId },
    select: {
      outreachStatus: true,
      hostname: true,
      contacts: { select: { email: true, status: true }, take: 20 },
    },
  });
  if (!prospect) {
    return true;
  }
  if (prospect.outreachStatus === "SUPPRESSED") {
    return true;
  }
  if (prospect.contacts.some((c) => c.status === "SUPPRESSED")) {
    return true;
  }
  if (prospect.hostname) {
    const hostSuppression = await prisma.suppressionEntry.findFirst({
      where: {
        type: "HOSTNAME",
        value: prospect.hostname.toLowerCase(),
        reason: { in: ["OPTED_OUT", "COMPLAINT", "BOUNCED", "MANUAL"] },
      },
      select: { id: true },
    });
    if (hostSuppression) {
      return true;
    }
  }
  return false;
}

export async function listFollowUpActivities(input: {
  subjectKind: FollowUpSubjectKind;
  subjectId: string;
  limit?: number;
}) {
  const take = Math.min(Math.max(input.limit ?? 50, 1), 100);
  const where =
    input.subjectKind === "LEAD"
      ? { leadId: input.subjectId }
      : input.subjectKind === "PROSPECT"
        ? { prospectId: input.subjectId }
        : { opportunityId: input.subjectId };

  return prisma.followUpActivity.findMany({
    where,
    orderBy: { occurredAt: "desc" },
    take,
  });
}

export function buildIdempotencyKey(parts: {
  subjectKind: string;
  subjectId: string;
  activityType: string;
  summary: string;
  bucket: string;
}): string {
  const raw = [
    parts.subjectKind,
    parts.subjectId,
    parts.activityType,
    parts.summary.trim().slice(0, 80),
    parts.bucket,
  ].join("|");
  return createHash("sha256").update(raw).digest("hex").slice(0, 48);
}
