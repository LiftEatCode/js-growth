import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { loadLatestImplementationInterpretation } from "@/lib/commercialization/implementation-interpretation/load";
import { loadLatestImplementationPlan } from "@/lib/commercialization/implementation-plan/load";
import { prisma } from "@/lib/prisma";

import { snapshotCapabilitiesFromPlan } from "./capabilities";
import {
  MAX_LOST_NOTE_CHARS,
  MAX_NEXT_ACTION_CHARS,
  MAX_OPPORTUNITY_NOTE_CHARS,
  type OpportunityLostReason,
  type OpportunityStage,
  isTerminalOpportunityStage,
} from "./constants";
import type { OpportunityMutationResult } from "./types";
import { canTransitionOpportunityStage } from "./workflow";

export async function updateOpportunityStage(options: {
  opportunityId: string;
  stage: OpportunityStage;
  actorEmail: string;
  lostReason?: OpportunityLostReason;
  lostNote?: string;
}): Promise<OpportunityMutationResult> {
  const opportunity = await prisma.opportunity.findUnique({
    where: { id: options.opportunityId },
  });

  if (!opportunity) {
    return { ok: false, code: "NOT_FOUND", message: "Opportunity not found." };
  }

  const transition = canTransitionOpportunityStage({
    from: opportunity.stage,
    to: options.stage,
  });

  if (!transition.ok) {
    return { ok: false, code: "INVALID_STAGE", message: transition.reason };
  }

  if (options.stage === "LOST" && !options.lostReason) {
    return {
      ok: false,
      code: "LOST_REASON_REQUIRED",
      message: "A lost reason is required when marking an Opportunity lost.",
    };
  }

  const lostNote =
    options.lostNote?.trim().slice(0, MAX_LOST_NOTE_CHARS) || null;
  const fromTerminal = isTerminalOpportunityStage(opportunity.stage);
  const toTerminal = isTerminalOpportunityStage(options.stage);
  const reopening = fromTerminal && !toTerminal;

  await prisma.$transaction(async (tx) => {
    await tx.opportunity.update({
      where: { id: options.opportunityId },
      data: {
        stage: options.stage,
        wonAt:
          options.stage === "WON"
            ? new Date()
            : options.stage === "LOST" || reopening
              ? null
              : opportunity.wonAt,
        lostAt:
          options.stage === "LOST"
            ? new Date()
            : options.stage === "WON" || reopening
              ? null
              : opportunity.lostAt,
        lostReason:
          options.stage === "LOST"
            ? options.lostReason!
            : options.stage === "WON" || reopening
              ? null
              : opportunity.lostReason,
        lostNote:
          options.stage === "LOST"
            ? lostNote
            : options.stage === "WON" || reopening
              ? null
              : opportunity.lostNote,
      },
    });

    if (options.stage === "WON") {
      await tx.opportunityActivity.create({
        data: {
          opportunityId: options.opportunityId,
          type: "MARKED_WON",
          actorEmail: options.actorEmail,
          fromValueJson: { stage: opportunity.stage } as Prisma.InputJsonValue,
          toValueJson: { stage: "WON" } as Prisma.InputJsonValue,
        },
      });
      return;
    }

    if (options.stage === "LOST") {
      await tx.opportunityActivity.create({
        data: {
          opportunityId: options.opportunityId,
          type: "MARKED_LOST",
          actorEmail: options.actorEmail,
          fromValueJson: { stage: opportunity.stage } as Prisma.InputJsonValue,
          toValueJson: {
            stage: "LOST",
            lostReason: options.lostReason,
            lostNote,
          } as Prisma.InputJsonValue,
          note: lostNote,
        },
      });
      return;
    }

    if (reopening) {
      await tx.opportunityActivity.create({
        data: {
          opportunityId: options.opportunityId,
          type: "REOPENED",
          actorEmail: options.actorEmail,
          fromValueJson: { stage: opportunity.stage } as Prisma.InputJsonValue,
          toValueJson: { stage: options.stage } as Prisma.InputJsonValue,
        },
      });
      return;
    }

    await tx.opportunityActivity.create({
      data: {
        opportunityId: options.opportunityId,
        type: "STAGE_CHANGED",
        actorEmail: options.actorEmail,
        fromValueJson: { stage: opportunity.stage } as Prisma.InputJsonValue,
        toValueJson: { stage: options.stage } as Prisma.InputJsonValue,
      },
    });
  });

  return { ok: true, opportunityId: options.opportunityId };
}

export async function updateOpportunityNextAction(options: {
  opportunityId: string;
  nextAction: string | null;
  nextActionAt: Date | null;
  actorEmail: string;
}): Promise<OpportunityMutationResult> {
  const opportunity = await prisma.opportunity.findUnique({
    where: { id: options.opportunityId },
  });

  if (!opportunity) {
    return { ok: false, code: "NOT_FOUND", message: "Opportunity not found." };
  }

  const nextAction =
    options.nextAction?.trim().slice(0, MAX_NEXT_ACTION_CHARS) || null;

  await prisma.$transaction(async (tx) => {
    await tx.opportunity.update({
      where: { id: options.opportunityId },
      data: {
        nextAction,
        nextActionAt: options.nextActionAt,
      },
    });

    await tx.opportunityActivity.create({
      data: {
        opportunityId: options.opportunityId,
        type: "NEXT_ACTION_CHANGED",
        actorEmail: options.actorEmail,
        fromValueJson: {
          nextAction: opportunity.nextAction,
          nextActionAt: opportunity.nextActionAt?.toISOString() ?? null,
        } as Prisma.InputJsonValue,
        toValueJson: {
          nextAction,
          nextActionAt: options.nextActionAt?.toISOString() ?? null,
        } as Prisma.InputJsonValue,
      },
    });
  });

  return { ok: true, opportunityId: options.opportunityId };
}

export async function addOpportunityNote(options: {
  opportunityId: string;
  note: string;
  actorEmail: string;
}): Promise<OpportunityMutationResult> {
  const note = options.note.trim().slice(0, MAX_OPPORTUNITY_NOTE_CHARS);
  if (!note) {
    return {
      ok: false,
      code: "INVALID_INPUT",
      message: "Note cannot be empty.",
    };
  }

  const opportunity = await prisma.opportunity.findUnique({
    where: { id: options.opportunityId },
    select: { id: true },
  });

  if (!opportunity) {
    return { ok: false, code: "NOT_FOUND", message: "Opportunity not found." };
  }

  await prisma.opportunityActivity.create({
    data: {
      opportunityId: options.opportunityId,
      type: "NOTE_ADDED",
      actorEmail: options.actorEmail,
      note,
      toValueJson: { note } as Prisma.InputJsonValue,
    },
  });

  await prisma.opportunity.update({
    where: { id: options.opportunityId },
    data: { updatedAt: new Date() },
  });

  return { ok: true, opportunityId: options.opportunityId };
}

export async function refreshOpportunityCapabilities(options: {
  opportunityId: string;
  actorEmail: string;
}): Promise<OpportunityMutationResult> {
  const opportunity = await prisma.opportunity.findUnique({
    where: { id: options.opportunityId },
  });

  if (!opportunity) {
    return { ok: false, code: "NOT_FOUND", message: "Opportunity not found." };
  }

  const planLoad = await loadLatestImplementationPlan({
    campaignId: opportunity.campaignId,
    prospectId: opportunity.prospectId,
  });

  const prospect = await prisma.prospect.findUnique({
    where: { id: opportunity.prospectId },
    select: { businessName: true, city: true, state: true },
  });

  const location =
    [prospect?.city, prospect?.state].filter(Boolean).join(", ") || null;

  const interpretationLoad = await loadLatestImplementationInterpretation({
    campaignId: opportunity.campaignId,
    prospectId: opportunity.prospectId,
    plan: planLoad.plan,
    planStale: planLoad.stale,
    businessName: prospect?.businessName ?? opportunity.name,
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

  await prisma.$transaction(async (tx) => {
    await tx.opportunity.update({
      where: { id: options.opportunityId },
      data: {
        implementationPlanId: planLoad.plan?.id ?? null,
        implementationInterpretationId,
        recommendedCapabilitiesJson:
          capabilities as unknown as Prisma.InputJsonValue,
      },
    });

    await tx.opportunityActivity.create({
      data: {
        opportunityId: options.opportunityId,
        type: "CAPABILITIES_UPDATED",
        actorEmail: options.actorEmail,
        fromValueJson:
          opportunity.recommendedCapabilitiesJson as Prisma.InputJsonValue,
        toValueJson: capabilities as unknown as Prisma.InputJsonValue,
      },
    });
  });

  return { ok: true, opportunityId: options.opportunityId };
}
