import type { CompetitivePosition } from "@/lib/competitive-intelligence/comparison/types";

export type CompetitiveReportReadinessStatus =
  | "READY"
  | "MISSING_TARGET_AUDIT"
  | "MISSING_COMPARISON"
  | "STALE_COMPARISON"
  | "MISSING_INTERPRETATION"
  | "STALE_INTERPRETATION";

export interface CompetitiveReportReadiness {
  status: CompetitiveReportReadinessStatus;
  ready: boolean;
  message: string;
  comparisonStaleReasons: string[];
  interpretationStaleReasons: string[];
}

export interface CompetitiveReportMetric {
  label: string;
  value: string;
  hint?: string;
}

export interface CompetitiveReportCategoryRow {
  category: string;
  label: string;
  targetScore: number;
  competitorAverage: number;
  gap: number;
  position: CompetitivePosition;
  positionLabel: string;
  targetRank: number;
  participantCount: number;
}

export interface CompetitiveReportOpportunityCard {
  title: string;
  explanation: string;
  targetScore: number | null;
  competitorAverage: number | null;
  gap: number | null;
  positionLabel: string | null;
  recommendedActions: string[];
}

export interface CompetitiveReportAdvantageCard {
  title: string;
  explanation: string;
  targetScore: number | null;
  competitorAverage: number | null;
  gap: number | null;
  positionLabel: string | null;
  kind: "category" | "finding";
}

export interface CompetitiveReportCompetitorRow {
  businessName: string;
  websiteGrowthScore: number;
  distanceMiles: number | null;
  competitiveRelevance: number | null;
  isTarget: boolean;
}

export interface CompetitiveReportPriorityCard {
  number: number;
  title: string;
  explanation: string;
  actions: string[];
  evidenceLabel: string | null;
  evidenceLines: string[];
}

export interface CompetitiveReportPhaseCard {
  phase: string;
  objective: string;
  actions: string[];
}

export interface CompetitiveGrowthReportViewModel {
  reportVersion: number;
  preparedBy: string;
  businessName: string;
  locationLabel: string | null;
  analysisDateLabel: string;
  competitorCount: number;
  sampleDisclosure: string;
  methodologyNote: string;
  metrics: {
    websiteGrowthScore: number;
    selectedCompetitorAverage: number;
    competitivePosition: string;
    competitiveGap: number;
  };
  executiveSummary: {
    headline: string;
    summary: string;
    positionAssessment: string;
    positionExplanation: string;
  };
  categories: CompetitiveReportCategoryRow[];
  opportunities: CompetitiveReportOpportunityCard[];
  advantages: CompetitiveReportAdvantageCard[];
  competitiveSet: CompetitiveReportCompetitorRow[];
  priorities: CompetitiveReportPriorityCard[];
  ninetyDayPlan: CompetitiveReportPhaseCard[];
  ninetyDayDisclaimer: string;
  cta: {
    headline: string;
    body: string;
    services: string[];
    primaryLabel: string;
    /** Visual only in Sprint 13 — no submit/send. */
    primaryHref: string | null;
  };
}
