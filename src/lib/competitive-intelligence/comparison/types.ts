import type { AuditCategory, AuditPriority } from "@/lib/website-audit/types";

export type CompetitivePosition =
  | "MAJOR_ADVANTAGE"
  | "ADVANTAGE"
  | "PARITY"
  | "GAP"
  | "MAJOR_GAP";

export type FindingPattern =
  | "TARGET_ONLY_WEAKNESS"
  | "COMMON_MARKET_WEAKNESS"
  | "COMPETITIVE_ADVANTAGE"
  | "MARKET_STANDARD"
  | "MIXED";

export type OpportunityPriority = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export type OpportunityType =
  | "COMPETITIVE_GAP"
  | "TARGET_ONLY_WEAKNESS"
  | "COMMON_MARKET_WEAKNESS";

export interface ComparisonParticipantScore {
  id: string;
  label: string;
  score: number;
  kind: "target" | "competitor";
}

export interface ScoreDistribution {
  targetScore: number;
  competitorScores: number[];
  competitorAverage: number;
  competitorMedian: number;
  competitorBest: number;
  competitorWorst: number;
  gapVsAverage: number;
  gapVsLeader: number;
  targetRank: number;
  participantCount: number;
  competitorsOutperforming: number;
  competitorsCompared: number;
}

export interface OverallComparison extends ScoreDistribution {
  position: CompetitivePosition;
}

export interface CategoryComparison extends ScoreDistribution {
  category: AuditCategory;
  label: string;
  position: CompetitivePosition;
  competitorBreakdown: Array<{
    prospectCompetitorId: string;
    businessName: string;
    score: number;
  }>;
}

export interface FindingComparison {
  findingId: string;
  title: string;
  category: AuditCategory;
  priority: AuditPriority;
  targetHasIssue: boolean;
  competitorIssueCount: number;
  competitorPassCount: number;
  competitorsCompared: number;
  prevalencePercent: number;
  pattern: FindingPattern;
}

export interface CompetitiveAdvantage {
  id: string;
  kind: "OVERALL" | "CATEGORY" | "FINDING";
  category: AuditCategory | null;
  title: string;
  evidence: string[];
  gapVsAverage: number | null;
  targetRank: number | null;
  participantCount: number | null;
}

export interface CompetitiveOpportunity {
  id: string;
  type: OpportunityType;
  priority: OpportunityPriority;
  priorityScore: number;
  category: AuditCategory | null;
  title: string;
  targetScore: number | null;
  competitorAverage: number | null;
  gap: number | null;
  competitorsOutperforming: number | null;
  competitorsCompared: number;
  findingId: string | null;
  evidence: string[];
}

export interface ComparedCompetitorSummary {
  prospectCompetitorId: string;
  competitorAuditId: string;
  businessName: string;
  website: string | null;
  competitiveRelevanceScore: number;
  distanceMiles: number | null;
  websiteGrowthScore: number;
  auditEngineVersion: number;
  auditedAt: string | null;
}

export interface CompetitiveComparison {
  comparisonVersion: number;
  auditEngineVersion: number;
  prospectId: string;
  campaignId: string;
  auditReportId: string;
  generatedAt: string;

  competitorsCompared: ComparedCompetitorSummary[];

  overall: OverallComparison;
  categories: CategoryComparison[];
  findingComparisons: FindingComparison[];
  advantages: CompetitiveAdvantage[];
  opportunities: CompetitiveOpportunity[];

  notes: string[];
}

export interface ComparisonInputAudit {
  overallScore: number;
  auditEngineVersion: number;
  categoryScores: Array<{
    category: AuditCategory;
    label: string;
    score: number;
    maxScore: number;
    applicable: boolean;
  }>;
  findings: Array<{
    id: string;
    title: string;
    category: AuditCategory;
    status: "pass" | "warning" | "fail";
    priority: AuditPriority;
  }>;
}

export interface ComparisonCompetitorInput {
  prospectCompetitorId: string;
  competitorAuditId: string;
  businessName: string;
  website: string | null;
  competitiveRelevanceScore: number;
  distanceMiles: number | null;
  auditedAt: string | null;
  audit: ComparisonInputAudit;
}
