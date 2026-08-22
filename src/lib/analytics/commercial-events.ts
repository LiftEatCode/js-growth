const REPORT_UUID_VALUE_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const STRIPE_ID_VALUE_PATTERN =
  /^(cs|pi|evt)_(test|live)_/i;

const FORBIDDEN_ANALYTICS_PARAM_KEY_PATTERN =
  /report[_-]?id|session[_-]?id|payment[_-]?intent|customer[_-]?email|^email$|^url$|website_url|competitor[_-]?url|lead[_-]?id|contact[_-]?email|prospect[_-]?email|^to_email$|outreach[_-]?status|outcome[_-]?notes|prospect[_-]?id|contact[_-]?form[_-]?url|contact[_-]?form[_-]?id|outreach[_-]?channel|submitted[_-]?by[_-]?email|provider[_-]?message[_-]?id|delivery[_-]?status|bounce[_-]?reason|webhook[_-]?id|svix[_-]?id|competitor[_-]?id|competitor[_-]?hostname|competitor[_-]?audit[_-]?id|competitor[_-]?business[_-]?name|business[_-]?name|provider[_-]?business[_-]?id|place[_-]?id|^latitude$|^longitude$|^lat$|^lng$|coordinates|competitive[_-]?comparison[_-]?id|competitor[_-]?audit[_-]?ids|comparison[_-]?json|competitive[_-]?gap|competitor[_-]?scores|competitive[_-]?interpretation[_-]?id|interpretation[_-]?json|input[_-]?fingerprint|comparison[_-]?snapshot[_-]?id|internal[_-]?talking[_-]?points|competitive[_-]?ai[_-]?summary|competitive[_-]?report|competitive[_-]?growth[_-]?analysis|source[_-]?key|implementation[_-]?plan[_-]?id|implementation[_-]?interpretation[_-]?id|implementation[_-]?strategy[_-]?json|workstream[_-]?id|evidence[_-]?json|capabilities[_-]?json|preservation[_-]?constraints|opportunity[_-]?id|opportunity[_-]?stage|opportunity[_-]?owner|next[_-]?action|lost[_-]?reason|commercial[_-]?notes|scope[_-]?id|scope[_-]?status|scope[_-]?summary|scope[_-]?deliverables|scope[_-]?assumptions|scope[_-]?exclusions|commercial[_-]?scope|pricing[_-]?id|pricing[_-]?status|pricing[_-]?total|pricing[_-]?line|commercial[_-]?pricing|unit[_-]?price|line[_-]?total|override[_-]?reason|proposal[_-]?id|proposal[_-]?status|proposal[_-]?revision|proposal[_-]?total|proposal[_-]?scope|proposal[_-]?pricing|proposal[_-]?summary|proposal[_-]?decision|proposal[_-]?delivery|proposal[_-]?delivery[_-]?id|share[_-]?token|recipient[_-]?email|recipient[_-]?name|proposal[_-]?email[_-]?subject|proposal[_-]?email[_-]?body|proposal[_-]?decision[_-]?note|proposal[_-]?failure[_-]?message|commercial[_-]?proposal|agreement[_-]?id|agreement[_-]?status|agreement[_-]?revision|agreement[_-]?token|agreement[_-]?share[_-]?token|agreement[_-]?delivery|agreement[_-]?delivery[_-]?id|signer[_-]?email|signer[_-]?name|signer[_-]?title|acceptance[_-]?text|agreement[_-]?snapshot|agreement[_-]?snapshot[_-]?hash|agreement[_-]?terms|payment[_-]?terms[_-]?custom|agreement[_-]?failure[_-]?message|commercial[_-]?agreement/i;

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
