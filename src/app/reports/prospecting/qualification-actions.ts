"use server";

import { revalidatePath } from "next/cache";

import { getInternalSession } from "@/lib/internal-auth";
import { prisma } from "@/lib/prisma";
import {
  MAX_AUDIT_CONCURRENCY,
  MAX_PROSPECT_AUDITS_PER_RUN,
  SKIP_REASON,
  STALE_QUALIFICATION_RUN_MS,
} from "@/lib/prospecting/qualification/constants";
import {
  auditProspectWebsite,
  loadQualificationBlockers,
  qualificationJsonValue,
} from "@/lib/prospecting/qualification/audit-prospect";
import { clampQualificationBatchSize } from "@/lib/prospecting/qualification/limit";
import { parseStoredQualification } from "@/lib/prospecting/qualification/parse";
import { qualifyProspectAudit } from "@/lib/prospecting/qualification/qualify";
import { rankCampaignProspects } from "@/lib/prospecting/qualification/rank";
import { runWithConcurrency } from "@/lib/website-audit/site/pool";

export interface QualificationActionResult {
  success: boolean;
  message?: string;
  campaignId?: string;
  prospectId?: string;
  runId?: string;
  processedCount?: number;
  remainingUnaudited?: number;
}

async function applyCampaignRanking(
  campaignId: string,
  desiredCount: number,
): Promise<void> {
  const memberships = await prisma.campaignProspect.findMany({
    where: { campaignId },
    select: {
      prospectId: true,
      qualificationJson: true,
      prospect: {
        select: {
          businessName: true,
          qualificationStatus: true,
        },
      },
    },
  });

  const ranked = rankCampaignProspects(
    memberships.map((row) => ({
      prospectId: row.prospectId,
      businessName: row.prospect.businessName,
      qualificationStatus: row.prospect.qualificationStatus,
      score: parseStoredQualification(row.qualificationJson)?.score ?? null,
    })),
    desiredCount,
  );

  await prisma.$transaction(
    ranked.map((row) =>
      prisma.campaignProspect.update({
        where: {
          campaignId_prospectId: {
            campaignId,
            prospectId: row.prospectId,
          },
        },
        data: {
          qualificationRank: row.qualificationRank,
          isSelectedTopN: row.isSelectedTopN,
        },
      }),
    ),
  );
}

async function qualifyLinkedProspect(options: {
  campaignId: string;
  prospectId: string;
  audit: Parameters<typeof qualifyProspectAudit>[0];
  reusedAudit: boolean;
  auditedAt: string;
}): Promise<"QUALIFIED" | "SKIPPED"> {
  const prospect = await prisma.prospect.findUnique({
    where: { id: options.prospectId },
    select: {
      website: true,
      hostname: true,
      city: true,
      state: true,
    },
  });

  const campaign = await prisma.campaign.findUnique({
    where: { id: options.campaignId },
    select: {
      city: true,
      state: true,
    },
  });

  const blockers = await loadQualificationBlockers({
    hostname: prospect?.hostname ?? null,
  });

  const qualification = qualifyProspectAudit(options.audit, {
    hostname: prospect?.hostname ?? null,
    website: prospect?.website ?? null,
    city: prospect?.city ?? null,
    state: prospect?.state ?? null,
    campaignCity: campaign?.city ?? null,
    campaignState: campaign?.state ?? null,
    suppressed: blockers.suppressed,
    customerSuppressed: blockers.customerSuppressed,
    existingLead: blockers.existingLead,
    reusedAudit: options.reusedAudit,
    auditedAt: options.auditedAt,
  });

  const status =
    qualification.label === "SKIP" ? "SKIPPED" : "QUALIFIED";

  await prisma.$transaction([
    prisma.prospect.update({
      where: { id: options.prospectId },
      data: {
        qualificationStatus: status,
        skipReason: qualification.skipReason,
      },
    }),
    prisma.campaignProspect.update({
      where: {
        campaignId_prospectId: {
          campaignId: options.campaignId,
          prospectId: options.prospectId,
        },
      },
      data: {
        qualificationJson: qualificationJsonValue(qualification),
      },
    }),
  ]);

  return status;
}

export async function startCampaignQualification(
  campaignId: string,
): Promise<QualificationActionResult> {
  const session = await getInternalSession();

  if (!session) {
    return {
      success: false,
      message: "You are not authorized to qualify prospects.",
    };
  }

  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: {
      id: true,
      desiredQualifiedCount: true,
    },
  });

  if (!campaign) {
    return {
      success: false,
      message: "The campaign could not be found.",
    };
  }

  const run = await prisma.$transaction(async (transaction) => {
    const staleBefore = new Date(Date.now() - STALE_QUALIFICATION_RUN_MS);

    await transaction.prospectQualificationRun.updateMany({
      where: {
        campaignId,
        status: "RUNNING",
        startedAt: { lt: staleBefore },
      },
      data: {
        status: "FAILED",
        errorMessage: "The previous qualification run timed out.",
        completedAt: new Date(),
      },
    });

    const active = await transaction.prospectQualificationRun.findFirst({
      where: { campaignId, status: "RUNNING" },
      select: { id: true },
    });

    if (active) {
      return { concurrent: true as const, id: active.id };
    }

    const created = await transaction.prospectQualificationRun.create({
      data: {
        campaignId,
        status: "RUNNING",
        requestedCount: MAX_PROSPECT_AUDITS_PER_RUN,
        createdByEmail: session.email,
      },
      select: { id: true },
    });

    return { concurrent: false as const, id: created.id };
  });

  if (run.concurrent) {
    return {
      success: false,
      campaignId,
      runId: run.id,
      message: "A qualification run is already in progress for this campaign.",
    };
  }

  const startedAt = Date.now();

  try {
    const pending = await prisma.campaignProspect.findMany({
      where: {
        campaignId,
        prospect: {
          qualificationStatus: {
            in: ["DISCOVERED", "AUDITING", "AUDIT_FAILED", "WEBSITE_INVALID"],
          },
        },
      },
      orderBy: { addedAt: "asc" },
      select: {
        prospectId: true,
        prospect: {
          select: {
            id: true,
            website: true,
            hostname: true,
            auditReportId: true,
            qualificationStatus: true,
          },
        },
      },
    });

    const batch = pending.slice(
      0,
      clampQualificationBatchSize(MAX_PROSPECT_AUDITS_PER_RUN),
    );
    const remainingUnaudited = Math.max(0, pending.length - batch.length);

    let auditsAttempted = 0;
    let auditsReused = 0;
    let auditsCompleted = 0;
    let auditsFailed = 0;

    const outcomes = await runWithConcurrency(
      batch,
      MAX_AUDIT_CONCURRENCY,
      async (row) => {
      await prisma.prospect.update({
        where: { id: row.prospectId },
        data: { qualificationStatus: "AUDITING" },
      });

      const attempt = await auditProspectWebsite({
        prospectId: row.prospectId,
        website: row.prospect.website,
        linkedReportId: row.prospect.auditReportId,
      });

      if (!attempt.ok) {
        if (attempt.code === "invalid-website") {
          await prisma.prospect.update({
            where: { id: row.prospectId },
            data: {
              qualificationStatus: "WEBSITE_INVALID",
              skipReason: SKIP_REASON.WEBSITE_INVALID,
            },
          });
          return { reused: false, attempted: false, failed: false };
        }

        await prisma.prospect.update({
          where: { id: row.prospectId },
          data: {
            qualificationStatus: "AUDIT_FAILED",
            skipReason: SKIP_REASON.AUDIT_FAILED,
          },
        });
        return { reused: false, attempted: true, failed: true };
      }

      const report = await prisma.auditReport.findUnique({
        where: { id: attempt.reportId },
        select: { createdAt: true },
      });

      await qualifyLinkedProspect({
        campaignId,
        prospectId: row.prospectId,
        audit: attempt.audit,
        reusedAudit: attempt.reused,
        auditedAt: report?.createdAt.toISOString() ?? new Date().toISOString(),
      });

      return {
        reused: attempt.reused,
        attempted: !attempt.reused,
        failed: false,
      };
    });

    for (const outcome of outcomes) {
      if (outcome.reused) {
        auditsReused += 1;
      }
      if (outcome.attempted) {
        auditsAttempted += 1;
      }
      if (outcome.failed) {
        auditsFailed += 1;
      } else if (outcome.attempted) {
        auditsCompleted += 1;
      }
    }

    const processedIds = batch.map((row) => row.prospectId);
    const processedProspects = await prisma.prospect.findMany({
      where: { id: { in: processedIds } },
      select: { qualificationStatus: true },
    });

    const qualifiedCount = processedProspects.filter(
      (prospect) => prospect.qualificationStatus === "QUALIFIED",
    ).length;
    const skippedCount = processedProspects.filter(
      (prospect) =>
        prospect.qualificationStatus === "SKIPPED" ||
        prospect.qualificationStatus === "WEBSITE_INVALID",
    ).length;
    const failedCount = processedProspects.filter(
      (prospect) => prospect.qualificationStatus === "AUDIT_FAILED",
    ).length;

    await applyCampaignRanking(campaignId, campaign.desiredQualifiedCount);

    await prisma.prospectQualificationRun.update({
      where: { id: run.id },
      data: {
        status: "COMPLETED",
        requestedCount: batch.length,
        processedCount: batch.length,
        qualifiedCount,
        skippedCount,
        failedCount,
        auditsAttempted,
        auditsReused,
        auditsCompleted,
        auditsFailed,
        remainingUnaudited,
        durationMs: Date.now() - startedAt,
        completedAt: new Date(),
        errorMessage:
          batch.length === 0
            ? "No unaudited prospects were waiting in this campaign."
            : remainingUnaudited > 0
              ? `${remainingUnaudited} prospect${remainingUnaudited === 1 ? "" : "s"} still need an audit. Run again to continue.`
              : null,
      },
    });

    revalidatePath(`/reports/prospecting/${campaignId}`);

    return {
      success: true,
      campaignId,
      runId: run.id,
      processedCount: batch.length,
      remainingUnaudited,
      message:
        batch.length === 0
          ? "No unaudited prospects were waiting."
          : remainingUnaudited > 0
            ? `Audited ${batch.length} prospects. ${remainingUnaudited} remain. Run again to continue.`
            : `Audited ${batch.length} prospect${batch.length === 1 ? "" : "s"}.`,
    };
  } catch {
    await prisma.prospectQualificationRun.update({
      where: { id: run.id },
      data: {
        status: "FAILED",
        errorMessage: "Qualification could not be completed.",
        durationMs: Date.now() - startedAt,
        completedAt: new Date(),
      },
    });

    console.error("Prospect qualification failed:", {
      campaignId,
      runId: run.id,
    });

    return {
      success: false,
      campaignId,
      runId: run.id,
      message: "Qualification could not be completed.",
    };
  }
}

export async function auditAndQualifyProspect(
  campaignId: string,
  prospectId: string,
  force = false,
): Promise<QualificationActionResult> {
  const session = await getInternalSession();

  if (!session) {
    return {
      success: false,
      message: "You are not authorized to audit this prospect.",
    };
  }

  const membership = await prisma.campaignProspect.findUnique({
    where: {
      campaignId_prospectId: { campaignId, prospectId },
    },
    include: {
      campaign: { select: { desiredQualifiedCount: true } },
      prospect: {
        select: {
          website: true,
          auditReportId: true,
        },
      },
    },
  });

  if (!membership) {
    return {
      success: false,
      message: "That prospect is not part of this campaign.",
    };
  }

  await prisma.prospect.update({
    where: { id: prospectId },
    data: { qualificationStatus: "AUDITING" },
  });

  const attempt = await auditProspectWebsite({
    prospectId,
    website: membership.prospect.website,
    linkedReportId: membership.prospect.auditReportId,
    force,
  });

  if (!attempt.ok) {
    await prisma.prospect.update({
      where: { id: prospectId },
      data: {
        qualificationStatus:
          attempt.code === "invalid-website" ? "WEBSITE_INVALID" : "AUDIT_FAILED",
        skipReason:
          attempt.code === "invalid-website"
            ? SKIP_REASON.WEBSITE_INVALID
            : SKIP_REASON.AUDIT_FAILED,
      },
    });

    return {
      success: false,
      campaignId,
      prospectId,
      message: attempt.message,
    };
  }

  const report = await prisma.auditReport.findUnique({
    where: { id: attempt.reportId },
    select: { createdAt: true },
  });

  await qualifyLinkedProspect({
    campaignId,
    prospectId,
    audit: attempt.audit,
    reusedAudit: attempt.reused,
    auditedAt: report?.createdAt.toISOString() ?? new Date().toISOString(),
  });

  await applyCampaignRanking(campaignId, membership.campaign.desiredQualifiedCount);

  revalidatePath(`/reports/prospecting/${campaignId}`);
  revalidatePath(`/reports/prospecting/${campaignId}/prospects/${prospectId}`);

  return {
    success: true,
    campaignId,
    prospectId,
    message: attempt.reused
      ? "Reused the recent prospecting audit and recalculated qualification."
      : "Audit completed and qualification updated.",
  };
}

export async function recalculateProspectQualification(
  campaignId: string,
  prospectId: string,
): Promise<QualificationActionResult> {
  const session = await getInternalSession();

  if (!session) {
    return {
      success: false,
      message: "You are not authorized to recalculate qualification.",
    };
  }

  const membership = await prisma.campaignProspect.findUnique({
    where: {
      campaignId_prospectId: { campaignId, prospectId },
    },
    include: {
      campaign: { select: { desiredQualifiedCount: true } },
      prospect: {
        select: {
          auditReportId: true,
        },
      },
    },
  });

  if (!membership?.prospect.auditReportId) {
    return {
      success: false,
      message: "Run an audit before recalculating qualification.",
    };
  }

  const report = await prisma.auditReport.findUnique({
    where: { id: membership.prospect.auditReportId },
  });

  if (!report || report.source !== "PROSPECTING") {
    return {
      success: false,
      message: "A prospecting audit is required before recalculating.",
    };
  }

  await qualifyLinkedProspect({
    campaignId,
    prospectId,
    audit: report.audit as never,
    reusedAudit: true,
    auditedAt: report.createdAt.toISOString(),
  });

  await applyCampaignRanking(campaignId, membership.campaign.desiredQualifiedCount);

  revalidatePath(`/reports/prospecting/${campaignId}`);
  revalidatePath(`/reports/prospecting/${campaignId}/prospects/${prospectId}`);

  return {
    success: true,
    campaignId,
    prospectId,
    message: "Qualification recalculated from the stored audit.",
  };
}
