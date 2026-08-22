import { effectiveUnitPriceCents } from "./totals";
import type { BuiltPricingLineItem } from "./types";

export const PRICING_COMPLETENESS = [
  "COMPLETE",
  "INCOMPLETE_CUSTOM_PRICING",
] as const;

export type PricingCompleteness = (typeof PRICING_COMPLETENESS)[number];

/**
 * Included non-optional work that still needs a human-entered final price.
 * Optional / excluded custom work does not make base pricing incomplete.
 */
export function lineRequiresManualPrice(line: {
  isIncluded: boolean;
  isOptional: boolean;
  isCustom: boolean;
  effortBand: string;
  recommendedUnitPriceCents: number | null;
  finalUnitPriceCents: number | null;
}): boolean {
  if (!line.isIncluded || line.isOptional) {
    return false;
  }

  const needsManual =
    line.isCustom ||
    line.effortBand === "CUSTOM" ||
    line.recommendedUnitPriceCents == null;

  return needsManual && line.finalUnitPriceCents == null;
}

export function evaluatePricingCompleteness(
  lineItems: Array<{
    isIncluded: boolean;
    isOptional: boolean;
    isCustom: boolean;
    effortBand: string;
    quantity: number;
    recommendedUnitPriceCents: number | null;
    finalUnitPriceCents: number | null;
    isOverridden: boolean;
  }>,
): {
  completeness: PricingCompleteness;
  unpricedIncludedCount: number;
  knownPricedIncludedCents: number;
  isComplete: boolean;
} {
  const includedBase = lineItems.filter((l) => l.isIncluded && !l.isOptional);
  const unpriced = includedBase.filter((l) => lineRequiresManualPrice(l));

  let knownPricedIncludedCents = 0;
  for (const line of includedBase) {
    if (lineRequiresManualPrice(line)) {
      continue;
    }
    const unit = effectiveUnitPriceCents(line);
    if (unit != null) {
      knownPricedIncludedCents += unit * line.quantity;
    }
  }

  const completeness: PricingCompleteness =
    unpriced.length > 0 ? "INCOMPLETE_CUSTOM_PRICING" : "COMPLETE";

  return {
    completeness,
    unpricedIncludedCount: unpriced.length,
    knownPricedIncludedCents,
    isComplete: completeness === "COMPLETE",
  };
}
