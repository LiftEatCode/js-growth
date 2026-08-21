"use server";

import { revalidatePath } from "next/cache";

import {
  createCommercialScope,
  reviseCommercialScope,
} from "@/lib/commercialization/scope/create";
import {
  addManualDeliverable,
  approveCommercialScope,
  markScopeReviewed,
  removeManualDeliverable,
  reorderScopeDeliverables,
  reorderScopeSections,
  replaceScopeAssumptions,
  replaceScopeExclusions,
  updateScopeDeliverable,
  updateScopeHeader,
  updateScopeSection,
} from "@/lib/commercialization/scope/mutate";
import type { ServiceCapabilityId } from "@/lib/commercialization/capabilities/types";
import type { ScopeDeliverableType } from "@/lib/commercialization/scope/constants";
import { getInternalSession } from "@/lib/internal-auth";
import { prisma } from "@/lib/prisma";

export interface ScopeActionResult {
  success: boolean;
  message?: string;
  scopeId?: string;
}

async function revalidateScope(scopeId: string) {
  const scope = await prisma.commercialScope.findUnique({
    where: { id: scopeId },
    select: { opportunityId: true },
  });
  revalidatePath("/reports/opportunities");
  if (scope) {
    revalidatePath(`/reports/opportunities/${scope.opportunityId}`);
    revalidatePath(
      `/reports/opportunities/${scope.opportunityId}/scope/${scopeId}`,
    );
  }
}

export async function createScopeAction(
  opportunityId: string,
): Promise<ScopeActionResult> {
  const session = await getInternalSession();
  if (!session) {
    return { success: false, message: "Not authorized." };
  }

  const result = await createCommercialScope({
    opportunityId,
    createdByEmail: session.email,
  });

  if (!result.ok) {
    return {
      success: false,
      message: result.message,
      scopeId: result.existingScopeId,
    };
  }

  await revalidateScope(result.scopeId);
  return {
    success: true,
    scopeId: result.scopeId,
    message: "Draft Scope created.",
  };
}

export async function reviseScopeAction(
  opportunityId: string,
): Promise<ScopeActionResult> {
  const session = await getInternalSession();
  if (!session) {
    return { success: false, message: "Not authorized." };
  }

  const result = await reviseCommercialScope({
    opportunityId,
    createdByEmail: session.email,
    fromLatestPlan: true,
  });

  if (!result.ok) {
    return { success: false, message: result.message };
  }

  await revalidateScope(result.scopeId);
  return {
    success: true,
    scopeId: result.scopeId,
    message: `Scope revised (revision ${result.revision}).`,
  };
}

export async function markScopeReviewedAction(
  scopeId: string,
): Promise<ScopeActionResult> {
  const session = await getInternalSession();
  if (!session) {
    return { success: false, message: "Not authorized." };
  }

  const result = await markScopeReviewed({
    scopeId,
    actorEmail: session.email,
  });
  if (!result.ok) {
    return { success: false, message: result.message, scopeId };
  }
  await revalidateScope(scopeId);
  return { success: true, scopeId, message: "Scope marked reviewed." };
}

export async function approveScopeAction(
  scopeId: string,
): Promise<ScopeActionResult> {
  const session = await getInternalSession();
  if (!session) {
    return { success: false, message: "Not authorized." };
  }

  const result = await approveCommercialScope({
    scopeId,
    actorEmail: session.email,
  });
  if (!result.ok) {
    return { success: false, message: result.message, scopeId };
  }
  await revalidateScope(scopeId);
  return { success: true, scopeId, message: "Scope approved." };
}

export async function saveScopeHeaderAction(
  scopeId: string,
  title: string,
  summary: string,
): Promise<ScopeActionResult> {
  const session = await getInternalSession();
  if (!session) {
    return { success: false, message: "Not authorized." };
  }

  const result = await updateScopeHeader({
    scopeId,
    title,
    summary,
    actorEmail: session.email,
  });
  if (!result.ok) {
    return { success: false, message: result.message, scopeId };
  }
  await revalidateScope(scopeId);
  return { success: true, scopeId, message: "Scope header saved." };
}

export async function updateSectionAction(
  scopeId: string,
  sectionId: string,
  patch: {
    title?: string;
    description?: string | null;
    isIncluded?: boolean;
    isOptional?: boolean;
    capabilities?: ServiceCapabilityId[];
  },
): Promise<ScopeActionResult> {
  const session = await getInternalSession();
  if (!session) {
    return { success: false, message: "Not authorized." };
  }

  const result = await updateScopeSection({
    scopeId,
    sectionId,
    ...patch,
    actorEmail: session.email,
  });
  if (!result.ok) {
    return { success: false, message: result.message, scopeId };
  }
  await revalidateScope(scopeId);
  return { success: true, scopeId, message: "Section updated." };
}

export async function updateDeliverableAction(
  scopeId: string,
  deliverableId: string,
  patch: {
    title?: string;
    description?: string | null;
    isIncluded?: boolean;
    isOptional?: boolean;
    deliverableType?: ScopeDeliverableType;
  },
): Promise<ScopeActionResult> {
  const session = await getInternalSession();
  if (!session) {
    return { success: false, message: "Not authorized." };
  }

  const result = await updateScopeDeliverable({
    scopeId,
    deliverableId,
    ...patch,
    actorEmail: session.email,
  });
  if (!result.ok) {
    return { success: false, message: result.message, scopeId };
  }
  await revalidateScope(scopeId);
  return { success: true, scopeId, message: "Deliverable updated." };
}

export async function addManualDeliverableAction(
  scopeId: string,
  sectionId: string,
  title: string,
): Promise<ScopeActionResult> {
  const session = await getInternalSession();
  if (!session) {
    return { success: false, message: "Not authorized." };
  }

  const result = await addManualDeliverable({
    scopeId,
    sectionId,
    title,
    actorEmail: session.email,
  });
  if (!result.ok) {
    return { success: false, message: result.message, scopeId };
  }
  await revalidateScope(scopeId);
  return { success: true, scopeId, message: "Manual deliverable added." };
}

export async function removeManualDeliverableAction(
  scopeId: string,
  deliverableId: string,
): Promise<ScopeActionResult> {
  const session = await getInternalSession();
  if (!session) {
    return { success: false, message: "Not authorized." };
  }

  const result = await removeManualDeliverable({
    scopeId,
    deliverableId,
    actorEmail: session.email,
  });
  if (!result.ok) {
    return { success: false, message: result.message, scopeId };
  }
  await revalidateScope(scopeId);
  return { success: true, scopeId, message: "Manual deliverable removed." };
}

export async function reorderSectionsAction(
  scopeId: string,
  orderedSectionIds: string[],
): Promise<ScopeActionResult> {
  const session = await getInternalSession();
  if (!session) {
    return { success: false, message: "Not authorized." };
  }

  const result = await reorderScopeSections({
    scopeId,
    orderedSectionIds,
    actorEmail: session.email,
  });
  if (!result.ok) {
    return { success: false, message: result.message, scopeId };
  }
  await revalidateScope(scopeId);
  return { success: true, scopeId, message: "Sections reordered." };
}

export async function reorderDeliverablesAction(
  scopeId: string,
  sectionId: string,
  orderedDeliverableIds: string[],
): Promise<ScopeActionResult> {
  const session = await getInternalSession();
  if (!session) {
    return { success: false, message: "Not authorized." };
  }

  const result = await reorderScopeDeliverables({
    scopeId,
    sectionId,
    orderedDeliverableIds,
    actorEmail: session.email,
  });
  if (!result.ok) {
    return { success: false, message: result.message, scopeId };
  }
  await revalidateScope(scopeId);
  return { success: true, scopeId, message: "Deliverables reordered." };
}

export async function saveAssumptionsAction(
  scopeId: string,
  texts: string[],
): Promise<ScopeActionResult> {
  const session = await getInternalSession();
  if (!session) {
    return { success: false, message: "Not authorized." };
  }

  const result = await replaceScopeAssumptions({
    scopeId,
    assumptions: texts.map((text) => ({ text })),
    actorEmail: session.email,
  });
  if (!result.ok) {
    return { success: false, message: result.message, scopeId };
  }
  await revalidateScope(scopeId);
  return { success: true, scopeId, message: "Assumptions saved." };
}

export async function saveExclusionsAction(
  scopeId: string,
  texts: string[],
): Promise<ScopeActionResult> {
  const session = await getInternalSession();
  if (!session) {
    return { success: false, message: "Not authorized." };
  }

  const result = await replaceScopeExclusions({
    scopeId,
    exclusions: texts.map((text) => ({ text })),
    actorEmail: session.email,
  });
  if (!result.ok) {
    return { success: false, message: result.message, scopeId };
  }
  await revalidateScope(scopeId);
  return { success: true, scopeId, message: "Exclusions saved." };
}
