import "server-only";

import { prisma } from "@/lib/prisma";

import {
  commercialPricingStatusLabel,
  formatUsdCents,
  type CommercialPricingStatus,
  type PricingEffortBand,
  type PricingWorkType,
} from "./constants";
import {
  COMMERCIAL_PRICING_CONFIG_VERSION,
  COMMERCIAL_PRICING_VERSION,
} from "./constants";
import { buildPricingSourceFingerprint } from "./fingerprint";
import { evaluatePricingStaleness } from "./staleness";

function asStringArray(raw: unknown): string[] {
  return Array.isArray(raw)
    ? raw.filter((v): v is string => typeof v === "string")
    : [];
}

export async function loadCurrentPricingForOpportunity(options: {
  opportunityId: string;
}): Promise<{
  pricing: {
    id: string;
    status: CommercialPricingStatus;
    statusLabel: string;
    revision: number;
    finalTotalCents: number;
    finalTotalLabel: string;
    recommendedTotalCents: number;
    lineItemCount: number;
    approvedAt: Date | null;
    approvedByEmail: string | null;
    updatedAt: Date;
    commercialScopeId: string;
  } | null;
}> {
  const pricing = await prisma.commercialPricing.findFirst({
    where: {
      opportunityId: options.opportunityId,
      status: { in: ["DRAFT", "REVIEWED", "APPROVED"] },
    },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { lineItems: true } },
    },
  });

  if (!pricing) {
    return { pricing: null };
  }

  return {
    pricing: {
      id: pricing.id,
      status: pricing.status,
      statusLabel: commercialPricingStatusLabel(pricing.status),
      revision: pricing.revision,
      finalTotalCents: pricing.finalTotalCents,
      finalTotalLabel: formatUsdCents(pricing.finalTotalCents),
      recommendedTotalCents: pricing.recommendedTotalCents,
      lineItemCount: pricing._count.lineItems,
      approvedAt: pricing.approvedAt,
      approvedByEmail: pricing.approvedByEmail,
      updatedAt: pricing.updatedAt,
      commercialScopeId: pricing.commercialScopeId,
    },
  };
}

export async function loadCommercialPricingDetail(options: {
  pricingId: string;
}): Promise<{
  pricing: {
    id: string;
    opportunityId: string;
    commercialScopeId: string;
    status: CommercialPricingStatus;
    statusLabel: string;
    revision: number;
    currency: string;
    pricingVersion: number;
    pricingConfigVersion: number;
    sourceFingerprint: string;
    recommendedIncludedCents: number;
    recommendedOptionalCents: number;
    recommendedTotalCents: number;
    finalIncludedCents: number;
    finalOptionalCents: number;
    finalTotalCents: number;
    minimumEngagementCents: number;
    minimumApplied: boolean;
    assessmentOnly: boolean;
    notes: string | null;
    approvedAt: Date | null;
    approvedByEmail: string | null;
    createdAt: Date;
    updatedAt: Date;
    createdByEmail: string;
    businessName: string;
    opportunityHref: string;
    scopeHref: string;
    editable: boolean;
  };
  lineItems: Array<{
    id: string;
    workUnitKey: string;
    title: string;
    workType: PricingWorkType;
    effortBand: PricingEffortBand;
    quantity: number;
    recommendedUnitPriceCents: number | null;
    recommendedLineTotalCents: number | null;
    finalUnitPriceCents: number | null;
    finalLineTotalCents: number | null;
    isOptional: boolean;
    isIncluded: boolean;
    isCustom: boolean;
    isOverridden: boolean;
    overrideReason: string | null;
    sourceDeliverableIds: string[];
    sourceSectionTitles: string[];
    sortOrder: number;
  }>;
  staleness: { stale: boolean; reasons: string[] };
} | null> {
  const row = await prisma.commercialPricing.findUnique({
    where: { id: options.pricingId },
    include: {
      lineItems: { orderBy: { sortOrder: "asc" } },
      opportunity: {
        select: {
          id: true,
          campaignId: true,
          prospectId: true,
          prospect: { select: { businessName: true } },
        },
      },
      commercialScope: {
        select: {
          id: true,
          revision: true,
          status: true,
        },
      },
    },
  });

  if (!row) {
    return null;
  }

  const current = {
    opportunityId: row.opportunityId,
    commercialScopeId: row.commercialScope.id,
    scopeRevision: row.commercialScope.revision,
    scopeStatus: row.commercialScope.status,
    pricingVersion: COMMERCIAL_PRICING_VERSION,
    pricingConfigVersion: COMMERCIAL_PRICING_CONFIG_VERSION,
  };

  const expectedFingerprint = buildPricingSourceFingerprint(current);
  const staleness =
    row.sourceFingerprint === expectedFingerprint
      ? { stale: false, reasons: [] as string[] }
      : evaluatePricingStaleness({
          storedFingerprint: row.sourceFingerprint,
          current,
        });

  return {
    pricing: {
      id: row.id,
      opportunityId: row.opportunityId,
      commercialScopeId: row.commercialScopeId,
      status: row.status,
      statusLabel: commercialPricingStatusLabel(row.status),
      revision: row.revision,
      currency: row.currency,
      pricingVersion: row.pricingVersion,
      pricingConfigVersion: row.pricingConfigVersion,
      sourceFingerprint: row.sourceFingerprint,
      recommendedIncludedCents: row.recommendedIncludedCents,
      recommendedOptionalCents: row.recommendedOptionalCents,
      recommendedTotalCents: row.recommendedTotalCents,
      finalIncludedCents: row.finalIncludedCents,
      finalOptionalCents: row.finalOptionalCents,
      finalTotalCents: row.finalTotalCents,
      minimumEngagementCents: row.minimumEngagementCents,
      minimumApplied: row.minimumApplied,
      assessmentOnly: row.assessmentOnly,
      notes: row.notes,
      approvedAt: row.approvedAt,
      approvedByEmail: row.approvedByEmail,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      createdByEmail: row.createdByEmail,
      businessName: row.opportunity.prospect.businessName,
      opportunityHref: `/reports/opportunities/${row.opportunityId}`,
      scopeHref: `/reports/opportunities/${row.opportunityId}/scope/${row.commercialScopeId}`,
      editable: row.status === "DRAFT" || row.status === "REVIEWED",
    },
    lineItems: row.lineItems.map((line) => ({
      id: line.id,
      workUnitKey: line.workUnitKey,
      title: line.title,
      workType: line.workType as PricingWorkType,
      effortBand: line.effortBand as PricingEffortBand,
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
      sourceDeliverableIds: asStringArray(line.sourceDeliverableIdsJson),
      sourceSectionTitles: asStringArray(line.sourceSectionTitlesJson),
      sortOrder: line.sortOrder,
    })),
    staleness,
  };
}
