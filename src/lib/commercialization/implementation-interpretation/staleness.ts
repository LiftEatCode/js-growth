import {
  IMPLEMENTATION_INTERPRETATION_PROMPT_VERSION,
  IMPLEMENTATION_INTERPRETATION_VERSION,
} from "./constants";
import { getOpenAiAuditModel } from "@/lib/website-audit/ai-interpretation/config";

export function evaluateImplementationInterpretationStaleness(options: {
  interpretation: {
    implementationPlanId: string;
    interpretationVersion: number;
    promptVersion: number;
    planVersion: number;
    mappingVersion: number;
    model: string | null;
    inputFingerprint: string;
  };
  currentImplementationPlanId: string | null;
  currentPlanVersion: number | null;
  currentMappingVersion: number | null;
  currentFingerprint: string | null;
  configuredModel?: string;
}): {
  stale: boolean;
  reasons: string[];
} {
  const reasons: string[] = [];
  const configuredModel = options.configuredModel ?? getOpenAiAuditModel();

  if (!options.currentImplementationPlanId) {
    reasons.push("No current Implementation Plan is available.");
  } else if (
    options.interpretation.implementationPlanId !==
    options.currentImplementationPlanId
  ) {
    reasons.push(
      "Implementation Plan has changed since this strategy was generated.",
    );
  }

  if (
    options.currentPlanVersion != null &&
    options.interpretation.planVersion !== options.currentPlanVersion
  ) {
    reasons.push("Implementation Plan algorithm version has changed.");
  }

  if (
    options.currentMappingVersion != null &&
    options.interpretation.mappingVersion !== options.currentMappingVersion
  ) {
    reasons.push("Implementation mapping version has changed.");
  }

  if (
    options.interpretation.interpretationVersion !==
    IMPLEMENTATION_INTERPRETATION_VERSION
  ) {
    reasons.push("Interpretation algorithm version has changed.");
  }

  if (
    options.interpretation.promptVersion !==
    IMPLEMENTATION_INTERPRETATION_PROMPT_VERSION
  ) {
    reasons.push("Interpretation prompt version has changed.");
  }

  if (
    options.interpretation.model &&
    options.interpretation.model !== configuredModel
  ) {
    reasons.push("Configured interpretation model has changed.");
  }

  if (
    options.currentFingerprint &&
    options.interpretation.inputFingerprint !== options.currentFingerprint
  ) {
    reasons.push("Interpretation input fingerprint no longer matches.");
  }

  return {
    stale: reasons.length > 0,
    reasons,
  };
}
