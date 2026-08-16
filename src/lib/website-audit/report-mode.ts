import { getReportCapabilitiesForMode } from "./report-config";
import type { ReportMode } from "./types";

export interface FindingVisibility {
  showRecommendation: boolean;
  showEstimatedTime: boolean;
  showDifficulty: boolean;
  showBusinessImpact: boolean;
  showPriority: boolean;
  showQuickWin: boolean;
  showImplementation: boolean;
}

export function getFindingVisibility(mode: ReportMode): FindingVisibility {
  const capabilities = getReportCapabilitiesForMode(mode);

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

export function getMaximumVisibleFindings(mode: ReportMode): number {
  return (
    getReportCapabilitiesForMode(mode).maxFindings ?? Number.MAX_SAFE_INTEGER
  );
}
