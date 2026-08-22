import {
  COMMERCIAL_AGREEMENT_PRESENTATION_VERSION,
  COMMERCIAL_AGREEMENT_TERMS_VERSION,
  COMMERCIAL_AGREEMENT_VERSION,
} from "./constants";
import type { AgreementSourceFingerprint } from "./types";

export function buildAgreementSourceFingerprint(
  input: AgreementSourceFingerprint,
): string {
  return JSON.stringify({
    opportunityId: input.opportunityId,
    proposalId: input.proposalId,
    proposalRevision: input.proposalRevision,
    commercialScopeId: input.commercialScopeId,
    scopeRevision: input.scopeRevision,
    commercialPricingId: input.commercialPricingId,
    pricingRevision: input.pricingRevision,
    agreementVersion: input.agreementVersion,
    agreementPresentationVersion: input.agreementPresentationVersion,
    termsVersion: input.termsVersion,
    paymentTermType: input.paymentTermType,
    depositPercent: input.depositPercent,
    paymentCustomText: input.paymentCustomText,
  } satisfies AgreementSourceFingerprint);
}

export function parseAgreementSourceFingerprint(
  raw: string,
): AgreementSourceFingerprint | null {
  try {
    const parsed = JSON.parse(raw) as Partial<AgreementSourceFingerprint>;
    if (
      typeof parsed.opportunityId !== "string" ||
      typeof parsed.proposalId !== "string" ||
      typeof parsed.commercialScopeId !== "string" ||
      typeof parsed.commercialPricingId !== "string" ||
      typeof parsed.paymentTermType !== "string"
    ) {
      return null;
    }
    return {
      opportunityId: parsed.opportunityId,
      proposalId: parsed.proposalId,
      proposalRevision:
        typeof parsed.proposalRevision === "number"
          ? parsed.proposalRevision
          : 0,
      commercialScopeId: parsed.commercialScopeId,
      scopeRevision:
        typeof parsed.scopeRevision === "number" ? parsed.scopeRevision : 0,
      commercialPricingId: parsed.commercialPricingId,
      pricingRevision:
        typeof parsed.pricingRevision === "number"
          ? parsed.pricingRevision
          : 0,
      agreementVersion:
        typeof parsed.agreementVersion === "number"
          ? parsed.agreementVersion
          : COMMERCIAL_AGREEMENT_VERSION,
      agreementPresentationVersion:
        typeof parsed.agreementPresentationVersion === "number"
          ? parsed.agreementPresentationVersion
          : COMMERCIAL_AGREEMENT_PRESENTATION_VERSION,
      termsVersion:
        typeof parsed.termsVersion === "number"
          ? parsed.termsVersion
          : COMMERCIAL_AGREEMENT_TERMS_VERSION,
      paymentTermType: parsed.paymentTermType as AgreementSourceFingerprint["paymentTermType"],
      depositPercent:
        typeof parsed.depositPercent === "number" ? parsed.depositPercent : 50,
      paymentCustomText:
        typeof parsed.paymentCustomText === "string"
          ? parsed.paymentCustomText
          : null,
    };
  } catch {
    return null;
  }
}
