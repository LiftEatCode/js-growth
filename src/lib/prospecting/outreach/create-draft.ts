import "server-only";

import { prisma } from "@/lib/prisma";
import { parseStoredQualification } from "@/lib/prospecting/qualification/parse";
import { loadQualificationBlockers } from "@/lib/prospecting/qualification/audit-prospect";
import { selectProspectOutreachChannel } from "@/lib/prospecting/contacts/select-channel";
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
          contactForms: true,
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

  const suppression = await loadContactSuppressionContext({
    hostname: prospect.hostname,
    emails: prospect.contacts.map((contact) => contact.normalizedEmail),
  });
  const blockers = await loadQualificationBlockers({
    hostname: prospect.hostname,
  });

  const channel = selectProspectOutreachChannel({
    hostname: prospect.hostname,
    leadId: prospect.leadId,
    outreachStatus: prospect.outreachStatus,
    contacts: prospect.contacts,
    contactForms: prospect.contactForms,
    suppressedHostnames: suppression.suppressedHostnames,
    suppressedEmails: suppression.suppressedEmails,
    customerHostnames: suppression.customerHostnames,
    existingLead: blockers.existingLead || Boolean(prospect.leadId),
  });

  if (channel.type === "NONE") {
    await prisma.prospect.update({
      where: { id: prospect.id },
      data: {
        outreachStatus:
          channel.reason.includes("SUPPRESSED") ||
          channel.reason === "PROSPECT_SUPPRESSED"
            ? "SUPPRESSED"
            : prospect.outreachStatus,
      },
    });

    return {
      outcome: "SKIPPED",
      message: "Outreach is blocked or no contact channel is available.",
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
    channel: channel.type,
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

    if (channel.type === "EMAIL") {
      await prisma.outreachMessage.create({
        data: {
          prospectId: prospect.id,
          campaignId: options.campaignId,
          channel: "EMAIL",
          contactId: channel.contactId,
          auditReportId: prospect.auditReport.id,
          toEmail: channel.email,
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
            channel: "EMAIL",
          } as Prisma.InputJsonValue,
        },
      });
    } else {
      await prisma.outreachMessage.create({
        data: {
          prospectId: prospect.id,
          campaignId: options.campaignId,
          channel: "CONTACT_FORM",
          contactFormId: channel.contactFormId,
          auditReportId: prospect.auditReport.id,
          toEmail: null,
          fromEmail: null,
          replyTo: null,
          subject: generated.subject || "",
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
            channel: "CONTACT_FORM",
          } as Prisma.InputJsonValue,
        },
      });
    }

    await prisma.prospect.update({
      where: { id: prospect.id },
      data: { outreachStatus: "DRAFT_READY" },
    });

    return {
      outcome: "GENERATED",
      message:
        channel.type === "CONTACT_FORM"
          ? "Contact-form draft generated for review."
          : "Draft generated for review.",
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
