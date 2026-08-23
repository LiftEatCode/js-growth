import type { AgreementPaymentTermType } from "@/lib/commercialization/agreement/constants";
import type { ServiceCapabilityId } from "@/lib/commercialization/capabilities/types";
import type { DerivedPaymentState } from "@/lib/commercialization/payments/constants";

import type {
  ClientProjectStatusValue,
  DerivedOnboardingState,
  OnboardingItemKey,
  OnboardingItemStatusValue,
} from "./constants";

export type OnboardingEligibilityResult =
  | {
      ok: true;
      eligible: true;
      paymentState: DerivedPaymentState;
      depositPaid: boolean;
      balanceOutstandingCents: number;
      paidInFull: boolean;
      reason: string;
    }
  | {
      ok: true;
      eligible: false;
      paymentState: DerivedPaymentState | "NO_ACCEPTED_AGREEMENT" | "CUSTOM_BLOCKED";
      depositPaid: boolean;
      balanceOutstandingCents: number;
      paidInFull: boolean;
      reason: string;
      code:
        | "AGREEMENT_NOT_ACCEPTED"
        | "DEPOSIT_UNPAID"
        | "FULL_UNPAID"
        | "CUSTOM_AMBIGUOUS"
        | "NO_AGREEMENT"
        | "PAYMENT_REVIEW_REQUIRED";
    };

export interface ProjectCommercialSnapshot {
  snapshotVersion: number;
  capturedAt: string;
  businessName: string;
  agreementId: string;
  agreementRevision: number;
  agreementVersion: number;
  scopeId: string;
  scopeRevision: number;
  pricingId: string;
  pricingRevision: number;
  proposalId: string;
  proposalRevision: number;
  currency: string;
  totalInvestmentCents: number;
  depositCents: number | null;
  balanceCents: number | null;
  paymentTermType: AgreementPaymentTermType;
  paymentTermsSummary: string;
  depositPaidAtCapture: boolean;
  balanceOutstandingCentsAtCapture: number;
  includedSections: Array<{
    sourceScopeSectionId: string;
    title: string;
    capabilities: ServiceCapabilityId[];
    sortOrder: number;
    deliverables: Array<{
      sourceScopeDeliverableId: string;
      sourceActionKey: string | null;
      title: string;
      description: string | null;
      sortOrder: number;
    }>;
  }>;
  assumptions: unknown;
  exclusions: unknown;
  considerations: unknown;
  clientResponsibilities: unknown;
  jsResponsibilities: unknown;
}

export interface ChecklistTemplateItem {
  key: OnboardingItemKey;
  label: string;
  description: string;
  required: boolean;
  sortOrder: number;
}

export interface LoadedProjectSummary {
  id: string;
  clientId: string;
  clientName: string;
  opportunityId: string;
  agreementId: string;
  name: string;
  status: ClientProjectStatusValue;
  statusLabel: string;
  ownerEmail: string;
  onboardingState: DerivedOnboardingState;
  onboardingStateLabel: string;
  depositPaid: boolean;
  balanceOutstandingCents: number;
  paidInFull: boolean;
  finalHandoffBlockedByBalance: boolean;
  totalInvestmentCents: number;
  depositCents: number | null;
  balanceCents: number | null;
  createdAt: Date;
  startedAt: Date | null;
}

export interface OnboardingItemView {
  id: string;
  key: string;
  label: string;
  description: string | null;
  status: OnboardingItemStatusValue;
  required: boolean;
  sortOrder: number;
  completedAt: Date | null;
  notes: string | null;
}
