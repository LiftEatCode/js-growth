import type { CommercialProposalStatus } from "./constants";

export interface ProposalSnapshotDeliverable {
  title: string;
  isOptional: boolean;
}

export interface ProposalSnapshotSection {
  title: string;
  description: string | null;
  capabilities: string[];
  isOptional: boolean;
  deliverables: ProposalSnapshotDeliverable[];
}

export interface ProposalSnapshotInvestmentLine {
  title: string;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
  isOptional: boolean;
  /** Client-readable primary group (usually a Scope section title). */
  groupTitle: string;
  /** Additional sections this priced work supports (no extra dollars). */
  alsoSupports: string[];
}

export interface ProposalSnapshotInvestmentGroup {
  title: string;
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
