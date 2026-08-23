import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { getResendClient } from "@/lib/email/resend";
import { prisma } from "@/lib/prisma";

import { commercialPaymentTypeLabel } from "./constants";
import type { CommercialPaymentTypeValue } from "./constants";

export type SendPaymentLinkResult =
  | { ok: true; providerMessageId: string | null }
  | { ok: false; code: string; message: string };

function recipientFirstName(name: string | null | undefined): string {
  const trimmed = name?.trim() ?? "";
  if (!trimmed) return "there";
  return trimmed.split(/\s+/)[0] ?? "there";
}

export function buildDefaultPaymentLinkSubject(businessName: string): string {
  return `Payment Link — ${businessName.trim() || "Implementation"} Implementation Agreement`;
}

export function buildDefaultPaymentLinkBody(options: {
  recipientName: string | null;
  paymentType: CommercialPaymentTypeValue;
  checkoutUrl: string;
}): string {
  const kind =
    options.paymentType === "DEPOSIT"
      ? "deposit"
      : options.paymentType === "BALANCE"
        ? "balance payment"
        : "payment";

  return [
    `Hi ${recipientFirstName(options.recipientName)},`,
    "",
    "Your implementation agreement has been accepted.",
    "",
    `You can complete the required ${kind} securely using the link below:`,
    "",
    options.checkoutUrl,
    "",
    "Once payment is confirmed, we'll follow up with the next project steps.",
    "",
    "Thanks,",
    "JS Solutions",
  ].join("\n");
}

/**
 * Explicit operator-triggered payment link email.
 * MAX Resend calls per invocation = 1. Never auto-sends on checkout create.
 */
export async function sendCommercialPaymentLink(options: {
  paymentId: string;
  actorEmail: string;
  recipientEmail: string;
  recipientName?: string | null;
  subject?: string;
  body?: string;
}): Promise<SendPaymentLinkResult> {
  const payment = await prisma.commercialPayment.findUnique({
    where: { id: options.paymentId },
    include: {
      agreement: {
        select: {
          snapshotJson: true,
          status: true,
        },
      },
    },
  });

  if (!payment) {
    return { ok: false, code: "PAYMENT_NOT_FOUND", message: "Payment not found." };
  }

  if (payment.status !== "CHECKOUT_CREATED" || !payment.checkoutUrl) {
    return {
      ok: false,
      code: "NO_ACTIVE_CHECKOUT",
      message: "No active checkout link to send.",
    };
  }

  if (payment.agreement.status !== "ACCEPTED") {
    return {
      ok: false,
      code: "AGREEMENT_NOT_ACCEPTED",
      message: "Agreement is no longer accepted.",
    };
  }

  const email = options.recipientEmail.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return {
      ok: false,
      code: "INVALID_EMAIL",
      message: "Recipient email is invalid.",
    };
  }

  const businessName =
    payment.agreement.snapshotJson &&
    typeof payment.agreement.snapshotJson === "object" &&
    "businessName" in (payment.agreement.snapshotJson as object) &&
    typeof (payment.agreement.snapshotJson as { businessName?: unknown })
      .businessName === "string"
      ? (
          payment.agreement.snapshotJson as { businessName: string }
        ).businessName
      : "Implementation";

  const subject =
    options.subject?.trim() || buildDefaultPaymentLinkSubject(businessName);
  const body =
    options.body?.trim() ||
    buildDefaultPaymentLinkBody({
      recipientName: options.recipientName ?? null,
      paymentType: payment.type as CommercialPaymentTypeValue,
      checkoutUrl: payment.checkoutUrl,
    });

  const fromEmail = process.env.CONTACT_FROM_EMAIL;
  const replyTo =
    process.env.CONTACT_REPLY_TO_EMAIL ?? process.env.CONTACT_TO_EMAIL;

  if (!fromEmail) {
    return {
      ok: false,
      code: "MISSING_FROM_EMAIL",
      message: "Email sender is not configured.",
    };
  }

  try {
    const resend = getResendClient();
    // Exactly one send per operator action.
    const result = await resend.emails.send(
      {
        from: fromEmail,
        to: email,
        subject,
        text: body,
        ...(replyTo ? { replyTo } : {}),
      },
      {
        idempotencyKey: `commercial-payment-link:${payment.id}:${email}`,
      },
    );

    const providerMessageId =
      result.data && typeof result.data === "object" && "id" in result.data
        ? String((result.data as { id: string }).id)
        : null;

    await prisma.opportunityActivity.create({
      data: {
        opportunityId: payment.opportunityId,
        type: "PAYMENT_LINK_SENT",
        actorEmail: options.actorEmail,
        note: `${commercialPaymentTypeLabel(payment.type as CommercialPaymentTypeValue)} payment link sent.`,
        toValueJson: {
          commercialPaymentId: payment.id,
          paymentType: payment.type,
        } as Prisma.InputJsonValue,
      },
    });

    return { ok: true, providerMessageId };
  } catch (error) {
    console.error("[commercial-payments] payment link send failed", {
      paymentId: payment.id,
      error: error instanceof Error ? error.message : "unknown",
    });
    return {
      ok: false,
      code: "SEND_FAILED",
      message: "Could not send payment link email.",
    };
  }
}
