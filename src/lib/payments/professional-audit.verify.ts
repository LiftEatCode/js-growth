import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import Stripe from "stripe";

import {
  buildProfessionalCheckoutSessionParams,
  canReuseOpenCheckoutSession,
  inspectProfessionalAuditSession,
  isReportId,
  resolvePurchasePaidAt,
  shouldFulfillStripeEvent,
} from "./checkout-session";
import {
  getProfessionalAuditPricePresentation,
  PROFESSIONAL_AUDIT_TAX_DISCLOSURE,
} from "./product";
import { verifyStripeWebhook } from "./webhook";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

const REPORT_ID = "11111111-1111-4111-8111-111111111111";
const OTHER_REPORT_ID = "22222222-2222-4222-8222-222222222222";

assert(isReportId(REPORT_ID), "valid report uuid");
assert(!isReportId("not-a-uuid"), "invalid report id");
assert(!isReportId("abc"), "short report id rejected");

const params = buildProfessionalCheckoutSessionParams({
  reportId: REPORT_ID,
  priceId: "price_test_professional_audit",
  baseUrl: "https://example.com/",
});

assert(params.mode === "payment", "checkout mode is payment");
assert(params.line_items.length === 1, "one line item");
assert(
  params.line_items[0]?.price === "price_test_professional_audit",
  "price is server-supplied",
);
assert(params.line_items[0]?.quantity === 1, "quantity is 1");
assert(params.client_reference_id === REPORT_ID, "client_reference_id is report id");
assert(params.metadata.reportId === REPORT_ID, "metadata includes reportId");
assert(
  params.success_url ===
    `https://example.com/report/${REPORT_ID}/purchase/success?session_id={CHECKOUT_SESSION_ID}`,
  "success url is server-controlled",
);
assert(
  params.cancel_url ===
    `https://example.com/report/${REPORT_ID}/purchase/cancelled`,
  "cancel url is server-controlled",
);
assert(
  !("automatic_tax" in params),
  "checkout params do not set Automatic Tax",
);

const paidSession = {
  id: "cs_test_123",
  mode: "payment" as const,
  payment_status: "paid",
  metadata: { reportId: REPORT_ID },
  client_reference_id: REPORT_ID,
};

assert(
  inspectProfessionalAuditSession(paidSession).ok === true,
  "paid session inspects as granted",
);
assert(
  inspectProfessionalAuditSession({
    ...paidSession,
    payment_status: "unpaid",
  }).ok === false,
  "unpaid session is not granted",
);
assert(
  inspectProfessionalAuditSession({
    ...paidSession,
    metadata: {},
    client_reference_id: null,
  }).ok === false,
  "missing report id is rejected",
);
assert(
  inspectProfessionalAuditSession(paidSession, OTHER_REPORT_ID).ok === false,
  "report mismatch is rejected",
);
assert(
  inspectProfessionalAuditSession({
    ...paidSession,
    mode: "subscription",
  }).ok === false,
  "subscription mode is rejected",
);

const firstInspect = inspectProfessionalAuditSession(paidSession);
const secondInspect = inspectProfessionalAuditSession(paidSession);
assert(firstInspect.ok && secondInspect.ok, "duplicate inspect remains valid");
assert(
  firstInspect.ok &&
    secondInspect.ok &&
    firstInspect.reportId === secondInspect.reportId,
  "duplicate inspect is idempotent",
);

assert(
  shouldFulfillStripeEvent("checkout.session.completed"),
  "completed event is fulfillable",
);
assert(
  shouldFulfillStripeEvent("checkout.session.async_payment_succeeded"),
  "async success is fulfillable",
);
assert(
  !shouldFulfillStripeEvent("customer.created"),
  "unsupported events are ignored",
);

assert(
  canReuseOpenCheckoutSession({
    status: "open",
    url: "https://checkout.stripe.com/c/pay/cs_test_123",
  }),
  "open checkout with a URL can be reused",
);
assert(
  !canReuseOpenCheckoutSession({ status: "open", url: null }),
  "open checkout without a URL is not reused",
);
assert(
  !canReuseOpenCheckoutSession({
    status: "expired",
    url: "https://checkout.stripe.com/c/pay/cs_test_expired",
  }),
  "expired checkout is not reused",
);
assert(
  !canReuseOpenCheckoutSession({
    status: "complete",
    url: "https://checkout.stripe.com/c/pay/cs_test_complete",
  }),
  "completed checkout is not reused",
);

const webhookSecret = "whsec_test_secret";
const payload = JSON.stringify({
  id: "evt_test",
  object: "event",
  type: "checkout.session.completed",
  data: { object: paidSession },
});

const missing = verifyStripeWebhook(payload, null, webhookSecret);
assert(missing.ok === false && missing.reason === "missing-signature", "missing signature");

const invalid = verifyStripeWebhook(payload, "invalid", webhookSecret);
assert(invalid.ok === false && invalid.reason === "invalid-signature", "invalid signature");

const signature = Stripe.webhooks.generateTestHeaderString({
  payload,
  secret: webhookSecret,
});
const valid = verifyStripeWebhook(payload, signature, webhookSecret);
assert(valid.ok === true, "valid signature verifies");
assert(valid.ok && valid.event.type === "checkout.session.completed", "event type preserved");

const firstPaidAt = new Date("2026-08-17T00:01:51.804Z");
const replayNow = new Date("2026-08-17T00:03:59.626Z");
assert(
  resolvePurchasePaidAt(null, firstPaidAt).getTime() === firstPaidAt.getTime(),
  "first PAID transition establishes paidAt",
);
assert(
  resolvePurchasePaidAt(undefined, firstPaidAt).getTime() === firstPaidAt.getTime(),
  "missing paidAt is treated as first transition",
);
assert(
  resolvePurchasePaidAt(firstPaidAt, replayNow).getTime() === firstPaidAt.getTime(),
  "replay keeps the original paidAt",
);

type MemoryPurchase = {
  stripeCheckoutSessionId: string;
  reportId: string;
  status: "PENDING" | "PAID";
  paidAt: Date | null;
  stripePaymentIntentId: string | null;
  amountTotal: number | null;
  currency: string | null;
};

function fulfillMemoryPurchase(
  rows: MemoryPurchase[],
  session: {
    id: string;
    reportId: string;
    payment_intent: string;
    amount_total: number;
    currency: string;
  },
  now: Date,
): MemoryPurchase[] {
  const existing = rows.find((row) => row.stripeCheckoutSessionId === session.id);
  const next: MemoryPurchase = {
    stripeCheckoutSessionId: session.id,
    reportId: session.reportId,
    status: "PAID",
    paidAt: resolvePurchasePaidAt(existing?.paidAt, now),
    stripePaymentIntentId: session.payment_intent,
    amountTotal: session.amount_total,
    currency: session.currency,
  };

  if (!existing) {
    return [...rows, next];
  }

  return rows.map((row) =>
    row.stripeCheckoutSessionId === session.id ? { ...row, ...next } : row,
  );
}

const pendingRow: MemoryPurchase = {
  stripeCheckoutSessionId: paidSession.id,
  reportId: REPORT_ID,
  status: "PENDING",
  paidAt: null,
  stripePaymentIntentId: null,
  amountTotal: null,
  currency: null,
};
const fulfillSession = {
  id: paidSession.id,
  reportId: REPORT_ID,
  payment_intent: "pi_test_123",
  amount_total: 9900,
  currency: "usd",
};

let purchases = fulfillMemoryPurchase([pendingRow], fulfillSession, firstPaidAt);
assert(purchases.length === 1, "first fulfill does not create a second row");
assert(purchases[0]?.status === "PAID", "first fulfill marks PAID");
assert(
  purchases[0]?.paidAt?.getTime() === firstPaidAt.getTime(),
  "first fulfill captures paidAt",
);
assert(
  purchases[0]?.stripePaymentIntentId === "pi_test_123",
  "first fulfill stores payment intent",
);
const capturedPaidAt = purchases[0]?.paidAt;
assert(capturedPaidAt, "paidAt is recorded");

purchases = fulfillMemoryPurchase(purchases, fulfillSession, replayNow);
assert(purchases.length === 1, "replay keeps exactly one purchase row");
assert(purchases[0]?.status === "PAID", "replay leaves status PAID");
assert(
  purchases[0]?.paidAt?.getTime() === capturedPaidAt.getTime(),
  "replay leaves paidAt exactly unchanged",
);
assert(
  purchases[0]?.stripePaymentIntentId === "pi_test_123",
  "replay keeps stripe payment identifiers",
);

assert(
  PROFESSIONAL_AUDIT_TAX_DISCLOSURE ===
    "Applicable taxes may be added at checkout.",
  "tax disclosure copy is centralized",
);
assert(
  !/\$105(?:\.53)?/.test(PROFESSIONAL_AUDIT_TAX_DISCLOSURE),
  "tax disclosure does not hardcode a TEST tax amount",
);
assert(
  !/\d+%/.test(PROFESSIONAL_AUDIT_TAX_DISCLOSURE),
  "tax disclosure does not hardcode a tax rate",
);
assert(
  getProfessionalAuditPricePresentation().endsWith(" one-time"),
  "display price remains the one-time base price",
);

const here = dirname(fileURLToPath(import.meta.url));
const ctaSource = readFileSync(
  join(here, "../../components/website-audit/report-ctas.tsx"),
  "utf8",
);
const auditPageSource = readFileSync(
  join(here, "../../app/website-audit/page.tsx"),
  "utf8",
);
assert(
  ctaSource.includes("PROFESSIONAL_AUDIT_TAX_DISCLOSURE"),
  "upgrade CTA shows tax disclosure",
);
assert(
  ctaSource.includes("not a subscription"),
  "upgrade CTA keeps not-a-subscription copy",
);
assert(
  auditPageSource.includes("PROFESSIONAL_AUDIT_TAX_DISCLOSURE"),
  "audit landing price mentions tax disclosure",
);
assert(!ctaSource.includes("$105.53"), "CTA does not mention TEST tax total");
assert(!auditPageSource.includes("$105.53"), "audit page does not mention TEST tax total");

console.log("professional audit payment verification passed");
process.exit(0);
