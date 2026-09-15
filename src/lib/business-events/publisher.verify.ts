import assert from "node:assert/strict";

import { jsGrowthBusinessEventV1Schema } from "./contract";
import {
  createDeterministicBusinessEventId,
  publishBusinessEvent,
} from "./publisher";

const event = {
  version: 1 as const,
  eventId: createDeterministicBusinessEventId("audit", "report-123"),
  eventType: "growth.audit_completed" as const,
  occurredAt: "2026-09-06T17:00:00.000Z",
  title: "Website audit completed",
  metadata: { audit_type: "website" as const, result: "completed" as const },
};

assert.equal(jsGrowthBusinessEventV1Schema.safeParse(event).success, true);
assert.equal(
  jsGrowthBusinessEventV1Schema.safeParse({ ...event, metadata: { email: "person@example.com" } }).success,
  false,
);
assert.equal(
  jsGrowthBusinessEventV1Schema.safeParse({ ...event, metadata: { nested: { value: true } } }).success,
  false,
);

const calls: Array<{ url: string; init?: RequestInit }> = [];
const accepted = await publishBusinessEvent(event, {
  eventsUrl: "https://js-os.test/api/integrations/js-growth/events",
  secret: "test-secret",
  fetchImpl: (async (url, init) => {
    calls.push({ url: String(url), init });
    return new Response(JSON.stringify({ status: "accepted" }), { status: 202 });
  }) as typeof fetch,
  sleep: async () => undefined,
});
assert.deepEqual(accepted, { ok: true, status: "accepted", eventId: event.eventId });
assert.equal(calls.length, 1);
assert.equal(calls[0]?.url, "https://js-os.test/api/integrations/js-growth/events");
const headers = new Headers(calls[0]?.init?.headers);
assert.equal(headers.get("authorization"), "Bearer test-secret");
assert.equal(headers.get("x-js-growth-event-version"), "1");
assert.equal(JSON.parse(String(calls[0]?.init?.body)).eventId, event.eventId);

let unauthorizedCalls = 0;
const unauthorized = await publishBusinessEvent(event, {
  eventsUrl: "https://js-os.test/events",
  secret: "test-secret",
  fetchImpl: (async () => {
    unauthorizedCalls += 1;
    return new Response(null, { status: 401 });
  }) as typeof fetch,
  sleep: async () => undefined,
});
assert.equal(unauthorized.ok, false);
assert.equal(unauthorizedCalls, 1);

const retryBodies: string[] = [];
let retryCalls = 0;
const retried = await publishBusinessEvent(event, {
  eventsUrl: "https://js-os.test/events",
  secret: "test-secret",
  fetchImpl: (async (_url, init) => {
    retryCalls += 1;
    retryBodies.push(String(init?.body));
    if (retryCalls < 3) {
      return new Response(null, { status: 503 });
    }
    return new Response(JSON.stringify({ status: "duplicate" }), { status: 200 });
  }) as typeof fetch,
  sleep: async () => undefined,
});
assert.deepEqual(retried, { ok: true, status: "duplicate", eventId: event.eventId });
assert.equal(retryCalls, 3);
assert.equal(new Set(retryBodies).size, 1);

let invalidCalls = 0;
const invalid = await publishBusinessEvent(
  { ...event, eventId: "invalid id" } as typeof event,
  {
    eventsUrl: "https://js-os.test/events",
    secret: "test-secret",
    fetchImpl: (async () => {
      invalidCalls += 1;
      return new Response(null, { status: 202 });
    }) as typeof fetch,
  },
);
assert.equal(invalid.ok, false);
assert.equal(invalidCalls, 0);
