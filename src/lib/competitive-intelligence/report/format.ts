import { competitivePositionLabel } from "@/lib/competitive-intelligence/comparison/labels";
import type { CompetitivePosition } from "@/lib/competitive-intelligence/comparison/types";

import {
  COMPETITIVE_REPORT_METHODOLOGY,
  COMPETITIVE_REPORT_NINETY_DAY_DISCLAIMER,
} from "./constants";
import type { CompetitiveReportReadinessStatus } from "./types";

export function formatReportScore(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export function formatReportGap(value: number): string {
  const formatted = formatReportScore(Math.abs(value));
  if (value > 0) {
    return `+${formatted}`;
  }
  if (value < 0) {
    return `-${formatted}`;
  }
  return "0";
}

export function formatClientPositionLabel(position: CompetitivePosition): string {
  return competitivePositionLabel(position);
}

export function buildSampleDisclosure(competitorCount: number): string {
  if (competitorCount <= 0) {
    return "No selected competitors were included in this comparison.";
  }

  if (competitorCount === 1) {
    return "Compared against 1 selected competitor. Findings are directional for this comparison rather than a broad market sample.";
  }

  if (competitorCount === 2) {
    return "Compared against 2 selected competitors. Treat results as a focused comparison of the selected websites.";
  }

  return `Compared against ${competitorCount} selected local competitors.`;
}

export function readinessMessage(status: CompetitiveReportReadinessStatus): string {
  switch (status) {
    case "READY":
      return "Competitive Growth Analysis is ready to preview.";
    case "MISSING_TARGET_AUDIT":
      return "Run a Website Growth Audit for this prospect before building the client report.";
    case "MISSING_COMPARISON":
      return "Generate a competitive comparison before previewing the client report.";
    case "STALE_COMPARISON":
      return "Competitive comparison must be rebuilt before generating the client report.";
    case "MISSING_INTERPRETATION":
      return "Generate an AI competitive interpretation before previewing the client report.";
    case "STALE_INTERPRETATION":
      return "AI interpretation is stale. Regenerate it before using this report.";
    default:
      return "Competitive Growth Analysis is not ready.";
  }
}

export function methodologyNote(): string {
  return COMPETITIVE_REPORT_METHODOLOGY;
}

export function ninetyDayDisclaimer(): string {
  return COMPETITIVE_REPORT_NINETY_DAY_DISCLAIMER;
}

export function formatDistanceMiles(value: number | null): string | null {
  if (value == null || !Number.isFinite(value)) {
    return null;
  }

  return `${value.toFixed(1)} mi`;
}
