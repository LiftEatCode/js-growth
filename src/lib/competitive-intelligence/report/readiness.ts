import { readinessMessage } from "./format";
import type { CompetitiveReportReadiness } from "./types";

export function getCompetitiveReportReadiness(options: {
  hasTargetAudit: boolean;
  hasComparison: boolean;
  comparisonStale: boolean;
  comparisonStaleReasons?: string[];
  hasCompletedInterpretation: boolean;
  interpretationStale: boolean;
  interpretationStaleReasons?: string[];
  interpretationMatchesComparison: boolean;
}): CompetitiveReportReadiness {
  const comparisonStaleReasons = options.comparisonStaleReasons ?? [];
  const interpretationStaleReasons = options.interpretationStaleReasons ?? [];

  if (!options.hasTargetAudit) {
    return {
      status: "MISSING_TARGET_AUDIT",
      ready: false,
      message: readinessMessage("MISSING_TARGET_AUDIT"),
      comparisonStaleReasons: [],
      interpretationStaleReasons: [],
    };
  }

  if (!options.hasComparison) {
    return {
      status: "MISSING_COMPARISON",
      ready: false,
      message: readinessMessage("MISSING_COMPARISON"),
      comparisonStaleReasons: [],
      interpretationStaleReasons: [],
    };
  }

  if (options.comparisonStale) {
    return {
      status: "STALE_COMPARISON",
      ready: false,
      message: readinessMessage("STALE_COMPARISON"),
      comparisonStaleReasons,
      interpretationStaleReasons: [],
    };
  }

  if (!options.hasCompletedInterpretation) {
    return {
      status: "MISSING_INTERPRETATION",
      ready: false,
      message: readinessMessage("MISSING_INTERPRETATION"),
      comparisonStaleReasons: [],
      interpretationStaleReasons: [],
    };
  }

  if (options.interpretationStale || !options.interpretationMatchesComparison) {
    return {
      status: "STALE_INTERPRETATION",
      ready: false,
      message: readinessMessage("STALE_INTERPRETATION"),
      comparisonStaleReasons: [],
      interpretationStaleReasons: options.interpretationMatchesComparison
        ? interpretationStaleReasons
        : [
            "Interpretation does not reference the current competitive comparison.",
            ...interpretationStaleReasons,
          ],
    };
  }

  return {
    status: "READY",
    ready: true,
    message: readinessMessage("READY"),
    comparisonStaleReasons: [],
    interpretationStaleReasons: [],
  };
}
