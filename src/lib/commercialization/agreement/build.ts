import type { ProposalSnapshot } from "@/lib/commercialization/proposal/types";

import {
  COMMERCIAL_AGREEMENT_PRESENTATION_VERSION,
  COMMERCIAL_AGREEMENT_TERMS_VERSION,
  COMMERCIAL_AGREEMENT_VERSION,
  DEFAULT_DEPOSIT_PERCENT,
  type AgreementPaymentTermType,
} from "./constants";
import {
  DEFAULT_ACCEPTANCE_LANGUAGE,
  DEFAULT_AGREEMENT_TITLE,
  DEFAULT_CHANGE_REQUEST_TERMS,
  DEFAULT_CLIENT_RESPONSIBILITIES,
  DEFAULT_JS_RESPONSIBILITIES,
  DEFAULT_RESULTS_DISCLAIMER,
  DEFAULT_THIRD_PARTY_COST_TERMS,
  DEFAULT_TIMELINE_TERMS,
  buildEngagementOverview,
  buildProposalReference,
} from "./defaults";
import { buildAgreementSourceFingerprint } from "./fingerprint";
import { buildPaymentTermsSnapshot } from "./payment-terms";
import type {
  AgreementSnapshot,
  AgreementSnapshotSection,
  BuiltCommercialAgreement,
} from "./types";

export interface AgreementProposalInput {
  id: string;
  revision: number;
  proposalVersion: number;
  presentationVersion: number;
  title: string;
  snapshot: ProposalSnapshot;
}

export interface AgreementAuthorityInput {
  opportunityId: string;
  scopeId: string;
  scopeRevision: number;
  pricingId: string;
  pricingRevision: number;
  currency: string;
  includedInvestmentCents: number;
  optionalInvestmentCents: number;
  totalInvestmentCents: number;
}

export interface AgreementPresentationOverrides {
  title?: string;
  engagementOverview?: string;
  clientResponsibilities?: string[];
  jsResponsibilities?: string[];
  timelineTerms?: string;
  changeRequestTerms?: string;
  thirdPartyCostTerms?: string;
  resultsDisclaimer?: string;
  acceptanceLanguage?: string;
  paymentTermType?: AgreementPaymentTermType;
  paymentCustomText?: string | null;
  depositPercent?: number;
}

function mapSections(
  sections: ProposalSnapshot["sections"],
): AgreementSnapshotSection[] {
  return sections.map((section) => ({
    title: section.title,
    clientValueExplanation: section.clientValueExplanation,
    deliverables: section.deliverables.map((d) => ({
      title: d.title,
      isOptional: d.isOptional,
    })),
  }));
}

function preparedDateLabel(date: Date): string {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "long" }).format(date);
}

export function buildAgreementFromApprovedSources(options: {
  proposal: AgreementProposalInput;
  authority: AgreementAuthorityInput;
  businessName: string;
  locationLabel: string | null;
  preparedAt?: Date;
  presentation?: AgreementPresentationOverrides;
}): BuiltCommercialAgreement {
  const proposalSnapshot = options.proposal.snapshot;
  const paymentTermType =
    options.presentation?.paymentTermType ?? "DEPOSIT_AND_BALANCE";
  const depositPercent =
    options.presentation?.depositPercent ?? DEFAULT_DEPOSIT_PERCENT;
  const paymentCustomText = options.presentation?.paymentCustomText ?? null;

  const paymentTerms = buildPaymentTermsSnapshot({
    type: paymentTermType,
    totalCents: options.authority.totalInvestmentCents,
    depositPercent,
    customText: paymentCustomText,
  });

  const title = options.presentation?.title?.trim() || DEFAULT_AGREEMENT_TITLE;
  const engagementOverview =
    options.presentation?.engagementOverview?.trim() ||
    buildEngagementOverview(options.businessName);
  const clientResponsibilities =
    options.presentation?.clientResponsibilities ??
    [...DEFAULT_CLIENT_RESPONSIBILITIES];
  const jsResponsibilities =
    options.presentation?.jsResponsibilities ?? [...DEFAULT_JS_RESPONSIBILITIES];
  const timelineTerms =
    options.presentation?.timelineTerms?.trim() || DEFAULT_TIMELINE_TERMS;
  const changeRequestTerms =
    options.presentation?.changeRequestTerms?.trim() ||
    DEFAULT_CHANGE_REQUEST_TERMS;
  const thirdPartyCostTerms =
    options.presentation?.thirdPartyCostTerms?.trim() ||
    DEFAULT_THIRD_PARTY_COST_TERMS;
  const resultsDisclaimer =
    options.presentation?.resultsDisclaimer?.trim() ||
    DEFAULT_RESULTS_DISCLAIMER;
  const acceptanceLanguage =
    options.presentation?.acceptanceLanguage?.trim() ||
    DEFAULT_ACCEPTANCE_LANGUAGE;

  const proposalReference = buildProposalReference({
    proposalRevision: options.proposal.revision,
    proposalVersion: options.proposal.proposalVersion,
    presentationVersion: options.proposal.presentationVersion,
  });

  const snapshot: AgreementSnapshot = {
    businessName: options.businessName,
    locationLabel: options.locationLabel,
    agreementTitle: title,
    proposalReference,
    preparedDateLabel: preparedDateLabel(options.preparedAt ?? new Date()),
    engagementOverview,
    sections: mapSections(proposalSnapshot.sections),
    optionalSections: mapSections(proposalSnapshot.optionalSections ?? []),
    considerations: proposalSnapshot.considerations ?? [],
    assumptions: proposalSnapshot.assumptions ?? [],
    exclusions: proposalSnapshot.exclusions ?? [],
    clientResponsibilities,
    jsResponsibilities,
    investment: {
      currency: options.authority.currency,
      includedCents: options.authority.includedInvestmentCents,
      optionalCents: options.authority.optionalInvestmentCents,
      totalCents: options.authority.totalInvestmentCents,
    },
    paymentTerms,
    timelineTerms,
    changeRequestTerms,
    thirdPartyCostTerms,
    resultsDisclaimer,
    acceptanceLanguage,
  };

  const sourceFingerprint = buildAgreementSourceFingerprint({
    opportunityId: options.authority.opportunityId,
    proposalId: options.proposal.id,
    proposalRevision: options.proposal.revision,
    commercialScopeId: options.authority.scopeId,
    scopeRevision: options.authority.scopeRevision,
    commercialPricingId: options.authority.pricingId,
    pricingRevision: options.authority.pricingRevision,
    agreementVersion: COMMERCIAL_AGREEMENT_VERSION,
    agreementPresentationVersion: COMMERCIAL_AGREEMENT_PRESENTATION_VERSION,
    termsVersion: COMMERCIAL_AGREEMENT_TERMS_VERSION,
    paymentTermType,
    depositPercent,
    paymentCustomText,
  });

  return {
    commercialScopeId: options.authority.scopeId,
    commercialPricingId: options.authority.pricingId,
    proposalId: options.proposal.id,
    title,
    proposalReference,
    engagementOverview,
    clientResponsibilities,
    jsResponsibilities,
    timelineTerms,
    changeRequestTerms,
    thirdPartyCostTerms,
    resultsDisclaimer,
    acceptanceLanguage,
    paymentTermType,
    paymentCustomText,
    depositPercent,
    currency: options.authority.currency,
    includedInvestmentCents: options.authority.includedInvestmentCents,
    optionalInvestmentCents: options.authority.optionalInvestmentCents,
    totalInvestmentCents: options.authority.totalInvestmentCents,
    depositCents: paymentTerms.depositCents,
    balanceCents: paymentTerms.balanceCents,
    snapshot,
    agreementVersion: COMMERCIAL_AGREEMENT_VERSION,
    agreementPresentationVersion: COMMERCIAL_AGREEMENT_PRESENTATION_VERSION,
    termsVersion: COMMERCIAL_AGREEMENT_TERMS_VERSION,
    sourceFingerprint,
  };
}

export function rebuildAgreementSnapshotFromRow(row: {
  title: string;
  proposalReference: string;
  engagementOverview: string;
  clientResponsibilitiesJson: unknown;
  jsResponsibilitiesJson: unknown;
  timelineTerms: string;
  changeRequestTerms: string;
  thirdPartyCostTerms: string;
  resultsDisclaimer: string;
  acceptanceLanguage: string;
  paymentTermType: AgreementPaymentTermType;
  paymentCustomText: string | null;
  depositPercent: number;
  currency: string;
  includedInvestmentCents: number;
  optionalInvestmentCents: number;
  totalInvestmentCents: number;
  depositCents: number | null;
  balanceCents: number | null;
  snapshotJson: unknown;
  approvedAt: Date | null;
  createdAt: Date;
  opportunity: { prospect: { businessName: string; city: string | null; state: string | null } };
}): AgreementSnapshot {
  const existing = row.snapshotJson as AgreementSnapshot | null;
  const businessName = row.opportunity.prospect.businessName;
  const city = row.opportunity.prospect.city?.trim();
  const state = row.opportunity.prospect.state?.trim();
  const locationLabel =
    city && state ? `${city}, ${state}` : city || state || null;

  const paymentTerms = buildPaymentTermsSnapshot({
    type: row.paymentTermType,
    totalCents: row.totalInvestmentCents,
    depositPercent: row.depositPercent,
    customText: row.paymentCustomText,
  });

  return {
    businessName,
    locationLabel,
    agreementTitle: row.title,
    proposalReference: row.proposalReference,
    preparedDateLabel: preparedDateLabel(row.approvedAt ?? row.createdAt),
    engagementOverview: row.engagementOverview,
    sections: existing?.sections ?? [],
    optionalSections: existing?.optionalSections ?? [],
    considerations: existing?.considerations ?? [],
    assumptions: existing?.assumptions ?? [],
    exclusions: existing?.exclusions ?? [],
    clientResponsibilities: Array.isArray(row.clientResponsibilitiesJson)
      ? (row.clientResponsibilitiesJson as string[])
      : [],
    jsResponsibilities: Array.isArray(row.jsResponsibilitiesJson)
      ? (row.jsResponsibilitiesJson as string[])
      : [],
    investment: {
      currency: row.currency,
      includedCents: row.includedInvestmentCents,
      optionalCents: row.optionalInvestmentCents,
      totalCents: row.totalInvestmentCents,
    },
    paymentTerms,
    timelineTerms: row.timelineTerms,
    changeRequestTerms: row.changeRequestTerms,
    thirdPartyCostTerms: row.thirdPartyCostTerms,
    resultsDisclaimer: row.resultsDisclaimer,
    acceptanceLanguage: row.acceptanceLanguage,
  };
}
