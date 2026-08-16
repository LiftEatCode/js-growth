import type {
  CompetitiveGap,
  CompetitiveGapDirection,
  CompetitiveGapMagnitude,
  CompetitiveMetric,
  CompetitiveMetricUnit,
} from "./types";

export interface GapClassificationInput {
  metric: CompetitiveMetric;
  unit: CompetitiveMetricUnit;
  customerValue: number;
  competitorValues: number[];
  benchmarkValue: number;
  higherIsBetter: boolean;
  sampleNote: string;
}

export function classifyGapMagnitude(options: {
  customerValue: number;
  benchmarkValue: number;
  unit: CompetitiveMetricUnit;
}): CompetitiveGapMagnitude | "similar" {
  const absDiff = Math.abs(options.customerValue - options.benchmarkValue);
  const relative =
    absDiff /
    Math.max(Math.abs(options.benchmarkValue), Math.abs(options.customerValue), 1);

  if (options.unit === "count") {
    if (absDiff <= 1 || (absDiff <= 2 && relative < 0.25)) {
      return "similar";
    }

    if ((absDiff >= 5 && relative >= 0.45) || absDiff >= 8) {
      return "large";
    }

    return "moderate";
  }

  if (options.unit === "percent") {
    if (absDiff < 15) {
      return "similar";
    }

    if (absDiff >= 25) {
      return "large";
    }

    return "moderate";
  }

  if (options.unit === "words") {
    if (absDiff < 120 || relative < 0.22) {
      return "similar";
    }

    if (absDiff >= 250 && relative >= 0.4) {
      return "large";
    }

    return "moderate";
  }

  if (absDiff < 1) {
    return "similar";
  }

  if (absDiff >= 2) {
    return "large";
  }

  return "moderate";
}

export function classifyGapDirection(
  customerValue: number,
  benchmarkValue: number,
  higherIsBetter: boolean,
  magnitude: CompetitiveGapMagnitude | "similar",
): CompetitiveGapDirection {
  if (magnitude === "similar") {
    return "similar";
  }

  const signed = higherIsBetter
    ? customerValue - benchmarkValue
    : benchmarkValue - customerValue;

  return signed >= 0 ? "ahead" : "behind";
}

export function buildGap(input: GapClassificationInput): CompetitiveGap {
  const magnitudeOrSimilar = classifyGapMagnitude({
    customerValue: input.customerValue,
    benchmarkValue: input.benchmarkValue,
    unit: input.unit,
  });
  const direction = classifyGapDirection(
    input.customerValue,
    input.benchmarkValue,
    input.higherIsBetter,
    magnitudeOrSimilar,
  );
  const magnitude: CompetitiveGapMagnitude =
    magnitudeOrSimilar === "similar" ? "small" : magnitudeOrSimilar;

  return {
    metric: input.metric,
    unit: input.unit,
    customerValue: input.customerValue,
    competitorValues: input.competitorValues,
    benchmarkValue: input.benchmarkValue,
    gapDirection: direction,
    magnitude,
    higherIsBetter: input.higherIsBetter,
    sampleNote: input.sampleNote,
  };
}
