import { NextResponse } from "next/server";

import {
  fulfillProfessionalAuditCheckout,
  logPaymentEvent,
} from "@/lib/payments/professional-audit";
import {
  shouldFulfillStripeEvent,
  type InspectableCheckoutSession,
} from "@/lib/payments/checkout-session";
import { getStripeWebhookSecret } from "@/lib/payments/stripe";
import { verifyStripeWebhook } from "@/lib/payments/webhook";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

  if (!shouldFulfillStripeEvent(event.type)) {
    return NextResponse.json({ received: true }, { status: 200 });
  }

  const session = event.data.object;

  if (!session || typeof session !== "object" || !("id" in session)) {
    return NextResponse.json({ received: true }, { status: 200 });
  }

  try {
    const result = await fulfillProfessionalAuditCheckout(
      session as InspectableCheckoutSession,
    );

    logPaymentEvent("webhook processed", {
      eventType: event.type,
      eventId: event.id,
      sessionId: "id" in session ? String(session.id) : undefined,
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
