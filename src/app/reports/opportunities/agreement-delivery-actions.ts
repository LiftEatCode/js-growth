"use server";

import { revalidatePath } from "next/cache";

import {
  prepareAgreementDelivery,
  regenerateAgreementShareToken,
  revokeAgreementAccess,
  sendAgreementDelivery,
  updateAgreementDelivery,
} from "@/lib/commercialization/agreement-delivery";
import { getInternalSession } from "@/lib/internal-auth";

export interface AgreementDeliveryActionResult {
  success: boolean;
  message?: string;
  deliveryId?: string;
  shareUrl?: string;
  shareToken?: string;
}

function revalidateOpportunity(opportunityId: string) {
  revalidatePath("/reports/opportunities");
  revalidatePath(`/reports/opportunities/${opportunityId}`);
}

export async function prepareAgreementDeliveryAction(options: {
  opportunityId: string;
  agreementId: string;
  recipientName: string;
  recipientEmail: string;
}): Promise<AgreementDeliveryActionResult> {
  const session = await getInternalSession();
  if (!session) {
    return { success: false, message: "Not authorized." };
  }

  const result = await prepareAgreementDelivery({
    opportunityId: options.opportunityId,
    agreementId: options.agreementId,
    actorEmail: session.email,
    recipientName: options.recipientName,
    recipientEmail: options.recipientEmail,
  });

  if (!result.ok) {
    return { success: false, message: result.message };
  }

  revalidateOpportunity(options.opportunityId);
  return {
    success: true,
    deliveryId: result.deliveryId,
    shareUrl: result.shareUrl,
    shareToken: result.shareToken,
    message: "Delivery prepared. Review the message before sending.",
  };
}

export async function updateAgreementDeliveryAction(options: {
  opportunityId: string;
  deliveryId: string;
  recipientName?: string;
  recipientEmail?: string;
  subject?: string;
  message?: string;
  markReady?: boolean;
}): Promise<AgreementDeliveryActionResult> {
  const session = await getInternalSession();
  if (!session) {
    return { success: false, message: "Not authorized." };
  }

  const result = await updateAgreementDelivery({
    deliveryId: options.deliveryId,
    actorEmail: session.email,
    recipientName: options.recipientName,
    recipientEmail: options.recipientEmail,
    subject: options.subject,
    message: options.message,
    markReady: options.markReady,
  });

  if (!result.ok) {
    return { success: false, message: result.message };
  }

  revalidateOpportunity(options.opportunityId);
  return {
    success: true,
    deliveryId: result.deliveryId,
    message: options.markReady
      ? "Delivery marked ready to send."
      : "Delivery updated.",
  };
}

export async function regenerateAgreementShareLinkAction(options: {
  opportunityId: string;
  deliveryId: string;
}): Promise<AgreementDeliveryActionResult> {
  const session = await getInternalSession();
  if (!session) {
    return { success: false, message: "Not authorized." };
  }

  const result = await regenerateAgreementShareToken({
    deliveryId: options.deliveryId,
    actorEmail: session.email,
  });

  if (!result.ok) {
    return { success: false, message: result.message };
  }

  revalidateOpportunity(options.opportunityId);
  return {
    success: true,
    deliveryId: result.deliveryId,
    shareUrl: result.shareUrl,
    shareToken: result.shareToken,
    message: "New secure link generated.",
  };
}

export async function sendAgreementDeliveryAction(options: {
  opportunityId: string;
  deliveryId: string;
  shareToken: string;
}): Promise<AgreementDeliveryActionResult> {
  const session = await getInternalSession();
  if (!session) {
    return { success: false, message: "Not authorized." };
  }

  const result = await sendAgreementDelivery({
    deliveryId: options.deliveryId,
    actorEmail: session.email,
    shareToken: options.shareToken,
  });

  if (!result.ok) {
    return { success: false, message: result.message };
  }

  revalidateOpportunity(options.opportunityId);
  return {
    success: true,
    deliveryId: result.deliveryId,
    message: "Agreement sent.",
  };
}

export async function revokeAgreementAccessAction(options: {
  opportunityId: string;
  deliveryId: string;
}): Promise<AgreementDeliveryActionResult> {
  const session = await getInternalSession();
  if (!session) {
    return { success: false, message: "Not authorized." };
  }

  const result = await revokeAgreementAccess({
    deliveryId: options.deliveryId,
    actorEmail: session.email,
  });

  if (!result.ok) {
    return { success: false, message: result.message };
  }

  revalidateOpportunity(options.opportunityId);
  return {
    success: true,
    deliveryId: result.deliveryId,
    message: "Agreement link access revoked.",
  };
}
