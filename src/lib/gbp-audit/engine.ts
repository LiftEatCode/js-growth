import { RULE_MAX_SCORES, WARNING_SCORE_RATIO, type GbpRuleId } from "./constants";
import type {
  GbpAuditFinding,
  GbpAuditRule,
  GbpEvidence,
  GbpFindingStatus,
  GbpRuleContext,
  GbpSeverity,
} from "./types";

export function pointsForStatus(
  status: GbpFindingStatus,
  maxScore: number,
): number {
  if (status === "pass") {
    return maxScore;
  }
  if (status === "warning") {
    return Math.round(maxScore * WARNING_SCORE_RATIO);
  }
  return 0;
}

export function defaultSeverity(status: GbpFindingStatus): GbpSeverity {
  if (status === "fail") {
    return "high";
  }
  if (status === "warning") {
    return "medium";
  }
  if (status === "pass") {
    return "info";
  }
  return "info";
}

export function isScoredStatus(status: GbpFindingStatus): boolean {
  return status === "pass" || status === "warning" || status === "fail";
}

interface CreateGbpFindingInput {
  id: GbpRuleId;
  category: GbpAuditFinding["category"];
  title: string;
  status: GbpFindingStatus;
  summary: string;
  whyItMatters: string;
  recommendation: string;
  evidence?: GbpEvidence;
  severity?: GbpSeverity;
}

export function createGbpFinding(
  input: CreateGbpFindingInput,
): GbpAuditFinding {
  const maxScore = RULE_MAX_SCORES[input.id];

  return {
    id: input.id,
    category: input.category,
    title: input.title,
    status: input.status,
    severity: input.severity ?? defaultSeverity(input.status),
    score: pointsForStatus(input.status, maxScore),
    maxScore,
    evidence: input.evidence ?? {},
    summary: input.summary,
    whyItMatters: input.whyItMatters,
    recommendation: input.recommendation,
  };
}

export function runGbpRules(
  rules: GbpAuditRule[],
  context: GbpRuleContext,
): GbpAuditFinding[] {
  return rules.map((rule) => rule.evaluate(context));
}
