import type {
  AgreementPaymentTermType,
  CommercialAgreementStatus,
} from "./constants";

export interface AgreementSnapshotDeliverable {
  title: string;
  isOptional: boolean;
}

export interface AgreementSnapshotSection {
  title: string;
  clientValueExplanation: string | null;
  deliverables: AgreementSnapshotDeliverable[];
}

export interface AgreementPaymentTermsSnapshot {
  type: AgreementPaymentTermType;
  totalCents: number;
  depositCents: number | null;
  balanceCents: number | null;
  depositPercent: number | null;
  customText: string | null;
  displaySummary: string;
}

export interface AgreementSnapshotInvestment {
  currency: string;
  includedCents: number;
  optionalCents: number;
  totalCents: number;
}

export interface AgreementSnapshot {
  businessName: string;
  locationLabel: string | null;
  agreementTitle: string;
  proposalReference: string;
  preparedDateLabel: string;
  engagementOverview: string;
  sections: AgreementSnapshotSection[];
  optionalSections: AgreementSnapshotSection[];
  considerations: string[];
  assumptions: string[];
  exclusions: string[];
  clientResponsibilities: string[];
  jsResponsibilities: string[];
  investment: AgreementSnapshotInvestment;
  paymentTerms: AgreementPaymentTermsSnapshot;
  timelineTerms: string;
  changeRequestTerms: string;
  thirdPartyCostTerms: string;
  resultsDisclaimer: string;
  acceptanceLanguage: string;
}

export interface BuiltCommercialAgreement {
  commercialScopeId: string;
  commercialPricingId: string;
  proposalId: string;
  title: string;
  proposalReference: string;
  engagementOverview: string;
  clientResponsibilities: string[];
  jsResponsibilities: string[];
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
  snapshot: AgreementSnapshot;
  agreementVersion: number;
  agreementPresentationVersion: number;
  termsVersion: number;
  sourceFingerprint: string;
}

export interface AgreementSourceFingerprint {
  opportunityId: string;
  proposalId: string;
  proposalRevision: number;
  commercialScopeId: string;
  scopeRevision: number;
  commercialPricingId: string;
  pricingRevision: number;
  agreementVersion: number;
  agreementPresentationVersion: number;
  termsVersion: number;
  paymentTermType: AgreementPaymentTermType;
  depositPercent: number;
  paymentCustomText: string | null;
}

export type { CommercialAgreementStatus, AgreementPaymentTermType };
