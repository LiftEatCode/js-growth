import { NextResponse } from "next/server";

import {
  getResendWebhookSecret,
  verifyResendWebhook,
} from "@/lib/email/resend-webhook";
import { processResendEmailDeliveryWebhook } from "@/lib/prospecting/outreach/delivery/process-webhook";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const svixId = request.headers.get("svix-id");
  const svixTimestamp = request.headers.get("svix-timestamp");
  const svixSignature = request.headers.get("svix-signature");

  let secret: string;

  try {
    secret = getResendWebhookSecret();
  } catch (error) {
    console.error("[resend-webhook] secret is not configured", {
      error: error instanceof Error ? error.message : "unknown",
    });

    return NextResponse.json(
      { error: "Webhook is not configured." },
      { status: 500 },
    );
  }

  const verification = verifyResendWebhook({
    payload: rawBody,
    svixId,
    svixTimestamp,
    svixSignature,
    webhookSecret: secret,
  });

  if (!verification.ok) {
    console.warn("[resend-webhook] signature rejected", {
      reason: verification.reason,
    });

    return NextResponse.json(
      { error: "Invalid webhook signature." },
      { status: verification.status },
    );
  }

  console.info("[resend-webhook] verified event received", {
    type: verification.event.type,
    providerEventId: svixId,
  });

  try {
    const result = await processResendEmailDeliveryWebhook({
      event: verification.event,
      providerEventId: svixId,
    });

    return NextResponse.json(
      {
        received: true,
        outcome: result.outcome,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[resend-webhook] processing failed", {
      type: verification.event.type,
      providerEventId: svixId,
      error: error instanceof Error ? error.message : "unknown",
    });

    return NextResponse.json(
      { error: "Webhook processing failed." },
      { status: 500 },
    );
  }
}
