"use server";

import { revalidatePath } from "next/cache";

import { createOpportunity } from "@/lib/commercialization/opportunities/create";
import { addOpportunityNote } from "@/lib/commercialization/opportunities/mutate";
import { refreshOpportunityCapabilities } from "@/lib/commercialization/opportunities/mutate";
import { updateOpportunityNextAction } from "@/lib/commercialization/opportunities/mutate";
import { updateOpportunityStage } from "@/lib/commercialization/opportunities/mutate";
import type {
  OpportunityLostReason,
  OpportunityStage,
} from "@/lib/commercialization/opportunities/constants";
import { getInternalSession } from "@/lib/internal-auth";

export interface OpportunityActionResult {
  success: boolean;
  message?: string;
  opportunityId?: string;
}

function revalidateOpportunityPaths(
  opportunityId?: string,
  campaignId?: string,
  prospectId?: string,
) {
  revalidatePath("/reports/opportunities");
  if (opportunityId) {
    revalidatePath(`/reports/opportunities/${opportunityId}`);
  }
  if (campaignId && prospectId) {
    revalidatePath(`/reports/prospecting/${campaignId}`);
    revalidatePath(
      `/reports/prospecting/${campaignId}/prospects/${prospectId}`,
    );
  }
}

export async function createOpportunityAction(
  campaignId: string,
  prospectId: string,
): Promise<OpportunityActionResult> {
  const session = await getInternalSession();
  if (!session) {
    return {
      success: false,
      message: "You are not authorized to create opportunities.",
    };
  }

  const result = await createOpportunity({
    campaignId,
    prospectId,
    createdByEmail: session.email,
    ownerEmail: session.email,
  });

  if (!result.ok) {
    return {
      success: false,
      message: result.message,
      opportunityId: result.existingOpportunityId,
    };
  }

  revalidateOpportunityPaths(result.opportunityId, campaignId, prospectId);

  return {
    success: true,
    opportunityId: result.opportunityId,
    message: "Opportunity created.",
  };
}

export async function changeOpportunityStageAction(
  opportunityId: string,
  stage: OpportunityStage,
  options?: { lostReason?: OpportunityLostReason; lostNote?: string },
): Promise<OpportunityActionResult> {
  const session = await getInternalSession();
  if (!session) {
    return {
      success: false,
      message: "You are not authorized to update opportunities.",
    };
  }

  const result = await updateOpportunityStage({
    opportunityId,
    stage,
    actorEmail: session.email,
    lostReason: options?.lostReason,
    lostNote: options?.lostNote,
  });

  if (!result.ok) {
    return { success: false, message: result.message, opportunityId };
  }

  revalidateOpportunityPaths(opportunityId);
  revalidatePath("/reports/prospecting");

  return {
    success: true,
    opportunityId,
    message: `Stage updated to ${stage}.`,
  };
}

export async function saveOpportunityNextActionAction(
  opportunityId: string,
  nextAction: string,
  nextActionAtIso: string | null,
): Promise<OpportunityActionResult> {
  const session = await getInternalSession();
  if (!session) {
    return {
      success: false,
      message: "You are not authorized to update opportunities.",
    };
  }

  const nextActionAt =
    nextActionAtIso && nextActionAtIso.trim()
      ? new Date(nextActionAtIso)
      : null;

  if (nextActionAt && Number.isNaN(nextActionAt.getTime())) {
    return { success: false, message: "Invalid next-action date." };
  }

  const result = await updateOpportunityNextAction({
    opportunityId,
    nextAction: nextAction || null,
    nextActionAt,
    actorEmail: session.email,
  });

  if (!result.ok) {
    return { success: false, message: result.message, opportunityId };
  }

  revalidateOpportunityPaths(opportunityId);

  return {
    success: true,
    opportunityId,
    message: "Next action saved.",
  };
}

export async function addOpportunityNoteAction(
  opportunityId: string,
  note: string,
): Promise<OpportunityActionResult> {
  const session = await getInternalSession();
  if (!session) {
    return {
      success: false,
      message: "You are not authorized to update opportunities.",
    };
  }

  const result = await addOpportunityNote({
    opportunityId,
    note,
    actorEmail: session.email,
  });

  if (!result.ok) {
    return { success: false, message: result.message, opportunityId };
  }

  revalidateOpportunityPaths(opportunityId);

  return {
    success: true,
    opportunityId,
    message: "Note added.",
  };
}

export async function refreshOpportunityCapabilitiesAction(
  opportunityId: string,
): Promise<OpportunityActionResult> {
  const session = await getInternalSession();
  if (!session) {
    return {
      success: false,
      message: "You are not authorized to update opportunities.",
    };
  }

  const result = await refreshOpportunityCapabilities({
    opportunityId,
    actorEmail: session.email,
  });

  if (!result.ok) {
    return { success: false, message: result.message, opportunityId };
  }

  revalidateOpportunityPaths(opportunityId);

  return {
    success: true,
    opportunityId,
    message: "Recommended capabilities refreshed from the current plan.",
  };
}
