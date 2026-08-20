import type { ImplementationPriority } from "./types";
import type { PlanEvidenceItem } from "./types";
import {
  MAX_CRITICAL_WORKSTREAMS,
} from "./constants";

const PRIORITY_POINTS: Record<string, number> = {
  critical: 40,
  high: 25,
  medium: 12,
  low: 5,
};

/**
 * Deterministic priority score for a workstream's evidence bag.
 *
 * Components:
 * - Audit finding priorities (sum, capped)
 * - Category weakness: (100 - percent) * 0.35 when category evidence present
 * - Competitive gaps: MAJOR_GAP +35, GAP +20; +4 per competitor outperforming (cap +12)
 * - Reinforcement: +10 when both audit and competitive evidence present
 *
 * Bands:
 * - CRITICAL ≥ 80
 * - HIGH ≥ 55
 * - MEDIUM ≥ 30
 * - LOW otherwise
 */
export function computeWorkstreamPriorityScore(
  evidence: PlanEvidenceItem[],
): number {
  let score = 0;
  let findingPoints = 0;
  let hasAudit = false;
  let hasCompetitiveGap = false;

  for (const item of evidence) {
    if (item.type === "COMPETITIVE_ADVANTAGE") {
      continue;
    }

    if (item.type === "AUDIT_FINDING" || item.type === "AUDIT_CATEGORY") {
      hasAudit = true;
    }

    if (
      item.type === "COMPETITIVE_CATEGORY_GAP" ||
      item.type === "COMPETITIVE_FINDING"
    ) {
      hasCompetitiveGap = true;
    }

    if (item.auditPriority) {
      findingPoints += PRIORITY_POINTS[item.auditPriority] ?? 0;
    }

    if (
      item.type === "AUDIT_CATEGORY" &&
      item.targetScorePercent != null
    ) {
      score += Math.round((100 - item.targetScorePercent) * 0.35);
    }

    if (item.type === "COMPETITIVE_CATEGORY_GAP") {
      if (item.position === "MAJOR_GAP") {
        score += 35;
      } else if (item.position === "GAP") {
        score += 20;
      }

      if (item.competitorsOutperforming != null) {
        score += Math.min(12, item.competitorsOutperforming * 4);
      }

      if (item.gapVsAverage != null && item.gapVsAverage < -25) {
        score += 10;
      }
    }
  }

  score += Math.min(50, findingPoints);

  if (hasAudit && hasCompetitiveGap) {
    score += 10;
  }

  return Math.max(0, Math.round(score));
}

export function priorityFromScore(score: number): ImplementationPriority {
  if (score >= 80) {
    return "CRITICAL";
  }
  if (score >= 55) {
    return "HIGH";
  }
  if (score >= 30) {
    return "MEDIUM";
  }
  return "LOW";
}

/**
 * Cap CRITICAL workstreams to the top N by score; demote the rest to HIGH.
 */
export function applyCriticalCap<
  T extends { priority: ImplementationPriority; priorityScore: number },
>(workstreams: T[]): T[] {
  const critical = workstreams
    .filter((row) => row.priority === "CRITICAL")
    .sort((a, b) => b.priorityScore - a.priorityScore);

  if (critical.length <= MAX_CRITICAL_WORKSTREAMS) {
    return workstreams;
  }

  const keep = new Set(
    critical.slice(0, MAX_CRITICAL_WORKSTREAMS).map((row) => row),
  );

  return workstreams.map((row) => {
    if (row.priority !== "CRITICAL" || keep.has(row)) {
      return row;
    }
    return { ...row, priority: "HIGH" as const };
  });
}
