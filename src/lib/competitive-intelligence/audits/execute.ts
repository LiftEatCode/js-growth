import "server-only";

import { prisma } from "@/lib/prisma";
import { tryNormalizeProspectHostname } from "@/lib/prospecting/hostname";
import { getAuditGrade } from "@/lib/website-audit/grading";
import { runDeterministicWebsiteAudit } from "@/lib/website-audit/run-deterministic-audit";
import { getScoreBand } from "@/lib/website-audit/score-bands";
import type { WebsiteAuditResult } from "@/lib/website-audit/types";

import {
  COMPETITOR_AUDIT_ENGINE_VERSION,
  COMPETITOR_AUDIT_TTL_MS,
} from "./constants";
import { canAuditCompetitorStatus, isReusableCompetitorAudit } from "./limit";
import {
  completedCompetitorAuditData,
  failedCompetitorAuditData,
} from "./persist";
import type { CompetitorAuditAttemptResult } from "./types";

function safeFailureMessage(message: string): string {
  const trimmed = message.trim();

  if (!trimmed) {
    return "Website could not be analyzed.";
  }

  return trimmed.slice(0, 280);
}

export async function loadLatestCompletedCompetitorAudit(
  prospectCompetitorId: string,
) {
  return prisma.competitorAudit.findFirst({
    where: {
      prospectCompetitorId,
      status: "COMPLETED",
    },
    orderBy: { completedAt: "desc" },
  });
}

export async function executeCompetitorWebsiteAudit(options: {
  prospectCompetitorId: string;
  campaignId: string;
  force?: boolean;
  runId?: string | null;
}): Promise<CompetitorAuditAttemptResult> {
  const competitor = await prisma.prospectCompetitor.findUnique({
    where: { id: options.prospectCompetitorId },
  });

  if (!competitor) {
    return {
      prospectCompetitorId: options.prospectCompetitorId,
      outcome: "skipped",
      auditId: null,
      message: "Competitor was not found.",
    };
  }

  if (!canAuditCompetitorStatus(competitor.status)) {
    return {
      prospectCompetitorId: competitor.id,
      outcome: "skipped",
      auditId: null,
      message: "Only human-selected competitors can be audited.",
    };
  }

  const hostname = tryNormalizeProspectHostname(competitor.website);

  if (!competitor.website || !hostname) {
    return {
      prospectCompetitorId: competitor.id,
      outcome: "skipped",
      auditId: null,
      message: "This competitor does not have a usable public website.",
    };
  }

  if (!options.force) {
    const latest = await loadLatestCompletedCompetitorAudit(competitor.id);

    if (
      latest &&
      isReusableCompetitorAudit({
        status: latest.status,
        completedAt: latest.completedAt,
        auditEngineVersion: latest.auditEngineVersion,
        expectedEngineVersion: COMPETITOR_AUDIT_ENGINE_VERSION,
        ttlMs: COMPETITOR_AUDIT_TTL_MS,
      })
    ) {
      return {
        prospectCompetitorId: competitor.id,
        outcome: "reused",
        auditId: latest.id,
        message: "Recent competitor website audit was reused.",
      };
    }
  }

  const startedAt = new Date();
  const running = await prisma.competitorAudit.create({
    data: {
      prospectCompetitorId: competitor.id,
      targetProspectId: competitor.prospectId,
      campaignId: options.campaignId,
      runId: options.runId ?? null,
      websiteUrl: competitor.website,
      normalizedHostname: hostname,
      status: "RUNNING",
      auditEngineVersion: COMPETITOR_AUDIT_ENGINE_VERSION,
      startedAt,
    },
  });

  try {
    const deterministic = await runDeterministicWebsiteAudit(competitor.website);

    if (!deterministic.success) {
      const failed = failedCompetitorAuditData({
        websiteUrl: competitor.website,
        normalizedHostname: hostname,
        startedAt,
        failureReason: safeFailureMessage(deterministic.error.message),
      });

      await prisma.competitorAudit.update({
        where: { id: running.id },
        data: failed,
      });

      return {
        prospectCompetitorId: competitor.id,
        outcome: "failed",
        auditId: running.id,
        message: failed.failureReason,
      };
    }

    const completed = completedCompetitorAuditData({
      audit: deterministic.audit,
      websiteUrl: competitor.website,
      normalizedHostname: hostname,
      startedAt,
    });

    await prisma.competitorAudit.update({
      where: { id: running.id },
      data: completed,
    });

    return {
      prospectCompetitorId: competitor.id,
      outcome: "completed",
      auditId: running.id,
      message: `Website Growth Score ${completed.overallScore} · ${getScoreBand(completed.overallScore).label}`,
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? safeFailureMessage(error.message)
        : "Website could not be analyzed.";

    await prisma.competitorAudit.update({
      where: { id: running.id },
      data: failedCompetitorAuditData({
        websiteUrl: competitor.website,
        normalizedHostname: hostname,
        startedAt,
        failureReason: message,
      }),
    });

    return {
      prospectCompetitorId: competitor.id,
      outcome: "failed",
      auditId: running.id,
      message,
    };
  }
}

export function competitorAuditScoreLabel(score: number): string {
  return `${score} · ${getScoreBand(score).label}`;
}

export function competitorAuditGradeLabel(score: number): string {
  return getAuditGrade(score).letter;
}

export type { WebsiteAuditResult };
