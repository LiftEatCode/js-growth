import {
  buildProfessionalCheckoutSessionParams,
  inspectProfessionalAuditSession,
  isReportId,
  shouldFulfillStripeEvent,
} from "./checkout-session";
import { verifyStripeWebhook } from "./webhook";
import Stripe from "stripe";

function assert(condition: unknown, message: string): void {
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

console.log("professional audit payment verification passed");
process.exit(0);
