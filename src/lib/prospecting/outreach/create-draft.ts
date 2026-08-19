import "server-only";

import { prisma } from "@/lib/prisma";
import { parseStoredQualification } from "@/lib/prospecting/qualification/parse";
import { loadQualificationBlockers } from "@/lib/prospecting/qualification/audit-prospect";
import { canContactProspect } from "@/lib/prospecting/suppression/can-contact";
import { loadContactSuppressionContext } from "@/lib/prospecting/suppression/load";
import type { WebsiteAuditResult } from "@/lib/website-audit/types";
import {
  InvalidAiOutputError,
} from "@/lib/website-audit/ai-interpretation/errors";
import { MissingOpenAiKeyError } from "@/lib/website-audit/ai-interpretation/openai-provider";
import { Prisma } from "@/generated/prisma/client";

import { buildOutreachDraftContext } from "./context";
import { generateOutreachDraft } from "./generate";
import { isUsableOutreachDraft } from "./limit";

export type DraftGenerationOutcome =
  | "GENERATED"
  | "REUSED"
  | "DRAFT_GENERATION_FAILED"
  | "SKIPPED";

export interface CreateOutreachDraftResult {
  outcome: DraftGenerationOutcome;
  message: string;
  subject?: string;
}

function senderFromEmail(): string {
  return (
    process.env.CONTACT_FROM_EMAIL?.trim() ||
    "JS Solutions <hello@js-growth.com>"
  );
}

export async function createOrReuseOutreachDraft(options: {
  campaignId: string;
  prospectId: string;
  regenerate?: boolean;
}): Promise<CreateOutreachDraftResult> {
  const membership = await prisma.campaignProspect.findUnique({
    where: {
      campaignId_prospectId: {
        campaignId: options.campaignId,
        prospectId: options.prospectId,
      },
    },
    include: {
      prospect: {
        include: {
          auditReport: true,
          contacts: true,
          outreachMessages: {
            where: {
              campaignId: options.campaignId,
            },
            orderBy: { createdAt: "desc" },
            take: 5,
          },
        },
      },
    },
  });

  if (!membership) {
    return {
      outcome: "SKIPPED",
      message: "The prospect is not in this campaign.",
    };
  }

  const prospect = membership.prospect;

  if (
    prospect.qualificationStatus !== "QUALIFIED" ||
    !membership.isSelectedTopN
  ) {
    return {
      outcome: "SKIPPED",
      message: "Drafts are only created for selected qualified prospects.",
    };
  }

  const existing = prospect.outreachMessages.find((message) =>
    isUsableOutreachDraft(message.status),
  );

  if (existing && !options.regenerate) {
    return {
      outcome: "REUSED",
      message: "An existing draft was reused.",
      subject: existing.subject,
    };
  }

  const primary =
    prospect.contacts.find(
      (contact) =>
        contact.isPrimary &&
        (contact.status === "SELECTED" || contact.status === "DISCOVERED"),
    ) ??
    prospect.contacts.find(
      (contact) =>
        contact.status === "SELECTED" || contact.status === "DISCOVERED",
    );

  if (!primary) {
    return {
      outcome: "SKIPPED",
      message: "A primary public contact is required before drafting.",
    };
  }

  const suppression = await loadContactSuppressionContext({
    hostname: prospect.hostname,
    emails: [primary.normalizedEmail],
  });
  const blockers = await loadQualificationBlockers({
    hostname: prospect.hostname,
  });
  const allowed = canContactProspect({
    hostname: prospect.hostname,
    email: primary.normalizedEmail,
    suppressedHostnames: suppression.suppressedHostnames,
    suppressedEmails: suppression.suppressedEmails,
    customerHostnames: suppression.customerHostnames,
    existingLead: blockers.existingLead,
    contactStatus: primary.status,
  });

  if (!allowed.allowed) {
    await prisma.prospect.update({
      where: { id: prospect.id },
      data: { outreachStatus: "SUPPRESSED" },
    });

    return {
      outcome: "SKIPPED",
      message: "Outreach is blocked by suppression or an existing lead.",
    };
  }

  const qualification = parseStoredQualification(membership.qualificationJson);

  if (!qualification?.primaryFindingId || !prospect.auditReport) {
    return {
      outcome: "SKIPPED",
      message: "A usable prospecting audit finding is required.",
    };
  }

  const audit = prospect.auditReport.audit as unknown as WebsiteAuditResult;
  const context = buildOutreachDraftContext({
    businessName: prospect.businessName,
    website: prospect.website ?? prospect.auditReport.website,
    city: prospect.city,
    state: prospect.state,
    industry: prospect.industry,
    audit,
    qualification,
  });

  if ("error" in context) {
    return {
      outcome: "SKIPPED",
      message: context.error,
    };
  }

  try {
    const generated = await generateOutreachDraft({ context });
    const attemptCount = (existing?.generationAttemptCount ?? 0) + 1;

    if (existing && options.regenerate) {
      await prisma.outreachMessage.update({
        where: { id: existing.id },
        data: {
          status: "CANCELLED",
        },
      });
    }

    await prisma.outreachMessage.create({
      data: {
        prospectId: prospect.id,
        campaignId: options.campaignId,
        contactId: primary.id,
        auditReportId: prospect.auditReport.id,
        toEmail: primary.email,
        fromEmail: senderFromEmail(),
        replyTo: process.env.CONTACT_FROM_EMAIL?.trim() || null,
        subject: generated.subject,
        bodyText: generated.body,
        findingIds: [
          qualification.primaryFindingId,
          qualification.secondaryFindingId,
        ].filter((id): id is string => Boolean(id)),
        primaryFindingId: qualification.primaryFindingId,
        secondaryFindingId: qualification.secondaryFindingId,
        status: "NEEDS_REVIEW",
        generationModel: generated.model,
        generationAttemptCount: attemptCount,
        promptTokens: generated.promptTokens,
        completionTokens: generated.completionTokens,
        generationJson: {
          version: 1,
          status: "generated",
        } as Prisma.InputJsonValue,
      },
    });

    await prisma.prospect.update({
      where: { id: prospect.id },
      data: { outreachStatus: "DRAFT_READY" },
    });

    return {
      outcome: "GENERATED",
      message: "Draft generated for review.",
      subject: generated.subject,
    };
  } catch (error) {
    const safe =
      error instanceof MissingOpenAiKeyError
        ? "AI drafting is not configured."
        : error instanceof InvalidAiOutputError
          ? "The draft could not be validated and was not saved."
          : "The draft could not be generated.";

    await prisma.prospect.update({
      where: { id: prospect.id },
      data: { outreachStatus: "DRAFT_GENERATION_FAILED" },
    });

    return {
      outcome: "DRAFT_GENERATION_FAILED",
      message: safe,
    };
  }
}
