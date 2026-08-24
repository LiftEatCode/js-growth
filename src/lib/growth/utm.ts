/**
 * Growth Sprint 1 — UTM conventions and URL builder (attribution-v1).
 *
 * Prefer GA4-native acquisition dimensions. Do not append UTMs to internal
 * navigation links — that corrupts session attribution.
 */

export const ATTRIBUTION_VERSION = "attribution-v1";
export const UTM_STANDARD_VERSION = "utm-standard-v1";

export const UTM_SOURCES = [
  "facebook",
  "instagram",
  "youtube",
  "google_business_profile",
  "email",
  "outreach",
  "partner",
  "qr",
  "linkedin",
  "newsletter",
] as const;

export type UtmSource = (typeof UTM_SOURCES)[number];

export const UTM_MEDIUMS = [
  "organic_social",
  "paid_social",
  "organic_video",
  "paid_video",
  "email",
  "referral",
  "offline",
  "organic_local",
  "cpc",
] as const;

export type UtmMedium = (typeof UTM_MEDIUMS)[number];

export const UTM_PARAM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "utm_id",
] as const;

const MAX_UTM_VALUE_LENGTH = 80;
const UTM_VALUE_PATTERN = /^[a-z0-9][a-z0-9_-]*$/;

export type UtmBuilderInput = {
  destinationUrl: string;
  source: string;
  medium: string;
  campaign: string;
  content?: string;
  term?: string;
};

export type UtmBuilderResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

export function normalizeUtmValue(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, "_");
}

export function isValidUtmValue(value: string): boolean {
  const normalized = normalizeUtmValue(value);
  if (!normalized || normalized.length > MAX_UTM_VALUE_LENGTH) {
    return false;
  }
  return UTM_VALUE_PATTERN.test(normalized);
}

export function isKnownUtmSource(value: string): boolean {
  return (UTM_SOURCES as readonly string[]).includes(normalizeUtmValue(value));
}

export function isKnownUtmMedium(value: string): boolean {
  return (UTM_MEDIUMS as readonly string[]).includes(normalizeUtmValue(value));
}

export function buildUtmUrl(input: UtmBuilderInput): UtmBuilderResult {
  const source = normalizeUtmValue(input.source);
  const medium = normalizeUtmValue(input.medium);
  const campaign = normalizeUtmValue(input.campaign);
  const content = input.content?.trim()
    ? normalizeUtmValue(input.content)
    : undefined;
  const term = input.term?.trim() ? normalizeUtmValue(input.term) : undefined;

  if (!isValidUtmValue(source)) {
    return { ok: false, error: "Invalid utm_source" };
  }
  if (!isValidUtmValue(medium)) {
    return { ok: false, error: "Invalid utm_medium" };
  }
  if (!isValidUtmValue(campaign)) {
    return { ok: false, error: "Invalid utm_campaign" };
  }
  if (content !== undefined && !isValidUtmValue(content)) {
    return { ok: false, error: "Invalid utm_content" };
  }
  if (term !== undefined && !isValidUtmValue(term)) {
    return { ok: false, error: "Invalid utm_term" };
  }

  let parsed: URL;
  try {
    parsed = new URL(input.destinationUrl.trim());
  } catch {
    return { ok: false, error: "Invalid destination URL" };
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { ok: false, error: "Destination must be http(s)" };
  }

  parsed.searchParams.set("utm_source", source);
  parsed.searchParams.set("utm_medium", medium);
  parsed.searchParams.set("utm_campaign", campaign);
  if (content) {
    parsed.searchParams.set("utm_content", content);
  } else {
    parsed.searchParams.delete("utm_content");
  }
  if (term) {
    parsed.searchParams.set("utm_term", term);
  } else {
    parsed.searchParams.delete("utm_term");
  }

  return { ok: true, url: parsed.toString() };
}

/** Facebook organic — business page posts. */
export const FACEBOOK_PAGE_UTM = {
  source: "facebook",
  medium: "organic_social",
  campaign: "page_organic",
} as const;

/** Facebook organic — founder/personal posts promoting JS Solutions. */
export const FACEBOOK_FOUNDER_UTM = {
  source: "facebook",
  medium: "organic_social",
  campaign: "founder_content",
} as const;

/** Google Business Profile website clicks (when link can be tagged). */
export const GBP_UTM = {
  source: "google_business_profile",
  medium: "organic_local",
  campaign: "gbp_profile",
} as const;
