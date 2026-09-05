import Clarity from "@microsoft/clarity";

import { sanitizeCommercialEventParams } from "@/lib/analytics/commercial-events";

export const CONVERSION_EVENT_VERSION = "conversion-events-v2";

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

export const CONVERSION_PLACEMENTS = [
  "header",
  "footer",
  "hero",
  "navigation",
  "contact_page",
  "audit_page",
  "inline",
] as const;

export type ConversionPlacement = (typeof CONVERSION_PLACEMENTS)[number];

export const CONVERSION_FORM_NAMES = ["contact", "website_audit"] as const;

export type ConversionFormName = (typeof CONVERSION_FORM_NAMES)[number];

export const CONVERSION_SURFACES = [
  "header",
  "footer",
  "navigation",
  "contact_form",
  "audit_form",
  "audit_results",
  "page",
] as const;

export type ConversionSurface = (typeof CONVERSION_SURFACES)[number];

export const CONVERSION_REPORT_CONTEXTS = [
  "inline_landing",
  "saved_report",
] as const;

export type ConversionReportContext =
  (typeof CONVERSION_REPORT_CONTEXTS)[number];

export const CONVERSION_SOURCE_CHANNELS = [
  "direct",
  "organic_search",
  "paid_search",
  "organic_social",
  "paid_social",
  "referral",
  "email",
  "other",
] as const;

export type ConversionSourceChannel =
  (typeof CONVERSION_SOURCE_CHANNELS)[number];

export type ConversionEventParams = {
  placement?: ConversionPlacement;
  form_name?: ConversionFormName;
  surface?: ConversionSurface;
  report_context?: ConversionReportContext;
  source_channel?: ConversionSourceChannel;
};

const CONTROLLED_VALUES = {
  placement: new Set<string>(CONVERSION_PLACEMENTS),
  form_name: new Set<string>(CONVERSION_FORM_NAMES),
  surface: new Set<string>(CONVERSION_SURFACES),
  report_context: new Set<string>(CONVERSION_REPORT_CONTEXTS),
  source_channel: new Set<string>(CONVERSION_SOURCE_CHANNELS),
} satisfies Record<keyof ConversionEventParams, Set<string>>;

const SESSION_EVENT_PREFIX = "jsg-conversion-event-v2-";

type ConversionDestination = "ga4" | "clarity";

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

  const sanitized: Partial<ConversionEventParams> = {};

  for (const [key, value] of Object.entries(commerciallySafe)) {
    if (!(key in CONTROLLED_VALUES) || typeof value !== "string") {
      continue;
    }

    const controlledKey = key as keyof ConversionEventParams;
    if (!CONTROLLED_VALUES[controlledKey].has(value)) {
      continue;
    }

    switch (controlledKey) {
      case "placement":
        sanitized.placement = value as ConversionPlacement;
        break;
      case "form_name":
        sanitized.form_name = value as ConversionFormName;
        break;
      case "surface":
        sanitized.surface = value as ConversionSurface;
        break;
      case "report_context":
        sanitized.report_context = value as ConversionReportContext;
        break;
      case "source_channel":
        sanitized.source_channel = value as ConversionSourceChannel;
        break;
    }
  }

  return Object.keys(sanitized).length > 0
    ? (sanitized as ConversionEventParams)
    : undefined;
}

function sendGa4Conversion(
  name: ConversionEventName,
  params?: ConversionEventParams,
): boolean {
  if (typeof window === "undefined") {
    return false;
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
    return false;
  }

  try {
    gtag(
      "event",
      name,
      params as Record<string, string | number | boolean> | undefined,
    );
    return true;
  } catch {
    return false;
  }
}

function sendClarityConversion(name: ConversionEventName): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    Clarity.event(name);
    return true;
  } catch {
    // Analytics must never interrupt the visitor experience.
    return false;
  }
}

function sessionStorageKey(
  destination: ConversionDestination,
  dedupeKey: string,
): string {
  return `${SESSION_EVENT_PREFIX}${destination}-${dedupeKey}`;
}

function hasSessionEventFired(
  destination: ConversionDestination,
  dedupeKey: string,
): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    return Boolean(
      window.sessionStorage.getItem(sessionStorageKey(destination, dedupeKey)),
    );
  } catch {
    return false;
  }
}

function markSessionEventFired(
  destination: ConversionDestination,
  dedupeKey: string,
): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.setItem(
      sessionStorageKey(destination, dedupeKey),
      "1",
    );
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

  const sanitized = sanitizeConversionEventParams(params);
  let dispatched = false;

  if (
    ga4 &&
    (!oncePerSession || !hasSessionEventFired("ga4", dedupeKey))
  ) {
    const ga4Dispatched = sendGa4Conversion(name, sanitized);
    if (ga4Dispatched) {
      dispatched = true;
      if (oncePerSession) {
        markSessionEventFired("ga4", dedupeKey);
      }
    }
  }

  if (
    clarity &&
    (!oncePerSession || !hasSessionEventFired("clarity", dedupeKey))
  ) {
    const clarityDispatched = sendClarityConversion(name);
    if (clarityDispatched) {
      dispatched = true;
      if (oncePerSession) {
        markSessionEventFired("clarity", dedupeKey);
      }
    }
  }

  return dispatched;
}
