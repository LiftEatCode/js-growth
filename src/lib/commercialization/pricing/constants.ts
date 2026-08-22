export const COMMERCIAL_PRICING_VERSION = 1;
/** Sprint 5.1: expanded deterministic catalog + incomplete-price safety. */
export const COMMERCIAL_PRICING_CONFIG_VERSION = 2;

export const COMMERCIAL_PRICING_CURRENCY = "USD" as const;

export const COMMERCIAL_PRICING_STATUSES = [
  "DRAFT",
  "REVIEWED",
  "APPROVED",
  "SUPERSEDED",
] as const;

export type CommercialPricingStatus =
  (typeof COMMERCIAL_PRICING_STATUSES)[number];

export const PRICING_EFFORT_BANDS = [
  "SMALL",
  "MEDIUM",
  "LARGE",
  "ASSESSMENT",
  "CUSTOM",
] as const;

export type PricingEffortBand = (typeof PRICING_EFFORT_BANDS)[number];

export const PRICING_WORK_TYPES = [
  "IMPLEMENTATION",
  "REVIEW",
  "CONFIGURATION",
  "CONTENT",
  "TECHNICAL",
  "OPTIMIZATION",
  "ASSESSMENT",
  "CUSTOM",
  "OTHER",
] as const;

export type PricingWorkType = (typeof PRICING_WORK_TYPES)[number];

/** V1 internal recommendation prices in integer USD cents. */
export const EFFORT_BAND_PRICE_CENTS: Record<
  Exclude<PricingEffortBand, "CUSTOM">,
  number
> = {
  SMALL: 15_000,
  MEDIUM: 35_000,
  LARGE: 75_000,
  ASSESSMENT: 20_000,
};

/** Configurable minimum engagement (USD cents). */
export const MINIMUM_ENGAGEMENT_CENTS = 75_000;

export const MAX_LINE_TITLE_CHARS = 240;
export const MAX_OVERRIDE_REASON_CHARS = 500;
export const MAX_PRICING_NOTES_CHARS = 2_000;
export const MAX_QUANTITY = 99;
export const MAX_LINE_ITEMS = 80;

export function commercialPricingStatusLabel(
  status: CommercialPricingStatus,
): string {
  switch (status) {
    case "DRAFT":
      return "Draft";
    case "REVIEWED":
      return "Reviewed";
    case "APPROVED":
      return "Approved";
    case "SUPERSEDED":
      return "Superseded";
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

export function effortBandLabel(band: PricingEffortBand): string {
  switch (band) {
    case "SMALL":
      return "Small";
    case "MEDIUM":
      return "Medium";
    case "LARGE":
      return "Large";
    case "ASSESSMENT":
      return "Assessment";
    case "CUSTOM":
      return "Custom";
    default: {
      const _exhaustive: never = band;
      return _exhaustive;
    }
  }
}

export function formatUsdCents(cents: number): string {
  const dollars = cents / 100;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(dollars);
}
