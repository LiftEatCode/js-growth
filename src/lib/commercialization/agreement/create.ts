import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { ACTIVE_OPPORTUNITY_STAGES } from "@/lib/commercialization/opportunities/constants";
import { evaluateProposalStaleness } from "@/lib/commercialization/proposal/staleness";
import type { ProposalSnapshot } from "@/lib/commercialization/proposal/types";
import {
  COMMERCIAL_PROPOSAL_PRESENTATION_VERSION,
  COMMERCIAL_PROPOSAL_VERSION,
} from "@/lib/commercialization/proposal/constants";
import { prisma } from "@/lib/prisma";

import { buildAgreementFromApprovedSources } from "./build";
import {
  MAX_AGREEMENT_OVERRIDE_REASON_CHARS,
  type AgreementPaymentTermType,
} from "./constants";

export type CreateAgreementResult =
  | { ok: true; agreementId: string; revision: number; revised: boolean }
  | {
      ok: false;
      code:
        | "MISSING_OPPORTUNITY"
        | "TERMINAL_OPPORTUNITY"
        | "MISSING_PROPOSAL"
        | "PROPOSAL_NOT_APPROVED"
        | "PROPOSAL_NOT_CURRENT"
        | "PROPOSAL_INTENT_NOT_ACCEPTED"
        | "INVALID_OVERRIDE"
        | "HAS_ACTIVE_DRAFT"
        | "INVALID_INPUT";
      message: string;
      existingAgreementId?: string;
    };

function parseProposalSnapshot(raw: unknown): ProposalSnapshot | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }
  return raw as ProposalSnapshot;
}

function locationLabel(prospect: {
  city: string | null;
  state: string | null;
}): string | null {
  const city = prospect.city?.trim();
  const state = prospect.state?.trim();
  if (city && state) {
    return `${city}, ${state}`;
  }
  return city || state || null;
}

async function hasAcceptedProposalIntent(proposalId: string): Promise<boolean> {
  const delivery = await prisma.proposalDelivery.findFirst({
    where: {
      proposalId,
      decision: "ACCEPTED",
      revokedAt: null,
    },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });
  return !!delivery;
}

export async function createAgreementForOpportunity(options: {
  opportunityId: string;
  proposalId: string;
  actorEmail: string;
  createOverrideReason?: string | null;
  paymentTermType?: AgreementPaymentTermType;
}): Promise<CreateAgreementResult> {
  const opportunity = await prisma.opportunity.findUnique({
    where: { id: options.opportunityId },
    select: { id: true, stage: true },
  });

  if (!opportunity) {
    return {
      ok: false,
      code: "MISSING_OPPORTUNITY",
      message: "Opportunity not found.",
    };
  }

  if (
    !ACTIVE_OPPORTUNITY_STAGES.includes(
      opportunity.stage as (typeof ACTIVE_OPPORTUNITY_STAGES)[number],
    )
  ) {
    return {
      ok: false,
      code: "TERMINAL_OPPORTUNITY",
      message: "Cannot create an Agreement on a won or lost Opportunity.",
    };
  }

  const existingActive = await prisma.commercialAgreement.findFirst({
    where: {
      opportunityId: options.opportunityId,
      status: { in: ["DRAFT", "REVIEWED", "APPROVED"] },
    },
    orderBy: { createdAt: "desc" },
  });

  if (existingActive) {
    return {
      ok: false,
      code: "HAS_ACTIVE_DRAFT",
      message:
        "An active Agreement already exists. Revise or void it before creating another.",
      existingAgreementId: existingActive.id,
    };
  }

  const proposal = await prisma.commercialProposal.findFirst({
    where: {
      id: options.proposalId,
      opportunityId: options.opportunityId,
    },
    include: {
      opportunity: {
        select: {
          prospect: {
            select: { businessName: true, city: true, state: true },
          },
        },
      },
      commercialScope: { select: { id: true, revision: true } },
      commercialPricing: { select: { id: true, revision: true } },
    },
  });

  if (!proposal) {
    return {
      ok: false,
      code: "MISSING_PROPOSAL",
      message: "Proposal not found for this Opportunity.",
    };
  }

  if (proposal.status !== "APPROVED") {
    return {
      ok: false,
      code: "PROPOSAL_NOT_APPROVED",
      message: "Only an approved Proposal can become an Agreement.",
    };
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
      scopeRevision: currentScope?.revision ?? proposal.commercialScope.revision,
      commercialPricingId:
        currentPricing?.id ?? proposal.commercialPricingId,
      pricingRevision:
        currentPricing?.revision ?? proposal.commercialPricing.revision,
      proposalVersion: COMMERCIAL_PROPOSAL_VERSION,
      presentationVersion: COMMERCIAL_PROPOSAL_PRESENTATION_VERSION,
    },
  });

  if (staleness.stale) {
    return {
      ok: false,
      code: "PROPOSAL_NOT_CURRENT",
      message:
        "Proposal is stale relative to current approved Scope or Pricing. Revise the Proposal before creating an Agreement.",
    };
  }

  const intentAccepted = await hasAcceptedProposalIntent(proposal.id);
  const overrideReason = options.createOverrideReason?.trim() ?? "";

  if (!intentAccepted) {
    if (!overrideReason) {
      return {
        ok: false,
        code: "PROPOSAL_INTENT_NOT_ACCEPTED",
        message:
          "Record Proposal commercial intent as Accepted, or provide an explicit override reason.",
      };
    }
    if (overrideReason.length > MAX_AGREEMENT_OVERRIDE_REASON_CHARS) {
      return {
        ok: false,
        code: "INVALID_OVERRIDE",
        message: "Override reason is too long.",
      };
    }
  }

  const snapshot = parseProposalSnapshot(proposal.snapshotJson);
  if (!snapshot) {
    return {
      ok: false,
      code: "INVALID_INPUT",
      message: "Proposal snapshot is missing or invalid.",
    };
  }

  const lastRevision = await prisma.commercialAgreement.findFirst({
    where: { opportunityId: options.opportunityId },
    orderBy: { revision: "desc" },
    select: { revision: true },
  });
  const revision = (lastRevision?.revision ?? 0) + 1;

  const built = buildAgreementFromApprovedSources({
    proposal: {
      id: proposal.id,
      revision: proposal.revision,
      proposalVersion: proposal.proposalVersion,
      presentationVersion: proposal.presentationVersion,
      title: proposal.title,
      snapshot,
    },
    authority: {
      opportunityId: options.opportunityId,
      scopeId: proposal.commercialScopeId,
      scopeRevision: proposal.commercialScope.revision,
      pricingId: proposal.commercialPricingId,
      pricingRevision: proposal.commercialPricing.revision,
      currency: proposal.currency,
      includedInvestmentCents: proposal.includedInvestmentCents,
      optionalInvestmentCents: proposal.optionalInvestmentCents,
      totalInvestmentCents: proposal.totalInvestmentCents,
    },
    businessName: proposal.opportunity.prospect.businessName,
    locationLabel: locationLabel(proposal.opportunity.prospect),
    presentation: options.paymentTermType
      ? { paymentTermType: options.paymentTermType }
      : undefined,
  });

  const agreementId = await prisma.$transaction(async (tx) => {
    const row = await tx.commercialAgreement.create({
      data: {
        opportunityId: options.opportunityId,
        proposalId: proposal.id,
        commercialScopeId: built.commercialScopeId,
        commercialPricingId: built.commercialPricingId,
        status: "DRAFT",
        revision,
        agreementVersion: built.agreementVersion,
        agreementPresentationVersion: built.agreementPresentationVersion,
        termsVersion: built.termsVersion,
        title: built.title,
        sourceFingerprint: built.sourceFingerprint,
        snapshotJson: built.snapshot as unknown as Prisma.InputJsonValue,
        engagementOverview: built.engagementOverview,
        clientResponsibilitiesJson:
          built.clientResponsibilities as unknown as Prisma.InputJsonValue,
        jsResponsibilitiesJson:
          built.jsResponsibilities as unknown as Prisma.InputJsonValue,
        timelineTerms: built.timelineTerms,
        changeRequestTerms: built.changeRequestTerms,
        thirdPartyCostTerms: built.thirdPartyCostTerms,
        resultsDisclaimer: built.resultsDisclaimer,
        acceptanceLanguage: built.acceptanceLanguage,
        paymentTermType: built.paymentTermType,
        paymentCustomText: built.paymentCustomText,
        depositPercent: built.depositPercent,
        currency: built.currency,
        includedInvestmentCents: built.includedInvestmentCents,
        optionalInvestmentCents: built.optionalInvestmentCents,
        totalInvestmentCents: built.totalInvestmentCents,
        depositCents: built.depositCents,
        balanceCents: built.balanceCents,
        proposalReference: built.proposalReference,
        createOverrideReason: intentAccepted ? null : overrideReason,
        createdByEmail: options.actorEmail,
      },
    });

    await tx.opportunityActivity.create({
      data: {
        opportunityId: options.opportunityId,
        type: "AGREEMENT_CREATED",
        actorEmail: options.actorEmail,
        toValueJson: {
          agreementId: row.id,
          revision,
          proposalId: proposal.id,
        } as Prisma.InputJsonValue,
        note: intentAccepted ? null : overrideReason,
      },
    });

    return row.id;
  });

  return {
    ok: true,
    agreementId,
    revision,
    revised: revision > 1,
  };
}

export async function reviseAgreementForOpportunity(options: {
  opportunityId: string;
  proposalId: string;
  actorEmail: string;
  createOverrideReason?: string | null;
}): Promise<CreateAgreementResult> {
  const prior = await prisma.commercialAgreement.findFirst({
    where: {
      opportunityId: options.opportunityId,
      status: { in: ["APPROVED", "DRAFT", "REVIEWED"] },
    },
    orderBy: { createdAt: "desc" },
  });

  if (prior?.status === "ACCEPTED") {
    return {
      ok: false,
      code: "INVALID_INPUT",
      message:
        "Accepted Agreements are permanently immutable. Create a new revision explicitly if a replacement is required.",
    };
  }

  if (prior && prior.status !== "SUPERSEDED") {
    await prisma.$transaction(async (tx) => {
      await tx.commercialAgreement.updateMany({
        where: {
          opportunityId: options.opportunityId,
          status: { in: ["DRAFT", "REVIEWED", "APPROVED"] },
        },
        data: {
          status: "SUPERSEDED",
          supersededAt: new Date(),
        },
      });

      await tx.opportunityActivity.create({
        data: {
          opportunityId: options.opportunityId,
          type: "AGREEMENT_SUPERSEDED",
          actorEmail: options.actorEmail,
          toValueJson: {
            priorAgreementId: prior.id,
            priorRevision: prior.revision,
          } as Prisma.InputJsonValue,
        },
      });
    });
  }

  const result = await createAgreementForOpportunity({
    ...options,
  });

  if (result.ok) {
    await prisma.opportunityActivity.create({
      data: {
        opportunityId: options.opportunityId,
        type: "AGREEMENT_REVISED",
        actorEmail: options.actorEmail,
        toValueJson: {
          agreementId: result.agreementId,
          revision: result.revision,
        } as Prisma.InputJsonValue,
      },
    });
  }

  return result;
}
