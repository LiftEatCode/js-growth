export interface ScoreBand {
  id:
    | "excellent"
    | "strong"
    | "good-foundation"
    | "needs-improvement"
    | "significant-opportunities"
    | "high-priority";
  label: string;
  description: string;
  min: number;
  max: number;
}

/**
 * Single source of truth for customer-facing score descriptions.
 * Letter grades may still be shown, but descriptive labels for a numeric
 * score must come from this table so HTML, PDF, and grade helpers agree.
 */
export const SCORE_BANDS: ScoreBand[] = [
  {
    id: "excellent",
    label: "Excellent",
    description: "The website has a strong foundation across the areas we checked.",
    min: 90,
    max: 100,
  },
  {
    id: "strong",
    label: "Strong",
    description: "The website is in solid shape, with a focused set of remaining improvements.",
    min: 80,
    max: 89,
  },
  {
    id: "good-foundation",
    label: "Good foundation",
    description: "The website has a usable foundation, with clear opportunities still ahead.",
    min: 70,
    max: 79,
  },
  {
    id: "needs-improvement",
    label: "Needs improvement",
    description: "Several areas can be strengthened to make the website more effective.",
    min: 60,
    max: 69,
  },
  {
    id: "significant-opportunities",
    label: "Significant opportunities",
    description: "The website has meaningful gaps that are likely affecting visitors and search visibility.",
    min: 40,
    max: 59,
  },
  {
    id: "high-priority",
    label: "High priority",
    description: "The scan found important issues that should be reviewed soon.",
    min: 0,
    max: 39,
  },
];

export function getScoreBand(score: number): ScoreBand {
  const normalized = Number.isFinite(score)
    ? Math.min(100, Math.max(0, Math.round(score)))
    : 0;

  return (
    SCORE_BANDS.find(
      (band) => normalized >= band.min && normalized <= band.max,
    ) ?? SCORE_BANDS[SCORE_BANDS.length - 1]
  );
}
