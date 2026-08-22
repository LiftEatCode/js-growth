import type { CommercialProposalStatus } from "./constants";

export interface ProposalSnapshotDeliverable {
  /** Client-facing polished label. */
  title: string;
  /** Authoritative Scope deliverable title (not shown in client preview). */
  sourceTitle: string;
  isOptional: boolean;
}

export interface ProposalSnapshotSection {
  title: string;
  /** Deterministic why-it-matters copy. Replaces raw Scope descriptions. */
  clientValueExplanation: string | null;
  capabilities: string[];
  isOptional: boolean;
  deliverables: ProposalSnapshotDeliverable[];
}

export interface ProposalSnapshotInvestmentLine {
  title: string;
  /** Polished include label for group lists. */
  includeLabel: string;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
  isOptional: boolean;
  /** Client-readable financial group title. */
  groupTitle: string;
  /** Additional Scope sections this priced work supports (no extra dollars). */
  alsoSupports: string[];
}

export interface ProposalSnapshotInvestmentGroup {
  title: string;
  /** Brief included-work labels (no per-line prices in client UI). */
  includeLabels: string[];
  lines: ProposalSnapshotInvestmentLine[];
  subtotalCents: number;
}

export interface ProposalSnapshot {
  businessName: string;
  locationLabel: string | null;
  currency: string;
  includedInvestmentCents: number;
  optionalInvestmentCents: number;
  totalInvestmentCents: number;
  /** When minimum engagement lifted the total above priced line sum. */
  engagementAdjustmentCents: number;
  investmentIntro: string;
  methodologyFooter: string;
  sections: ProposalSnapshotSection[];
  optionalSections: ProposalSnapshotSection[];
  assumptions: string[];
  exclusions: string[];
  considerations: string[];
  includedInvestmentGroups: ProposalSnapshotInvestmentGroup[];
  optionalInvestmentGroups: ProposalSnapshotInvestmentGroup[];
  includedLines: ProposalSnapshotInvestmentLine[];
  optionalLines: ProposalSnapshotInvestmentLine[];
}

export interface BuiltCommercialProposal {
  commercialScopeId: string;
  commercialPricingId: string;
  title: string;
  executiveSummary: string;
  businessContext: string | null;
  approachIntro: string;
  timelineNote: string;
  nextStepText: string;
  currency: string;
  includedInvestmentCents: number;
  optionalInvestmentCents: number;
  totalInvestmentCents: number;
  snapshot: ProposalSnapshot;
  proposalVersion: number;
  presentationVersion: number;
  sourceFingerprint: string;
}

export interface ProposalSourceFingerprint {
  opportunityId: string;
  commercialScopeId: string;
  scopeRevision: number;
  commercialPricingId: string;
  pricingRevision: number;
  proposalVersion: number;
  presentationVersion: number;
}

export type { CommercialProposalStatus };
