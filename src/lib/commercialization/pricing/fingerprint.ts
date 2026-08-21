import {
  COMMERCIAL_PRICING_CONFIG_VERSION,
  COMMERCIAL_PRICING_VERSION,
} from "./constants";
import type { PricingSourceFingerprint } from "./types";

export function buildPricingSourceFingerprint(
  input: PricingSourceFingerprint,
): string {
  return JSON.stringify({
    opportunityId: input.opportunityId,
    commercialScopeId: input.commercialScopeId,
    scopeRevision: input.scopeRevision,
    scopeStatus: input.scopeStatus,
    pricingVersion: input.pricingVersion,
    pricingConfigVersion: input.pricingConfigVersion,
  } satisfies PricingSourceFingerprint);
}

export function parsePricingSourceFingerprint(
  raw: string,
): PricingSourceFingerprint | null {
  try {
    const parsed = JSON.parse(raw) as Partial<PricingSourceFingerprint>;
    if (
      typeof parsed.opportunityId !== "string" ||
      typeof parsed.commercialScopeId !== "string"
    ) {
      return null;
    }
    return {
      opportunityId: parsed.opportunityId,
      commercialScopeId: parsed.commercialScopeId,
      scopeRevision:
        typeof parsed.scopeRevision === "number" ? parsed.scopeRevision : 0,
      scopeStatus:
        typeof parsed.scopeStatus === "string" ? parsed.scopeStatus : "",
      pricingVersion:
        typeof parsed.pricingVersion === "number"
          ? parsed.pricingVersion
          : COMMERCIAL_PRICING_VERSION,
      pricingConfigVersion:
        typeof parsed.pricingConfigVersion === "number"
          ? parsed.pricingConfigVersion
          : COMMERCIAL_PRICING_CONFIG_VERSION,
    };
  } catch {
    return null;
  }
}
