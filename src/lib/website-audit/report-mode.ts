import { resolveReportTier } from "./report-access";
import { getReportCapabilities, getReportCapabilitiesForMode } from "./report-config";
import type { ReportMode, ReportTier } from "./types";

export interface FindingVisibility {
  showRecommendation: boolean;
  showEstimatedTime: boolean;
  showDifficulty: boolean;
  showBusinessImpact: boolean;
  showPriority: boolean;
  showQuickWin: boolean;
  showImplementation: boolean;
}

export function getFindingVisibilityForTier(tier: ReportTier): FindingVisibility {
  const capabilities = getReportCapabilities(tier);

  return {
    showRecommendation: capabilities.showRecommendations,
    showEstimatedTime: capabilities.showEstimatedEffort,
    showDifficulty: capabilities.showRecommendations,
    showBusinessImpact: true,
    showPriority: true,
    showQuickWin: capabilities.showQuickWins,
    showImplementation: false,
  };
}

export function getFindingVisibility(
  mode: ReportMode,
  professionallyUnlocked = false,
): FindingVisibility {
  return getFindingVisibilityForTier(
    resolveReportTier({ mode, professionallyUnlocked }),
  );
}

export function getMaximumVisibleFindings(mode: ReportMode): number {
  return (
    getReportCapabilitiesForMode(mode).maxFindings ?? Number.MAX_SAFE_INTEGER
  );
}
