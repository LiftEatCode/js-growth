import assert from "node:assert/strict";

import {
  CONVERSION_EVENT_NAMES,
  CONVERSION_EVENTS,
  isConversionEventName,
  sanitizeConversionEventParams,
} from "./conversions";

assert.deepEqual(CONVERSION_EVENT_NAMES, [
  "contact_clicked",
  "phone_clicked",
  "email_clicked",
  "quote_started",
  "quote_submitted",
  "audit_started",
  "audit_completed",
]);

for (const eventName of CONVERSION_EVENT_NAMES) {
  assert.equal(isConversionEventName(eventName), true);
}

assert.equal(isConversionEventName("contact_form_started"), false);

assert.deepEqual(
  sanitizeConversionEventParams({
    placement: "contact_page",
    form_name: "contact",
    surface: "contact_form",
    report_context: "inline_landing",
    source_channel: "organic_search",
  }),
  {
    placement: "contact_page",
    form_name: "contact",
    surface: "contact_form",
    report_context: "inline_landing",
    source_channel: "organic_search",
  },
);

assert.deepEqual(
  sanitizeConversionEventParams({
    placement: "contact_page",
    email: "person@example.com",
    phone: "9365551212",
    url: "https://example.com/private",
    report_id: "123e4567-e89b-42d3-a456-426614174000",
    payment_intent: "pi_live_secret",
    arbitrary_field: "drop-me",
  }),
  { placement: "contact_page" },
);

assert.equal(
  sanitizeConversionEventParams({
    email: "person@example.com",
    phone: "9365551212",
  }),
  undefined,
);

assert.equal(CONVERSION_EVENTS.auditStarted, "audit_started");
assert.equal(CONVERSION_EVENTS.auditCompleted, "audit_completed");

console.log("conversions.verify PASS");
