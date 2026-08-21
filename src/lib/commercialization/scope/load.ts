import "server-only";

import type { ServiceCapabilityId } from "@/lib/commercialization/capabilities/types";
import { loadLatestImplementationPlan } from "@/lib/commercialization/implementation-plan/load";
import { prisma } from "@/lib/prisma";

import {
  commercialScopeStatusLabel,
  type CommercialScopeStatus,
  type ScopeDeliverableType,
  type ScopeItemSource,
} from "./constants";
import { buildScopeSourceFingerprint } from "./fingerprint";
import { evaluateScopeStaleness } from "./staleness";
import type {
  ScopeAssumption,
  ScopeConsideration,
  ScopeExclusion,
} from "./types";

function parseJsonArray<T>(raw: unknown): T[] {
  return Array.isArray(raw) ? (raw as T[]) : [];
}

export async function loadCurrentScopeForOpportunity(options: {
  opportunityId: string;
}): Promise<{
  scope: {
    id: string;
    status: CommercialScopeStatus;
    statusLabel: string;
    revision: number;
    title: string;
    sectionCount: number;
    deliverableCount: number;
    approvedAt: Date | null;
    approvedByEmail: string | null;
    updatedAt: Date;
  } | null;
}> {
  const scope = await prisma.commercialScope.findFirst({
    where: {
      opportunityId: options.opportunityId,
      status: { in: ["DRAFT", "REVIEWED", "APPROVED"] },
    },
    orderBy: { createdAt: "desc" },
    include: {
      sections: {
        include: { deliverables: true },
      },
    },
  });

  if (!scope) {
    return { scope: null };
  }

  const deliverableCount = scope.sections.reduce(
    (sum, section) => sum + section.deliverables.length,
    0,
  );

  return {
    scope: {
      id: scope.id,
      status: scope.status,
      statusLabel: commercialScopeStatusLabel(scope.status),
      revision: scope.revision,
      title: scope.title,
      sectionCount: scope.sections.length,
      deliverableCount,
      approvedAt: scope.approvedAt,
      approvedByEmail: scope.approvedByEmail,
      updatedAt: scope.updatedAt,
    },
  };
}

export async function loadCommercialScopeDetail(options: {
  scopeId: string;
}): Promise<{
  scope: {
    id: string;
    opportunityId: string;
    status: CommercialScopeStatus;
    statusLabel: string;
    revision: number;
    title: string;
    summary: string | null;
    implementationPlanId: string | null;
    implementationInterpretationId: string | null;
    sourceFingerprint: string;
    assumptions: ScopeAssumption[];
    exclusions: ScopeExclusion[];
    considerations: ScopeConsideration[];
    approvedAt: Date | null;
    approvedByEmail: string | null;
    createdAt: Date;
    updatedAt: Date;
    createdByEmail: string;
    businessName: string;
    opportunityHref: string;
    prospectHref: string;
    editable: boolean;
  };
  sections: Array<{
    id: string;
    title: string;
    description: string | null;
    workstreamType: string | null;
    sourceImplementationWorkstreamId: string | null;
    sortOrder: number;
    isOptional: boolean;
    isIncluded: boolean;
    capabilities: ServiceCapabilityId[];
    source: ScopeItemSource;
    deliverables: Array<{
      id: string;
      title: string;
      description: string | null;
      sourceActionKey: string | null;
      deliverableType: ScopeDeliverableType;
      sortOrder: number;
      isOptional: boolean;
      isIncluded: boolean;
      source: ScopeItemSource;
    }>;
  }>;
  staleness: { stale: boolean; reasons: string[] };
} | null> {
  const row = await prisma.commercialScope.findUnique({
    where: { id: options.scopeId },
    include: {
      opportunity: {
        include: {
          prospect: {
            select: {
              id: true,
              businessName: true,
            },
          },
        },
      },
      sections: {
        orderBy: { sortOrder: "asc" },
        include: {
          deliverables: { orderBy: { sortOrder: "asc" } },
        },
      },
    },
  });

  if (!row) {
    return null;
  }

  const planLoad = await loadLatestImplementationPlan({
    campaignId: row.opportunity.campaignId,
    prospectId: row.opportunity.prospectId,
  });

  const currentFingerprint = {
    opportunityId: row.opportunityId,
    implementationPlanId: planLoad.plan?.id ?? null,
    planVersion: planLoad.plan?.planVersion ?? null,
    mappingVersion: planLoad.plan?.mappingVersion ?? null,
    scopeVersion: row.scopeVersion,
  };

  // Compare stored fingerprint against current plan identity (rebuild fingerprint input).
  const expectedNow = buildScopeSourceFingerprint({
    opportunityId: row.opportunityId,
    implementationPlanId: planLoad.plan?.id ?? null,
    planVersion: planLoad.plan?.planVersion ?? null,
    mappingVersion: planLoad.plan?.mappingVersion ?? null,
    scopeVersion: row.scopeVersion,
  });

  const staleness =
    row.sourceFingerprint === expectedNow
      ? { stale: false, reasons: [] as string[] }
      : evaluateScopeStaleness({
          storedFingerprint: row.sourceFingerprint,
          current: currentFingerprint,
        });

  return {
    scope: {
      id: row.id,
      opportunityId: row.opportunityId,
      status: row.status,
      statusLabel: commercialScopeStatusLabel(row.status),
      revision: row.revision,
      title: row.title,
      summary: row.summary,
      implementationPlanId: row.implementationPlanId,
      implementationInterpretationId: row.implementationInterpretationId,
      sourceFingerprint: row.sourceFingerprint,
      assumptions: parseJsonArray<ScopeAssumption>(row.assumptionsJson),
      exclusions: parseJsonArray<ScopeExclusion>(row.exclusionsJson),
      considerations: parseJsonArray<ScopeConsideration>(
        row.considerationsJson,
      ),
      approvedAt: row.approvedAt,
      approvedByEmail: row.approvedByEmail,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      createdByEmail: row.createdByEmail,
      businessName: row.opportunity.prospect.businessName,
      opportunityHref: `/reports/opportunities/${row.opportunityId}`,
      prospectHref: `/reports/prospecting/${row.opportunity.campaignId}/prospects/${row.opportunity.prospectId}`,
      editable: row.status === "DRAFT" || row.status === "REVIEWED",
    },
    sections: row.sections.map((section) => ({
      id: section.id,
      title: section.title,
      description: section.description,
      workstreamType: section.workstreamType,
      sourceImplementationWorkstreamId:
        section.sourceImplementationWorkstreamId,
      sortOrder: section.sortOrder,
      isOptional: section.isOptional,
      isIncluded: section.isIncluded,
      capabilities: section.capabilitiesJson as unknown as ServiceCapabilityId[],
      source: section.source as ScopeItemSource,
      deliverables: section.deliverables.map((d) => ({
        id: d.id,
        title: d.title,
        description: d.description,
        sourceActionKey: d.sourceActionKey,
        deliverableType: d.deliverableType as ScopeDeliverableType,
        sortOrder: d.sortOrder,
        isOptional: d.isOptional,
        isIncluded: d.isIncluded,
        source: d.source as ScopeItemSource,
      })),
    })),
    staleness,
  };
}
