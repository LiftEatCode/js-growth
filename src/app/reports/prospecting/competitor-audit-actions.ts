"use server";

import { revalidatePath } from "next/cache";

import { getInternalSession } from "@/lib/internal-auth";
import {
  auditSelectedCompetitorsForProspect,
} from "@/lib/competitive-intelligence/audits/load";
import { executeCompetitorWebsiteAudit } from "@/lib/competitive-intelligence/audits/execute";
import { prisma } from "@/lib/prisma";

export interface CompetitorAuditActionResult {
  success: boolean;
  message?: string;
  campaignId?: string;
  prospectId?: string;
  runId?: string;
  auditId?: string;
}

function revalidateCompetitorAuditPages(
  campaignId: string,
  prospectId: string,
  competitorId?: string,
  auditId?: string,
) {
  revalidatePath("/reports/prospecting");
  revalidatePath(`/reports/prospecting/${campaignId}`);
  revalidatePath(
    `/reports/prospecting/${campaignId}/prospects/${prospectId}`,
  );

  if (competitorId && auditId) {
    revalidatePath(
      `/reports/prospecting/${campaignId}/prospects/${prospectId}/competitors/${competitorId}/audits/${auditId}`,
    );
  }
}

async function assertCampaignMembership(
  campaignId: string,
  prospectId: string,
) {
  return prisma.campaignProspect.findUnique({
    where: {
      campaignId_prospectId: { campaignId, prospectId },
    },
    select: { campaignId: true, prospectId: true },
  });
}

export async function startSelectedCompetitorAudits(
  campaignId: string,
  prospectId: string,
): Promise<CompetitorAuditActionResult> {
  const session = await getInternalSession();

  if (!session) {
    return {
      success: false,
      message: "You are not authorized to audit competitors.",
    };
  }

  const membership = await assertCampaignMembership(campaignId, prospectId);

  if (!membership) {
    return {
      success: false,
      message: "The prospect is not in this campaign.",
    };
  }

  try {
    const result = await auditSelectedCompetitorsForProspect({
      campaignId,
      prospectId,
      createdByEmail: session.email,
      force: false,
    });

    revalidateCompetitorAuditPages(campaignId, prospectId);

    return {
      success: true,
      campaignId,
      prospectId,
      runId: result.runId,
      message: `Processed ${result.processed}: ${result.completed} completed, ${result.reused} reused, ${result.failed} failed, ${result.skipped} skipped.`,
    };
  } catch (error) {
    return {
      success: false,
      campaignId,
      prospectId,
      message:
        error instanceof Error
          ? error.message
          : "Competitor website audits could not be completed.",
    };
  }
}

export async function startCompetitorAudit(
  campaignId: string,
  prospectId: string,
  competitorId: string,
): Promise<CompetitorAuditActionResult> {
  const session = await getInternalSession();

  if (!session) {
    return {
      success: false,
      message: "You are not authorized to audit competitors.",
    };
  }

  const membership = await assertCampaignMembership(campaignId, prospectId);

  if (!membership) {
    return {
      success: false,
      message: "The prospect is not in this campaign.",
    };
  }

  const competitor = await prisma.prospectCompetitor.findFirst({
    where: {
      id: competitorId,
      prospectId,
    },
    select: { id: true },
  });

  if (!competitor) {
    return {
      success: false,
      message: "Competitor was not found for this prospect.",
    };
  }

  try {
    const result = await auditSelectedCompetitorsForProspect({
      campaignId,
      prospectId,
      createdByEmail: session.email,
      force: false,
      competitorIds: [competitorId],
    });

    revalidateCompetitorAuditPages(
      campaignId,
      prospectId,
      competitorId,
      result.results[0]?.auditId ?? undefined,
    );

    return {
      success: true,
      campaignId,
      prospectId,
      runId: result.runId,
      auditId: result.results[0]?.auditId ?? undefined,
      message: result.results[0]?.message ?? "Competitor audit finished.",
    };
  } catch (error) {
    return {
      success: false,
      campaignId,
      prospectId,
      message:
        error instanceof Error
          ? error.message
          : "The competitor website audit could not be completed.",
    };
  }
}

export async function rerunCompetitorAudit(
  campaignId: string,
  prospectId: string,
  competitorId: string,
): Promise<CompetitorAuditActionResult> {
  const session = await getInternalSession();

  if (!session) {
    return {
      success: false,
      message: "You are not authorized to audit competitors.",
    };
  }

  const membership = await assertCampaignMembership(campaignId, prospectId);

  if (!membership) {
    return {
      success: false,
      message: "The prospect is not in this campaign.",
    };
  }

  const competitor = await prisma.prospectCompetitor.findFirst({
    where: {
      id: competitorId,
      prospectId,
    },
    select: { id: true },
  });

  if (!competitor) {
    return {
      success: false,
      message: "Competitor was not found for this prospect.",
    };
  }

  try {
    const run = await prisma.competitorAuditRun.create({
      data: {
        campaignId,
        prospectId,
        status: "RUNNING",
        requestedAudits: 1,
        createdByEmail: session.email,
      },
    });

    const startedAt = Date.now();
    const result = await executeCompetitorWebsiteAudit({
      prospectCompetitorId: competitorId,
      campaignId,
      force: true,
      runId: run.id,
    });

    await prisma.competitorAuditRun.update({
      where: { id: run.id },
      data: {
        status: "COMPLETED",
        processedAudits: 1,
        completedCount: result.outcome === "completed" ? 1 : 0,
        reusedCount: result.outcome === "reused" ? 1 : 0,
        failedCount: result.outcome === "failed" ? 1 : 0,
        skippedCount: result.outcome === "skipped" ? 1 : 0,
        durationMs: Date.now() - startedAt,
        completedAt: new Date(),
      },
    });

    revalidateCompetitorAuditPages(
      campaignId,
      prospectId,
      competitorId,
      result.auditId ?? undefined,
    );

    return {
      success: result.outcome !== "skipped",
      campaignId,
      prospectId,
      runId: run.id,
      auditId: result.auditId ?? undefined,
      message: result.message,
    };
  } catch (error) {
    return {
      success: false,
      campaignId,
      prospectId,
      message:
        error instanceof Error
          ? error.message
          : "The competitor website re-audit could not be completed.",
    };
  }
}
