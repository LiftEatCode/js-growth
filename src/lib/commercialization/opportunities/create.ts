import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { loadLatestImplementationInterpretation } from "@/lib/commercialization/implementation-interpretation/load";
import { loadLatestImplementationPlan } from "@/lib/commercialization/implementation-plan/load";
import { prisma } from "@/lib/prisma";

import { snapshotCapabilitiesFromPlan } from "./capabilities";
import {
  ACTIVE_OPPORTUNITY_STAGES,
  type OpportunityStage,
} from "./constants";
import type { CreateOpportunityResult } from "./types";

export async function createOpportunity(options: {
  campaignId: string;
  prospectId: string;
  createdByEmail: string;
  ownerEmail?: string;
  name?: string;
}): Promise<CreateOpportunityResult> {
  const membership = await prisma.campaignProspect.findUnique({
    where: {
      campaignId_prospectId: {
        campaignId: options.campaignId,
        prospectId: options.prospectId,
      },
    },
    include: {
      prospect: {
        select: {
          id: true,
          businessName: true,
          city: true,
          state: true,
          leadId: true,
        },
      },
    },
  });

  if (!membership) {
    return {
      ok: false,
      code: "MISSING_PROSPECT",
      message: "Prospect is not in this campaign.",
    };
  }

  const existingActive = await prisma.opportunity.findFirst({
    where: {
      prospectId: options.prospectId,
      stage: { in: [...ACTIVE_OPPORTUNITY_STAGES] },
    },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });

  if (existingActive) {
    return {
      ok: false,
      code: "DUPLICATE_ACTIVE",
      message:
        "An active Opportunity already exists for this prospect. Open it instead of creating another.",
      existingOpportunityId: existingActive.id,
    };
  }

  const planLoad = await loadLatestImplementationPlan({
    campaignId: options.campaignId,
    prospectId: options.prospectId,
  });

  const location =
    [membership.prospect.city, membership.prospect.state]
      .filter(Boolean)
      .join(", ") || null;

  const interpretationLoad = await loadLatestImplementationInterpretation({
    campaignId: options.campaignId,
    prospectId: options.prospectId,
    plan: planLoad.plan,
    planStale: planLoad.stale,
    businessName: membership.prospect.businessName,
    location,
  });

  const capabilities = snapshotCapabilitiesFromPlan(planLoad.plan);

  const completedInterpretation =
    interpretationLoad.interpretation?.status === "COMPLETED" &&
    interpretationLoad.interpretation.content
      ? interpretationLoad.interpretation
      : null;

  let implementationInterpretationId: string | null = null;
  if (completedInterpretation) {
    if (!planLoad.plan) {
      implementationInterpretationId = completedInterpretation.id;
    } else if (
      completedInterpretation.implementationPlanId === planLoad.plan.id
    ) {
      implementationInterpretationId = completedInterpretation.id;
    }
  }

  const name =
    options.name?.trim() ||
    `${membership.prospect.businessName} — Opportunity`;

  const ownerEmail = options.ownerEmail?.trim() || options.createdByEmail;

  const opportunity = await prisma.$transaction(async (tx) => {
    const created = await tx.opportunity.create({
      data: {
        prospectId: options.prospectId,
        campaignId: options.campaignId,
        leadId: membership.prospect.leadId,
        implementationPlanId: planLoad.plan?.id ?? null,
        implementationInterpretationId,
        name,
        stage: "NEW",
        ownerEmail,
        recommendedCapabilitiesJson:
          capabilities as unknown as Prisma.InputJsonValue,
        createdByEmail: options.createdByEmail,
      },
    });

    await tx.opportunityActivity.create({
      data: {
        opportunityId: created.id,
        type: "OPPORTUNITY_CREATED",
        actorEmail: options.createdByEmail,
        toValueJson: {
          stage: "NEW" satisfies OpportunityStage,
          implementationPlanId: planLoad.plan?.id ?? null,
          implementationInterpretationId,
          capabilities: capabilities.capabilities,
          noPlanAtSnapshot: capabilities.noPlanAtSnapshot,
        } as Prisma.InputJsonValue,
      },
    });

    return created;
  });

  return {
    ok: true,
    opportunityId: opportunity.id,
  };
}
