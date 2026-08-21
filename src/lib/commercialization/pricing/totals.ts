import {
  EFFORT_BAND_PRICE_CENTS,
  MINIMUM_ENGAGEMENT_CENTS,
  type PricingEffortBand,
} from "./constants";
import type { BuiltPricingLineItem } from "./types";

export function bandUnitPriceCents(
  band: PricingEffortBand,
): number | null {
  if (band === "CUSTOM") {
    return null;
  }
  return EFFORT_BAND_PRICE_CENTS[band];
}

export function lineTotalCents(
  unitPriceCents: number | null,
  quantity: number,
): number | null {
  if (unitPriceCents == null) {
    return null;
  }
  return unitPriceCents * quantity;
}

export function effectiveUnitPriceCents(line: {
  recommendedUnitPriceCents: number | null;
  finalUnitPriceCents: number | null;
  isOverridden: boolean;
}): number | null {
  if (line.isOverridden && line.finalUnitPriceCents != null) {
    return line.finalUnitPriceCents;
  }
  if (line.finalUnitPriceCents != null) {
    return line.finalUnitPriceCents;
  }
  return line.recommendedUnitPriceCents;
}

export function computePricingTotals(lineItems: BuiltPricingLineItem[]): {
  recommendedIncludedCents: number;
  recommendedOptionalCents: number;
  recommendedTotalCents: number;
  finalIncludedCents: number;
  finalOptionalCents: number;
  finalTotalCents: number;
  minimumEngagementCents: number;
  minimumApplied: boolean;
  assessmentOnly: boolean;
} {
  let recommendedIncluded = 0;
  let recommendedOptional = 0;
  let finalIncluded = 0;
  let finalOptional = 0;

  const includedBase = lineItems.filter((l) => l.isIncluded && !l.isOptional);
  const includedOptional = lineItems.filter((l) => l.isIncluded && l.isOptional);

  for (const line of includedBase) {
    recommendedIncluded += line.recommendedLineTotalCents ?? 0;
    const eff = effectiveUnitPriceCents(line);
    finalIncluded += eff != null ? eff * line.quantity : 0;
  }

  for (const line of includedOptional) {
    recommendedOptional += line.recommendedLineTotalCents ?? 0;
    const eff = effectiveUnitPriceCents(line);
    finalOptional += eff != null ? eff * line.quantity : 0;
  }

  const assessmentOnly =
    includedBase.length > 0 &&
    includedBase.every((l) => l.effortBand === "ASSESSMENT");

  let recommendedTotal = recommendedIncluded;
  let finalTotal = finalIncluded;
  let minimumApplied = false;

  if (!assessmentOnly && recommendedIncluded > 0) {
    if (recommendedIncluded < MINIMUM_ENGAGEMENT_CENTS) {
      recommendedTotal = MINIMUM_ENGAGEMENT_CENTS;
      minimumApplied = true;
    }
  }

  if (!assessmentOnly && finalIncluded > 0) {
    if (finalIncluded < MINIMUM_ENGAGEMENT_CENTS) {
      finalTotal = MINIMUM_ENGAGEMENT_CENTS;
      minimumApplied = true;
    } else {
      finalTotal = finalIncluded;
    }
  } else if (assessmentOnly) {
    finalTotal = finalIncluded;
  }

  // Recompute minimumApplied for recommended path consistency when final also lifted
  if (!assessmentOnly && recommendedIncluded > 0 && recommendedIncluded < MINIMUM_ENGAGEMENT_CENTS) {
    minimumApplied = true;
  }

  return {
    recommendedIncludedCents: recommendedIncluded,
    recommendedOptionalCents: recommendedOptional,
    recommendedTotalCents: recommendedTotal,
    finalIncludedCents: finalIncluded,
    finalOptionalCents: finalOptional,
    finalTotalCents: finalTotal,
    minimumEngagementCents: MINIMUM_ENGAGEMENT_CENTS,
    minimumApplied,
    assessmentOnly,
  };
}
