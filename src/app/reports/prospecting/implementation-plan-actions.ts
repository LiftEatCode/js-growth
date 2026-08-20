"use server";

import { revalidatePath } from "next/cache";

import { getInternalSession } from "@/lib/internal-auth";
import { createImplementationPlanSnapshot } from "@/lib/commercialization/implementation-plan/create";
import {
  approveImplementationPlan,
  removeImplementationWorkstream,
  reorderImplementationWorkstream,
  setImplementationPlanOperatorNotes,
  setImplementationWorkstreamPriority,
} from "@/lib/commercialization/implementation-plan/mutate";
import type { ImplementationPriority } from "@/lib/commercialization/implementation-plan/types";

export interface ImplementationPlanActionResult {
  success: boolean;
  message?: string;
  planId?: string;
}

function revalidateProspect(campaignId: string, prospectId: string) {
  revalidatePath("/reports/prospecting");
  revalidatePath(`/reports/prospecting/${campaignId}`);
  revalidatePath(`/reports/prospecting/${campaignId}/prospects/${prospectId}`);
}

export async function generateImplementationPlanAction(
  campaignId: string,
  prospectId: string,
): Promise<ImplementationPlanActionResult> {
  const session = await getInternalSession();

  if (!session) {
    return {
      success: false,
      message: "You are not authorized to generate implementation plans.",
    };
  }

  const result = await createImplementationPlanSnapshot({
    campaignId,
    prospectId,
    createdByEmail: session.email,
  });

  if (!result.ok) {
    return { success: false, message: result.message };
  }

  revalidateProspect(campaignId, prospectId);

  return {
    success: true,
    planId: result.planId,
    message: `Implementation plan generated with ${result.workstreamCount} workstream(s).`,
  };
}

export async function approveImplementationPlanAction(
  campaignId: string,
  prospectId: string,
  planId: string,
): Promise<ImplementationPlanActionResult> {
  const session = await getInternalSession();

  if (!session) {
    return {
      success: false,
      message: "You are not authorized to approve implementation plans.",
    };
  }

  const result = await approveImplementationPlan({
    planId,
    campaignId,
    prospectId,
    approvedByEmail: session.email,
  });

  if (!result.ok) {
    return { success: false, message: result.message };
  }

  revalidateProspect(campaignId, prospectId);
  return { success: true, planId, message: "Implementation plan approved." };
}

export async function removeImplementationWorkstreamAction(
  campaignId: string,
  prospectId: string,
  planId: string,
  workstreamId: string,
): Promise<ImplementationPlanActionResult> {
  const session = await getInternalSession();

  if (!session) {
    return { success: false, message: "You are not authorized." };
  }

  const result = await removeImplementationWorkstream({
    planId,
    workstreamId,
    campaignId,
    prospectId,
  });

  if (!result.ok) {
    return { success: false, message: result.message };
  }

  revalidateProspect(campaignId, prospectId);
  return { success: true, planId, message: "Workstream removed." };
}

export async function setImplementationWorkstreamPriorityAction(
  campaignId: string,
  prospectId: string,
  planId: string,
  workstreamId: string,
  priority: ImplementationPriority,
): Promise<ImplementationPlanActionResult> {
  const session = await getInternalSession();

  if (!session) {
    return { success: false, message: "You are not authorized." };
  }

  const result = await setImplementationWorkstreamPriority({
    planId,
    workstreamId,
    campaignId,
    prospectId,
    priority,
  });

  if (!result.ok) {
    return { success: false, message: result.message };
  }

  revalidateProspect(campaignId, prospectId);
  return { success: true, planId, message: "Priority updated." };
}

export async function reorderImplementationWorkstreamAction(
  campaignId: string,
  prospectId: string,
  planId: string,
  workstreamId: string,
  direction: "up" | "down",
): Promise<ImplementationPlanActionResult> {
  const session = await getInternalSession();

  if (!session) {
    return { success: false, message: "You are not authorized." };
  }

  const result = await reorderImplementationWorkstream({
    planId,
    workstreamId,
    campaignId,
    prospectId,
    direction,
  });

  if (!result.ok) {
    return { success: false, message: result.message };
  }

  revalidateProspect(campaignId, prospectId);
  return { success: true, planId };
}

export async function saveImplementationPlanNotesAction(
  campaignId: string,
  prospectId: string,
  planId: string,
  notes: string,
): Promise<ImplementationPlanActionResult> {
  const session = await getInternalSession();

  if (!session) {
    return { success: false, message: "You are not authorized." };
  }

  const result = await setImplementationPlanOperatorNotes({
    planId,
    campaignId,
    prospectId,
    notes,
  });

  if (!result.ok) {
    return { success: false, message: result.message };
  }

  revalidateProspect(campaignId, prospectId);
  return { success: true, planId, message: "Notes saved." };
}
