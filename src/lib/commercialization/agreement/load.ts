import "server-only";

import { formatUsdCents } from "@/lib/commercialization/pricing/constants";
import { prisma } from "@/lib/prisma";

import {
  agreementPaymentTermTypeLabel,
  commercialAgreementStatusLabel,
  type CommercialAgreementStatus,
} from "./constants";
import { evaluateAgreementStaleness } from "./staleness";
import type { AgreementSnapshot } from "./types";

function parseSnapshot(raw: unknown): AgreementSnapshot | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }
  return raw as AgreementSnapshot;
}

export interface LoadedAgreementSummary {
  id: string;
  opportunityId: string;
  proposalId: string;
  status: CommercialAgreementStatus;
  statusLabel: string;
  revision: number;
  title: string;
  totalInvestmentLabel: string;
  paymentTermLabel: string;
  paymentSummary: string;
  approvedAt: Date | null;
  acceptedAt: Date | null;
  stale: boolean;
  staleReasons: string[];
  acceptance: {
    signerName: string;
    signerEmail: string;
    signerTitle: string | null;
    acceptedAt: Date;
  } | null;
  paymentPending: boolean;
}

export async function loadCurrentAgreementForOpportunity(options: {
  opportunityId: string;
}): Promise<{ agreement: LoadedAgreementSummary | null }> {
  const row = await prisma.commercialAgreement.findFirst({
    where: {
      opportunityId: options.opportunityId,
      status: { not: "SUPERSEDED" },
    },
    orderBy: { createdAt: "desc" },
    include: {
      acceptance: true,
      proposal: { select: { revision: true } },
      commercialScope: { select: { id: true, revision: true } },
      commercialPricing: { select: { id: true, revision: true } },
    },
  });

  if (!row) {
    return { agreement: null };
  }

  const snapshot = parseSnapshot(row.snapshotJson);
  const staleness =
    row.status === "ACCEPTED"
      ? { stale: false, reasons: [] }
      : evaluateAgreementStaleness({
          storedFingerprint: row.sourceFingerprint,
          current: {
            opportunityId: row.opportunityId,
            proposalId: row.proposalId,
            proposalRevision: row.proposal.revision,
            commercialScopeId: row.commercialScopeId,
            scopeRevision: row.commercialScope.revision,
            commercialPricingId: row.commercialPricingId,
            pricingRevision: row.commercialPricing.revision,
            agreementVersion: row.agreementVersion,
            agreementPresentationVersion: row.agreementPresentationVersion,
            termsVersion: row.termsVersion,
            paymentTermType: row.paymentTermType,
            depositPercent: row.depositPercent,
            paymentCustomText: row.paymentCustomText,
          },
        });

  return {
    agreement: {
      id: row.id,
      opportunityId: row.opportunityId,
      proposalId: row.proposalId,
      status: row.status,
      statusLabel: commercialAgreementStatusLabel(row.status),
      revision: row.revision,
      title: row.title,
      totalInvestmentLabel: formatUsdCents(row.totalInvestmentCents),
      paymentTermLabel: agreementPaymentTermTypeLabel(row.paymentTermType),
      paymentSummary:
        snapshot?.paymentTerms.displaySummary ??
        agreementPaymentTermTypeLabel(row.paymentTermType),
      approvedAt: row.approvedAt,
      acceptedAt: row.acceptedAt,
      stale: staleness.stale,
      staleReasons: staleness.reasons,
      acceptance: row.acceptance
        ? {
            signerName: row.acceptance.signerName,
            signerEmail: row.acceptance.signerEmail,
            signerTitle: row.acceptance.signerTitle,
            acceptedAt: row.acceptance.acceptedAt,
          }
        : null,
      paymentPending: row.status === "ACCEPTED",
    },
  };
}

export interface LoadedAgreementDetail {
  proposal: {
    opportunityId: string;
    opportunityHref: string;
    scopeHref: string;
    pricingHref: string;
    proposalHref: string;
  };
  agreement: {
    id: string;
    status: CommercialAgreementStatus;
    statusLabel: string;
    revision: number;
    title: string;
    engagementOverview: string;
    clientResponsibilities: string[];
    jsResponsibilities: string[];
    timelineTerms: string;
    changeRequestTerms: string;
    thirdPartyCostTerms: string;
    resultsDisclaimer: string;
    acceptanceLanguage: string;
    paymentTermType: string;
    paymentCustomText: string | null;
    depositPercent: number;
    currency: string;
    includedInvestmentCents: number;
    optionalInvestmentCents: number;
    totalInvestmentCents: number;
    totalInvestmentLabel: string;
    depositCents: number | null;
    balanceCents: number | null;
    proposalReference: string;
    createdAt: Date;
    approvedAt: Date | null;
    acceptedAt: Date | null;
    stale: boolean;
    staleReasons: string[];
    editable: boolean;
  };
  snapshot: AgreementSnapshot;
  acceptance: LoadedAgreementSummary["acceptance"];
}

export async function loadCommercialAgreementDetail(options: {
  agreementId: string;
}): Promise<LoadedAgreementDetail | null> {
  const row = await prisma.commercialAgreement.findUnique({
    where: { id: options.agreementId },
    include: {
      acceptance: true,
      proposal: { select: { revision: true, id: true } },
      commercialScope: { select: { id: true, revision: true } },
      commercialPricing: { select: { id: true, revision: true } },
    },
  });

  if (!row) {
    return null;
  }

  const snapshot = parseSnapshot(row.snapshotJson);
  if (!snapshot) {
    return null;
  }

  const staleness =
    row.status === "ACCEPTED"
      ? { stale: false, reasons: [] }
      : evaluateAgreementStaleness({
          storedFingerprint: row.sourceFingerprint,
          current: {
            opportunityId: row.opportunityId,
            proposalId: row.proposalId,
            proposalRevision: row.proposal.revision,
            commercialScopeId: row.commercialScopeId,
            scopeRevision: row.commercialScope.revision,
            commercialPricingId: row.commercialPricingId,
            pricingRevision: row.commercialPricing.revision,
            agreementVersion: row.agreementVersion,
            agreementPresentationVersion: row.agreementPresentationVersion,
            termsVersion: row.termsVersion,
            paymentTermType: row.paymentTermType,
            depositPercent: row.depositPercent,
            paymentCustomText: row.paymentCustomText,
          },
        });

  const base = `/reports/opportunities/${row.opportunityId}`;

  return {
    proposal: {
      opportunityId: row.opportunityId,
      opportunityHref: base,
      scopeHref: `${base}/scope/${row.commercialScopeId}`,
      pricingHref: `${base}/pricing/${row.commercialPricingId}`,
      proposalHref: `${base}/proposal/${row.proposalId}`,
    },
    agreement: {
      id: row.id,
      status: row.status,
      statusLabel: commercialAgreementStatusLabel(row.status),
      revision: row.revision,
      title: row.title,
      engagementOverview: row.engagementOverview,
      clientResponsibilities: Array.isArray(row.clientResponsibilitiesJson)
        ? (row.clientResponsibilitiesJson as string[])
        : [],
      jsResponsibilities: Array.isArray(row.jsResponsibilitiesJson)
        ? (row.jsResponsibilitiesJson as string[])
        : [],
      timelineTerms: row.timelineTerms,
      changeRequestTerms: row.changeRequestTerms,
      thirdPartyCostTerms: row.thirdPartyCostTerms,
      resultsDisclaimer: row.resultsDisclaimer,
      acceptanceLanguage: row.acceptanceLanguage,
      paymentTermType: row.paymentTermType,
      paymentCustomText: row.paymentCustomText,
      depositPercent: row.depositPercent,
      currency: row.currency,
      includedInvestmentCents: row.includedInvestmentCents,
      optionalInvestmentCents: row.optionalInvestmentCents,
      totalInvestmentCents: row.totalInvestmentCents,
      totalInvestmentLabel: formatUsdCents(row.totalInvestmentCents),
      depositCents: row.depositCents,
      balanceCents: row.balanceCents,
      proposalReference: row.proposalReference,
      createdAt: row.createdAt,
      approvedAt: row.approvedAt,
      acceptedAt: row.acceptedAt,
      stale: staleness.stale,
      staleReasons: staleness.reasons,
      editable: row.status === "DRAFT" || row.status === "REVIEWED",
    },
    snapshot,
    acceptance: row.acceptance
      ? {
          signerName: row.acceptance.signerName,
          signerEmail: row.acceptance.signerEmail,
          signerTitle: row.acceptance.signerTitle,
          acceptedAt: row.acceptance.acceptedAt,
        }
      : null,
  };
}
