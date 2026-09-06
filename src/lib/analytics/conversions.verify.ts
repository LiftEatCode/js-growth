import assert from "node:assert/strict";
import Clarity from "@microsoft/clarity";

import {
  CONVERSION_EVENT_NAMES,
  CONVERSION_EVENTS,
  isConversionEventName,
  sanitizeConversionEventParams,
  trackConversionEvent,
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

const rejectedMetadataCases: Array<
  Record<string, string | number | boolean>
> = [
  { placement: "person@example.com" },
  { form_name: "9365551212" },
  { surface: "John Smith" },
  { report_context: "https://example.com/private" },
  { source_channel: "not_a_real_channel" },
  { placement: 123 },
];

for (const params of rejectedMetadataCases) {
  assert.equal(
    sanitizeConversionEventParams(params),
    undefined,
    `Expected controlled metadata to reject ${JSON.stringify(params)}`,
  );
}

assert.deepEqual(
  sanitizeConversionEventParams({
    placement: "header",
    form_name: "website_audit",
    surface: "audit_form",
    report_context: "saved_report",
    source_channel: "referral",
    arbitrary_field: "drop-me",
  }),
  {
    placement: "header",
    form_name: "website_audit",
    surface: "audit_form",
    report_context: "saved_report",
    source_channel: "referral",
  },
);

assert.equal(CONVERSION_EVENTS.auditStarted, "audit_started");
assert.equal(CONVERSION_EVENTS.auditCompleted, "audit_completed");

function createSessionStorage(): Storage {
  const values = new Map<string, string>();

  return {
    get length() {
      return values.size;
    },
    clear() {
      values.clear();
    },
    getItem(key: string) {
      return values.get(key) ?? null;
    },
    key(index: number) {
      return Array.from(values.keys())[index] ?? null;
    },
    removeItem(key: string) {
      values.delete(key);
    },
    setItem(key: string, value: string) {
      values.set(key, value);
    },
  };
}

const originalWindowDescriptor = Object.getOwnPropertyDescriptor(globalThis, "window");
const originalClarityEventDescriptor = Object.getOwnPropertyDescriptor(
  Clarity,
  "event",
);

const sessionStorage = createSessionStorage();
let ga4Calls: string[] = [];
let clarityCalls: string[] = [];
let ga4ShouldThrow = false;
let clarityShouldThrow = false;

const testWindow = {
  sessionStorage,
  gtag: (
    command: "event",
    eventName: string,
    _eventParams?: Record<string, string | number | boolean>,
  ) => {
    assert.equal(command, "event");
    if (ga4ShouldThrow) {
      throw new Error("GA4 dispatch failed");
    }
    ga4Calls.push(eventName);
  },
} as unknown as Window & typeof globalThis;

Object.defineProperty(globalThis, "window", {
  configurable: true,
  writable: true,
  value: testWindow,
});

Object.defineProperty(Clarity, "event", {
  configurable: true,
  writable: true,
  value: (eventName: string) => {
    if (clarityShouldThrow) {
      throw new Error("Clarity dispatch failed");
    }
    clarityCalls.push(eventName);
  },
});

try {
  sessionStorage.clear();
  ga4Calls = [];
  clarityCalls = [];

  assert.equal(
    trackConversionEvent(CONVERSION_EVENTS.auditStarted, undefined, {
      ga4: true,
      clarity: false,
      oncePerSession: true,
    }),
    true,
  );
  assert.deepEqual(ga4Calls, ["audit_started"]);
  assert.deepEqual(clarityCalls, []);

  assert.equal(
    trackConversionEvent(CONVERSION_EVENTS.auditStarted, undefined, {
      ga4: false,
      clarity: true,
      oncePerSession: true,
    }),
    true,
  );
  assert.deepEqual(ga4Calls, ["audit_started"]);
  assert.deepEqual(clarityCalls, ["audit_started"]);

  assert.equal(
    trackConversionEvent(CONVERSION_EVENTS.auditStarted, undefined, {
      ga4: true,
      clarity: false,
      oncePerSession: true,
    }),
    false,
  );
  assert.equal(
    trackConversionEvent(CONVERSION_EVENTS.auditStarted, undefined, {
      ga4: false,
      clarity: true,
      oncePerSession: true,
    }),
    false,
  );
  assert.deepEqual(ga4Calls, ["audit_started"]);
  assert.deepEqual(clarityCalls, ["audit_started"]);

  sessionStorage.clear();
  ga4Calls = [];
  ga4ShouldThrow = true;

  assert.equal(
    trackConversionEvent(CONVERSION_EVENTS.quoteSubmitted, undefined, {
      ga4: true,
      clarity: false,
      oncePerSession: true,
    }),
    false,
  );
  assert.deepEqual(ga4Calls, []);

  ga4ShouldThrow = false;
  assert.equal(
    trackConversionEvent(CONVERSION_EVENTS.quoteSubmitted, undefined, {
      ga4: true,
      clarity: false,
      oncePerSession: true,
    }),
    true,
  );
  assert.deepEqual(ga4Calls, ["quote_submitted"]);

  assert.equal(
    trackConversionEvent(CONVERSION_EVENTS.quoteSubmitted, undefined, {
      ga4: true,
      clarity: false,
      oncePerSession: true,
    }),
    false,
  );
  assert.deepEqual(ga4Calls, ["quote_submitted"]);

  sessionStorage.clear();
  clarityCalls = [];
  clarityShouldThrow = true;

  assert.equal(
    trackConversionEvent(CONVERSION_EVENTS.auditCompleted, undefined, {
      ga4: false,
      clarity: true,
      oncePerSession: true,
    }),
    false,
  );
  assert.deepEqual(clarityCalls, []);

  clarityShouldThrow = false;
  assert.equal(
    trackConversionEvent(CONVERSION_EVENTS.auditCompleted, undefined, {
      ga4: false,
      clarity: true,
      oncePerSession: true,
    }),
    true,
  );
  assert.deepEqual(clarityCalls, ["audit_completed"]);

  assert.equal(
    trackConversionEvent(CONVERSION_EVENTS.auditCompleted, undefined, {
      ga4: false,
      clarity: true,
      oncePerSession: true,
    }),
    false,
  );
  assert.deepEqual(clarityCalls, ["audit_completed"]);
} finally {
  ga4ShouldThrow = false;
  clarityShouldThrow = false;

  if (originalWindowDescriptor) {
    Object.defineProperty(globalThis, "window", originalWindowDescriptor);
  } else {
    Reflect.deleteProperty(globalThis, "window");
  }

  if (originalClarityEventDescriptor) {
    Object.defineProperty(Clarity, "event", originalClarityEventDescriptor);
  }
}

console.log("conversions.verify PASS");
