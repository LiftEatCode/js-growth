export type CompetitiveInterpretationStatusValue =
  | "PENDING"
  | "RUNNING"
  | "COMPLETED"
  | "FAILED";

export type CompetitiveInterpretationFailureCode =
  | "MODEL_ERROR"
  | "TIMEOUT"
  | "INVALID_OUTPUT"
  | "VALIDATION_FAILED"
  | "STALE_INPUT"
  | "MISSING_COMPARISON"
  | "UNSUPPORTED_COMPARISON_VERSION"
  | "NOT_CONFIGURED"
  | "UNAUTHORIZED";

export interface CompetitiveAiCompetitorInput {
  businessName: string;
  websiteGrowthScore: number;
  competitiveRelevance: number;
  distanceMiles: number | null;
}

export interface CompetitiveAiCategoryInput {
  sourceKey: string;
  category: string;
  label: string;
  targetScore: number;
  competitorAverage: number;
  competitorBest: number;
  gap: number;
  targetRank: number;
  participantCount: number;
  position: string;
}

export interface CompetitiveAiOpportunityInput {
  sourceKey: string;
  category: string | null;
  type: string;
  priority: string;
  title: string;
  facts: {
    targetScore: number | null;
    competitorAverage: number | null;
    gap: number | null;
    competitorsOutperforming: number | null;
    competitorsCompared: number;
  };
  evidence: string[];
}

export interface CompetitiveAiAdvantageInput {
  sourceKey: string;
  category: string | null;
  kind: string;
  title: string;
  facts: {
    gapVsAverage: number | null;
    targetRank: number | null;
    participantCount: number | null;
  };
  evidence: string[];
}

export interface CompetitiveAiInput {
  meta: {
    interpretationVersion: number;
    promptVersion: number;
    comparisonVersion: number;
    auditEngineVersion: number;
    comparisonSnapshotId: string;
  };
  target: {
    businessName: string;
    websiteGrowthScore: number;
  };
  comparison: {
    competitorCount: number;
    competitorAverage: number;
    competitorBest: number;
    competitorWorst: number;
    gapVsAverage: number;
    gapVsLeader: number;
    targetRank: number;
    participantCount: number;
    position: string;
  };
  categories: CompetitiveAiCategoryInput[];
  topOpportunities: CompetitiveAiOpportunityInput[];
  topAdvantages: CompetitiveAiAdvantageInput[];
  competitors: CompetitiveAiCompetitorInput[];
  allowedSourceKeys: string[];
}

export interface CompetitiveInterpretationContent {
  executiveSummary: {
    headline: string;
    summary: string;
  };
  competitivePosition: {
    assessment: string;
    explanation: string;
  };
  risks: Array<{
    sourceKey: string;
    title: string;
    explanation: string;
  }>;
  advantages: Array<{
    sourceKey: string;
    title: string;
    explanation: string;
  }>;
  priorities: Array<{
    sourceKey: string;
    supportingSourceKeys: string[];
    title: string;
    rationale: string;
    recommendedActions: string[];
  }>;
  ninetyDayPlan: Array<{
    phase: string;
    objective: string;
    actions: string[];
    sourceKeys: string[];
  }>;
  internalTalkingPoints: string[];
}
