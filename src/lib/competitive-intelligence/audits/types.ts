import type { AuditCategory, WebsiteAuditResult } from "@/lib/website-audit/types";

export type CompetitorAuditStatusValue =
  | "PENDING"
  | "RUNNING"
  | "COMPLETED"
  | "FAILED";

export interface CompetitorAuditCategorySnapshot {
  category: AuditCategory;
  label: string;
  score: number;
  maxScore: number;
  applicable: boolean;
}

export interface CompetitorAuditSummarySnapshot {
  passed: number;
  warnings: number;
  failed: number;
  criticalIssues: number;
  quickWins: number;
  highImpactFindings: number;
  estimatedFixMinutes: number;
  topFindingIds: string[];
}

export interface CompetitorAuditAttemptResult {
  prospectCompetitorId: string;
  outcome: "completed" | "reused" | "failed" | "skipped";
  auditId: string | null;
  message: string;
}

export type WebsiteAuditResultSnapshot = WebsiteAuditResult;
