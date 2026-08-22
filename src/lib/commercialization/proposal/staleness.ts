import {
  COMMERCIAL_PROPOSAL_PRESENTATION_VERSION,
  COMMERCIAL_PROPOSAL_VERSION,
} from "./constants";
import { parseProposalSourceFingerprint } from "./fingerprint";
import type { ProposalSourceFingerprint } from "./types";

/**
 * Proposal becomes stale when linked Scope/Pricing identity or proposal
 * presentation versions diverge. Never mutates proposal — indicator only.
 */
export function evaluateProposalStaleness(options: {
  storedFingerprint: string;
  current: ProposalSourceFingerprint;
}): { stale: boolean; reasons: string[] } {
  const reasons: string[] = [];
  const stored = parseProposalSourceFingerprint(options.storedFingerprint);

  if (!stored) {
    reasons.push("Proposal source fingerprint could not be parsed.");
    return { stale: true, reasons };
  }

  if (stored.opportunityId !== options.current.opportunityId) {
    reasons.push("Opportunity identity no longer matches this Proposal.");
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

  if (stored.proposalVersion !== COMMERCIAL_PROPOSAL_VERSION) {
    reasons.push("Proposal algorithm version has changed.");
  }

  if (stored.presentationVersion !== COMMERCIAL_PROPOSAL_PRESENTATION_VERSION) {
    reasons.push("Proposal presentation version has changed.");
  }

  return { stale: reasons.length > 0, reasons };
}
