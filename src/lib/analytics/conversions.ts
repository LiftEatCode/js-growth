import Clarity from "@microsoft/clarity";

import { sanitizeCommercialEventParams } from "@/lib/analytics/commercial-events";

export const CONVERSION_EVENT_VERSION = "conversion-events-v1";

export const CONVERSION_EVENTS = {
  contactClicked: "contact_clicked",
  phoneClicked: "phone_clicked",
  emailClicked: "email_clicked",
  quoteStarted: "quote_started",
  quoteSubmitted: "quote_submitted",
  auditStarted: "audit_started",
  auditCompleted: "audit_completed",
} as const;

export type ConversionEventName =
  (typeof CONVERSION_EVENTS)[keyof typeof CONVERSION_EVENTS];

export const CONVERSION_EVENT_NAMES = Object.values(CONVERSION_EVENTS);

export type ConversionSourceChannel =
  | "direct"
  | "organic_search"
  | "paid_search"
  | "organic_social"
  | "paid_social"
  | "referral"
  | "email"
  | "other";

export type ConversionEventParams = {
  placement?: string;
  form_name?: string;
  surface?: string;
  report_context?: string;
  source_channel?: ConversionSourceChannel;
};

const ALLOWED_CONVERSION_PARAM_KEYS = new Set<keyof ConversionEventParams>([
  "placement",
  "form_name",
  "surface",
  "report_context",
  "source_channel",
]);

const SESSION_EVENT_PREFIX = "jsg-conversion-event-v1-";

export function isConversionEventName(name: string): name is ConversionEventName {
  return (CONVERSION_EVENT_NAMES as readonly string[]).includes(name);
}

export function sanitizeConversionEventParams(
  params?: ConversionEventParams | Record<string, string | number | boolean>,
): ConversionEventParams | undefined {
  if (!params) {
    return undefined;
  }

  const commerciallySafe = sanitizeCommercialEventParams(params);
  if (!commerciallySafe) {
    return undefined;
  }

  const sanitized: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(commerciallySafe)) {
    if (!ALLOWED_CONVERSION_PARAM_KEYS.has(key as keyof ConversionEventParams)) {
      continue;
    }
    sanitized[key] = value;
  }

  return Object.keys(sanitized).length > 0
    ? (sanitized as ConversionEventParams)
    : undefined;
}

function sendGa4Conversion(
  name: ConversionEventName,
  params?: ConversionEventParams,
): void {
  if (typeof window === "undefined") {
    return;
  }

  const gtag = (
    window as Window & {
      gtag?: (
        command: "event",
        eventName: string,
        eventParams?: Record<string, string | number | boolean>,
      ) => void;
    }
  ).gtag;

  if (typeof gtag !== "function") {
    return;
  }

  gtag(
    "event",
    name,
    params as Record<string, string | number | boolean> | undefined,
  );
}

function sendClarityConversion(name: ConversionEventName): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    Clarity.event(name);
  } catch {
    // Analytics must never interrupt the visitor experience.
  }
}

function hasSessionEventFired(dedupeKey: string): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    return Boolean(
      window.sessionStorage.getItem(`${SESSION_EVENT_PREFIX}${dedupeKey}`),
    );
  } catch {
    return false;
  }
}

function markSessionEventFired(dedupeKey: string): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.setItem(`${SESSION_EVENT_PREFIX}${dedupeKey}`, "1");
  } catch {
    // Continue when sessionStorage is unavailable.
  }
}

export type TrackConversionOptions = {
  /** Disable a destination only when another existing tracker already owns it. */
  ga4?: boolean;
  clarity?: boolean;
  /** Session-scoped dedupe. Never use PII or private/commercial IDs as the key. */
  oncePerSession?: boolean;
  dedupeKey?: string;
};

export function trackConversionEvent(
  name: ConversionEventName,
  params?: ConversionEventParams,
  options: TrackConversionOptions = {},
): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const {
    ga4 = true,
    clarity = true,
    oncePerSession = false,
    dedupeKey = name,
  } = options;

  if (oncePerSession && hasSessionEventFired(dedupeKey)) {
    return false;
  }

  if (oncePerSession) {
    markSessionEventFired(dedupeKey);
  }

  const sanitized = sanitizeConversionEventParams(params);

  if (ga4) {
    sendGa4Conversion(name, sanitized);
  }

  if (clarity) {
    sendClarityConversion(name);
  }

  return true;
}
