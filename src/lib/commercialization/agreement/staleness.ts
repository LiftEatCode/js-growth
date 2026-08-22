import {
  COMMERCIAL_AGREEMENT_PRESENTATION_VERSION,
  COMMERCIAL_AGREEMENT_TERMS_VERSION,
  COMMERCIAL_AGREEMENT_VERSION,
} from "./constants";
import { parseAgreementSourceFingerprint } from "./fingerprint";
import type { AgreementSourceFingerprint } from "./types";

export function evaluateAgreementStaleness(options: {
  storedFingerprint: string;
  current: AgreementSourceFingerprint;
}): { stale: boolean; reasons: string[] } {
  const reasons: string[] = [];
  const stored = parseAgreementSourceFingerprint(options.storedFingerprint);

  if (!stored) {
    reasons.push("Agreement source fingerprint could not be parsed.");
    return { stale: true, reasons };
  }

  if (stored.opportunityId !== options.current.opportunityId) {
    reasons.push("Opportunity identity no longer matches this Agreement.");
  }

  if (stored.proposalId !== options.current.proposalId) {
    reasons.push("Linked Proposal is no longer current.");
  }

  if (stored.proposalRevision !== options.current.proposalRevision) {
    reasons.push("Proposal revision has changed.");
  }

  if (stored.commercialScopeId !== options.current.commercialScopeId) {
    reasons.push("Linked Commercial Scope is no longer current.");
  }

  if (stored.scopeRevision !== options.current.scopeRevision) {
    reasons.push("Commercial Scope revision has changed.");
  }

  if (stored.commercialPricingId !== options.current.commercialPricingId) {
    reasons.push("Linked Commercial Pricing is no longer current.");
  }

  if (stored.pricingRevision !== options.current.pricingRevision) {
    reasons.push("Commercial Pricing revision has changed.");
  }

  if (stored.agreementVersion !== COMMERCIAL_AGREEMENT_VERSION) {
    reasons.push("Agreement algorithm version has changed.");
  }

  if (
    stored.agreementPresentationVersion !==
    COMMERCIAL_AGREEMENT_PRESENTATION_VERSION
  ) {
    reasons.push("Agreement presentation version has changed.");
  }

  if (stored.termsVersion !== COMMERCIAL_AGREEMENT_TERMS_VERSION) {
    reasons.push("Agreement terms version has changed.");
  }

  if (stored.paymentTermType !== options.current.paymentTermType) {
    reasons.push("Payment term type has changed.");
  }

  if (stored.depositPercent !== options.current.depositPercent) {
    reasons.push("Deposit percentage has changed.");
  }

  if (stored.paymentCustomText !== options.current.paymentCustomText) {
    reasons.push("Custom payment terms have changed.");
  }

  return { stale: reasons.length > 0, reasons };
}
