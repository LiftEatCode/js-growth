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
  
  export function getFindingVisibility(
    mode: ReportMode,
  ): FindingVisibility {
    switch (mode) {
      case "client":
        return {
          showRecommendation: true,
          showEstimatedTime: true,
          showDifficulty: true,
          showBusinessImpact: true,
          showPriority: true,
          showQuickWin: true,
          showImplementation: true,
        };
  
      case "consultation":
        return {
          showRecommendation: true,
          showEstimatedTime: true,
          showDifficulty: true,
          showBusinessImpact: true,
          showPriority: true,
          showQuickWin: true,
          showImplementation: false,
        };
  
      case "public":
      default:
        return {
          showRecommendation: false,
          showEstimatedTime: false,
          showDifficulty: false,
          showBusinessImpact: true,
          showPriority: true,
          showQuickWin: false,
          showImplementation: false,
        };
    }
  }
  
  export function getMaximumVisibleFindings(
    mode: ReportMode,
  ): number {
    switch (mode) {
      case "client":
        return Number.MAX_SAFE_INTEGER;
  
      case "consultation":
        return 20;
  
      case "public":
      default:
        return 6;
    }
  }