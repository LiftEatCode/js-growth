import { NextResponse } from "next/server";

import {
  fulfillCommercialPaymentCheckout,
  handleCommercialCheckoutExpired,
  handleCommercialPaymentRefunded,
  isCommercialAgreementPaymentSession,
} from "@/lib/commercialization/payments";
import {
  fulfillProfessionalAuditCheckout,
  logPaymentEvent,
} from "@/lib/payments/professional-audit";
import {
  getStripeObjectId,
  shouldFulfillStripeEvent,
  type InspectableCheckoutSession,
} from "@/lib/payments/checkout-session";
import { getStripeWebhookSecret } from "@/lib/payments/stripe";
import { verifyStripeWebhook } from "@/lib/payments/webhook";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COMMERCIAL_EXTRA_EVENTS = new Set([
  "checkout.session.expired",
  "charge.refunded",
  "refund.created",
]);

function shouldProcessEvent(type: string): boolean {
  return shouldFulfillStripeEvent(type) || COMMERCIAL_EXTRA_EVENTS.has(type);
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("stripe-signature");

  let secret: string;

  try {
    secret = getStripeWebhookSecret();
  } catch (error) {
    console.error("[payments] webhook secret is not configured", {
      error: error instanceof Error ? error.message : "unknown",
    });

    return NextResponse.json(
      { error: "Webhook is not configured." },
      { status: 500 },
    );
  }

  const verification = verifyStripeWebhook(rawBody, signature, secret);

  if (!verification.ok) {
    logPaymentEvent("webhook verification failed", {
      reason: verification.reason,
    });

    return NextResponse.json(
      { error: "Invalid webhook signature." },
      { status: verification.status },
    );
  }

  const event = verification.event;

  if (!shouldProcessEvent(event.type)) {
    return NextResponse.json({ received: true }, { status: 200 });
  }

  try {
    if (event.type === "charge.refunded" || event.type === "refund.created") {
      const obj = event.data.object as {
        payment_intent?: string | { id?: string | null } | null;
        id?: string;
      };
      const paymentIntentId = getStripeObjectId(obj.payment_intent);
      const result = await handleCommercialPaymentRefunded({
        paymentIntentId,
        checkoutSessionId: null,
      });
      logPaymentEvent("commercial refund webhook processed", {
        eventType: event.type,
        eventId: event.id,
        handled: result.handled ? "true" : "false",
        reason: result.reason,
        paymentId: result.paymentId,
      });
      return NextResponse.json({ received: true }, { status: 200 });
    }

    const session = event.data.object;

    if (!session || typeof session !== "object" || !("id" in session)) {
      return NextResponse.json({ received: true }, { status: 200 });
    }

    const inspectable = session as InspectableCheckoutSession;

    if (isCommercialAgreementPaymentSession(inspectable)) {
      if (event.type === "checkout.session.expired") {
        const result = await handleCommercialCheckoutExpired(inspectable);
        logPaymentEvent("commercial checkout expired", {
          eventType: event.type,
          eventId: event.id,
          sessionId: inspectable.id,
          reason: result.reason,
          paymentId: result.paymentId,
        });
        return NextResponse.json({ received: true }, { status: 200 });
      }

      const result = await fulfillCommercialPaymentCheckout(inspectable);
      logPaymentEvent("commercial payment webhook processed", {
        eventType: event.type,
        eventId: event.id,
        sessionId: inspectable.id,
        paid: result.paid ? "true" : "false",
        reason: result.reason,
        paymentId: result.paymentId,
      });
      return NextResponse.json({ received: true }, { status: 200 });
    }

    if (event.type === "checkout.session.expired") {
      return NextResponse.json({ received: true }, { status: 200 });
    }

    if (!shouldFulfillStripeEvent(event.type)) {
      return NextResponse.json({ received: true }, { status: 200 });
    }

    const result = await fulfillProfessionalAuditCheckout(inspectable);

    logPaymentEvent("webhook processed", {
      eventType: event.type,
      eventId: event.id,
      sessionId: inspectable.id,
      granted: result.granted ? "true" : "false",
      reason: result.reason,
      reportId: result.reportId,
    });

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error("[payments] webhook fulfillment failed", {
      eventType: event.type,
      eventId: event.id,
      error: error instanceof Error ? error.message : "unknown",
    });

    return NextResponse.json(
      { error: "Webhook processing failed." },
      { status: 500 },
    );
  }
}
