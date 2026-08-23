"use server";

import { revalidatePath } from "next/cache";

import {
  completeClientProject,
  convertOpportunityToClientProject,
  startClientProject,
  updateDeliveryTaskStatus,
  updateOnboardingItemStatus,
  type OnboardingItemStatusValue,
} from "@/lib/commercialization/onboarding";
import { getInternalSession } from "@/lib/internal-auth";

export interface OnboardingActionResult {
  success: boolean;
  message?: string;
  clientId?: string;
  projectId?: string;
  candidateClientIds?: string[];
}

function revalidateClientProject(options: {
  opportunityId?: string;
  clientId?: string;
  projectId?: string;
}) {
  if (options.opportunityId) {
    revalidatePath("/reports/opportunities");
    revalidatePath(`/reports/opportunities/${options.opportunityId}`);
  }
  revalidatePath("/reports/clients");
  if (options.clientId) {
    revalidatePath(`/reports/clients/${options.clientId}`);
  }
  if (options.clientId && options.projectId) {
    revalidatePath(
      `/reports/clients/${options.clientId}/projects/${options.projectId}`,
    );
  }
}

export async function convertToClientAction(options: {
  opportunityId: string;
  selectedClientId?: string;
}): Promise<OnboardingActionResult> {
  const session = await getInternalSession();
  if (!session) {
    return { success: false, message: "Not authorized." };
  }

  const result = await convertOpportunityToClientProject({
    opportunityId: options.opportunityId,
    actorEmail: session.email,
    selectedClientId: options.selectedClientId,
  });

  if (!result.ok) {
    return {
      success: false,
      message: result.message,
      candidateClientIds: result.candidateClientIds,
    };
  }

  revalidateClientProject({
    opportunityId: options.opportunityId,
    clientId: result.clientId,
    projectId: result.projectId,
  });

  return {
    success: true,
    message: result.created
      ? "Client and project created. Opportunity marked WON."
      : "Existing client engagement returned (idempotent).",
    clientId: result.clientId,
    projectId: result.projectId,
  };
}

export async function updateOnboardingItemAction(options: {
  opportunityId: string;
  clientId: string;
  projectId: string;
  itemId: string;
  status: OnboardingItemStatusValue;
  notes?: string | null;
}): Promise<OnboardingActionResult> {
  const session = await getInternalSession();
  if (!session) {
    return { success: false, message: "Not authorized." };
  }

  const result = await updateOnboardingItemStatus({
    projectId: options.projectId,
    itemId: options.itemId,
    status: options.status,
    actorEmail: session.email,
    notes: options.notes,
  });

  if (!result.ok) {
    return { success: false, message: result.message };
  }

  revalidateClientProject({
    opportunityId: options.opportunityId,
    clientId: options.clientId,
    projectId: options.projectId,
  });

  return { success: true, projectId: options.projectId };
}

export async function startProjectAction(options: {
  opportunityId: string;
  clientId: string;
  projectId: string;
}): Promise<OnboardingActionResult> {
  const session = await getInternalSession();
  if (!session) {
    return { success: false, message: "Not authorized." };
  }

  const result = await startClientProject({
    projectId: options.projectId,
    actorEmail: session.email,
  });

  if (!result.ok) {
    return { success: false, message: result.message };
  }

  revalidateClientProject(options);
  return {
    success: true,
    message: result.message ?? "Project started.",
    projectId: options.projectId,
  };
}

export async function updateDeliveryTaskAction(options: {
  opportunityId: string;
  clientId: string;
  projectId: string;
  taskId: string;
  status: "NOT_STARTED" | "IN_PROGRESS" | "BLOCKED" | "COMPLETED";
}): Promise<OnboardingActionResult> {
  const session = await getInternalSession();
  if (!session) {
    return { success: false, message: "Not authorized." };
  }

  const result = await updateDeliveryTaskStatus({
    projectId: options.projectId,
    taskId: options.taskId,
    status: options.status,
    actorEmail: session.email,
  });

  if (!result.ok) {
    return { success: false, message: result.message };
  }

  revalidateClientProject(options);
  return { success: true, projectId: options.projectId };
}

export async function completeProjectAction(options: {
  opportunityId: string;
  clientId: string;
  projectId: string;
  overrideReason?: string;
}): Promise<OnboardingActionResult> {
  const session = await getInternalSession();
  if (!session) {
    return { success: false, message: "Not authorized." };
  }

  const result = await completeClientProject({
    projectId: options.projectId,
    actorEmail: session.email,
    overrideReason: options.overrideReason,
  });

  if (!result.ok) {
    return { success: false, message: result.message };
  }

  revalidateClientProject(options);
  return {
    success: true,
    message: result.message ?? "Project completed.",
    projectId: options.projectId,
  };
}
