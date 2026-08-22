import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import type { ServiceCapabilityId } from "@/lib/commercialization/capabilities/types";
import { ACTIVE_OPPORTUNITY_STAGES } from "@/lib/commercialization/opportunities/constants";
import { evaluatePricingCompleteness } from "@/lib/commercialization/pricing/completeness";
import {
  COMMERCIAL_PRICING_CONFIG_VERSION,
  COMMERCIAL_PRICING_VERSION,
} from "@/lib/commercialization/pricing/constants";
import { buildPricingSourceFingerprint } from "@/lib/commercialization/pricing/fingerprint";
import { prisma } from "@/lib/prisma";

import { buildProposalFromApprovedSources } from "./build";
import {
  COMMERCIAL_PROPOSAL_PRESENTATION_VERSION,
  COMMERCIAL_PROPOSAL_VERSION,
} from "./constants";
import { ProposalFinancialReconciliationError } from "./reconcile";

export type CreateProposalResult =
  | { ok: true; proposalId: string; revision: number; revised: boolean }
  | {
      ok: false;
      code:
        | "MISSING_OPPORTUNITY"
        | "TERMINAL_OPPORTUNITY"
        | "SCOPE_NOT_APPROVED"
        | "PRICING_NOT_APPROVED"
        | "PRICING_INCOMPLETE"
        | "PRICING_SCOPE_MISMATCH"
        | "PRICING_STALE"
        | "HAS_ACTIVE_DRAFT"
        | "INVALID_INPUT"
        | "PROPOSAL_FINANCIAL_RECONCILIATION_FAILED"
      message: string;
      existingProposalId?: string;
    };

function buildProposalSnapshot(
  options: Parameters<typeof buildProposalFromApprovedSources>[0],
):
  | { ok: true; built: ReturnType<typeof buildProposalFromApprovedSources> }
  | {
      ok: false;
      code: "PROPOSAL_FINANCIAL_RECONCILIATION_FAILED";
      message: string;
    } {
  try {
    return { ok: true, built: buildProposalFromApprovedSources(options) };
  } catch (error) {
    if (error instanceof ProposalFinancialReconciliationError) {
      return {
        ok: false,
        code: "PROPOSAL_FINANCIAL_RECONCILIATION_FAILED",
        message:
          "Proposal financial presentation could not be reconciled to approved Scope and Pricing.",
      };
    }
    throw error;
  }
}

function asStringArray(raw: unknown): string[] {
  return Array.isArray(raw)
    ? raw.filter((v): v is string => typeof v === "string")
    : [];
}

function asCapabilityArray(raw: unknown): ServiceCapabilityId[] {
  return Array.isArray(raw)
    ? (raw.filter((v): v is string => typeof v === "string") as ServiceCapabilityId[])
    : [];
}

async function loadApprovedCommercialInputs(opportunityId: string) {
  const scope = await prisma.commercialScope.findFirst({
    where: { opportunityId, status: "APPROVED" },
    orderBy: { createdAt: "desc" },
    include: {
      sections: {
        orderBy: { sortOrder: "asc" },
        include: {
          deliverables: { orderBy: { sortOrder: "asc" } },
        },
      },
      opportunity: {
        select: {
          prospect: {
            select: {
              businessName: true,
              city: true,
              state: true,
              auditReport: { select: { overallScore: true } },
            },
          },
        },
      },
    },
  });

  const pricing = await prisma.commercialPricing.findFirst({
    where: { opportunityId, status: "APPROVED" },
    orderBy: { createdAt: "desc" },
    include: {
      lineItems: { orderBy: { sortOrder: "asc" } },
    },
  });

  return { scope, pricing };
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

async function persistBuiltProposal(options: {
  opportunityId: string;
  revision: number;
  createdByEmail: string;
  built: ReturnType<typeof buildProposalFromApprovedSources>;
  activityType: "PROPOSAL_CREATED" | "PROPOSAL_REVISED";
  supersedePrior: boolean;
}): Promise<string> {
  return prisma.$transaction(async (tx) => {
    if (options.supersedePrior) {
      await tx.commercialProposal.updateMany({
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
          type: "PROPOSAL_SUPERSEDED",
          actorEmail: options.createdByEmail,
          toValueJson: { reason: "revised" } as Prisma.InputJsonValue,
        },
      });
    }

    const proposal = await tx.commercialProposal.create({
      data: {
        opportunityId: options.opportunityId,
        commercialScopeId: options.built.commercialScopeId,
        commercialPricingId: options.built.commercialPricingId,
        status: "DRAFT",
        revision: options.revision,
        title: options.built.title,
        executiveSummary: options.built.executiveSummary,
        businessContext: options.built.businessContext,
        approachIntro: options.built.approachIntro,
        timelineNote: options.built.timelineNote,
        nextStepText: options.built.nextStepText,
        currency: options.built.currency,
        includedInvestmentCents: options.built.includedInvestmentCents,
        optionalInvestmentCents: options.built.optionalInvestmentCents,
        totalInvestmentCents: options.built.totalInvestmentCents,
        snapshotJson: options.built.snapshot as unknown as Prisma.InputJsonValue,
        proposalVersion: COMMERCIAL_PROPOSAL_VERSION,
        presentationVersion: COMMERCIAL_PROPOSAL_PRESENTATION_VERSION,
        sourceFingerprint: options.built.sourceFingerprint,
        createdByEmail: options.createdByEmail,
      },
    });

    await tx.opportunityActivity.create({
      data: {
        opportunityId: options.opportunityId,
        type: options.activityType,
        actorEmail: options.createdByEmail,
        toValueJson: {
          proposalId: proposal.id,
          revision: options.revision,
          commercialScopeId: options.built.commercialScopeId,
          commercialPricingId: options.built.commercialPricingId,
          totalInvestmentCents: options.built.totalInvestmentCents,
        } as Prisma.InputJsonValue,
      },
    });

    return proposal.id;
  });
}

function gateApprovedInputs(
  scope: NonNullable<Awaited<ReturnType<typeof loadApprovedCommercialInputs>>["scope"]> | null,
  pricing: NonNullable<Awaited<ReturnType<typeof loadApprovedCommercialInputs>>["pricing"]> | null,
): CreateProposalResult | null {
  if (!scope) {
    return {
      ok: false,
      code: "SCOPE_NOT_APPROVED",
      message: "Proposal requires an approved Commercial Scope.",
    };
  }
  if (!pricing) {
    return {
      ok: false,
      code: "PRICING_NOT_APPROVED",
      message: "Proposal requires approved Commercial Pricing.",
    };
  }
  if (pricing.commercialScopeId !== scope.id) {
    return {
      ok: false,
      code: "PRICING_SCOPE_MISMATCH",
      message:
        "Approved Pricing does not match the current approved Scope. Revise Pricing from the approved Scope first.",
    };
  }

  const completeness = evaluatePricingCompleteness(pricing.lineItems);
  if (!completeness.isComplete) {
    return {
      ok: false,
      code: "PRICING_INCOMPLETE",
      message:
        "Pricing is incomplete. Enter prices for all included work before creating a Proposal.",
    };
  }

  const expectedFingerprint = buildPricingSourceFingerprint({
    opportunityId: scope.opportunityId,
    commercialScopeId: scope.id,
    scopeRevision: scope.revision,
    scopeStatus: scope.status,
    pricingVersion: COMMERCIAL_PRICING_VERSION,
    pricingConfigVersion: COMMERCIAL_PRICING_CONFIG_VERSION,
  });

  if (pricing.sourceFingerprint !== expectedFingerprint) {
    return {
      ok: false,
      code: "PRICING_STALE",
      message:
        "Approved Pricing is stale relative to the Scope. Revise Pricing from the current approved Scope, then create the Proposal.",
    };
  }

  return null;
}

export async function createProposalForOpportunity(options: {
  opportunityId: string;
  actorEmail: string;
}): Promise<CreateProposalResult> {
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
      message: "Cannot create a Proposal on a won or lost Opportunity.",
    };
  }

  const existingActive = await prisma.commercialProposal.findFirst({
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
        existingActive.status === "APPROVED"
          ? "An approved Proposal already exists. Use Revise to create a new draft."
          : "An editable Proposal already exists. Open it to continue.",
      existingProposalId: existingActive.id,
    };
  }

  const { scope, pricing } = await loadApprovedCommercialInputs(
    options.opportunityId,
  );
  const gate = gateApprovedInputs(scope, pricing);
  if (gate) {
    return gate;
  }

  const assumptions = Array.isArray(scope!.assumptionsJson)
    ? (scope!.assumptionsJson as Array<{ text?: string }>).map((a) => ({
        text: typeof a.text === "string" ? a.text : "",
      }))
    : [];
  const exclusions = Array.isArray(scope!.exclusionsJson)
    ? (scope!.exclusionsJson as Array<{ text?: string }>).map((e) => ({
        text: typeof e.text === "string" ? e.text : "",
      }))
    : [];
  const considerations = Array.isArray(scope!.considerationsJson)
    ? (scope!.considerationsJson as Array<{ text?: string; key?: string }>).map(
        (c) => ({
          text: typeof c.text === "string" ? c.text : "",
          key: typeof c.key === "string" ? c.key : undefined,
        }),
      )
    : [];

  const buildResult = buildProposalSnapshot({
    opportunityId: options.opportunityId,
    businessName: scope!.opportunity.prospect.businessName,
    locationLabel: locationLabel(scope!.opportunity.prospect),
    overallScore: scope!.opportunity.prospect.auditReport?.overallScore ?? null,
    scope: {
      id: scope!.id,
      revision: scope!.revision,
      status: scope!.status,
      title: scope!.title,
      summary: scope!.summary,
      assumptions,
      exclusions,
      considerations,
      sections: scope!.sections.map((section) => ({
        id: section.id,
        title: section.title,
        description: section.description,
        sortOrder: section.sortOrder,
        isIncluded: section.isIncluded,
        isOptional: section.isOptional,
        capabilities: asCapabilityArray(section.capabilitiesJson),
        deliverables: section.deliverables.map((d) => ({
          id: d.id,
          title: d.title,
          sourceActionKey: d.sourceActionKey,
          isCustom: d.source === "MANUAL",
          isIncluded: d.isIncluded,
          isOptional: d.isOptional,
          sortOrder: d.sortOrder,
        })),
      })),
    },
    pricing: {
      id: pricing!.id,
      revision: pricing!.revision,
      status: pricing!.status,
      currency: pricing!.currency,
      commercialScopeId: pricing!.commercialScopeId,
      finalIncludedCents: pricing!.finalIncludedCents,
      finalOptionalCents: pricing!.finalOptionalCents,
      finalTotalCents: pricing!.finalTotalCents,
      minimumApplied: pricing!.minimumApplied,
      minimumEngagementCents: pricing!.minimumEngagementCents,
      lineItems: pricing!.lineItems.map((line) => ({
        id: line.id,
        title: line.title,
        quantity: line.quantity,
        recommendedUnitPriceCents: line.recommendedUnitPriceCents,
        finalUnitPriceCents: line.finalUnitPriceCents,
        finalLineTotalCents: line.finalLineTotalCents,
        isIncluded: line.isIncluded,
        isOptional: line.isOptional,
        isCustom: line.isCustom,
        isOverridden: line.isOverridden,
        effortBand: line.effortBand,
        sortOrder: line.sortOrder,
        sourceSectionTitles: asStringArray(line.sourceSectionTitlesJson),
        workUnitKey: line.workUnitKey,
      })),
    },
  });

  if (!buildResult.ok) {
    return buildResult;
  }

  const built = buildResult.built;

  const proposalId = await persistBuiltProposal({
    opportunityId: options.opportunityId,
    revision: 1,
    createdByEmail: options.actorEmail,
    built,
    activityType: "PROPOSAL_CREATED",
    supersedePrior: false,
  });

  return { ok: true, proposalId, revision: 1, revised: false };
}

export async function reviseProposalForOpportunity(options: {
  opportunityId: string;
  actorEmail: string;
}): Promise<CreateProposalResult> {
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
      message: "Cannot revise a Proposal on a won or lost Opportunity.",
    };
  }

  const { scope, pricing } = await loadApprovedCommercialInputs(
    options.opportunityId,
  );
  const gate = gateApprovedInputs(scope, pricing);
  if (gate) {
    return gate;
  }

  const latest = await prisma.commercialProposal.findFirst({
    where: { opportunityId: options.opportunityId },
    orderBy: { revision: "desc" },
    select: { revision: true },
  });
  const nextRevision = (latest?.revision ?? 0) + 1;

  const assumptions = Array.isArray(scope!.assumptionsJson)
    ? (scope!.assumptionsJson as Array<{ text?: string }>).map((a) => ({
        text: typeof a.text === "string" ? a.text : "",
      }))
    : [];
  const exclusions = Array.isArray(scope!.exclusionsJson)
    ? (scope!.exclusionsJson as Array<{ text?: string }>).map((e) => ({
        text: typeof e.text === "string" ? e.text : "",
      }))
    : [];
  const considerations = Array.isArray(scope!.considerationsJson)
    ? (scope!.considerationsJson as Array<{ text?: string; key?: string }>).map(
        (c) => ({
          text: typeof c.text === "string" ? c.text : "",
          key: typeof c.key === "string" ? c.key : undefined,
        }),
      )
    : [];

  const buildResult = buildProposalSnapshot({
    opportunityId: options.opportunityId,
    businessName: scope!.opportunity.prospect.businessName,
    locationLabel: locationLabel(scope!.opportunity.prospect),
    overallScore: scope!.opportunity.prospect.auditReport?.overallScore ?? null,
    scope: {
      id: scope!.id,
      revision: scope!.revision,
      status: scope!.status,
      title: scope!.title,
      summary: scope!.summary,
      assumptions,
      exclusions,
      considerations,
      sections: scope!.sections.map((section) => ({
        id: section.id,
        title: section.title,
        description: section.description,
        sortOrder: section.sortOrder,
        isIncluded: section.isIncluded,
        isOptional: section.isOptional,
        capabilities: asCapabilityArray(section.capabilitiesJson),
        deliverables: section.deliverables.map((d) => ({
          id: d.id,
          title: d.title,
          sourceActionKey: d.sourceActionKey,
          isCustom: d.source === "MANUAL",
          isIncluded: d.isIncluded,
          isOptional: d.isOptional,
          sortOrder: d.sortOrder,
        })),
      })),
    },
    pricing: {
      id: pricing!.id,
      revision: pricing!.revision,
      status: pricing!.status,
      currency: pricing!.currency,
      commercialScopeId: pricing!.commercialScopeId,
      finalIncludedCents: pricing!.finalIncludedCents,
      finalOptionalCents: pricing!.finalOptionalCents,
      finalTotalCents: pricing!.finalTotalCents,
      minimumApplied: pricing!.minimumApplied,
      minimumEngagementCents: pricing!.minimumEngagementCents,
      lineItems: pricing!.lineItems.map((line) => ({
        id: line.id,
        title: line.title,
        quantity: line.quantity,
        recommendedUnitPriceCents: line.recommendedUnitPriceCents,
        finalUnitPriceCents: line.finalUnitPriceCents,
        finalLineTotalCents: line.finalLineTotalCents,
        isIncluded: line.isIncluded,
        isOptional: line.isOptional,
        isCustom: line.isCustom,
        isOverridden: line.isOverridden,
        effortBand: line.effortBand,
        sortOrder: line.sortOrder,
        sourceSectionTitles: asStringArray(line.sourceSectionTitlesJson),
        workUnitKey: line.workUnitKey,
      })),
    },
  });

  if (!buildResult.ok) {
    return buildResult;
  }

  const built = buildResult.built;

  const proposalId = await persistBuiltProposal({
    opportunityId: options.opportunityId,
    revision: nextRevision,
    createdByEmail: options.actorEmail,
    built,
    activityType: "PROPOSAL_REVISED",
    supersedePrior: true,
  });

  return { ok: true, proposalId, revision: nextRevision, revised: true };
}
