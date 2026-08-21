import {
  COMMERCIAL_PRICING_CONFIG_VERSION,
  COMMERCIAL_PRICING_VERSION,
} from "./constants";
import { parsePricingSourceFingerprint } from "./fingerprint";
import type { PricingSourceFingerprint } from "./types";

/**
 * Pricing becomes stale when linked Scope identity/revision or pricing
 * algorithm/config versions diverge. Never mutates pricing — indicator only.
 */
export function evaluatePricingStaleness(options: {
  storedFingerprint: string;
  current: PricingSourceFingerprint;
}): { stale: boolean; reasons: string[] } {
  const reasons: string[] = [];
  const stored = parsePricingSourceFingerprint(options.storedFingerprint);

  if (!stored) {
    reasons.push("Pricing source fingerprint could not be parsed.");
    return { stale: true, reasons };
  }

  if (stored.opportunityId !== options.current.opportunityId) {
    reasons.push("Opportunity identity no longer matches this Pricing.");
  }

  if (stored.commercialScopeId !== options.current.commercialScopeId) {
    reasons.push("Linked Commercial Scope is no longer current.");
  }

  if (stored.scopeRevision !== options.current.scopeRevision) {
    reasons.push("Commercial Scope revision has changed.");
  }

  if (
    stored.scopeStatus === "APPROVED" &&
    options.current.scopeStatus !== "APPROVED"
  ) {
    reasons.push("Linked Commercial Scope is no longer approved.");
  }

  if (stored.pricingVersion !== COMMERCIAL_PRICING_VERSION) {
    reasons.push("Pricing algorithm version has changed.");
  }

  if (stored.pricingConfigVersion !== COMMERCIAL_PRICING_CONFIG_VERSION) {
    reasons.push("Pricing configuration version has changed.");
  }

  if (stored.pricingVersion !== options.current.pricingVersion) {
    reasons.push("Pricing algorithm version no longer matches.");
  }

  if (stored.pricingConfigVersion !== options.current.pricingConfigVersion) {
    reasons.push("Pricing configuration version no longer matches.");
  }

  return { stale: reasons.length > 0, reasons };
}
