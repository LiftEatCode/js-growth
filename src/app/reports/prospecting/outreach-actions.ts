"use server";

import { revalidatePath } from "next/cache";

import { getInternalSession } from "@/lib/internal-auth";
import { prisma } from "@/lib/prisma";
import {
  MAX_AI_DRAFT_CONCURRENCY,
  MAX_AI_DRAFTS_PER_RUN,
  MAX_OUTREACH_EMAILS_PER_DAY,
  STALE_OUTREACH_DRAFT_RUN_MS,
} from "@/lib/prospecting/outreach/constants";
import { createOrReuseOutreachDraft } from "@/lib/prospecting/outreach/create-draft";
import { clampOutreachDraftBatchSize } from "@/lib/prospecting/outreach/limit";
import { runWithConcurrency } from "@/lib/website-audit/site/pool";
import { getResendClient } from "@/lib/email/resend";
import { loadContactSuppressionContext } from "@/lib/prospecting/suppression/load";
import {
  canContactProspect,
  type ContactBlockReason,
} from "@/lib/prospecting/suppression/can-contact";
import { loadQualificationBlockers } from "@/lib/prospecting/qualification/audit-prospect";
import { canSendOutreachMessage } from "@/lib/prospecting/outreach/can-send";
import { canSubmitContactFormMessage } from "@/lib/prospecting/outreach/can-submit";

export interface OutreachActionResult {
  success: boolean;
  message?: string;
  campaignId?: string;
  prospectId?: string;
  runId?: string;
}

function revalidateCampaign(campaignId: string, prospectId?: string) {
  revalidatePath("/reports/prospecting");
  revalidatePath(`/reports/prospecting/${campaignId}`);

  if (prospectId) {
    revalidatePath(
      `/reports/prospecting/${campaignId}/prospects/${prospectId}`,
    );
  }
}

export async function startCampaignOutreachDrafts(
  campaignId: string,
): Promise<OutreachActionResult> {
  const session = await getInternalSession();

  if (!session) {
    return {
      success: false,
      message: "You are not authorized to generate drafts.",
    };
  }

  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: { id: true },
  });

  if (!campaign) {
    return {
      success: false,
      message: "The campaign could not be found.",
    };
  }

  const run = await prisma.$transaction(async (transaction) => {
    const staleBefore = new Date(Date.now() - STALE_OUTREACH_DRAFT_RUN_MS);

    await transaction.prospectOutreachDraftRun.updateMany({
      where: {
        campaignId,
        status: "RUNNING",
        startedAt: { lt: staleBefore },
      },
      data: {
        status: "FAILED",
        errorMessage: "The previous draft run timed out.",
        completedAt: new Date(),
      },
    });

    const active = await transaction.prospectOutreachDraftRun.findFirst({
      where: { campaignId, status: "RUNNING" },
      select: { id: true },
    });

    if (active) {
      return { concurrent: true as const, id: active.id };
    }

    const created = await transaction.prospectOutreachDraftRun.create({
      data: {
        campaignId,
        status: "RUNNING",
        requested: 0,
        createdByEmail: session.email,
      },
      select: { id: true },
    });

    return { concurrent: false as const, id: created.id };
  });

  if (run.concurrent) {
    return {
      success: false,
      message: "Draft generation is already running for this campaign.",
      runId: run.id,
    };
  }

  const startedAt = Date.now();

  try {
    const memberships = await prisma.campaignProspect.findMany({
      where: {
        campaignId,
        isSelectedTopN: true,
        prospect: {
          qualificationStatus: "QUALIFIED",
          contacts: {
            some: {
              isPrimary: true,
              status: { in: ["SELECTED", "DISCOVERED"] },
            },
          },
        },
      },
      include: {
        prospect: {
          include: {
            outreachMessages: {
              where: { campaignId },
              select: { status: true },
            },
          },
        },
      },
      orderBy: { qualificationRank: { sort: "asc", nulls: "last" } },
    });

    const missing = memberships.filter(
      (row) =>
        !row.prospect.outreachMessages.some(
          (message) =>
            message.status === "DRAFT" ||
            message.status === "NEEDS_REVIEW" ||
            message.status === "APPROVED",
        ),
    );

    const batch = missing.slice(0, clampOutreachDraftBatchSize(missing.length));

    await prisma.prospectOutreachDraftRun.update({
      where: { id: run.id },
      data: { requested: batch.length },
    });

    if (batch.length === 0) {
      await prisma.prospectOutreachDraftRun.update({
        where: { id: run.id },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
          durationMs: Date.now() - startedAt,
        },
      });

      revalidateCampaign(campaignId);

      return {
        success: true,
        campaignId,
        runId: run.id,
        message: "No selected prospects still need drafts.",
      };
    }

    const results = await runWithConcurrency(
      batch,
      MAX_AI_DRAFT_CONCURRENCY,
      async (row) =>
        createOrReuseOutreachDraft({
          campaignId,
          prospectId: row.prospectId,
        }),
    );

    const generated = results.filter((row) => row.outcome === "GENERATED").length;
    const reused = results.filter((row) => row.outcome === "REUSED").length;
    const failed = results.filter(
      (row) => row.outcome === "DRAFT_GENERATION_FAILED",
    ).length;
    const skipped = results.filter((row) => row.outcome === "SKIPPED").length;

    await prisma.prospectOutreachDraftRun.update({
      where: { id: run.id },
      data: {
        status: "COMPLETED",
        processed: results.length,
        generated,
        reused,
        failed,
        skipped,
        durationMs: Date.now() - startedAt,
        completedAt: new Date(),
      },
    });

    revalidateCampaign(campaignId);

    return {
      success: true,
      campaignId,
      runId: run.id,
      message: `Processed ${results.length} prospect${results.length === 1 ? "" : "s"} (max ${MAX_AI_DRAFTS_PER_RUN}). ${generated} new drafts. No email was sent.`,
    };
  } catch (error) {
    console.error("[prospecting outreach drafts]", error);

    await prisma.prospectOutreachDraftRun.update({
      where: { id: run.id },
      data: {
        status: "FAILED",
        errorMessage: "Draft generation could not be completed.",
        completedAt: new Date(),
        durationMs: Date.now() - startedAt,
      },
    });

    return {
      success: false,
      message: "Draft generation could not be completed.",
      runId: run.id,
    };
  }
}

export async function generateProspectDraft(
  campaignId: string,
  prospectId: string,
  regenerate = false,
): Promise<OutreachActionResult> {
  const session = await getInternalSession();

  if (!session) {
    return {
      success: false,
      message: "You are not authorized to generate drafts.",
    };
  }

  const result = await createOrReuseOutreachDraft({
    campaignId,
    prospectId,
    regenerate,
  });

  revalidateCampaign(campaignId, prospectId);

  return {
    success: result.outcome !== "DRAFT_GENERATION_FAILED",
    campaignId,
    prospectId,
    message: `${result.message} No email was sent.`,
  };
}

export async function saveOutreachDraft(input: {
  campaignId: string;
  prospectId: string;
  messageId: string;
  subject: string;
  body: string;
}): Promise<OutreachActionResult> {
  const session = await getInternalSession();

  if (!session) {
    return {
      success: false,
      message: "You are not authorized to edit drafts.",
    };
  }

  const subject = input.subject.trim();
  const body = input.body.trim();

  const message = await prisma.outreachMessage.findFirst({
    where: {
      id: input.messageId,
      prospectId: input.prospectId,
      campaignId: input.campaignId,
    },
  });

  if (
    !message ||
    message.status === "SENT" ||
    message.status === "SENDING" ||
    message.status === "SUBMITTED" ||
    message.status === "SUPPRESSED"
  ) {
    return {
      success: false,
      message: "This draft can no longer be edited.",
    };
  }

  if (!subject && message.channel === "EMAIL") {
    return {
      success: false,
      message: "Subject and body are required.",
    };
  }

  if (!body) {
    return {
      success: false,
      message: "Body is required.",
    };
  }

  if (
    !["DRAFT", "NEEDS_REVIEW", "APPROVED", "FAILED"].includes(message.status)
  ) {
    return {
      success: false,
      message: "This draft cannot be edited.",
    };
  }

  const invalidated = message.status === "APPROVED" || message.status === "FAILED";
  const nextStatus = message.status === "DRAFT" ? "DRAFT" : "NEEDS_REVIEW";

  await prisma.outreachMessage.update({
    where: { id: message.id },
    data: {
      subject,
      bodyText: body,
      status: nextStatus,
      approvedAt: invalidated ? null : message.approvedAt,
      approvedByEmail: invalidated ? null : message.approvedByEmail,
      error: null,
    },
  });

  await prisma.prospect.update({
    where: { id: input.prospectId },
    data: { outreachStatus: "DRAFT_READY" },
  });

  revalidateCampaign(input.campaignId, input.prospectId);

  return {
    success: true,
    campaignId: input.campaignId,
    prospectId: input.prospectId,
    message: "Draft saved. No email was sent.",
  };
}

export async function rejectOutreachDraft(
  campaignId: string,
  prospectId: string,
  messageId: string,
): Promise<OutreachActionResult> {
  const session = await getInternalSession();

  if (!session) {
    return {
      success: false,
      message: "You are not authorized to update drafts.",
    };
  }

  const message = await prisma.outreachMessage.findFirst({
    where: { id: messageId, prospectId, campaignId },
  });

  if (
    !message ||
    message.status === "SENT" ||
    message.status === "SENDING" ||
    message.status === "SUBMITTED"
  ) {
    return {
      success: false,
      message: "The draft could not be found.",
    };
  }

  await prisma.outreachMessage.update({
    where: { id: message.id },
    data: { status: "REJECTED" },
  });

  await prisma.prospect.update({
    where: { id: prospectId },
    data: { outreachStatus: "CONTACT_FOUND" },
  });

  revalidateCampaign(campaignId, prospectId);

  return {
    success: true,
    campaignId,
    prospectId,
    message: "Draft rejected. No email was sent.",
  };
}

export async function approveOutreachDraft(
  campaignId: string,
  prospectId: string,
  messageId: string,
): Promise<OutreachActionResult> {
  const session = await getInternalSession();

  if (!session) {
    return {
      success: false,
      message: "You are not authorized to approve drafts.",
    };
  }

  const message = await prisma.outreachMessage.findFirst({
    where: { id: messageId, prospectId, campaignId },
    include: {
      prospect: true,
      contact: true,
      contactForm: true,
      campaign: true,
    },
  });

  if (!message) {
    return {
      success: false,
      message: "The draft could not be approved.",
    };
  }

  if (
    message.status === "SENT" ||
    message.status === "SENDING" ||
    message.status === "SUBMITTED"
  ) {
    return {
      success: false,
      message: "This draft cannot be approved.",
    };
  }

  if (!message.prospect || !message.campaign) {
    return {
      success: false,
      message: "This draft is missing required related data.",
    };
  }

  const prospect = message.prospect;
  const campaign = message.campaign;

  if (
    prospect.qualificationStatus !== "QUALIFIED" ||
    prospect.outreachStatus === "SUPPRESSED"
  ) {
    return {
      success: false,
      message: "Approval blocked: prospect is not eligible.",
    };
  }

  if (!message.bodyText.trim()) {
    return {
      success: false,
      message: "Approval blocked: body is required.",
    };
  }

  if (campaign.status !== "ACTIVE") {
    return {
      success: false,
      message: "Approval blocked: campaign is not active.",
    };
  }

  const [suppression, blockers] = await Promise.all([
    loadContactSuppressionContext({
      hostname: prospect.hostname,
      emails: message.contact?.normalizedEmail
        ? [message.contact.normalizedEmail]
        : [],
    }),
    loadQualificationBlockers({ hostname: prospect.hostname }),
  ]);

  if (message.channel === "CONTACT_FORM") {
    if (!message.contactForm) {
      return {
        success: false,
        message: "Approval blocked: contact form is missing.",
      };
    }

    const eligibility = canSubmitContactFormMessage({
      message: {
        status: "APPROVED",
        channel: message.channel,
        approvedAt: new Date(),
        approvedByEmail: session.email,
        bodyText: message.bodyText,
        contactFormId: message.contactFormId,
        prospectId: message.prospectId,
        campaignId: message.campaignId,
      },
      prospect: {
        qualificationStatus: prospect.qualificationStatus,
        outreachStatus: prospect.outreachStatus,
        hostname: prospect.hostname,
        leadId: prospect.leadId,
      },
      contactForm: message.contactForm,
      campaign: { status: campaign.status },
      suppressedHostnames: suppression.suppressedHostnames,
      customerHostnames: suppression.customerHostnames,
      existingLead: blockers.existingLead || Boolean(prospect.leadId),
      priorSubmittedExists: false,
    });

    if (!eligibility.allowed) {
      return {
        success: false,
        message: `Approval blocked: ${eligibility.reasons.join(", ")}.`,
      };
    }

    await prisma.outreachMessage.update({
      where: { id: message.id },
      data: {
        status: "APPROVED",
        approvedAt: new Date(),
        approvedByEmail: session.email,
        error: null,
      },
    });
  } else {
    if (!message.contact) {
      return {
        success: false,
        message: "Approval blocked: email contact is missing.",
      };
    }

    const optOutSentence =
      "If you'd rather not receive messages like this from me, just reply and let me know.";
    const normalizedBody = message.bodyText.trim();
    const bodyText = normalizedBody.includes(optOutSentence)
      ? message.bodyText
      : `${message.bodyText.trim()}\n\n${optOutSentence}\n`;

    const contact = message.contact;

    if (!message.subject.trim()) {
      return {
        success: false,
        message: "Approval blocked: subject and body are required.",
      };
    }

    if (!contact.isPrimary) {
      return {
        success: false,
        message: "Approval blocked: contact is not selected.",
      };
    }

    if (!["SELECTED", "DISCOVERED"].includes(contact.status)) {
      return {
        success: false,
        message: "Approval blocked: contact is not usable.",
      };
    }

    if (
      message.toEmail?.trim().toLowerCase() !==
      contact.email.trim().toLowerCase()
    ) {
      return {
        success: false,
        message: "Approval blocked: recipient email changed.",
      };
    }

    const canContact = canContactProspect({
      hostname: prospect.hostname,
      email: contact.normalizedEmail,
      suppressedHostnames: suppression.suppressedHostnames,
      suppressedEmails: suppression.suppressedEmails,
      customerHostnames: suppression.customerHostnames,
      existingLead: blockers.existingLead || Boolean(prospect.leadId),
      convertedProspect: Boolean(prospect.leadId),
      contactStatus: contact.status,
    });

    if (!canContact.allowed) {
      return {
        success: false,
        message: `Approval blocked: ${canContact.reasons.join(", ")}.`,
      };
    }

    const alreadySent = await prisma.outreachMessage.findFirst({
      where: {
        prospectId,
        campaignId,
        contactId: contact.id,
        status: "SENT",
      },
      select: { id: true },
    });

    if (alreadySent) {
      return {
        success: false,
        message: "Approval blocked: outreach was already sent to this prospect.",
      };
    }

    await prisma.outreachMessage.update({
      where: { id: message.id },
      data: {
        status: "APPROVED",
        approvedAt: new Date(),
        approvedByEmail: session.email,
        bodyText,
        error: null,
      },
    });
  }

  await prisma.prospect.update({
    where: { id: prospectId },
    data: { outreachStatus: "APPROVED" },
  });

  revalidateCampaign(campaignId, prospectId);

  return {
    success: true,
    campaignId,
    prospectId,
    message:
      message.channel === "CONTACT_FORM"
        ? "Draft approved. Copy the message and submit it manually through the contact form."
        : "Draft approved. It is ready to send.",
  };
}

function getUtcDayBounds(now = new Date()): { start: Date; end: Date } {
  const start = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0),
  );
  const end = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0),
  );

  return { start, end };
}

export async function sendOutreachMessage(
  campaignId: string,
  prospectId: string,
  messageId: string,
): Promise<OutreachActionResult> {
  const session = await getInternalSession();

  if (!session) {
    return {
      success: false,
      message: "You are not authorized to send emails.",
    };
  }

  const message = await prisma.outreachMessage.findFirst({
    where: { id: messageId, prospectId, campaignId },
    include: {
      prospect: true,
      contact: true,
      campaign: true,
    },
  });

  if (!message || message.status !== "APPROVED" || message.channel !== "EMAIL") {
    return {
      success: false,
      message: "This draft is not ready for sending.",
    };
  }

  if (!message.approvedAt || !message.approvedByEmail) {
    return {
      success: false,
      message: "This draft is missing approval metadata.",
    };
  }

  if (!message.prospect || !message.contact || !message.campaign) {
    return {
      success: false,
      message: "This draft is missing required related data.",
    };
  }

  const prospect = message.prospect;
  const contact = message.contact;
  const campaign = message.campaign;

  if (!message.subject.trim() || !message.bodyText.trim()) {
    return {
      success: false,
      message: "This draft is missing required subject/body content.",
    };
  }

  const { start, end } = getUtcDayBounds(new Date());

  const [suppression, blockers] = await Promise.all([
    loadContactSuppressionContext({
      hostname: prospect.hostname,
      emails: [contact.normalizedEmail],
    }),
    loadQualificationBlockers({ hostname: prospect.hostname }),
  ]);

  const priorSentExists = Boolean(
    await prisma.outreachMessage.findFirst({
      where: {
        prospectId,
        campaignId,
        contactId: contact.id,
        status: "SENT",
      },
      select: { id: true },
    }),
  );

  const sentTodayCount = await prisma.outreachMessage.count({
    where: {
      status: "SENT",
      sentAt: {
        gte: start,
        lt: end,
      },
    },
  });

  const eligibility = canSendOutreachMessage({
    message: {
      status: message.status,
      channel: message.channel,
      approvedAt: message.approvedAt,
      approvedByEmail: message.approvedByEmail,
      toEmail: message.toEmail,
      subject: message.subject,
      bodyText: message.bodyText,
      contactId: message.contactId ?? null,
      prospectId: message.prospectId,
      campaignId: message.campaignId ?? null,
    },
    prospect: {
      qualificationStatus: prospect.qualificationStatus,
      outreachStatus: prospect.outreachStatus,
      hostname: prospect.hostname,
      leadId: prospect.leadId,
    },
    contact: {
      id: contact.id,
      isPrimary: contact.isPrimary,
      status: contact.status,
      email: contact.email,
      normalizedEmail: contact.normalizedEmail,
      prospectId: contact.prospectId,
    },
    campaign: {
      status: campaign.status,
    },
    suppressedHostnames: suppression.suppressedHostnames,
    suppressedEmails: suppression.suppressedEmails,
    customerHostnames: suppression.customerHostnames,
    existingLead: blockers.existingLead || Boolean(prospect.leadId),
    priorSentExists,
    sentTodayCount,
    maxEmailsPerDay: MAX_OUTREACH_EMAILS_PER_DAY,
  });

  if (!eligibility.allowed) {
    const contactBlockReasonSet = new Set<ContactBlockReason>([
      "NO_EMAIL",
      "HOSTNAME_SUPPRESSED",
      "EMAIL_SUPPRESSED",
      "EXISTING_LEAD",
      "CUSTOMER",
      "CONTACT_REJECTED",
      "CONTACT_SUPPRESSED",
      "CONTACT_STALE",
    ]);

    const hasSuppressionBlock = eligibility.reasons.some((reason) =>
      contactBlockReasonSet.has(reason as ContactBlockReason),
    );

    await prisma.outreachMessage.update({
      where: { id: message.id },
      data: {
        status: hasSuppressionBlock ? "SUPPRESSED" : "FAILED",
        error: `Send blocked: ${eligibility.reasons.join(", ")}`,
        sentAt: null,
        providerMessageId: null,
      },
    });

    return {
      success: false,
      message: "Send blocked by final eligibility checks.",
      campaignId,
      prospectId,
    };
  }

  // Atomically transition APPROVED -> SENDING.
  const locked = await prisma.outreachMessage.updateMany({
    where: {
      id: message.id,
      status: "APPROVED",
    },
    data: {
      status: "SENDING",
      error: null,
    },
  });

  if (locked.count !== 1) {
    return {
      success: false,
      message: "This email is already being processed.",
      campaignId,
      prospectId,
    };
  }

  const fromEmail = process.env.CONTACT_FROM_EMAIL;
  const replyTo = process.env.CONTACT_TO_EMAIL;

  if (!fromEmail) {
    await prisma.outreachMessage.update({
      where: { id: message.id },
      data: { status: "FAILED", error: "Missing sender configuration." },
    });

    return {
      success: false,
      message: "Email delivery is temporarily unavailable.",
    };
  }

  try {
    const resend = getResendClient();
    const { error: sendError, data } = await resend.emails.send({
      from: fromEmail,
      to: message.toEmail ?? "",
      replyTo: replyTo ?? undefined,
      subject: message.subject,
      text: message.bodyText,
    });

    if (sendError) {
      await prisma.outreachMessage.update({
        where: { id: message.id },
        data: {
          status: "FAILED",
          error: sendError.message ?? "Resend send failed.",
          sentAt: null,
          providerMessageId: null,
        },
      });

      return {
        success: false,
        message: "Email delivery failed. Re-approve and retry.",
        campaignId,
        prospectId,
      };
    }

    const providerMessageId = data?.id ? String(data.id) : null;

    await prisma.outreachMessage.update({
      where: { id: message.id },
      data: {
        status: "SENT",
        sentAt: new Date(),
        providerMessageId,
        error: null,
      },
    });

    await prisma.prospect.update({
      where: { id: prospectId },
      data: { outreachStatus: "SENT" },
    });

    revalidateCampaign(campaignId, prospectId);

    return {
      success: true,
      campaignId,
      prospectId,
      message: "Email sent. No further sending is available for this draft.",
    };
  } catch {
    await prisma.outreachMessage.update({
      where: { id: message.id },
      data: {
        status: "FAILED",
        error: "Resend send threw an unexpected error.",
        sentAt: null,
        providerMessageId: null,
      },
    });

    return {
      success: false,
      message: "Email delivery failed. Re-approve and retry.",
      campaignId,
      prospectId,
    };
  }
}

export async function markContactFormSubmitted(
  campaignId: string,
  prospectId: string,
  messageId: string,
): Promise<OutreachActionResult> {
  const session = await getInternalSession();

  if (!session) {
    return {
      success: false,
      message: "You are not authorized to record form submissions.",
    };
  }

  const message = await prisma.outreachMessage.findFirst({
    where: { id: messageId, prospectId, campaignId },
    include: {
      prospect: true,
      contactForm: true,
      campaign: true,
    },
  });

  if (
    !message ||
    message.status !== "APPROVED" ||
    message.channel !== "CONTACT_FORM"
  ) {
    return {
      success: false,
      message: "This contact-form draft is not ready to mark as submitted.",
    };
  }

  if (!message.prospect || !message.contactForm || !message.campaign) {
    return {
      success: false,
      message: "This draft is missing required related data.",
    };
  }

  const prospect = message.prospect;
  const contactForm = message.contactForm;
  const campaign = message.campaign;

  const [suppression, blockers] = await Promise.all([
    loadContactSuppressionContext({
      hostname: prospect.hostname,
      emails: [],
    }),
    loadQualificationBlockers({ hostname: prospect.hostname }),
  ]);

  const priorSubmittedExists = Boolean(
    await prisma.outreachMessage.findFirst({
      where: {
        prospectId,
        campaignId,
        contactFormId: contactForm.id,
        status: "SUBMITTED",
      },
      select: { id: true },
    }),
  );

  const eligibility = canSubmitContactFormMessage({
    message: {
      status: message.status,
      channel: message.channel,
      approvedAt: message.approvedAt,
      approvedByEmail: message.approvedByEmail,
      bodyText: message.bodyText,
      contactFormId: message.contactFormId,
      prospectId: message.prospectId,
      campaignId: message.campaignId,
    },
    prospect: {
      qualificationStatus: prospect.qualificationStatus,
      outreachStatus: prospect.outreachStatus,
      hostname: prospect.hostname,
      leadId: prospect.leadId,
    },
    contactForm,
    campaign: { status: campaign.status },
    suppressedHostnames: suppression.suppressedHostnames,
    customerHostnames: suppression.customerHostnames,
    existingLead: blockers.existingLead || Boolean(prospect.leadId),
    priorSubmittedExists,
  });

  if (!eligibility.allowed) {
    await prisma.outreachMessage.update({
      where: { id: message.id },
      data: {
        status: eligibility.reasons.some((reason) =>
          ["HOSTNAME_SUPPRESSED", "EXISTING_LEAD", "CUSTOMER", "PROSPECT_CONVERTED"].includes(
            reason,
          ),
        )
          ? "SUPPRESSED"
          : "FAILED",
        error: `Submit blocked: ${eligibility.reasons.join(", ")}`,
      },
    });

    return {
      success: false,
      message: "Submission blocked by final eligibility checks.",
      campaignId,
      prospectId,
    };
  }

  const locked = await prisma.outreachMessage.updateMany({
    where: {
      id: message.id,
      status: "APPROVED",
      channel: "CONTACT_FORM",
    },
    data: {
      status: "SUBMITTED",
      submittedAt: new Date(),
      submittedByEmail: session.email,
      error: null,
    },
  });

  if (locked.count !== 1) {
    return {
      success: false,
      message: "This contact form outreach is already marked as submitted.",
      campaignId,
      prospectId,
    };
  }

  await prisma.prospect.update({
    where: { id: prospectId },
    data: { outreachStatus: "SENT" },
  });

  revalidateCampaign(campaignId, prospectId);

  return {
    success: true,
    campaignId,
    prospectId,
    message:
      "Contact form submission recorded. No automated submission occurred from this application.",
  };
}
