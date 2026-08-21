import "server-only";

import type { ServiceCapabilityId } from "@/lib/commercialization/capabilities/types";
import { loadLatestCompetitiveComparison } from "@/lib/competitive-intelligence/comparison/load";
import { loadLatestImplementationInterpretation } from "@/lib/commercialization/implementation-interpretation/load";
import { loadLatestImplementationPlan } from "@/lib/commercialization/implementation-plan/load";
import { prisma } from "@/lib/prisma";

import { parseCapabilitiesSnapshot } from "./capabilities";
import {
  ACTIVE_OPPORTUNITY_STAGES,
  type OpportunityLostReason,
  type OpportunityStage,
  opportunityLostReasonLabel,
  opportunityStageLabel,
} from "./constants";
import { evaluateOpportunityIntelligenceStaleness } from "./staleness";
import type {
  OpportunityCapabilitiesSnapshot,
  OpportunityListFilters,
} from "./types";
import { classifyNextActionState } from "./workflow";

export interface LoadedOpportunitySummary {
  id: string;
  name: string;
  stage: OpportunityStage;
  stageLabel: string;
  ownerEmail: string;
  nextAction: string | null;
  nextActionAt: Date | null;
  nextActionState: "none" | "overdue" | "upcoming";
  createdAt: Date;
  updatedAt: Date;
  capabilities: ServiceCapabilityId[];
  prospectId: string;
  campaignId: string;
  businessName: string;
  city: string | null;
  state: string | null;
  locationLabel: string | null;
  overallScore: number | null;
  competitivePosition: string | null;
  lastActivityAt: Date | null;
}

export async function loadOpportunityForProspect(options: {
  prospectId: string;
}): Promise<{
  active: {
    id: string;
    stage: OpportunityStage;
    stageLabel: string;
    capabilities: ServiceCapabilityId[];
    nextAction: string | null;
    nextActionAt: Date | null;
    nextActionState: "none" | "overdue" | "upcoming";
    updatedAt: Date;
    lastActivityAt: Date | null;
  } | null;
  latestTerminal: { id: string; stage: OpportunityStage } | null;
}> {
  const [active, latest] = await Promise.all([
    prisma.opportunity.findFirst({
      where: {
        prospectId: options.prospectId,
        stage: { in: [...ACTIVE_OPPORTUNITY_STAGES] },
      },
      orderBy: { createdAt: "desc" },
      include: {
        activities: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { createdAt: true },
        },
      },
    }),
    prisma.opportunity.findFirst({
      where: { prospectId: options.prospectId },
      orderBy: { createdAt: "desc" },
      select: { id: true, stage: true },
    }),
  ]);

  if (!active) {
    return {
      active: null,
      latestTerminal:
        latest && (latest.stage === "WON" || latest.stage === "LOST")
          ? { id: latest.id, stage: latest.stage }
          : null,
    };
  }

  const snapshot = parseCapabilitiesSnapshot(active.recommendedCapabilitiesJson);

  return {
    active: {
      id: active.id,
      stage: active.stage,
      stageLabel: opportunityStageLabel(active.stage),
      capabilities: snapshot?.capabilities ?? [],
      nextAction: active.nextAction,
      nextActionAt: active.nextActionAt,
      nextActionState: classifyNextActionState({
        nextAction: active.nextAction,
        nextActionAt: active.nextActionAt,
      }),
      updatedAt: active.updatedAt,
      lastActivityAt: active.activities[0]?.createdAt ?? active.updatedAt,
    },
    latestTerminal: null,
  };
}

export async function listOpportunities(
  filters: OpportunityListFilters = {},
): Promise<LoadedOpportunitySummary[]> {
  const where: {
    stage?: OpportunityStage | { in: OpportunityStage[] };
    ownerEmail?: string;
  } = {};

  if (filters.stage === "ALL_ACTIVE") {
    where.stage = { in: [...ACTIVE_OPPORTUNITY_STAGES] };
  } else if (filters.stage && filters.stage !== "ALL") {
    where.stage = filters.stage;
  }

  if (filters.ownerEmail) {
    where.ownerEmail = filters.ownerEmail;
  }

  const rows = await prisma.opportunity.findMany({
    where,
    orderBy: [{ nextActionAt: "asc" }, { updatedAt: "desc" }],
    include: {
      prospect: {
        select: {
          id: true,
          businessName: true,
          city: true,
          state: true,
          auditReport: {
            select: { overallScore: true },
          },
        },
      },
      activities: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { createdAt: true },
      },
    },
  });

  const now = new Date();
  const summaries: LoadedOpportunitySummary[] = [];

  for (const row of rows) {
    const snapshot = parseCapabilitiesSnapshot(row.recommendedCapabilitiesJson);
    const capabilities = snapshot?.capabilities ?? [];

    if (filters.capability && !capabilities.includes(filters.capability)) {
      continue;
    }

    const nextActionState = classifyNextActionState({
      nextAction: row.nextAction,
      nextActionAt: row.nextActionAt,
      now,
    });

    if (
      filters.nextActionState &&
      filters.nextActionState !== "any" &&
      nextActionState !== filters.nextActionState
    ) {
      continue;
    }

    const locationLabel =
      [row.prospect.city, row.prospect.state].filter(Boolean).join(", ") ||
      null;

    summaries.push({
      id: row.id,
      name: row.name,
      stage: row.stage,
      stageLabel: opportunityStageLabel(row.stage),
      ownerEmail: row.ownerEmail,
      nextAction: row.nextAction,
      nextActionAt: row.nextActionAt,
      nextActionState,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      capabilities,
      prospectId: row.prospectId,
      campaignId: row.campaignId,
      businessName: row.prospect.businessName,
      city: row.prospect.city,
      state: row.prospect.state,
      locationLabel,
      overallScore: row.prospect.auditReport?.overallScore ?? null,
      // List uses persisted audit score only; competitive position on detail.
      competitivePosition: null,
      lastActivityAt: row.activities[0]?.createdAt ?? row.updatedAt,
    });
  }

  return summaries;
}

export async function loadOpportunityDetail(options: {
  opportunityId: string;
}): Promise<{
  opportunity: {
    id: string;
    name: string;
    stage: OpportunityStage;
    stageLabel: string;
    ownerEmail: string;
    createdByEmail: string;
    createdAt: Date;
    updatedAt: Date;
    nextAction: string | null;
    nextActionAt: Date | null;
    nextActionState: "none" | "overdue" | "upcoming";
    wonAt: Date | null;
    lostAt: Date | null;
    lostReason: OpportunityLostReason | null;
    lostReasonLabel: string | null;
    lostNote: string | null;
    capabilitiesSnapshot: OpportunityCapabilitiesSnapshot | null;
    implementationPlanId: string | null;
    implementationInterpretationId: string | null;
    prospectId: string;
    campaignId: string;
    businessName: string;
    locationLabel: string | null;
    overallScore: number | null;
    prospectHref: string;
  };
  activities: Array<{
    id: string;
    type: string;
    actorEmail: string;
    note: string | null;
    fromValueJson: unknown;
    toValueJson: unknown;
    createdAt: Date;
  }>;
  intelligence: {
    planStatus: string | null;
    planStale: boolean;
    interpretationStatus: string | null;
    interpretationStale: boolean;
    competitivePosition: string | null;
    comparisonStale: boolean;
    staleness: ReturnType<typeof evaluateOpportunityIntelligenceStaleness>;
  };
} | null> {
  const row = await prisma.opportunity.findUnique({
    where: { id: options.opportunityId },
    include: {
      prospect: {
        select: {
          id: true,
          businessName: true,
          city: true,
          state: true,
          auditReport: { select: { overallScore: true } },
        },
      },
      activities: {
        orderBy: { createdAt: "desc" },
        take: 100,
      },
    },
  });

  if (!row) {
    return null;
  }

  const planLoad = await loadLatestImplementationPlan({
    campaignId: row.campaignId,
    prospectId: row.prospectId,
  });

  const locationLabel =
    [row.prospect.city, row.prospect.state].filter(Boolean).join(", ") || null;

  const interpretationLoad = await loadLatestImplementationInterpretation({
    campaignId: row.campaignId,
    prospectId: row.prospectId,
    plan: planLoad.plan,
    planStale: planLoad.stale,
    businessName: row.prospect.businessName,
    location: locationLabel,
  });

  const comparison = await loadLatestCompetitiveComparison({
    campaignId: row.campaignId,
    prospectId: row.prospectId,
  });

  const capabilitiesSnapshot = parseCapabilitiesSnapshot(
    row.recommendedCapabilitiesJson,
  );

  const staleness = evaluateOpportunityIntelligenceStaleness({
    linkedPlanId: row.implementationPlanId,
    linkedInterpretationId: row.implementationInterpretationId,
    capabilitiesSnapshot,
    currentPlanId: planLoad.plan?.id ?? null,
    currentPlanStale: planLoad.stale,
    currentPlanStaleReasons: planLoad.staleReasons,
    currentInterpretationId: interpretationLoad.interpretation?.id ?? null,
    currentInterpretationStale: interpretationLoad.stale,
    currentInterpretationStaleReasons: interpretationLoad.staleReasons,
    currentComparisonStale: comparison.stale,
    currentComparisonStaleReasons: comparison.staleReasons,
  });

  return {
    opportunity: {
      id: row.id,
      name: row.name,
      stage: row.stage,
      stageLabel: opportunityStageLabel(row.stage),
      ownerEmail: row.ownerEmail,
      createdByEmail: row.createdByEmail,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      nextAction: row.nextAction,
      nextActionAt: row.nextActionAt,
      nextActionState: classifyNextActionState({
        nextAction: row.nextAction,
        nextActionAt: row.nextActionAt,
      }),
      wonAt: row.wonAt,
      lostAt: row.lostAt,
      lostReason: row.lostReason,
      lostReasonLabel: row.lostReason
        ? opportunityLostReasonLabel(row.lostReason)
        : null,
      lostNote: row.lostNote,
      capabilitiesSnapshot,
      implementationPlanId: row.implementationPlanId,
      implementationInterpretationId: row.implementationInterpretationId,
      prospectId: row.prospectId,
      campaignId: row.campaignId,
      businessName: row.prospect.businessName,
      locationLabel,
      overallScore: row.prospect.auditReport?.overallScore ?? null,
      prospectHref: `/reports/prospecting/${row.campaignId}/prospects/${row.prospectId}`,
    },
    activities: row.activities.map((activity) => ({
      id: activity.id,
      type: activity.type,
      actorEmail: activity.actorEmail,
      note: activity.note,
      fromValueJson: activity.fromValueJson,
      toValueJson: activity.toValueJson,
      createdAt: activity.createdAt,
    })),
    intelligence: {
      planStatus: planLoad.plan?.status ?? null,
      planStale: planLoad.stale,
      interpretationStatus: interpretationLoad.interpretation?.status ?? null,
      interpretationStale: interpretationLoad.stale,
      competitivePosition:
        comparison.snapshot?.comparison?.overall?.position ?? null,
      comparisonStale: comparison.stale,
      staleness,
    },
  };
}
