import {
  COMMERCIAL_PROPOSAL_PRESENTATION_VERSION,
  COMMERCIAL_PROPOSAL_VERSION,
} from "./constants";
import type { ProposalSourceFingerprint } from "./types";

export function buildProposalSourceFingerprint(
  input: ProposalSourceFingerprint,
): string {
  return JSON.stringify({
    opportunityId: input.opportunityId,
    commercialScopeId: input.commercialScopeId,
    scopeRevision: input.scopeRevision,
    commercialPricingId: input.commercialPricingId,
    pricingRevision: input.pricingRevision,
    proposalVersion: input.proposalVersion,
    presentationVersion: input.presentationVersion,
  } satisfies ProposalSourceFingerprint);
}

export function parseProposalSourceFingerprint(
  raw: string,
): ProposalSourceFingerprint | null {
  try {
    const parsed = JSON.parse(raw) as Partial<ProposalSourceFingerprint>;
    if (
      typeof parsed.opportunityId !== "string" ||
      typeof parsed.commercialScopeId !== "string" ||
      typeof parsed.commercialPricingId !== "string"
    ) {
      return null;
    }
    return {
      opportunityId: parsed.opportunityId,
      commercialScopeId: parsed.commercialScopeId,
      scopeRevision:
        typeof parsed.scopeRevision === "number" ? parsed.scopeRevision : 0,
      commercialPricingId: parsed.commercialPricingId,
      pricingRevision:
        typeof parsed.pricingRevision === "number"
          ? parsed.pricingRevision
          : 0,
      proposalVersion:
        typeof parsed.proposalVersion === "number"
          ? parsed.proposalVersion
          : COMMERCIAL_PROPOSAL_VERSION,
      presentationVersion:
        typeof parsed.presentationVersion === "number"
          ? parsed.presentationVersion
          : COMMERCIAL_PROPOSAL_PRESENTATION_VERSION,
    };
  } catch {
    return null;
  }
}
