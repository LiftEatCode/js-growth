import type { ServiceCapabilityId } from "@/lib/commercialization/capabilities/types";
import { buildPaymentTermsDisplaySummary } from "@/lib/commercialization/agreement/payment-terms";
import type { AgreementPaymentTermType } from "@/lib/commercialization/agreement/constants";
import type { loadCommercialScopeDetail } from "@/lib/commercialization/scope/load";

import {
  PROJECT_COMMERCIAL_SNAPSHOT_VERSION,
} from "./constants";
import type { ProjectCommercialSnapshot } from "./types";

type ScopeDetail = NonNullable<
  Awaited<ReturnType<typeof loadCommercialScopeDetail>>
>;

export function buildProjectCommercialSnapshot(options: {
  businessName: string;
  agreement: {
    id: string;
    revision: number;
    agreementVersion: number;
    currency: string;
    totalInvestmentCents: number;
    depositCents: number | null;
    balanceCents: number | null;
    depositPercent: number | null;
    paymentTermType: AgreementPaymentTermType;
    paymentCustomText: string | null;
    clientResponsibilitiesJson: unknown;
    jsResponsibilitiesJson: unknown;
  };
  scope: ScopeDetail;
  pricingId: string;
  pricingRevision: number;
  proposalId: string;
  proposalRevision: number;
  depositPaid: boolean;
  balanceOutstandingCents: number;
  capturedAt?: Date;
}): ProjectCommercialSnapshot {
  const includedSections = options.scope.sections
    .filter((section) => section.isIncluded)
    .map((section) => ({
      sourceScopeSectionId: section.id,
      title: section.title,
      capabilities: section.capabilities as ServiceCapabilityId[],
      sortOrder: section.sortOrder,
      deliverables: section.deliverables
        .filter((d) => d.isIncluded)
        .map((d) => ({
          sourceScopeDeliverableId: d.id,
          sourceActionKey: d.sourceActionKey,
          title: d.title,
          description: d.description,
          sortOrder: d.sortOrder,
        })),
    }));

  return {
    snapshotVersion: PROJECT_COMMERCIAL_SNAPSHOT_VERSION,
    capturedAt: (options.capturedAt ?? new Date()).toISOString(),
    businessName: options.businessName,
    agreementId: options.agreement.id,
    agreementRevision: options.agreement.revision,
    agreementVersion: options.agreement.agreementVersion,
    scopeId: options.scope.scope.id,
    scopeRevision: options.scope.scope.revision,
    pricingId: options.pricingId,
    pricingRevision: options.pricingRevision,
    proposalId: options.proposalId,
    proposalRevision: options.proposalRevision,
    currency: options.agreement.currency,
    totalInvestmentCents: options.agreement.totalInvestmentCents,
    depositCents: options.agreement.depositCents,
    balanceCents: options.agreement.balanceCents,
    paymentTermType: options.agreement.paymentTermType,
    paymentTermsSummary: buildPaymentTermsDisplaySummary({
      type: options.agreement.paymentTermType,
      totalCents: options.agreement.totalInvestmentCents,
      depositCents: options.agreement.depositCents,
      balanceCents: options.agreement.balanceCents,
      depositPercent: options.agreement.depositPercent,
      customText: options.agreement.paymentCustomText,
    }),
    depositPaidAtCapture: options.depositPaid,
    balanceOutstandingCentsAtCapture: options.balanceOutstandingCents,
    includedSections,
    assumptions: options.scope.scope.assumptions,
    exclusions: options.scope.scope.exclusions,
    considerations: options.scope.scope.considerations,
    clientResponsibilities: options.agreement.clientResponsibilitiesJson,
    jsResponsibilities: options.agreement.jsResponsibilitiesJson,
  };
}

export function parseProjectCommercialSnapshot(
  raw: unknown,
): ProjectCommercialSnapshot | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }
  const snap = raw as ProjectCommercialSnapshot;
  if (
    typeof snap.snapshotVersion !== "number" ||
    typeof snap.agreementId !== "string" ||
    typeof snap.scopeId !== "string" ||
    !Array.isArray(snap.includedSections)
  ) {
    return null;
  }
  return snap;
}
