import {
  ADVANTAGE_GAP,
  MAJOR_ADVANTAGE_GAP,
  MAJOR_GAP_THRESHOLD,
  PARITY_GAP,
} from "./constants";
import type { CompetitivePosition, ComparisonParticipantScore } from "./types";

/** Round to one decimal place (e.g. 87.333 → 87.3). */
export function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

export function average(values: number[]): number | null {
  if (values.length === 0) {
    return null;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

/** Median of a non-empty number list. */
export function median(values: number[]): number | null {
  if (values.length === 0) {
    return null;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2;
  }

  return sorted[mid] ?? null;
}

/**
 * Competition ranking (1224 style): ties share rank; next rank skips.
 * Higher score = better = lower rank number.
 * Tie-break: target before competitors, then stable by id.
 */
export function competitionRank(
  participants: ComparisonParticipantScore[],
  targetId: string,
): { rank: number; participantCount: number } {
  const sorted = [...participants].sort((left, right) => {
    if (right.score !== left.score) {
      return right.score - left.score;
    }

    if (left.id === targetId) {
      return -1;
    }

    if (right.id === targetId) {
      return 1;
    }

    return left.id.localeCompare(right.id);
  });

  let previousScore: number | null = null;
  let previousRank = 0;

  for (let index = 0; index < sorted.length; index += 1) {
    const row = sorted[index];

    if (!row) {
      continue;
    }

    const rank =
      previousScore !== null && row.score === previousScore
        ? previousRank
        : index + 1;

    previousScore = row.score;
    previousRank = rank;

    if (row.id === targetId) {
      return { rank, participantCount: participants.length };
    }
  }

  return { rank: participants.length, participantCount: participants.length };
}

export function classifyPosition(gapVsAverage: number): CompetitivePosition {
  if (gapVsAverage >= MAJOR_ADVANTAGE_GAP) {
    return "MAJOR_ADVANTAGE";
  }

  if (gapVsAverage >= ADVANTAGE_GAP) {
    return "ADVANTAGE";
  }

  if (gapVsAverage > -PARITY_GAP && gapVsAverage < PARITY_GAP) {
    return "PARITY";
  }

  if (gapVsAverage <= -MAJOR_GAP_THRESHOLD) {
    return "MAJOR_GAP";
  }

  return "GAP";
}

export function buildScoreDistribution(options: {
  targetId: string;
  targetLabel: string;
  targetScore: number;
  competitors: Array<{ id: string; label: string; score: number }>;
}) {
  const competitorScores = options.competitors.map((row) => row.score);
  const competitorAverageRaw = average(competitorScores);
  const competitorMedianRaw = median(competitorScores);
  const competitorBest =
    competitorScores.length > 0 ? Math.max(...competitorScores) : options.targetScore;
  const competitorWorst =
    competitorScores.length > 0 ? Math.min(...competitorScores) : options.targetScore;

  const competitorAverage =
    competitorAverageRaw === null ? options.targetScore : round1(competitorAverageRaw);
  const competitorMedian =
    competitorMedianRaw === null ? options.targetScore : round1(competitorMedianRaw);

  const gapVsAverage = round1(options.targetScore - competitorAverage);
  const gapVsLeader = round1(options.targetScore - competitorBest);

  const participants: ComparisonParticipantScore[] = [
    {
      id: options.targetId,
      label: options.targetLabel,
      score: options.targetScore,
      kind: "target",
    },
    ...options.competitors.map((row) => ({
      id: row.id,
      label: row.label,
      score: row.score,
      kind: "competitor" as const,
    })),
  ];

  const ranking = competitionRank(participants, options.targetId);
  const competitorsOutperforming = options.competitors.filter(
    (row) => row.score > options.targetScore,
  ).length;

  return {
    targetScore: options.targetScore,
    competitorScores,
    competitorAverage,
    competitorMedian,
    competitorBest,
    competitorWorst,
    gapVsAverage,
    gapVsLeader,
    targetRank: ranking.rank,
    participantCount: ranking.participantCount,
    competitorsOutperforming,
    competitorsCompared: options.competitors.length,
  };
}

/** Convert raw category points to a 0–100 percentage. */
export function categoryScorePercent(score: number, maxScore: number): number {
  if (!Number.isFinite(score) || !Number.isFinite(maxScore) || maxScore <= 0) {
    return 0;
  }

  return Math.round((score / maxScore) * 100);
}
