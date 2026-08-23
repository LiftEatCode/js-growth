import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import {
  getStripeObjectId,
  type InspectableCheckoutSession,
} from "@/lib/payments/checkout-session";
import { prisma } from "@/lib/prisma";

import type { CommercialPaymentTypeValue } from "./constants";
import {
  isCommercialAgreementPaymentSession,
  readCommercialPaymentMetadata,
  reconcileCommercialCheckoutAmount,
} from "./reconcile";

export type FulfillCommercialPaymentResult = {
  handled: boolean;
  paid: boolean;
  paymentId?: string;
  reason?: string;
};

async function recordReconciliationFailure(options: {
  paymentId: string;
  opportunityId: string;
  code: string;
  message: string;
}): Promise<void> {
  await prisma.commercialPayment.update({
    where: { id: options.paymentId },
    data: {
      reconciliationCode: options.code,
      reconciliationMessage: options.message.slice(0, 500),
    },
  });

  await prisma.opportunityActivity.create({
    data: {
      opportunityId: options.opportunityId,
      type: "PAYMENT_RECONCILIATION_FAILED",
      actorEmail: "stripe-webhook",
      note: options.message.slice(0, 280),
      toValueJson: {
        commercialPaymentId: options.paymentId,
        reconciliationCode: options.code,
      } as Prisma.InputJsonValue,
    },
  });
}

export async function fulfillCommercialPaymentCheckout(
  session: InspectableCheckoutSession,
): Promise<FulfillCommercialPaymentResult> {
  if (!isCommercialAgreementPaymentSession(session)) {
    return { handled: false, paid: false, reason: "not-commercial" };
  }

  if (session.mode && session.mode !== "payment") {
    return { handled: true, paid: false, reason: "invalid-mode" };
  }

  if (session.payment_status !== "paid") {
    return { handled: true, paid: false, reason: "unpaid" };
  }

  const meta = readCommercialPaymentMetadata(session);
  const paymentIntentId = getStripeObjectId(session.payment_intent);

  const payment =
    (meta.commercialPaymentId
      ? await prisma.commercialPayment.findUnique({
          where: { id: meta.commercialPaymentId },
        })
      : null) ??
    (session.id
      ? await prisma.commercialPayment.findUnique({
          where: { stripeCheckoutSessionId: session.id },
        })
      : null);

  if (!payment) {
    return { handled: true, paid: false, reason: "payment-not-found" };
  }

  if (payment.status === "PAID") {
    return {
      handled: true,
      paid: true,
      paymentId: payment.id,
      reason: "already-paid",
    };
  }

  if (meta.agreementId && meta.agreementId !== payment.agreementId) {
    await recordReconciliationFailure({
      paymentId: payment.id,
      opportunityId: payment.opportunityId,
      code: "AGREEMENT_MISMATCH",
      message: "Webhook agreement metadata does not match payment record.",
    });
    return { handled: true, paid: false, reason: "agreement-mismatch" };
  }

  const reconcile = reconcileCommercialCheckoutAmount({
    session,
    expectedAmountCents: payment.amountDueCents,
    expectedCurrency: payment.currency,
  });

  if (!reconcile.ok) {
    await recordReconciliationFailure({
      paymentId: payment.id,
      opportunityId: payment.opportunityId,
      code: reconcile.code,
      message: reconcile.message,
    });
    return { handled: true, paid: false, reason: reconcile.code.toLowerCase() };
  }

  const now = new Date();

  const marked = await prisma.$transaction(async (tx) => {
    const updated = await tx.commercialPayment.updateMany({
      where: {
        id: payment.id,
        status: { not: "PAID" },
      },
      data: {
        status: "PAID",
        amountPaidCents: reconcile.amountPaidCents,
        paidAt: now,
        stripeCheckoutSessionId: session.id,
        stripePaymentIntentId: paymentIntentId,
        reconciliationCode: null,
        reconciliationMessage: null,
      },
    });

    if (updated.count !== 1) {
      return { applied: false as const };
    }

    const paymentType = payment.type as CommercialPaymentTypeValue;

    await tx.opportunityActivity.create({
      data: {
        opportunityId: payment.opportunityId,
        type: "PAYMENT_COMPLETED",
        actorEmail: "stripe-webhook",
        note: `${paymentType} payment completed.`,
        toValueJson: {
          commercialPaymentId: payment.id,
          paymentType,
          amountPaidCents: reconcile.amountPaidCents,
        } as Prisma.InputJsonValue,
      },
    });

    if (paymentType === "DEPOSIT") {
      await tx.opportunityActivity.create({
        data: {
          opportunityId: payment.opportunityId,
          type: "DEPOSIT_PAID",
          actorEmail: "stripe-webhook",
          note: "Deposit paid.",
          toValueJson: {
            commercialPaymentId: payment.id,
            amountPaidCents: reconcile.amountPaidCents,
          } as Prisma.InputJsonValue,
        },
      });
    } else if (paymentType === "BALANCE") {
      await tx.opportunityActivity.create({
        data: {
          opportunityId: payment.opportunityId,
          type: "BALANCE_PAID",
          actorEmail: "stripe-webhook",
          note: "Balance paid.",
          toValueJson: {
            commercialPaymentId: payment.id,
            amountPaidCents: reconcile.amountPaidCents,
          } as Prisma.InputJsonValue,
        },
      });
    }

    // Explicitly do NOT mark Opportunity WON.
    return { applied: true as const };
  });

  if (!marked.applied) {
    return {
      handled: true,
      paid: true,
      paymentId: payment.id,
      reason: "already-paid-race",
    };
  }

  return {
    handled: true,
    paid: true,
    paymentId: payment.id,
    reason: "paid",
  };
}

export async function handleCommercialCheckoutExpired(
  session: InspectableCheckoutSession,
): Promise<FulfillCommercialPaymentResult> {
  if (!isCommercialAgreementPaymentSession(session)) {
    return { handled: false, paid: false, reason: "not-commercial" };
  }

  const meta = readCommercialPaymentMetadata(session);
  const payment =
    (meta.commercialPaymentId
      ? await prisma.commercialPayment.findUnique({
          where: { id: meta.commercialPaymentId },
        })
      : null) ??
    (await prisma.commercialPayment.findUnique({
      where: { stripeCheckoutSessionId: session.id },
    }));

  if (!payment) {
    return { handled: true, paid: false, reason: "payment-not-found" };
  }

  if (payment.status === "PAID") {
    return { handled: true, paid: true, paymentId: payment.id, reason: "already-paid" };
  }

  const updated = await prisma.commercialPayment.updateMany({
    where: {
      id: payment.id,
      status: { in: ["PENDING", "CHECKOUT_CREATED"] },
    },
    data: {
      status: "EXPIRED",
      expiredAt: new Date(),
    },
  });

  if (updated.count === 1) {
    await prisma.opportunityActivity.create({
      data: {
        opportunityId: payment.opportunityId,
        type: "PAYMENT_EXPIRED",
        actorEmail: "stripe-webhook",
        note: "Checkout session expired.",
        toValueJson: {
          commercialPaymentId: payment.id,
          paymentType: payment.type,
        } as Prisma.InputJsonValue,
      },
    });
  }

  return {
    handled: true,
    paid: false,
    paymentId: payment.id,
    reason: "expired",
  };
}

export async function handleCommercialPaymentRefunded(options: {
  paymentIntentId: string | null;
  checkoutSessionId: string | null;
}): Promise<FulfillCommercialPaymentResult> {
  const payment =
    (options.checkoutSessionId
      ? await prisma.commercialPayment.findUnique({
          where: { stripeCheckoutSessionId: options.checkoutSessionId },
        })
      : null) ??
    (options.paymentIntentId
      ? await prisma.commercialPayment.findUnique({
          where: { stripePaymentIntentId: options.paymentIntentId },
        })
      : null);

  if (!payment) {
    return { handled: false, paid: false, reason: "payment-not-found" };
  }

  if (payment.status === "REFUNDED") {
    return {
      handled: true,
      paid: false,
      paymentId: payment.id,
      reason: "already-refunded",
    };
  }

  await prisma.commercialPayment.update({
    where: { id: payment.id },
    data: {
      status: "REFUNDED",
      refundedAt: new Date(),
      reconciliationCode: "PAYMENT_REVIEW_REQUIRED",
      reconciliationMessage:
        "Provider reported a refund. Manual review required. Agreement unchanged.",
    },
  });

  await prisma.opportunityActivity.create({
    data: {
      opportunityId: payment.opportunityId,
      type: "PAYMENT_RECONCILIATION_FAILED",
      actorEmail: "stripe-webhook",
      note: "Refund received — payment review required.",
      toValueJson: {
        commercialPaymentId: payment.id,
        reconciliationCode: "PAYMENT_REVIEW_REQUIRED",
      } as Prisma.InputJsonValue,
    },
  });

  return {
    handled: true,
    paid: false,
    paymentId: payment.id,
    reason: "refunded-review-required",
  };
}
