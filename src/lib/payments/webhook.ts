import Stripe from "stripe";

export type StripeWebhookVerification =
  | { ok: true; event: Stripe.Event }
  | { ok: false; status: 400; reason: "missing-signature" | "invalid-signature" };

export function verifyStripeWebhook(
  rawBody: string,
  signature: string | null,
  secret: string,
): StripeWebhookVerification {
  if (!signature) {
    return { ok: false, status: 400, reason: "missing-signature" };
  }

  try {
    const event = Stripe.webhooks.constructEvent(rawBody, signature, secret);

    return { ok: true, event };
  } catch {
    return { ok: false, status: 400, reason: "invalid-signature" };
  }
}
