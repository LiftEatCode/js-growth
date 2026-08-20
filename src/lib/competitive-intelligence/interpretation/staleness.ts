import {
  COMPETITIVE_INTERPRETATION_PROMPT_VERSION,
  COMPETITIVE_INTERPRETATION_VERSION,
} from "./constants";
import { getOpenAiAuditModel } from "@/lib/website-audit/ai-interpretation/config";

export function evaluateCompetitiveInterpretationStaleness(options: {
  interpretation: {
    comparisonSnapshotId: string;
    interpretationVersion: number;
    promptVersion: number;
    model: string | null;
    inputFingerprint: string;
  };
  currentComparisonSnapshotId: string | null;
  currentFingerprint: string | null;
  configuredModel?: string;
}): {
  stale: boolean;
  reasons: string[];
} {
  const reasons: string[] = [];
  const configuredModel = options.configuredModel ?? getOpenAiAuditModel();

  if (!options.currentComparisonSnapshotId) {
    reasons.push("No current competitive comparison is available.");
  } else if (
    options.interpretation.comparisonSnapshotId !==
    options.currentComparisonSnapshotId
  ) {
    reasons.push(
      "Competitive comparison has changed since this interpretation was generated.",
    );
  }

  if (
    options.interpretation.interpretationVersion !==
    COMPETITIVE_INTERPRETATION_VERSION
  ) {
    reasons.push("Interpretation algorithm version has changed.");
  }

  if (
    options.interpretation.promptVersion !==
    COMPETITIVE_INTERPRETATION_PROMPT_VERSION
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
