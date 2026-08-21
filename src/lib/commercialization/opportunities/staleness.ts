import type { OpportunityCapabilitiesSnapshot } from "./types";

/**
 * Detect whether Opportunity-linked intelligence sources have moved on.
 * Never mutates Opportunity state — indicators only.
 */
export function evaluateOpportunityIntelligenceStaleness(options: {
  linkedPlanId: string | null;
  linkedInterpretationId: string | null;
  capabilitiesSnapshot: OpportunityCapabilitiesSnapshot | null;
  currentPlanId: string | null;
  currentPlanStale: boolean;
  currentPlanStaleReasons: string[];
  currentInterpretationId: string | null;
  currentInterpretationStale: boolean;
  currentInterpretationStaleReasons: string[];
  currentComparisonStale: boolean;
  currentComparisonStaleReasons: string[];
}): {
  planStale: boolean;
  planReasons: string[];
  interpretationStale: boolean;
  interpretationReasons: string[];
  comparisonStale: boolean;
  comparisonReasons: string[];
  capabilitiesSourceStale: boolean;
  capabilitiesSourceReasons: string[];
  overallStale: boolean;
} {
  const planReasons: string[] = [];
  const interpretationReasons: string[] = [];
  const comparisonReasons: string[] = [...options.currentComparisonStaleReasons];
  const capabilitiesSourceReasons: string[] = [];

  if (options.linkedPlanId) {
    if (!options.currentPlanId) {
      planReasons.push("Linked Implementation Plan is no longer available.");
    } else if (options.linkedPlanId !== options.currentPlanId) {
      planReasons.push(
        "A newer Implementation Plan exists. Opportunity still references the linked snapshot.",
      );
    }
    if (options.currentPlanStale && options.linkedPlanId === options.currentPlanId) {
      planReasons.push(...options.currentPlanStaleReasons);
    }
  }

  if (options.linkedInterpretationId) {
    if (!options.currentInterpretationId) {
      interpretationReasons.push(
        "Linked AI Implementation Strategy is no longer available.",
      );
    } else if (
      options.linkedInterpretationId !== options.currentInterpretationId
    ) {
      interpretationReasons.push(
        "A newer AI Implementation Strategy exists. Opportunity still references the linked snapshot.",
      );
    }
    if (
      options.currentInterpretationStale &&
      options.linkedInterpretationId === options.currentInterpretationId
    ) {
      interpretationReasons.push(
        ...options.currentInterpretationStaleReasons,
      );
    }
  }

  const snapshot = options.capabilitiesSnapshot;
  if (snapshot?.sourcePlanId) {
    if (!options.currentPlanId) {
      capabilitiesSourceReasons.push(
        "Capability snapshot source plan is no longer available.",
      );
    } else if (snapshot.sourcePlanId !== options.currentPlanId) {
      capabilitiesSourceReasons.push(
        "Implementation Plan changed since capabilities were snapshotted. Refresh to update.",
      );
    } else if (options.currentPlanStale) {
      capabilitiesSourceReasons.push(
        "Source Implementation Plan is stale. Refresh after rebuilding the plan if needed.",
      );
    }
  }

  const planStale = planReasons.length > 0;
  const interpretationStale = interpretationReasons.length > 0;
  const comparisonStale =
    options.currentComparisonStale || comparisonReasons.length > 0;
  const capabilitiesSourceStale = capabilitiesSourceReasons.length > 0;

  return {
    planStale,
    planReasons,
    interpretationStale,
    interpretationReasons,
    comparisonStale,
    comparisonReasons: comparisonStale ? comparisonReasons : [],
    capabilitiesSourceStale,
    capabilitiesSourceReasons,
    overallStale:
      planStale ||
      interpretationStale ||
      comparisonStale ||
      capabilitiesSourceStale,
  };
}
