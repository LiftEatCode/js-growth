import type { ReportMode, ReportTier } from "./types";

export interface ReportCapabilities {
  showFullFindings: boolean;
  showRecommendations: boolean;
  showActionPlan: boolean;
  showTechnicalEvidence: boolean;
  showQuickWins: boolean;
  showCategoryDeepDives: boolean;
  showEstimatedEffort: boolean;
  showMethodology: boolean;
  showUpgradeCta: boolean;
  showImplementationCta: boolean;
  showPdfExport: boolean;
  maxPriorityFindings: number | null;
  maxQuickWins: number | null;
  maxFindings: number | null;
}

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

const UNLIMITED = Number.MAX_SAFE_INTEGER;

const FREE_CAPABILITIES: ReportCapabilities = {
  showFullFindings: false,
  showRecommendations: false,
  showActionPlan: false,
  showTechnicalEvidence: false,
  showQuickWins: true,
  showCategoryDeepDives: false,
  showEstimatedEffort: true,
  showMethodology: true,
  showUpgradeCta: true,
  showImplementationCta: true,
  showPdfExport: false,
  maxPriorityFindings: 3,
  maxQuickWins: 3,
  maxFindings: 6,
};

const PROFESSIONAL_CAPABILITIES: ReportCapabilities = {
  showFullFindings: true,
  showRecommendations: true,
  showActionPlan: true,
  showTechnicalEvidence: true,
  showQuickWins: true,
  showCategoryDeepDives: true,
  showEstimatedEffort: true,
  showMethodology: true,
  showUpgradeCta: false,
  showImplementationCta: true,
  showPdfExport: true,
  maxPriorityFindings: 5,
  maxQuickWins: 5,
  maxFindings: null,
};

export function getReportTier(mode: ReportMode): ReportTier {
  return mode === "public" ? "free" : "professional";
}

export function getReportCapabilities(
  tier: ReportTier,
): ReportCapabilities {
  return tier === "professional"
    ? PROFESSIONAL_CAPABILITIES
    : FREE_CAPABILITIES;
}

export function getReportCapabilitiesForMode(
  mode: ReportMode,
): ReportCapabilities {
  return getReportCapabilities(getReportTier(mode));
}

function capabilitiesToAccessConfig(
  capabilities: ReportCapabilities,
): ReportAccessConfig {
  const maximumFindings = capabilities.maxFindings ?? UNLIMITED;

  return {
    maximumFindings,
    maximumCriticalIssues: capabilities.maxPriorityFindings ?? UNLIMITED,
    maximumRoadmapItems: capabilities.showActionPlan ? UNLIMITED : 3,
    maximumRoadmapTasksPerPhase: capabilities.showActionPlan ? 5 : 2,
    maximumInsights: capabilities.showFullFindings ? UNLIMITED : 2,
    showRecommendations: capabilities.showRecommendations,
    showImplementation: false,
    showRevenueModel: false,
    showLeadModel: false,
    showMethodology: capabilities.showMethodology,
    showEstimatedTime: capabilities.showEstimatedEffort,
    showDifficulty: capabilities.showRecommendations,
    showBusinessImpact: true,
    showPriority: true,
    showQuickWins: capabilities.showQuickWins,
  };
}

export const REPORT_CONFIG: Record<ReportMode, ReportAccessConfig> = {
  public: capabilitiesToAccessConfig(FREE_CAPABILITIES),
  consultation: capabilitiesToAccessConfig(PROFESSIONAL_CAPABILITIES),
  client: capabilitiesToAccessConfig(PROFESSIONAL_CAPABILITIES),
};

export function getReportConfig(mode: ReportMode): ReportAccessConfig {
  return REPORT_CONFIG[mode];
}
