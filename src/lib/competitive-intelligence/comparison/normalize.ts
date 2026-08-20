import { isCategoryScoreApplicable } from "@/lib/website-audit/scoring";
import type {
  AuditCategory,
  AuditFinding,
  AuditPriority,
  WebsiteAuditResult,
} from "@/lib/website-audit/types";

import type { ComparisonInputAudit } from "./types";

export function normalizeWebsiteAuditResult(
  audit: WebsiteAuditResult,
  auditEngineVersion: number,
): ComparisonInputAudit {
  return {
    overallScore: audit.overallScore,
    auditEngineVersion,
    categoryScores: audit.categoryScores.map((row) => ({
      category: row.category,
      label: row.label,
      score: row.score,
      maxScore: row.maxScore,
      applicable: isCategoryScoreApplicable(row),
    })),
    findings: audit.findings.map((finding) => ({
      id: finding.id,
      title: finding.title,
      category: finding.category,
      status: finding.status,
      priority: finding.priority,
    })),
  };
}

export function normalizeStoredAuditJson(
  value: unknown,
  auditEngineVersion: number,
  fallbackOverallScore?: number | null,
): ComparisonInputAudit | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const audit = value as Partial<WebsiteAuditResult>;
  const overallScore =
    typeof audit.overallScore === "number"
      ? audit.overallScore
      : fallbackOverallScore;

  if (typeof overallScore !== "number" || !Number.isFinite(overallScore)) {
    return null;
  }

  const categoryScores = Array.isArray(audit.categoryScores)
    ? audit.categoryScores
        .filter(
          (row): row is NonNullable<typeof row> =>
            Boolean(row) &&
            typeof row === "object" &&
            typeof row.category === "string" &&
            typeof row.score === "number" &&
            typeof row.maxScore === "number",
        )
        .map((row) => ({
          category: row.category as AuditCategory,
          label:
            typeof row.label === "string" ? row.label : String(row.category),
          score: row.score,
          maxScore: row.maxScore,
          applicable: isCategoryScoreApplicable(row),
        }))
    : [];

  const findings = Array.isArray(audit.findings)
    ? audit.findings
        .filter(
          (row): row is AuditFinding =>
            Boolean(row) &&
            typeof row === "object" &&
            typeof row.id === "string" &&
            typeof row.title === "string" &&
            typeof row.category === "string" &&
            (row.status === "pass" ||
              row.status === "warning" ||
              row.status === "fail"),
        )
        .map((row) => ({
          id: row.id,
          title: row.title,
          category: row.category,
          status: row.status,
          priority: (row.priority ?? "medium") as AuditPriority,
        }))
    : [];

  return {
    overallScore,
    auditEngineVersion,
    categoryScores,
    findings,
  };
}
