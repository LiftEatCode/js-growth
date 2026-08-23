import "server-only";

import { Prisma } from "@/generated/prisma/client";
import { getAppBaseUrl } from "@/lib/payments/stripe";
import { prisma } from "@/lib/prisma";

import {
  ACTIVE_CHECKOUT_STATUSES,
  COMMERCIAL_AGREEMENT_PAYMENT_PRODUCT_KEY,
  assertNotLiveStripeInAutomatedTest,
  commercialCheckoutIdempotencyKey,
  type CommercialPaymentTypeValue,
} from "./constants";
import {
  loadAcceptedAgreementPaymentAuthority,
  loadPaymentsForAgreement,
} from "./load";
import { derivePaymentRequirement } from "./requirements";
import { createCommercialStripeCheckoutSession } from "./stripe-adapter";

export type CreateCommercialCheckoutResult =
  | {
      ok: true;
      paymentId: string;
      checkoutUrl: string;
      sessionId: string;
      amountDueCents: number;
      type: CommercialPaymentTypeValue;
      reused: boolean;
    }
  | { ok: false; code: string; message: string };

async function nextPaymentSequence(options: {
  agreementId: string;
  type: CommercialPaymentTypeValue;
}): Promise<number> {
  const latest = await prisma.commercialPayment.findFirst({
    where: {
      agreementId: options.agreementId,
      type: options.type,
    },
    orderBy: { paymentSequence: "desc" },
    select: { paymentSequence: true },
  });
  return (latest?.paymentSequence ?? 0) + 1;
}

export async function createCommercialCheckout(options: {
  agreementId: string;
  paymentType: CommercialPaymentTypeValue;
  actorEmail: string;
  /** When true, expire/cancel prior active checkout for this type and create a new one. */
  regenerate?: boolean;
}): Promise<CreateCommercialCheckoutResult> {
  assertNotLiveStripeInAutomatedTest();

  const agreement = await loadAcceptedAgreementPaymentAuthority({
    agreementId: options.agreementId,
  });

  if (!agreement) {
    return {
      ok: false,
      code: "AGREEMENT_NOT_FOUND",
      message: "Agreement not found.",
    };
  }

  if (agreement.status !== "ACCEPTED") {
    return {
      ok: false,
      code: "AGREEMENT_NOT_ACCEPTED",
      message: "Only an accepted Agreement can create a payment checkout.",
    };
  }

  const payments = await loadPaymentsForAgreement({
    agreementId: agreement.agreementId,
  });

  const typeAlreadyPaid = payments.some(
    (p) => p.type === options.paymentType && p.status === "PAID",
  );
  const depositPaid = payments.some(
    (p) => p.type === "DEPOSIT" && p.status === "PAID",
  );

  const activeSameType = payments.find(
    (p) =>
      p.type === options.paymentType &&
      (ACTIVE_CHECKOUT_STATUSES as readonly string[]).includes(p.status),
  );

  if (activeSameType && !options.regenerate) {
    if (activeSameType.checkoutUrl && activeSameType.stripeCheckoutSessionId) {
      return {
        ok: true,
        paymentId: activeSameType.id,
        checkoutUrl: activeSameType.checkoutUrl,
        sessionId: activeSameType.stripeCheckoutSessionId,
        amountDueCents: activeSameType.amountDueCents,
        type: options.paymentType,
        reused: true,
      };
    }
  }

  if (activeSameType && options.regenerate) {
    await prisma.commercialPayment.updateMany({
      where: {
        id: activeSameType.id,
        status: { in: [...ACTIVE_CHECKOUT_STATUSES] },
      },
      data: {
        status: "CANCELED",
        canceledAt: new Date(),
      },
    });
  }

  const requirement = derivePaymentRequirement({
    agreement,
    requestedType: options.paymentType,
    depositPaid,
    typeAlreadyPaid,
    nextSequence: await nextPaymentSequence({
      agreementId: agreement.agreementId,
      type: options.paymentType,
    }),
  });

  if (!requirement.ok) {
    return {
      ok: false,
      code: requirement.code,
      message: requirement.message,
    };
  }

  const baseUrl = getAppBaseUrl();
  let paymentId: string;

  try {
    const created = await prisma.commercialPayment.create({
      data: {
        opportunityId: agreement.opportunityId,
        agreementId: agreement.agreementId,
        type: requirement.requirement.type,
        status: "PENDING",
        currency: requirement.requirement.currency,
        amountDueCents: requirement.requirement.amountDueCents,
        amountPaidCents: 0,
        paymentSequence: requirement.requirement.paymentSequence,
        paymentTermTypeSnapshot: requirement.requirement.paymentTermTypeSnapshot,
        createdByEmail: options.actorEmail,
      },
      select: { id: true },
    });
    paymentId = created.id;
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return {
        ok: false,
        code: "DUPLICATE_ACTIVE_PAYMENT",
        message:
          "An active checkout already exists for this payment requirement.",
      };
    }
    throw error;
  }

  await prisma.opportunityActivity.create({
    data: {
      opportunityId: agreement.opportunityId,
      type: "PAYMENT_REQUIREMENT_CREATED",
      actorEmail: options.actorEmail,
      note: `${requirement.requirement.type} payment requirement created.`,
      toValueJson: {
        commercialPaymentId: paymentId,
        paymentType: requirement.requirement.type,
        amountDueCents: requirement.requirement.amountDueCents,
      } as Prisma.InputJsonValue,
    },
  });

  try {
    const session = await createCommercialStripeCheckoutSession({
      amountDueCents: requirement.requirement.amountDueCents,
      currency: requirement.requirement.currency,
      lineItemDescription: requirement.requirement.lineItemDescription,
      successUrl: `${baseUrl}/payment/return?status=success&session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${baseUrl}/payment/return?status=cancelled`,
      clientReferenceId: paymentId,
      idempotencyKey: commercialCheckoutIdempotencyKey(paymentId),
      metadata: {
        product: COMMERCIAL_AGREEMENT_PAYMENT_PRODUCT_KEY,
        commercialPaymentId: paymentId,
        agreementId: agreement.agreementId,
        opportunityId: agreement.opportunityId,
        paymentType: requirement.requirement.type,
        amountDueCents: String(requirement.requirement.amountDueCents),
        currency: requirement.requirement.currency,
      },
    });

    const updated = await prisma.commercialPayment.updateMany({
      where: {
        id: paymentId,
        status: "PENDING",
      },
      data: {
        status: "CHECKOUT_CREATED",
        stripeCheckoutSessionId: session.id,
        checkoutUrl: session.url,
        checkoutCreatedAt: new Date(),
      },
    });

    if (updated.count !== 1) {
      return {
        ok: false,
        code: "PAYMENT_STATE_RACE",
        message: "Payment record changed during checkout creation.",
      };
    }

    await prisma.opportunityActivity.create({
      data: {
        opportunityId: agreement.opportunityId,
        type: "PAYMENT_CHECKOUT_CREATED",
        actorEmail: options.actorEmail,
        note: `${requirement.requirement.type} checkout created.`,
        toValueJson: {
          commercialPaymentId: paymentId,
          paymentType: requirement.requirement.type,
          amountDueCents: requirement.requirement.amountDueCents,
        } as Prisma.InputJsonValue,
      },
    });

    return {
      ok: true,
      paymentId,
      checkoutUrl: session.url,
      sessionId: session.id,
      amountDueCents: requirement.requirement.amountDueCents,
      type: requirement.requirement.type,
      reused: false,
    };
  } catch (error) {
    await prisma.commercialPayment.updateMany({
      where: { id: paymentId, status: { in: ["PENDING", "CHECKOUT_CREATED"] } },
      data: {
        status: "FAILED",
        failedAt: new Date(),
        failureCode: "CHECKOUT_CREATE_FAILED",
        failureMessage:
          error instanceof Error ? error.message.slice(0, 500) : "unknown",
      },
    });

    await prisma.opportunityActivity.create({
      data: {
        opportunityId: agreement.opportunityId,
        type: "PAYMENT_FAILED",
        actorEmail: options.actorEmail,
        note: "Checkout creation failed.",
        toValueJson: {
          commercialPaymentId: paymentId,
          paymentType: options.paymentType,
        } as Prisma.InputJsonValue,
      },
    });

    console.error("[commercial-payments] checkout create failed", {
      paymentId,
      error: error instanceof Error ? error.message : "unknown",
    });

    return {
      ok: false,
      code: "CHECKOUT_CREATE_FAILED",
      message: "Could not create Stripe Checkout Session.",
    };
  }
}
