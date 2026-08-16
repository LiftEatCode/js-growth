import { resolveReportTier } from "./report-access";
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
  showImplementationCta: false,
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

export function getReportTier(
  mode: ReportMode,
  professionallyUnlocked = false,
): ReportTier {
  return resolveReportTier({ mode, professionallyUnlocked });
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
  professionallyUnlocked = false,
): ReportCapabilities {
  return getReportCapabilities(getReportTier(mode, professionallyUnlocked));
}

export function getReportConfigForTier(tier: ReportTier): ReportAccessConfig {
  return capabilitiesToAccessConfig(getReportCapabilities(tier));
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

export function getReportConfig(
  mode: ReportMode,
  professionallyUnlocked = false,
): ReportAccessConfig {
  return getReportConfigForTier(getReportTier(mode, professionallyUnlocked));
}

export interface AuditTierComparisonRow {
  feature: string;
  free: string;
  professional: string;
}

export function getAuditTierComparison(): AuditTierComparisonRow[] {
  const free = FREE_CAPABILITIES;
  const professional = PROFESSIONAL_CAPABILITIES;

  return [
    {
      feature: "Website Growth Score",
      free: "Included",
      professional: "Included",
    },
    {
      feature: "Category scores",
      free: "Included",
      professional: "Included",
    },
    {
      feature: "Top priority findings",
      free: free.maxPriorityFindings
        ? `Up to ${free.maxPriorityFindings}`
        : "Full",
      professional: professional.maxPriorityFindings
        ? `Up to ${professional.maxPriorityFindings}`
        : "Full",
    },
    {
      feature: "Quick wins",
      free: free.maxQuickWins ? `Up to ${free.maxQuickWins}` : "Full",
      professional: professional.maxQuickWins
        ? `Up to ${professional.maxQuickWins}`
        : "Full",
    },
    {
      feature: "Complete recommendations",
      free: free.showRecommendations ? "Included" : "Not included",
      professional: professional.showRecommendations ? "Included" : "Not included",
    },
    {
      feature: "30–90 day action plan",
      free: free.showActionPlan ? "Included" : "Not included",
      professional: professional.showActionPlan ? "Included" : "Not included",
    },
    {
      feature: "Technical evidence",
      free: free.showTechnicalEvidence ? "Included" : "Not included",
      professional: professional.showTechnicalEvidence
        ? "Included"
        : "Not included",
    },
    {
      feature: "Category deep dives",
      free: free.showCategoryDeepDives ? "Included" : "Not included",
      professional: professional.showCategoryDeepDives
        ? "Included"
        : "Not included",
    },
    {
      feature: "Professional report / PDF",
      free: free.showPdfExport ? "Included" : "Not included",
      professional: professional.showPdfExport ? "Included" : "Not included",
    },
  ];
}
