"use server";

import { revalidatePath } from "next/cache";

import {
  createCommercialCheckout,
  sendCommercialPaymentLink,
  type CommercialPaymentTypeValue,
} from "@/lib/commercialization/payments";
import { getInternalSession } from "@/lib/internal-auth";

export interface PaymentActionResult {
  success: boolean;
  message?: string;
  paymentId?: string;
  checkoutUrl?: string;
  amountDueCents?: number;
}

function revalidateOpportunity(opportunityId: string) {
  revalidatePath("/reports/opportunities");
  revalidatePath(`/reports/opportunities/${opportunityId}`);
}

export async function createDepositCheckoutAction(options: {
  opportunityId: string;
  agreementId: string;
  regenerate?: boolean;
}): Promise<PaymentActionResult> {
  return createTypedCheckoutAction({
    ...options,
    paymentType: "DEPOSIT",
  });
}

export async function createBalanceCheckoutAction(options: {
  opportunityId: string;
  agreementId: string;
  regenerate?: boolean;
}): Promise<PaymentActionResult> {
  return createTypedCheckoutAction({
    ...options,
    paymentType: "BALANCE",
  });
}

export async function createFullCheckoutAction(options: {
  opportunityId: string;
  agreementId: string;
  regenerate?: boolean;
}): Promise<PaymentActionResult> {
  return createTypedCheckoutAction({
    ...options,
    paymentType: "FULL",
  });
}

async function createTypedCheckoutAction(options: {
  opportunityId: string;
  agreementId: string;
  paymentType: CommercialPaymentTypeValue;
  regenerate?: boolean;
}): Promise<PaymentActionResult> {
  const session = await getInternalSession();
  if (!session) {
    return { success: false, message: "Not authorized." };
  }

  const result = await createCommercialCheckout({
    agreementId: options.agreementId,
    paymentType: options.paymentType,
    actorEmail: session.email,
    regenerate: options.regenerate,
  });

  if (!result.ok) {
    return { success: false, message: result.message };
  }

  revalidateOpportunity(options.opportunityId);
  return {
    success: true,
    paymentId: result.paymentId,
    checkoutUrl: result.checkoutUrl,
    amountDueCents: result.amountDueCents,
    message: result.reused
      ? "Existing checkout link reused."
      : "Checkout created.",
  };
}

export async function sendPaymentLinkAction(options: {
  opportunityId: string;
  paymentId: string;
  recipientEmail: string;
  recipientName?: string;
  subject?: string;
  body?: string;
}): Promise<PaymentActionResult> {
  const session = await getInternalSession();
  if (!session) {
    return { success: false, message: "Not authorized." };
  }

  const result = await sendCommercialPaymentLink({
    paymentId: options.paymentId,
    actorEmail: session.email,
    recipientEmail: options.recipientEmail,
    recipientName: options.recipientName,
    subject: options.subject,
    body: options.body,
  });

  if (!result.ok) {
    return { success: false, message: result.message };
  }

  revalidateOpportunity(options.opportunityId);
  return { success: true, message: "Payment link sent." };
}
