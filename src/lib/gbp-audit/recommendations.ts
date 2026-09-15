import { SEVERITY_RANK } from "./constants";
import { isScoredStatus } from "./engine";
import type {
  GbpAuditFinding,
  GbpRecommendation,
  GbpStrength,
} from "./types";

export function buildRecommendations(
  findings: GbpAuditFinding[],
): GbpRecommendation[] {
  const actionable = findings.filter(
    (finding) => finding.status === "fail" || finding.status === "warning",
  );

  const mapped: GbpRecommendation[] = actionable.map((finding) => ({
    ruleId: finding.id,
    category: finding.category,
    title: finding.title,
    found: finding.summary,
    whyItMatters: finding.whyItMatters,
    whatToDo: finding.recommendation,
    severity: finding.severity,
    scoreImpact: finding.maxScore - finding.score,
  }));

  mapped.sort((left, right) => {
    const severityDelta =
      SEVERITY_RANK[left.severity] - SEVERITY_RANK[right.severity];
    if (severityDelta !== 0) {
      return severityDelta;
    }
    if (right.scoreImpact !== left.scoreImpact) {
      return right.scoreImpact - left.scoreImpact;
    }
    return left.ruleId.localeCompare(right.ruleId);
  });

  return mapped;
}

export function buildStrengths(findings: GbpAuditFinding[]): GbpStrength[] {
  return findings
    .filter((finding) => finding.status === "pass")
    .sort((left, right) => {
      if (right.maxScore !== left.maxScore) {
        return right.maxScore - left.maxScore;
      }
      return left.id.localeCompare(right.id);
    })
    .map((finding) => ({
      ruleId: finding.id,
      category: finding.category,
      title: finding.title,
      summary: finding.summary,
    }));
}

export function applicableRuleCount(findings: GbpAuditFinding[]): number {
  return findings.filter((finding) => isScoredStatus(finding.status)).length;
}
