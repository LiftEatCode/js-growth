import { CONFIDENCE_THRESHOLDS } from "./constants";
import { isScoredStatus } from "./engine";
import { clampScore } from "./score";
import type { GbpAuditConfidence, GbpAuditFinding } from "./types";

export function buildConfidence(findings: GbpAuditFinding[]): GbpAuditConfidence {
  const evaluatedRules = findings.filter((finding) =>
    isScoredStatus(finding.status),
  ).length;
  const insufficientDataRules = findings.filter(
    (finding) => finding.status === "insufficient_data",
  ).length;
  const applicableRules = evaluatedRules + insufficientDataRules;
  const coveragePercent =
    applicableRules === 0
      ? 100
      : Math.round(
          clampScore((evaluatedRules / applicableRules) * 100),
        );

  const level =
    coveragePercent >= CONFIDENCE_THRESHOLDS.highMinCoveragePercent
      ? "high"
      : coveragePercent >= CONFIDENCE_THRESHOLDS.mediumMinCoveragePercent
        ? "medium"
        : "low";

  return {
    level,
    coveragePercent,
    evaluatedRules,
    insufficientDataRules,
    applicableRules,
  };
}
