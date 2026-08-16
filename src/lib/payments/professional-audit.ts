import "server-only";

import { Prisma, PurchaseStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import {
  buildProfessionalCheckoutSessionParams,
  getStripeObjectId,
  inspectProfessionalAuditSession,
  isReportId,
  type InspectableCheckoutSession,
} from "@/lib/payments/checkout-session";
import {
  getAppBaseUrl,
  getProfessionalAuditPriceId,
  getStripe,
  isStripeConfigured,
} from "@/lib/payments/stripe";

export function logPaymentEvent(
  message: string,
  context: Record<string, string | null | undefined>,
): void {
  const safe = Object.fromEntries(
    Object.entries(context).filter(
      ([key, value]) =>
        Boolean(value) &&
        !key.toLowerCase().includes("secret") &&
        !key.toLowerCase().includes("key"),
    ),
  );

  console.info(`[payments] ${message}`, safe);
}

export async function reportHasProfessionalEntitlement(
  reportId: string,
): Promise<boolean> {
  const paid = await prisma.reportPurchase.findFirst({
    where: {
      reportId,
      status: PurchaseStatus.PAID,
    },
    select: { id: true },
  });

  return Boolean(paid);
}

export async function getLatestReportPurchase(reportId: string) {
  return prisma.reportPurchase.findFirst({
    where: { reportId },
    orderBy: [{ paidAt: "desc" }, { createdAt: "desc" }],
  });
}

function customerReportUrl(reportId: string): string {
  return `${getAppBaseUrl()}/report/${reportId}`;
}

export type CreateCheckoutResult =
  | { status: "already-unlocked"; url: string }
  | { status: "checkout"; url: string; sessionId: string }
  | { status: "not-found" }
  | { status: "invalid-id" }
  | { status: "unavailable"; message: string };

export async function createProfessionalAuditCheckout(
  reportId: string,
): Promise<CreateCheckoutResult> {
  if (!isReportId(reportId)) {
    return { status: "invalid-id" };
  }

  const report = await prisma.auditReport.findUnique({
    where: { id: reportId },
    select: { id: true, reportMode: true },
  });

  if (!report) {
    return { status: "not-found" };
  }

  if (
    report.reportMode !== "public" ||
    (await reportHasProfessionalEntitlement(reportId))
  ) {
    return {
      status: "already-unlocked",
      url: customerReportUrl(reportId),
    };
  }

  if (!isStripeConfigured()) {
    return {
      status: "unavailable",
      message: "Checkout is temporarily unavailable.",
    };
  }

  try {
    const stripe = getStripe();
    const params = buildProfessionalCheckoutSessionParams({
      reportId,
      priceId: getProfessionalAuditPriceId(),
      baseUrl: getAppBaseUrl(),
    });
    const session = await stripe.checkout.sessions.create({
      ...params,
      allow_promotion_codes: false,
    });

    if (!session.url) {
      return {
        status: "unavailable",
        message: "Checkout is temporarily unavailable.",
      };
    }

    try {
      await prisma.reportPurchase.create({
        data: {
          reportId,
          stripeCheckoutSessionId: session.id,
          status: PurchaseStatus.PENDING,
        },
      });
    } catch (error) {
      if (
        !(error instanceof Prisma.PrismaClientKnownRequestError) ||
        error.code !== "P2002"
      ) {
        throw error;
      }
    }

    logPaymentEvent("checkout session created", {
      reportId,
      sessionId: session.id,
    });

    return {
      status: "checkout",
      url: session.url,
      sessionId: session.id,
    };
  } catch (error) {
    console.error("[payments] checkout session create failed", {
      reportId,
      error: error instanceof Error ? error.message : "unknown",
    });

    return {
      status: "unavailable",
      message: "Checkout is temporarily unavailable.",
    };
  }
}

export async function fulfillProfessionalAuditCheckout(
  session: InspectableCheckoutSession,
  expectedReportId?: string,
): Promise<{ granted: boolean; reportId?: string; reason?: string }> {
  const inspection = inspectProfessionalAuditSession(
    session,
    expectedReportId,
  );

  if (!inspection.ok) {
    return { granted: false, reason: inspection.reason };
  }

  const report = await prisma.auditReport.findUnique({
    where: { id: inspection.reportId },
    select: { id: true },
  });

  if (!report) {
    return {
      granted: false,
      reportId: inspection.reportId,
      reason: "report-not-found",
    };
  }

  const intentId = getStripeObjectId(session.payment_intent);
  const stripeCustomerId = getStripeObjectId(session.customer);
  const customerEmail =
    session.customer_details?.email ?? session.customer_email ?? null;

  await prisma.reportPurchase.upsert({
    where: {
      stripeCheckoutSessionId: session.id,
    },
    create: {
      reportId: inspection.reportId,
      stripeCheckoutSessionId: session.id,
      stripePaymentIntentId: intentId,
      stripeCustomerId,
      customerEmail,
      amountTotal: session.amount_total ?? null,
      currency: session.currency ?? null,
      status: PurchaseStatus.PAID,
      paidAt: new Date(),
    },
    update: {
      reportId: inspection.reportId,
      stripePaymentIntentId: intentId,
      stripeCustomerId,
      customerEmail,
      amountTotal: session.amount_total ?? null,
      currency: session.currency ?? null,
      status: PurchaseStatus.PAID,
      paidAt: new Date(),
    },
  });

  logPaymentEvent("professional entitlement granted", {
    reportId: inspection.reportId,
    sessionId: session.id,
    paymentIntentId: intentId,
  });

  return { granted: true, reportId: inspection.reportId };
}

export async function retrieveAndFulfillCheckoutSession(
  sessionId: string,
  expectedReportId?: string,
): Promise<{ granted: boolean; reportId?: string; reason?: string }> {
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.retrieve(sessionId);

  return fulfillProfessionalAuditCheckout(
    {
      id: session.id,
      mode: session.mode,
      payment_status: session.payment_status,
      metadata: session.metadata,
      client_reference_id: session.client_reference_id,
      payment_intent: session.payment_intent,
      customer: session.customer,
      customer_details: session.customer_details,
      customer_email: session.customer_email,
      amount_total: session.amount_total,
      currency: session.currency,
    },
    expectedReportId,
  );
}

export { inspectProfessionalAuditSession, isReportId };
export type { InspectableCheckoutSession };
