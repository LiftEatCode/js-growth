import type { RecommendedAction } from "@/lib/commercialization/implementation-plan/types";

import { EVIDENCE_ONLY_ACTION_ID_PREFIX } from "./constants";
import type { ScopeDeliverableType } from "./constants";

/**
 * Competitive-gap "address peers" actions are rationale/evidence context,
 * not client deliverables. Sprint 1.1 facts are unchanged — this is scope mapping only.
 */
export function isEvidenceOnlyPlanAction(action: RecommendedAction): boolean {
  if (action.id.startsWith(EVIDENCE_ONLY_ACTION_ID_PREFIX)) {
    return true;
  }

  const label = action.label.toLowerCase();
  return (
    label.startsWith("address competitive ") &&
    label.includes(" gap relative to selected peers")
  );
}

export function classifyDeliverableType(options: {
  workstreamType: string | null;
  actionId: string;
}): ScopeDeliverableType {
  const id = options.actionId.toLowerCase();
  const ws = options.workstreamType ?? "";

  if (id.includes("review") || id.startsWith("review-")) {
    return "REVIEW";
  }
  if (ws === "CONTENT_FOUNDATION" || id.includes("content")) {
    return "CONTENT";
  }
  if (
    ws === "TECHNICAL_SEO" ||
    id.includes("canonical") ||
    id.includes("structured-data") ||
    id.includes("schema")
  ) {
    return "TECHNICAL";
  }
  if (ws === "CONVERSION_OPTIMIZATION" || id.includes("trust") || id.includes("cta")) {
    return "OPTIMIZATION";
  }
  if (id.includes("meta") || id.includes("open-graph") || id.includes("heading")) {
    return "CONFIGURATION";
  }
  return "IMPLEMENTATION";
}
