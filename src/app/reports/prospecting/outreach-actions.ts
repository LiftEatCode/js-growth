"use server";

import { revalidatePath } from "next/cache";

import { getInternalSession } from "@/lib/internal-auth";
import { prisma } from "@/lib/prisma";
import {
  MAX_AI_DRAFT_CONCURRENCY,
  MAX_AI_DRAFTS_PER_RUN,
  STALE_OUTREACH_DRAFT_RUN_MS,
} from "@/lib/prospecting/outreach/constants";
import { createOrReuseOutreachDraft } from "@/lib/prospecting/outreach/create-draft";
import { clampOutreachDraftBatchSize } from "@/lib/prospecting/outreach/limit";
import { runWithConcurrency } from "@/lib/website-audit/site/pool";

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
  } catch {
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

  if (!subject || !body) {
    return {
      success: false,
      message: "Subject and body are required.",
    };
  }

  const message = await prisma.outreachMessage.findFirst({
    where: {
      id: input.messageId,
      prospectId: input.prospectId,
      campaignId: input.campaignId,
    },
  });

  if (!message || message.status === "SENT") {
    return {
      success: false,
      message: "The draft could not be saved.",
    };
  }

  await prisma.outreachMessage.update({
    where: { id: message.id },
    data: {
      subject,
      bodyText: body,
      status: message.status === "APPROVED" ? "APPROVED" : "DRAFT",
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

  if (!message) {
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
  });

  if (!message || message.status === "SENT") {
    return {
      success: false,
      message: "The draft could not be approved.",
    };
  }

  await prisma.outreachMessage.update({
    where: { id: message.id },
    data: {
      status: "APPROVED",
      approvedAt: new Date(),
      approvedByEmail: session.email,
    },
  });

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
      "Draft marked approved. No email is sent from this screen in Sprint 4.",
  };
}
