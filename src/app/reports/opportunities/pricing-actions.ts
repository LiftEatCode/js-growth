"use server";

import { revalidatePath } from "next/cache";

import {
  createPricingForOpportunity,
  revisePricingForOpportunity,
} from "@/lib/commercialization/pricing/create";
import {
  addCustomPricingLineItem,
  approvePricing,
  markPricingReviewed,
  removeCustomPricingLineItem,
  updatePricingLineItem,
  updatePricingNotes,
} from "@/lib/commercialization/pricing/mutate";
import { getInternalSession } from "@/lib/internal-auth";
import { prisma } from "@/lib/prisma";

export interface PricingActionResult {
  success: boolean;
  message?: string;
  pricingId?: string;
}

async function revalidatePricing(pricingId: string) {
  const pricing = await prisma.commercialPricing.findUnique({
    where: { id: pricingId },
    select: { opportunityId: true },
  });
  revalidatePath("/reports/opportunities");
  if (pricing) {
    revalidatePath(`/reports/opportunities/${pricing.opportunityId}`);
    revalidatePath(
      `/reports/opportunities/${pricing.opportunityId}/pricing/${pricingId}`,
    );
  }
}

export async function createPricingAction(
  opportunityId: string,
): Promise<PricingActionResult> {
  const session = await getInternalSession();
  if (!session) {
    return { success: false, message: "Not authorized." };
  }

  const result = await createPricingForOpportunity({
    opportunityId,
    actorEmail: session.email,
  });

  if (!result.ok) {
    return {
      success: false,
      message: result.message,
      pricingId: result.existingPricingId,
    };
  }

  await revalidatePricing(result.pricingId);
  return {
    success: true,
    pricingId: result.pricingId,
    message: "Draft Pricing created.",
  };
}

export async function revisePricingAction(
  opportunityId: string,
): Promise<PricingActionResult> {
  const session = await getInternalSession();
  if (!session) {
    return { success: false, message: "Not authorized." };
  }

  const result = await revisePricingForOpportunity({
    opportunityId,
    actorEmail: session.email,
  });

  if (!result.ok) {
    return { success: false, message: result.message };
  }

  await revalidatePricing(result.pricingId);
  return {
    success: true,
    pricingId: result.pricingId,
    message: "Pricing revised — new draft created.",
  };
}

export async function updatePricingNotesAction(
  pricingId: string,
  notes: string,
): Promise<PricingActionResult> {
  const session = await getInternalSession();
  if (!session) {
    return { success: false, message: "Not authorized." };
  }

  const result = await updatePricingNotes({
    pricingId,
    notes,
    actorEmail: session.email,
  });
  if (!result.ok) {
    return { success: false, message: result.message };
  }
  await revalidatePricing(pricingId);
  return { success: true, pricingId };
}

export async function updatePricingLineItemAction(
  pricingId: string,
  lineItemId: string,
  patch: {
    isIncluded?: boolean;
    isOptional?: boolean;
    quantity?: number;
    finalUnitPriceCents?: number | null;
    overrideReason?: string | null;
  },
): Promise<PricingActionResult> {
  const session = await getInternalSession();
  if (!session) {
    return { success: false, message: "Not authorized." };
  }

  const result = await updatePricingLineItem({
    pricingId,
    lineItemId,
    ...patch,
    actorEmail: session.email,
  });
  if (!result.ok) {
    return { success: false, message: result.message };
  }
  await revalidatePricing(pricingId);
  return { success: true, pricingId };
}

export async function addCustomLineItemAction(
  pricingId: string,
  title: string,
  unitPriceDollars: string,
  isOptional: boolean,
): Promise<PricingActionResult> {
  const session = await getInternalSession();
  if (!session) {
    return { success: false, message: "Not authorized." };
  }

  const trimmed = unitPriceDollars.trim();
  let unitPriceCents: number | null = null;
  if (trimmed.length > 0) {
    const dollars = Number(trimmed);
    if (!Number.isFinite(dollars) || dollars < 0) {
      return { success: false, message: "Enter a valid dollar amount." };
    }
    unitPriceCents = Math.round(dollars * 100);
  }

  const result = await addCustomPricingLineItem({
    pricingId,
    title,
    unitPriceCents,
    isOptional,
    actorEmail: session.email,
  });
  if (!result.ok) {
    return { success: false, message: result.message };
  }
  await revalidatePricing(pricingId);
  return { success: true, pricingId };
}

export async function removeCustomLineItemAction(
  pricingId: string,
  lineItemId: string,
): Promise<PricingActionResult> {
  const session = await getInternalSession();
  if (!session) {
    return { success: false, message: "Not authorized." };
  }

  const result = await removeCustomPricingLineItem({
    pricingId,
    lineItemId,
    actorEmail: session.email,
  });
  if (!result.ok) {
    return { success: false, message: result.message };
  }
  await revalidatePricing(pricingId);
  return { success: true, pricingId };
}

export async function markPricingReviewedAction(
  pricingId: string,
): Promise<PricingActionResult> {
  const session = await getInternalSession();
  if (!session) {
    return { success: false, message: "Not authorized." };
  }

  const result = await markPricingReviewed({
    pricingId,
    actorEmail: session.email,
  });
  if (!result.ok) {
    return { success: false, message: result.message };
  }
  await revalidatePricing(pricingId);
  return { success: true, pricingId, message: "Marked reviewed." };
}

export async function approvePricingAction(
  pricingId: string,
): Promise<PricingActionResult> {
  const session = await getInternalSession();
  if (!session) {
    return { success: false, message: "Not authorized." };
  }

  const result = await approvePricing({
    pricingId,
    actorEmail: session.email,
  });
  if (!result.ok) {
    return { success: false, message: result.message };
  }
  await revalidatePricing(pricingId);
  return { success: true, pricingId, message: "Pricing approved." };
}
