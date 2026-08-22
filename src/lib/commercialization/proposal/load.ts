import "server-only";

import { formatUsdCents } from "@/lib/commercialization/pricing/constants";
import { prisma } from "@/lib/prisma";

import {
  commercialProposalStatusLabel,
  COMMERCIAL_PROPOSAL_PRESENTATION_VERSION,
  COMMERCIAL_PROPOSAL_VERSION,
  type CommercialProposalStatus,
} from "./constants";
import { buildProposalSourceFingerprint } from "./fingerprint";
import { evaluateProposalStaleness } from "./staleness";
import type { ProposalSnapshot } from "./types";

function parseSnapshot(raw: unknown): ProposalSnapshot | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }
  return raw as ProposalSnapshot;
}

export async function loadCurrentProposalForOpportunity(options: {
  opportunityId: string;
}): Promise<{
  proposal: {
    id: string;
    status: CommercialProposalStatus;
    statusLabel: string;
    revision: number;
    title: string;
    includedInvestmentCents: number;
    totalInvestmentCents: number;
    totalInvestmentLabel: string;
    approvedAt: Date | null;
    approvedByEmail: string | null;
    updatedAt: Date;
    commercialScopeId: string;
    commercialPricingId: string;
    stale: boolean;
  } | null;
}> {
  const proposal = await prisma.commercialProposal.findFirst({
    where: {
      opportunityId: options.opportunityId,
      status: { in: ["DRAFT", "REVIEWED", "APPROVED"] },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!proposal) {
    return { proposal: null };
  }

  const [currentScope, currentPricing] = await Promise.all([
    prisma.commercialScope.findFirst({
      where: { opportunityId: options.opportunityId, status: "APPROVED" },
      orderBy: { createdAt: "desc" },
      select: { id: true, revision: true },
    }),
    prisma.commercialPricing.findFirst({
      where: { opportunityId: options.opportunityId, status: "APPROVED" },
      orderBy: { createdAt: "desc" },
      select: { id: true, revision: true },
    }),
  ]);

  const staleness = evaluateProposalStaleness({
    storedFingerprint: proposal.sourceFingerprint,
    current: {
      opportunityId: options.opportunityId,
      commercialScopeId: currentScope?.id ?? proposal.commercialScopeId,
      scopeRevision: currentScope?.revision ?? 0,
      commercialPricingId: currentPricing?.id ?? proposal.commercialPricingId,
      pricingRevision: currentPricing?.revision ?? 0,
      proposalVersion: COMMERCIAL_PROPOSAL_VERSION,
      presentationVersion: COMMERCIAL_PROPOSAL_PRESENTATION_VERSION,
    },
  });

  return {
    proposal: {
      id: proposal.id,
      status: proposal.status,
      statusLabel: commercialProposalStatusLabel(proposal.status),
      revision: proposal.revision,
      title: proposal.title,
      includedInvestmentCents: proposal.includedInvestmentCents,
      totalInvestmentCents: proposal.totalInvestmentCents,
      totalInvestmentLabel: formatUsdCents(proposal.includedInvestmentCents),
      approvedAt: proposal.approvedAt,
      approvedByEmail: proposal.approvedByEmail,
      updatedAt: proposal.updatedAt,
      commercialScopeId: proposal.commercialScopeId,
      commercialPricingId: proposal.commercialPricingId,
      stale: staleness.stale,
    },
  };
}

export async function loadCommercialProposalDetail(options: {
  proposalId: string;
}): Promise<{
  proposal: {
    id: string;
    opportunityId: string;
    commercialScopeId: string;
    commercialPricingId: string;
    status: CommercialProposalStatus;
    statusLabel: string;
    revision: number;
    title: string;
    executiveSummary: string;
    businessContext: string | null;
    approachIntro: string | null;
    timelineNote: string | null;
    nextStepText: string | null;
    currency: string;
    includedInvestmentCents: number;
    optionalInvestmentCents: number;
    totalInvestmentCents: number;
    proposalVersion: number;
    presentationVersion: number;
    sourceFingerprint: string;
    approvedAt: Date | null;
    approvedByEmail: string | null;
    createdAt: Date;
    updatedAt: Date;
    createdByEmail: string;
    businessName: string;
    opportunityHref: string;
    scopeHref: string;
    pricingHref: string;
    editable: boolean;
  };
  snapshot: ProposalSnapshot;
  staleness: { stale: boolean; reasons: string[] };
} | null> {
  const row = await prisma.commercialProposal.findUnique({
    where: { id: options.proposalId },
    include: {
      opportunity: {
        select: {
          prospect: { select: { businessName: true } },
        },
      },
      commercialScope: {
        select: { id: true, revision: true, status: true },
      },
      commercialPricing: {
        select: { id: true, revision: true, status: true },
      },
    },
  });

  if (!row) {
    return null;
  }

  const snapshot = parseSnapshot(row.snapshotJson);
  if (!snapshot) {
    return null;
  }

  // Current commercial state for staleness (latest approved if present)
  const [currentScope, currentPricing] = await Promise.all([
    prisma.commercialScope.findFirst({
      where: {
        opportunityId: row.opportunityId,
        status: "APPROVED",
      },
      orderBy: { createdAt: "desc" },
      select: { id: true, revision: true },
    }),
    prisma.commercialPricing.findFirst({
      where: {
        opportunityId: row.opportunityId,
        status: "APPROVED",
      },
      orderBy: { createdAt: "desc" },
      select: { id: true, revision: true },
    }),
  ]);

  const current = {
    opportunityId: row.opportunityId,
    commercialScopeId: currentScope?.id ?? row.commercialScopeId,
    scopeRevision: currentScope?.revision ?? row.commercialScope.revision,
    commercialPricingId: currentPricing?.id ?? row.commercialPricingId,
    pricingRevision: currentPricing?.revision ?? row.commercialPricing.revision,
    proposalVersion: COMMERCIAL_PROPOSAL_VERSION,
    presentationVersion: COMMERCIAL_PROPOSAL_PRESENTATION_VERSION,
  };

  const expectedFingerprint = buildProposalSourceFingerprint({
    opportunityId: row.opportunityId,
    commercialScopeId: row.commercialScopeId,
    scopeRevision: row.commercialScope.revision,
    commercialPricingId: row.commercialPricingId,
    pricingRevision: row.commercialPricing.revision,
    proposalVersion: row.proposalVersion,
    presentationVersion: row.presentationVersion,
  });

  const staleness =
    row.sourceFingerprint === expectedFingerprint &&
    row.commercialScopeId === current.commercialScopeId &&
    row.commercialPricingId === current.commercialPricingId &&
    row.proposalVersion === COMMERCIAL_PROPOSAL_VERSION &&
    row.presentationVersion === COMMERCIAL_PROPOSAL_PRESENTATION_VERSION
      ? { stale: false, reasons: [] as string[] }
      : evaluateProposalStaleness({
          storedFingerprint: row.sourceFingerprint,
          current,
        });

  return {
    proposal: {
      id: row.id,
      opportunityId: row.opportunityId,
      commercialScopeId: row.commercialScopeId,
      commercialPricingId: row.commercialPricingId,
      status: row.status,
      statusLabel: commercialProposalStatusLabel(row.status),
      revision: row.revision,
      title: row.title,
      executiveSummary: row.executiveSummary,
      businessContext: row.businessContext,
      approachIntro: row.approachIntro,
      timelineNote: row.timelineNote,
      nextStepText: row.nextStepText,
      currency: row.currency,
      includedInvestmentCents: row.includedInvestmentCents,
      optionalInvestmentCents: row.optionalInvestmentCents,
      totalInvestmentCents: row.totalInvestmentCents,
      proposalVersion: row.proposalVersion,
      presentationVersion: row.presentationVersion,
      sourceFingerprint: row.sourceFingerprint,
      approvedAt: row.approvedAt,
      approvedByEmail: row.approvedByEmail,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      createdByEmail: row.createdByEmail,
      businessName: row.opportunity.prospect.businessName,
      opportunityHref: `/reports/opportunities/${row.opportunityId}`,
      scopeHref: `/reports/opportunities/${row.opportunityId}/scope/${row.commercialScopeId}`,
      pricingHref: `/reports/opportunities/${row.opportunityId}/pricing/${row.commercialPricingId}`,
      editable: row.status === "DRAFT" || row.status === "REVIEWED",
    },
    snapshot,
    staleness,
  };
}
