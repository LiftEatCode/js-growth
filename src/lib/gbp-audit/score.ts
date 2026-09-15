import {
  CATEGORY_LABELS,
  CATEGORY_WEIGHTS,
  SCORE_BANDS,
} from "./constants";
import { isScoredStatus } from "./engine";
import type {
  GbpAuditCategory,
  GbpAuditFinding,
  GbpCategoryScore,
  GbpFindingCounts,
} from "./types";
import { GBP_AUDIT_CATEGORIES } from "./types";

export function clampScore(
  value: number,
  minimum = 0,
  maximum = 100,
): number {
  if (!Number.isFinite(value)) {
    return minimum;
  }
  return Math.min(maximum, Math.max(minimum, value));
}

export function getScoreBand(score: number): (typeof SCORE_BANDS)[number] {
  const normalized = clampScore(Math.round(score));
  return (
    SCORE_BANDS.find(
      (band) => normalized >= band.min && normalized <= band.max,
    ) ?? SCORE_BANDS[SCORE_BANDS.length - 1]
  );
}

export function countFindings(findings: GbpAuditFinding[]): GbpFindingCounts {
  const counts: GbpFindingCounts = {
    pass: 0,
    warning: 0,
    fail: 0,
    not_applicable: 0,
    insufficient_data: 0,
  };

  for (const finding of findings) {
    counts[finding.status] += 1;
  }

  return counts;
}

export function scoreCategory(
  category: GbpAuditCategory,
  findings: GbpAuditFinding[],
): GbpCategoryScore {
  const categoryFindings = findings.filter(
    (finding) => finding.category === category,
  );

  const scored = categoryFindings.filter((finding) =>
    isScoredStatus(finding.status),
  );
  const earnedPoints = scored.reduce((total, finding) => total + finding.score, 0);
  const possiblePoints = scored.reduce(
    (total, finding) => total + finding.maxScore,
    0,
  );

  const applicable = possiblePoints > 0;
  const score = applicable
    ? Math.round(clampScore((earnedPoints / possiblePoints) * 100))
    : 0;

  return {
    category,
    label: CATEGORY_LABELS[category],
    score,
    applicable,
    weight: CATEGORY_WEIGHTS[category],
    earnedPoints,
    possiblePoints,
    applicableRuleCount: scored.length,
    notApplicableCount: categoryFindings.filter(
      (finding) => finding.status === "not_applicable",
    ).length,
    insufficientDataCount: categoryFindings.filter(
      (finding) => finding.status === "insufficient_data",
    ).length,
  };
}

export function scoreCategories(
  findings: GbpAuditFinding[],
): GbpCategoryScore[] {
  return GBP_AUDIT_CATEGORIES.map((category) =>
    scoreCategory(category, findings),
  );
}

/**
 * Weighted overall score. Categories with no scored rules (all N/A or
 * insufficient_data) are dropped and remaining weights are renormalized
 * so missing optional data does not collapse the score toward zero.
 */
export function scoreOverall(categoryScores: GbpCategoryScore[]): number {
  const applicable = categoryScores.filter((item) => item.applicable);
  const weightSum = applicable.reduce((total, item) => total + item.weight, 0);

  if (weightSum === 0) {
    return 0;
  }

  const weighted = applicable.reduce(
    (total, item) => total + item.score * item.weight,
    0,
  );

  return Math.round(clampScore(weighted / weightSum));
}
