import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { ACTIVE_OPPORTUNITY_STAGES } from "@/lib/commercialization/opportunities/constants";
import { prisma } from "@/lib/prisma";

import { buildPricingFromScope } from "./build";
import {
  COMMERCIAL_PRICING_CONFIG_VERSION,
  COMMERCIAL_PRICING_VERSION,
} from "./constants";

export type CreatePricingResult =
  | { ok: true; pricingId: string; revision: number; revised: boolean }
  | {
      ok: false;
      code:
        | "MISSING_OPPORTUNITY"
        | "TERMINAL_OPPORTUNITY"
        | "MISSING_SCOPE"
        | "SCOPE_NOT_APPROVED"
        | "HAS_ACTIVE_DRAFT"
        | "INVALID_INPUT";
      message: string;
      existingPricingId?: string;
    };

async function persistBuiltPricing(options: {
  opportunityId: string;
  revision: number;
  createdByEmail: string;
  built: ReturnType<typeof buildPricingFromScope>;
  activityType: "PRICING_CREATED" | "PRICING_REVISED";
  supersedePrior: boolean;
}): Promise<string> {
  return prisma.$transaction(async (tx) => {
    if (options.supersedePrior) {
      await tx.commercialPricing.updateMany({
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
          type: "PRICING_SUPERSEDED",
          actorEmail: options.createdByEmail,
          toValueJson: {
            reason: "revised",
          } as Prisma.InputJsonValue,
        },
      });
    }

    const pricing = await tx.commercialPricing.create({
      data: {
        opportunityId: options.opportunityId,
        commercialScopeId: options.built.commercialScopeId,
        status: "DRAFT",
        revision: options.revision,
        currency: options.built.currency,
        pricingVersion: COMMERCIAL_PRICING_VERSION,
        pricingConfigVersion: COMMERCIAL_PRICING_CONFIG_VERSION,
        sourceFingerprint: options.built.sourceFingerprint,
        recommendedIncludedCents: options.built.recommendedIncludedCents,
        recommendedOptionalCents: options.built.recommendedOptionalCents,
        recommendedTotalCents: options.built.recommendedTotalCents,
        finalIncludedCents: options.built.finalIncludedCents,
        finalOptionalCents: options.built.finalOptionalCents,
        finalTotalCents: options.built.finalTotalCents,
        minimumEngagementCents: options.built.minimumEngagementCents,
        minimumApplied: options.built.minimumApplied,
        assessmentOnly: options.built.assessmentOnly,
        createdByEmail: options.createdByEmail,
        lineItems: {
          create: options.built.lineItems.map((line) => ({
            workUnitKey: line.workUnitKey,
            title: line.title,
            workType: line.workType,
            effortBand: line.effortBand,
            quantity: line.quantity,
            recommendedUnitPriceCents: line.recommendedUnitPriceCents,
            recommendedLineTotalCents: line.recommendedLineTotalCents,
            finalUnitPriceCents: line.finalUnitPriceCents,
            finalLineTotalCents: line.finalLineTotalCents,
            isOptional: line.isOptional,
            isIncluded: line.isIncluded,
            isCustom: line.isCustom,
            isOverridden: line.isOverridden,
            overrideReason: line.overrideReason,
            sourceDeliverableIdsJson:
              line.sourceDeliverableIds as unknown as Prisma.InputJsonValue,
            sourceSectionTitlesJson:
              line.sourceSectionTitles as unknown as Prisma.InputJsonValue,
            sortOrder: line.sortOrder,
          })),
        },
      },
    });

    await tx.opportunityActivity.create({
      data: {
        opportunityId: options.opportunityId,
        type: options.activityType,
        actorEmail: options.createdByEmail,
        toValueJson: {
          pricingId: pricing.id,
          revision: options.revision,
          commercialScopeId: options.built.commercialScopeId,
          lineItemCount: options.built.lineItems.length,
          recommendedTotalCents: options.built.recommendedTotalCents,
        } as Prisma.InputJsonValue,
      },
    });

    return pricing.id;
  });
}

async function loadApprovedScopeForPricing(opportunityId: string) {
  return prisma.commercialScope.findFirst({
    where: {
      opportunityId,
      status: "APPROVED",
    },
    orderBy: { createdAt: "desc" },
    include: {
      sections: {
        orderBy: { sortOrder: "asc" },
        include: {
          deliverables: {
            orderBy: { sortOrder: "asc" },
          },
        },
      },
    },
  });
}

export async function createPricingForOpportunity(options: {
  opportunityId: string;
  actorEmail: string;
}): Promise<CreatePricingResult> {
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
      message: "Cannot create Pricing on a won or lost Opportunity.",
    };
  }

  const existingActive = await prisma.commercialPricing.findFirst({
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
          ? "An approved Pricing already exists. Use Revise to create a new draft."
          : "An editable Pricing already exists. Open it to continue.",
      existingPricingId: existingActive.id,
    };
  }

  const scope = await loadApprovedScopeForPricing(options.opportunityId);
  if (!scope) {
    return {
      ok: false,
      code: "SCOPE_NOT_APPROVED",
      message:
        "Pricing requires an approved Commercial Scope. Approve Scope first.",
    };
  }

  const built = buildPricingFromScope({
    opportunityId: options.opportunityId,
    scope: {
      id: scope.id,
      revision: scope.revision,
      status: scope.status,
      sections: scope.sections.map((section) => ({
        id: section.id,
        title: section.title,
        isIncluded: section.isIncluded,
        isOptional: section.isOptional,
        sortOrder: section.sortOrder,
        deliverables: section.deliverables.map((d) => ({
          id: d.id,
          title: d.title,
          sourceActionKey: d.sourceActionKey,
          source: d.source,
          isIncluded: d.isIncluded,
          isOptional: d.isOptional,
          sortOrder: d.sortOrder,
        })),
      })),
    },
  });

  const pricingId = await persistBuiltPricing({
    opportunityId: options.opportunityId,
    revision: 1,
    createdByEmail: options.actorEmail,
    built,
    activityType: "PRICING_CREATED",
    supersedePrior: false,
  });

  return { ok: true, pricingId, revision: 1, revised: false };
}

export async function revisePricingForOpportunity(options: {
  opportunityId: string;
  actorEmail: string;
}): Promise<CreatePricingResult> {
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
      message: "Cannot revise Pricing on a won or lost Opportunity.",
    };
  }

  const scope = await loadApprovedScopeForPricing(options.opportunityId);
  if (!scope) {
    return {
      ok: false,
      code: "SCOPE_NOT_APPROVED",
      message:
        "Pricing revision requires an approved Commercial Scope.",
    };
  }

  const latest = await prisma.commercialPricing.findFirst({
    where: { opportunityId: options.opportunityId },
    orderBy: { revision: "desc" },
    select: { revision: true },
  });

  const nextRevision = (latest?.revision ?? 0) + 1;

  const built = buildPricingFromScope({
    opportunityId: options.opportunityId,
    scope: {
      id: scope.id,
      revision: scope.revision,
      status: scope.status,
      sections: scope.sections.map((section) => ({
        id: section.id,
        title: section.title,
        isIncluded: section.isIncluded,
        isOptional: section.isOptional,
        sortOrder: section.sortOrder,
        deliverables: section.deliverables.map((d) => ({
          id: d.id,
          title: d.title,
          sourceActionKey: d.sourceActionKey,
          source: d.source,
          isIncluded: d.isIncluded,
          isOptional: d.isOptional,
          sortOrder: d.sortOrder,
        })),
      })),
    },
  });

  const pricingId = await persistBuiltPricing({
    opportunityId: options.opportunityId,
    revision: nextRevision,
    createdByEmail: options.actorEmail,
    built,
    activityType: "PRICING_REVISED",
    supersedePrior: true,
  });

  return { ok: true, pricingId, revision: nextRevision, revised: true };
}
