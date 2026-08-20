import type { Prisma } from "@/generated/prisma/client";
import type { AuditCategory, WebsiteAuditResult } from "@/lib/website-audit/types";
import { getAuditGrade } from "@/lib/website-audit/grading";
import { isCategoryScoreApplicable } from "@/lib/website-audit/scoring";

import { COMPETITOR_AUDIT_ENGINE_VERSION } from "./constants";
import type {
  CompetitorAuditCategorySnapshot,
  CompetitorAuditSummarySnapshot,
} from "./types";

function categoryColumn(
  category: AuditCategory,
):
  | "technicalScore"
  | "seoScore"
  | "contentScore"
  | "croScore"
  | "accessibilityScore"
  | "localScore"
  | "performanceScore" {
  switch (category) {
    case "technical":
      return "technicalScore";
    case "seo":
      return "seoScore";
    case "content":
      return "contentScore";
    case "cro":
      return "croScore";
    case "accessibility":
      return "accessibilityScore";
    case "local":
      return "localScore";
    case "performance":
      return "performanceScore";
  }
}

export function extractCategoryScores(
  audit: WebsiteAuditResult,
): Record<
  | "technicalScore"
  | "seoScore"
  | "contentScore"
  | "croScore"
  | "accessibilityScore"
  | "localScore"
  | "performanceScore",
  number | null
> & {
  categories: CompetitorAuditCategorySnapshot[];
} {
  const categories: CompetitorAuditCategorySnapshot[] = audit.categoryScores.map(
    (row) => ({
      category: row.category,
      label: row.label,
      score: row.score,
      maxScore: row.maxScore,
      applicable: isCategoryScoreApplicable(row),
    }),
  );

  const scores = {
    technicalScore: null as number | null,
    seoScore: null as number | null,
    contentScore: null as number | null,
    croScore: null as number | null,
    accessibilityScore: null as number | null,
    localScore: null as number | null,
    performanceScore: null as number | null,
  };

  for (const row of audit.categoryScores) {
    if (!isCategoryScoreApplicable(row)) {
      continue;
    }

    scores[categoryColumn(row.category)] = row.score;
  }

  return { ...scores, categories };
}

export function extractPagesScanned(audit: WebsiteAuditResult): number | null {
  const crawled = audit.siteData?.crawl?.crawledCount;

  if (typeof crawled === "number" && Number.isFinite(crawled)) {
    return crawled;
  }

  return 1;
}

export function buildCompetitorAuditSummary(
  audit: WebsiteAuditResult,
): CompetitorAuditSummarySnapshot {
  const topFindingIds = [...audit.findings]
    .filter((finding) => finding.status === "fail" || finding.status === "warning")
    .sort((left, right) => {
      const priorityRank = (priority: string) => {
        switch (priority) {
          case "critical":
            return 0;
          case "high":
            return 1;
          case "medium":
            return 2;
          default:
            return 3;
        }
      };

      const byPriority =
        priorityRank(left.priority) - priorityRank(right.priority);

      if (byPriority !== 0) {
        return byPriority;
      }

      return right.scoreImpact - left.scoreImpact;
    })
    .slice(0, 12)
    .map((finding) => finding.id);

  return {
    passed: audit.summary.passed,
    warnings: audit.summary.warnings,
    failed: audit.summary.failed,
    criticalIssues: audit.summary.criticalIssues,
    quickWins: audit.summary.quickWins,
    highImpactFindings: audit.summary.highImpactFindings,
    estimatedFixMinutes: audit.summary.estimatedFixMinutes,
    topFindingIds,
  };
}

export function completedCompetitorAuditData(options: {
  audit: WebsiteAuditResult;
  websiteUrl: string;
  normalizedHostname: string;
  startedAt: Date;
  completedAt?: Date;
}): {
  websiteUrl: string;
  normalizedHostname: string;
  status: "COMPLETED";
  overallScore: number;
  grade: string;
  technicalScore: number | null;
  seoScore: number | null;
  contentScore: number | null;
  croScore: number | null;
  accessibilityScore: number | null;
  localScore: number | null;
  performanceScore: number | null;
  criticalIssues: number;
  quickWins: number;
  pagesScanned: number | null;
  auditResultJson: Prisma.InputJsonValue;
  summaryJson: Prisma.InputJsonValue;
  auditEngineVersion: number;
  startedAt: Date;
  completedAt: Date;
  failedAt: null;
  failureReason: null;
} {
  const categories = extractCategoryScores(options.audit);
  const summary = buildCompetitorAuditSummary(options.audit);
  const completedAt = options.completedAt ?? new Date();

  return {
    websiteUrl: options.websiteUrl,
    normalizedHostname: options.normalizedHostname,
    status: "COMPLETED",
    overallScore: options.audit.overallScore,
    grade: getAuditGrade(options.audit.overallScore).letter,
    technicalScore: categories.technicalScore,
    seoScore: categories.seoScore,
    contentScore: categories.contentScore,
    croScore: categories.croScore,
    accessibilityScore: categories.accessibilityScore,
    localScore: categories.localScore,
    performanceScore: categories.performanceScore,
    criticalIssues: options.audit.summary.criticalIssues,
    quickWins: options.audit.summary.quickWins,
    pagesScanned: extractPagesScanned(options.audit),
    auditResultJson: options.audit as unknown as Prisma.InputJsonValue,
    summaryJson: summary as unknown as Prisma.InputJsonValue,
    auditEngineVersion: COMPETITOR_AUDIT_ENGINE_VERSION,
    startedAt: options.startedAt,
    completedAt,
    failedAt: null,
    failureReason: null,
  };
}

export function failedCompetitorAuditData(options: {
  websiteUrl: string;
  normalizedHostname: string;
  startedAt: Date;
  failureReason: string;
  failedAt?: Date;
}): {
  websiteUrl: string;
  normalizedHostname: string;
  status: "FAILED";
  auditEngineVersion: number;
  startedAt: Date;
  failedAt: Date;
  failureReason: string;
  completedAt: null;
} {
  return {
    websiteUrl: options.websiteUrl,
    normalizedHostname: options.normalizedHostname,
    status: "FAILED",
    auditEngineVersion: COMPETITOR_AUDIT_ENGINE_VERSION,
    startedAt: options.startedAt,
    failedAt: options.failedAt ?? new Date(),
    failureReason: options.failureReason.slice(0, 500),
    completedAt: null,
  };
}
