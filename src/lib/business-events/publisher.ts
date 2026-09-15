import { createHash } from "node:crypto";

import {
  jsGrowthBusinessEventV1Schema,
  type JsGrowthBusinessEventV1,
} from "./contract";

export type PublishBusinessEventResult =
  | { ok: true; status: "accepted" | "duplicate"; eventId: string }
  | { ok: false; retryable: boolean; statusCode?: number; error: string };

type PublisherDependencies = {
  fetchImpl?: typeof fetch;
  sleep?: (milliseconds: number) => Promise<void>;
  eventsUrl?: string;
  secret?: string;
};

const RETRYABLE_STATUS_CODES = new Set([429, 500, 502, 503, 504]);
const RETRY_DELAYS_MS = [0, 250, 750] as const;
const ATTEMPT_TIMEOUT_MS = 2000;

export function createDeterministicBusinessEventId(
  namespace: "quote" | "audit",
  sourceId: string,
): string {
  const digest = createHash("sha256")
    .update(`js-growth:v1:${namespace}:${sourceId}`)
    .digest("hex")
    .slice(0, 32);

  return `jsg:v1:${namespace}:${digest}`;
}

export function isBusinessEventPublisherConfigured(): boolean {
  return Boolean(
    process.env.JS_OS_EVENTS_URL?.trim() &&
      process.env.JS_OS_EVENTS_SECRET?.trim(),
  );
}

export async function publishBusinessEvent(
  event: JsGrowthBusinessEventV1,
  dependencies: PublisherDependencies = {},
): Promise<PublishBusinessEventResult> {
  const parsed = jsGrowthBusinessEventV1Schema.safeParse(event);
  if (!parsed.success) {
    return { ok: false, retryable: false, error: "invalid_event" };
  }

  const eventsUrl = dependencies.eventsUrl ?? process.env.JS_OS_EVENTS_URL;
  const secret = dependencies.secret ?? process.env.JS_OS_EVENTS_SECRET;
  if (!eventsUrl?.trim() || !secret?.trim()) {
    return { ok: false, retryable: false, error: "publisher_not_configured" };
  }

  const fetchImpl = dependencies.fetchImpl ?? fetch;
  const sleep = dependencies.sleep ?? ((milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds)));
  const body = JSON.stringify(parsed.data);
  let lastFailure: PublishBusinessEventResult = {
    ok: false,
    retryable: true,
    error: "publish_failed",
  };

  for (let attempt = 0; attempt < RETRY_DELAYS_MS.length; attempt += 1) {
    const delay = RETRY_DELAYS_MS[attempt] ?? 0;
    if (delay > 0) {
      await sleep(delay);
    }

    try {
      const response = await fetchImpl(eventsUrl, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${secret}`,
          "x-js-growth-event-version": "1",
        },
        body,
        cache: "no-store",
        signal: AbortSignal.timeout(ATTEMPT_TIMEOUT_MS),
      });

      if (response.status === 202) {
        return { ok: true, status: "accepted", eventId: event.eventId };
      }
      if (response.status === 200) {
        return { ok: true, status: "duplicate", eventId: event.eventId };
      }

      const retryable = RETRYABLE_STATUS_CODES.has(response.status);
      lastFailure = {
        ok: false,
        retryable,
        statusCode: response.status,
        error: `http_${response.status}`,
      };

      if (!retryable) {
        return lastFailure;
      }
    } catch (error) {
      lastFailure = {
        ok: false,
        retryable: true,
        error: error instanceof Error ? error.name || "network_error" : "network_error",
      };
    }
  }

  return lastFailure;
}

export async function publishBusinessEventSafely(
  event: JsGrowthBusinessEventV1,
): Promise<void> {
  if (!isBusinessEventPublisherConfigured()) {
    return;
  }

  try {
    const result = await publishBusinessEvent(event);
    if (!result.ok) {
      console.error("business_event.publish.failed", {
        eventId: event.eventId,
        eventType: event.eventType,
        statusCode: result.statusCode,
        retryable: result.retryable,
        error: result.error,
      });
      return;
    }

    console.info(`business_event.publish.${result.status}`, {
      eventId: event.eventId,
      eventType: event.eventType,
    });
  } catch (error) {
    console.error("business_event.publish.failed", {
      eventId: event.eventId,
      eventType: event.eventType,
      error: error instanceof Error ? error.message : "unknown_error",
    });
  }
}
