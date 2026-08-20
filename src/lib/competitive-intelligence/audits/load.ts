import "server-only";

import { prisma } from "@/lib/prisma";

import {
  COMPETITOR_AUDIT_CONCURRENCY,
  MAX_COMPETITOR_AUDITS_PER_PROSPECT,
  MAX_COMPETITOR_AUDITS_PER_RUN,
} from "./constants";
import { executeCompetitorWebsiteAudit } from "./execute";
import type { CompetitorAuditAttemptResult } from "./types";
import { runWithConcurrency } from "@/lib/website-audit/site/pool";

export async function loadLatestCompetitorAuditsForProspect(
  prospectId: string,
) {
  const selected = await prisma.prospectCompetitor.findMany({
    where: {
      prospectId,
      status: "SELECTED",
    },
    select: { id: true },
    take: MAX_COMPETITOR_AUDITS_PER_PROSPECT,
  });

  const latestByCompetitor = await Promise.all(
    selected.map(async (row) => {
      const latest = await prisma.competitorAudit.findFirst({
        where: { prospectCompetitorId: row.id },
        orderBy: [{ completedAt: "desc" }, { createdAt: "desc" }],
      });

      return { prospectCompetitorId: row.id, latest };
    }),
  );

  return latestByCompetitor;
}

export async function auditSelectedCompetitorsForProspect(options: {
  campaignId: string;
  prospectId: string;
  createdByEmail: string;
  force?: boolean;
  competitorIds?: string[];
}): Promise<{
  runId: string;
  processed: number;
  completed: number;
  reused: number;
  failed: number;
  skipped: number;
  results: CompetitorAuditAttemptResult[];
}> {
  const selected = await prisma.prospectCompetitor.findMany({
    where: {
      prospectId: options.prospectId,
      status: "SELECTED",
      ...(options.competitorIds && options.competitorIds.length > 0
        ? { id: { in: options.competitorIds } }
        : {}),
    },
    orderBy: [{ validationScore: "desc" }, { businessName: "asc" }],
    take: Math.min(
      MAX_COMPETITOR_AUDITS_PER_PROSPECT,
      MAX_COMPETITOR_AUDITS_PER_RUN,
    ),
  });

  const run = await prisma.competitorAuditRun.create({
    data: {
      campaignId: options.campaignId,
      prospectId: options.prospectId,
      status: "RUNNING",
      requestedAudits: selected.length,
      createdByEmail: options.createdByEmail,
    },
  });

  const startedAt = Date.now();

  try {
    const results = await runWithConcurrency(
      selected,
      COMPETITOR_AUDIT_CONCURRENCY,
      async (competitor) =>
        executeCompetitorWebsiteAudit({
          prospectCompetitorId: competitor.id,
          campaignId: options.campaignId,
          force: options.force,
          runId: run.id,
        }),
    );

    const completed = results.filter((row) => row.outcome === "completed").length;
    const reused = results.filter((row) => row.outcome === "reused").length;
    const failed = results.filter((row) => row.outcome === "failed").length;
    const skipped = results.filter((row) => row.outcome === "skipped").length;

    await prisma.competitorAuditRun.update({
      where: { id: run.id },
      data: {
        status: "COMPLETED",
        processedAudits: results.length,
        completedCount: completed,
        reusedCount: reused,
        failedCount: failed,
        skippedCount: skipped,
        durationMs: Date.now() - startedAt,
        completedAt: new Date(),
      },
    });

    return {
      runId: run.id,
      processed: results.length,
      completed,
      reused,
      failed,
      skipped,
      results,
    };
  } catch (error) {
    await prisma.competitorAuditRun.update({
      where: { id: run.id },
      data: {
        status: "FAILED",
        errorMessage:
          error instanceof Error
            ? error.message.slice(0, 500)
            : "Competitor audit run failed.",
        durationMs: Date.now() - startedAt,
        completedAt: new Date(),
      },
    });

    throw error;
  }
}
