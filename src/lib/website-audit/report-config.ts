import type { ReportMode } from "./types";

export interface ReportAccessConfig {
  maximumFindings: number;

  maximumCriticalIssues: number;

  maximumRoadmapItems: number;

  maximumRoadmapTasksPerPhase: number;

  maximumInsights: number;

  showRecommendations: boolean;

  showImplementation: boolean;

  showRevenueModel: boolean;

  showLeadModel: boolean;

  showMethodology: boolean;

  showEstimatedTime: boolean;

  showDifficulty: boolean;

  showBusinessImpact: boolean;

  showPriority: boolean;

  showQuickWins: boolean;
}

export const REPORT_CONFIG: Record<
  ReportMode,
  ReportAccessConfig
> = {
  public: {
    maximumFindings: 6,

    maximumCriticalIssues: 3,

    maximumRoadmapItems: 3,

    maximumRoadmapTasksPerPhase: 2,

    maximumInsights: 2,

    showRecommendations: false,

    showImplementation: false,

    showRevenueModel: false,

    showLeadModel: false,

    showMethodology: false,

    showEstimatedTime: false,

    showDifficulty: false,

    showBusinessImpact: true,

    showPriority: true,

    showQuickWins: false,
  },

  consultation: {
    maximumFindings: 20,

    maximumCriticalIssues: 10,

    maximumRoadmapItems: 10,

    maximumRoadmapTasksPerPhase: 20,

    maximumInsights: 20,

    showRecommendations: true,

    showImplementation: false,

    showRevenueModel: true,

    showLeadModel: true,

    showMethodology: true,

    showEstimatedTime: true,

    showDifficulty: true,

    showBusinessImpact: true,

    showPriority: true,

    showQuickWins: true,
  },

  client: {
    maximumFindings: Number.MAX_SAFE_INTEGER,

    maximumCriticalIssues: Number.MAX_SAFE_INTEGER,

    maximumRoadmapItems: Number.MAX_SAFE_INTEGER,

    maximumRoadmapTasksPerPhase:
      Number.MAX_SAFE_INTEGER,

    maximumInsights: Number.MAX_SAFE_INTEGER,

    showRecommendations: true,

    showImplementation: true,

    showRevenueModel: true,

    showLeadModel: true,

    showMethodology: true,

    showEstimatedTime: true,

    showDifficulty: true,

    showBusinessImpact: true,

    showPriority: true,

    showQuickWins: true,
  },
};

export function getReportConfig(
  mode: ReportMode,
): ReportAccessConfig {
  return REPORT_CONFIG[mode];
}