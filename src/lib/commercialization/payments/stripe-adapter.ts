import "server-only";

import {
  isCommercialStripeMockEnabled,
  commercialCheckoutIdempotencyKey,
} from "./constants";

export interface MockStripeCheckoutSession {
  id: string;
  url: string;
  status: "open" | "complete" | "expired";
  payment_status: "unpaid" | "paid" | "no_payment_required";
  mode: "payment";
  amount_total: number;
  currency: string;
  metadata: Record<string, string>;
  payment_intent: string | null;
  idempotencyKey: string | null;
}

const mockSessions = new Map<string, MockStripeCheckoutSession>();
let lastMockCheckoutCreate: {
  amountDueCents: number;
  currency: string;
  idempotencyKey: string;
  metadata: Record<string, string>;
} | null = null;

export function clearMockCommercialStripeSessions(): void {
  mockSessions.clear();
  lastMockCheckoutCreate = null;
}

export function getLastMockCommercialCheckoutCreate() {
  return lastMockCheckoutCreate;
}

export function getMockCommercialStripeSession(
  sessionId: string,
): MockStripeCheckoutSession | undefined {
  return mockSessions.get(sessionId);
}

export function listMockCommercialStripeSessions(): MockStripeCheckoutSession[] {
  return [...mockSessions.values()];
}

export async function createCommercialStripeCheckoutSession(options: {
  amountDueCents: number;
  currency: string;
  lineItemDescription: string;
  successUrl: string;
  cancelUrl: string;
  metadata: Record<string, string>;
  idempotencyKey: string;
  clientReferenceId: string;
}): Promise<{ id: string; url: string }> {
  if (isCommercialStripeMockEnabled()) {
    lastMockCheckoutCreate = {
      amountDueCents: options.amountDueCents,
      currency: options.currency,
      idempotencyKey: options.idempotencyKey,
      metadata: options.metadata,
    };
    const id = `cs_test_mock_${options.metadata.commercialPaymentId ?? "payment"}`;
    const existing = mockSessions.get(id);
    if (existing) {
      return { id: existing.id, url: existing.url };
    }
    const session: MockStripeCheckoutSession = {
      id,
      url: `https://checkout.stripe.com/c/pay/${id}#mock`,
      status: "open",
      payment_status: "unpaid",
      mode: "payment",
      amount_total: options.amountDueCents,
      currency: options.currency.toLowerCase(),
      metadata: options.metadata,
      payment_intent: null,
      idempotencyKey: options.idempotencyKey,
    };
    mockSessions.set(id, session);
    return { id: session.id, url: session.url };
  }

  const { getStripe } = await import("@/lib/payments/stripe");
  const stripe = getStripe();

  const session = await stripe.checkout.sessions.create(
    {
      mode: "payment",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: options.currency.toLowerCase(),
            unit_amount: options.amountDueCents,
            product_data: {
              name: options.lineItemDescription,
            },
          },
        },
      ],
      success_url: options.successUrl,
      cancel_url: options.cancelUrl,
      client_reference_id: options.clientReferenceId,
      metadata: options.metadata,
      allow_promotion_codes: false,
      // Do not enable automatic_tax — Agreement total is authority for V1.
    },
    {
      idempotencyKey: options.idempotencyKey || commercialCheckoutIdempotencyKey(
        options.metadata.commercialPaymentId ?? "unknown",
      ),
    },
  );

  if (!session.url) {
    throw new Error("Stripe Checkout Session did not return a URL.");
  }

  return { id: session.id, url: session.url };
}

/** Test harness: mark mock session paid and return inspectable payload. */
export function completeMockCommercialCheckoutSession(sessionId: string): {
  id: string;
  mode: "payment";
  payment_status: "paid";
  amount_total: number;
  currency: string;
  metadata: Record<string, string>;
  payment_intent: string;
} {
  const session = mockSessions.get(sessionId);
  if (!session) {
    throw new Error(`Unknown mock checkout session: ${sessionId}`);
  }
  session.status = "complete";
  session.payment_status = "paid";
  session.payment_intent = `pi_test_mock_${session.metadata.commercialPaymentId ?? "payment"}`;
  mockSessions.set(sessionId, session);
  return {
    id: session.id,
    mode: "payment",
    payment_status: "paid",
    amount_total: session.amount_total,
    currency: session.currency,
    metadata: session.metadata,
    payment_intent: session.payment_intent,
  };
}

export function expireMockCommercialCheckoutSession(sessionId: string): {
  id: string;
  mode: "payment";
  payment_status: "unpaid";
  status: "expired";
  amount_total: number;
  currency: string;
  metadata: Record<string, string>;
} {
  const session = mockSessions.get(sessionId);
  if (!session) {
    throw new Error(`Unknown mock checkout session: ${sessionId}`);
  }
  session.status = "expired";
  mockSessions.set(sessionId, session);
  return {
    id: session.id,
    mode: "payment",
    payment_status: "unpaid",
    status: "expired",
    amount_total: session.amount_total,
    currency: session.currency,
    metadata: session.metadata,
  };
}
