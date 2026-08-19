const REPORT_UUID_VALUE_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const STRIPE_ID_VALUE_PATTERN =
  /^(cs|pi|evt)_(test|live)_/i;

const FORBIDDEN_ANALYTICS_PARAM_KEY_PATTERN =
  /report[_-]?id|session[_-]?id|payment[_-]?intent|customer[_-]?email|^email$|^url$|website_url|competitor[_-]?url|lead[_-]?id|contact[_-]?email|prospect[_-]?email|^to_email$|outreach[_-]?status|outcome[_-]?notes|prospect[_-]?id|contact[_-]?form[_-]?url|contact[_-]?form[_-]?id|outreach[_-]?channel|submitted[_-]?by[_-]?email/i;

export type CommercialEventParams = {
  pages_scanned?: number;
  pages_discovered?: number;
  site_scan_truncated?: boolean;
  truncated?: boolean;
  competitor_count?: number;
  successful_competitor_count?: number;
  status?: string;
  model?: string;
};

export function isForbiddenAnalyticsParamKey(key: string): boolean {
  return FORBIDDEN_ANALYTICS_PARAM_KEY_PATTERN.test(key);
}

export function isForbiddenAnalyticsParamValue(value: unknown): boolean {
  if (typeof value !== "string") {
    return false;
  }

  return (
    REPORT_UUID_VALUE_PATTERN.test(value.trim()) ||
    STRIPE_ID_VALUE_PATTERN.test(value.trim())
  );
}

export function sanitizeCommercialEventParams(
  params?: CommercialEventParams | Record<string, string | number | boolean>,
): CommercialEventParams | undefined {
  if (!params) {
    return undefined;
  }

  const sanitized: Record<string, string | number | boolean> = {};

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || isForbiddenAnalyticsParamKey(key)) {
      continue;
    }

    if (isForbiddenAnalyticsParamValue(value)) {
      continue;
    }

    sanitized[key] = value;
  }

  return Object.keys(sanitized).length > 0 ? sanitized : undefined;
}

export function trackCommercialEvent(
  name: string,
  params?: CommercialEventParams,
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

  gtag("event", name, sanitizeCommercialEventParams(params));
}

export const COMMERCIAL_EVENTS = {
  auditCompleted: "audit_completed",
  professionalCheckoutStarted: "professional_checkout_started",
  multiPageAuditCompleted: "multi_page_audit_completed",
  competitiveAuditCompleted: "competitive_audit_completed",
  aiInterpretationCompleted: "ai_interpretation_completed",
  aiInterpretationFailed: "ai_interpretation_failed",
} as const;
