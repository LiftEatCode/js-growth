/**
 * Growth Sprint 10 — Acquisition Capture V1
 *
 * Capture what we observe. Preserve what we know. Label what we do not know.
 * Extends attribution-v1; does not invent attribution-v2 or backfill history.
 */

import { sanitizeAnalyticsPagePath } from "@/lib/analytics/page-path";
import { siteConfig } from "@/config/site";
import {
  type CampaignAttribution,
  parseCampaignAttribution,
  parseCampaignAttributionFromUnknown,
} from "@/lib/growth/attribution";
import {
  classifyAttributionChannel,
  type AttributionChannel,
  type AttributionStrength,
} from "@/lib/growth/lead-conversion-intelligence";
import { isValidUtmValue, normalizeUtmValue } from "@/lib/growth/utm";
import { getOrganizationSchema } from "@/lib/seo";

export const ACQUISITION_CAPTURE_VERSION = 1 as const;

/** JS_SOLUTIONS_OPERATING_RULE — bounded browser first-observed retention. */
export const FIRST_OBSERVED_RETENTION_DAYS = 90 as const;

export const FIRST_OBSERVED_STORAGE_KEY = "jsg-growth-first-observed-v1";
export const SESSION_ATTRIBUTION_STORAGE_KEY = "jsg-growth-attribution-v1";

export const REFERRER_CLASSES = [
  "GOOGLE",
  "FACEBOOK",
  "BING",
  "OTHER_SEARCH",
  "OTHER_SOCIAL",
  "REFERRAL",
  "DIRECT",
  "UNKNOWN",
] as const;
export type ReferrerClass = (typeof REFERRER_CLASSES)[number];

export const ENTRY_TYPES = ["UTM", "REFERRER", "DIRECT", "UNKNOWN"] as const;
export type EntryType = (typeof ENTRY_TYPES)[number];

export const LEAD_ORIGINS = ["AUDIT", "CONTACT"] as const;
export type LeadOrigin = (typeof LEAD_ORIGINS)[number];

export type AcquisitionContextV1 = CampaignAttribution & {
  acquisitionCaptureVersion: typeof ACQUISITION_CAPTURE_VERSION;
  referrerClass: ReferrerClass | null;
  entryType: EntryType;
};

export type AttributionCoverageBreakdown = {
  knownChannel: number;
  direct: number;
  unknown: number;
  notCaptured: number;
  eligible: number;
  /** (knownChannel + direct) / eligible when eligible > 0 */
  knownRate: number | null;
};

const MAX_PATH = 200;

function optionalUtm(value: string | null | undefined): string | null {
  if (value == null || !String(value).trim()) {
    return null;
  }
  const normalized = normalizeUtmValue(String(value));
  return isValidUtmValue(normalized) ? normalized : null;
}

function isSameSiteReferrerHost(host: string): boolean {
  const siteHost = siteConfig.domain.toLowerCase().replace(/^www\./, "");
  const normalized = host.toLowerCase().replace(/^www\./, "");
  return (
    normalized === siteHost ||
    normalized === "localhost" ||
    normalized.endsWith(".localhost")
  );
}

export function classifyReferrerHost(
  referrerUrl: string | null | undefined,
): ReferrerClass {
  if (!referrerUrl || !String(referrerUrl).trim()) {
    return "DIRECT";
  }
  let host = "";
  try {
    host = new URL(referrerUrl).hostname.toLowerCase();
  } catch {
    return "UNKNOWN";
  }
  if (!host) {
    return "DIRECT";
  }
  // Internal navigation is not a new acquisition source.
  if (isSameSiteReferrerHost(host)) {
    return "DIRECT";
  }
  if (
    host === "google.com" ||
    host.endsWith(".google.com") ||
    host === "google.co.uk" ||
    host.endsWith(".google.co.uk") ||
    host.startsWith("www.google.")
  ) {
    return "GOOGLE";
  }
  if (host === "bing.com" || host.endsWith(".bing.com")) {
    return "BING";
  }
  if (
    host.includes("facebook.com") ||
    host.includes("fb.com") ||
    host.includes("instagram.com")
  ) {
    return "FACEBOOK";
  }
  if (
    host.includes("duckduckgo.com") ||
    host.includes("yahoo.com") ||
    host.includes("search.yahoo.") ||
    host.includes("ecosia.org")
  ) {
    return "OTHER_SEARCH";
  }
  if (
    host.includes("linkedin.com") ||
    host.includes("twitter.com") ||
    host.includes("x.com") ||
    host.includes("tiktok.com") ||
    host.includes("youtube.com") ||
    host.includes("youtu.be")
  ) {
    return "OTHER_SOCIAL";
  }
  return "REFERRAL";
}

/**
 * Infer privacy-safe source/medium from referrer class when UTMs are absent.
 * Never invents GBP from Google referrer.
 */
export function inferUtmFromReferrerClass(referrerClass: ReferrerClass): {
  source: string | null;
  medium: string | null;
} {
  switch (referrerClass) {
    case "GOOGLE":
      return { source: "google", medium: "organic" };
    case "BING":
      return { source: "bing", medium: "organic" };
    case "FACEBOOK":
      return { source: "facebook", medium: "organic_social" };
    case "OTHER_SEARCH":
      return { source: "search", medium: "organic" };
    case "OTHER_SOCIAL":
      return { source: "social", medium: "organic_social" };
    case "REFERRAL":
      return { source: "referral", medium: "referral" };
    case "DIRECT":
      return { source: null, medium: null };
    default:
      return { source: null, medium: null };
  }
}

export function buildAcquisitionContext(input: {
  source?: string | null;
  medium?: string | null;
  campaign?: string | null;
  content?: string | null;
  landingPath: string;
  capturedAt?: string;
  referrerClass?: ReferrerClass | null;
  entryType: EntryType;
}): AcquisitionContextV1 | null {
  const base = parseCampaignAttribution({
    source: input.source,
    medium: input.medium,
    campaign: input.campaign,
    content: input.content,
    landingPath: input.landingPath,
    capturedAt: input.capturedAt,
  });
  if (!base) {
    return null;
  }
  return {
    ...base,
    acquisitionCaptureVersion: ACQUISITION_CAPTURE_VERSION,
    referrerClass: input.referrerClass ?? null,
    entryType: input.entryType,
  };
}

export function parseAcquisitionContextFromUnknown(
  value: unknown,
): AcquisitionContextV1 | null {
  const base = parseCampaignAttributionFromUnknown(value);
  if (!base) {
    return null;
  }
  const record =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  const entryRaw =
    typeof record.entryType === "string" ? record.entryType : null;
  const entryType = (ENTRY_TYPES as readonly string[]).includes(entryRaw ?? "")
    ? (entryRaw as EntryType)
    : base.source || base.medium
      ? "UTM"
      : "UNKNOWN";
  const refRaw =
    typeof record.referrerClass === "string" ? record.referrerClass : null;
  const referrerClass = (REFERRER_CLASSES as readonly string[]).includes(
    refRaw ?? "",
  )
    ? (refRaw as ReferrerClass)
    : null;

  return {
    ...base,
    acquisitionCaptureVersion: ACQUISITION_CAPTURE_VERSION,
    referrerClass,
    entryType,
  };
}

/**
 * Server-side normalization. Attribution is untrusted marketing input.
 * Never throws — returns null on failure (conversion must still succeed).
 */
export function normalizeAcquisitionForPersistence(
  value: unknown,
): AcquisitionContextV1 | null {
  try {
    const parsed = parseAcquisitionContextFromUnknown(value);
    if (!parsed) {
      return null;
    }
    const landingPath = sanitizeAnalyticsPagePath(
      parsed.landingPath.slice(0, MAX_PATH),
    );
    if (!landingPath.startsWith("/")) {
      return null;
    }
    return {
      source: optionalUtm(parsed.source),
      medium: optionalUtm(parsed.medium),
      campaign: optionalUtm(parsed.campaign),
      content: optionalUtm(parsed.content),
      landingPath,
      capturedAt: parsed.capturedAt.slice(0, 40),
      acquisitionCaptureVersion: ACQUISITION_CAPTURE_VERSION,
      referrerClass: parsed.referrerClass,
      entryType: parsed.entryType,
    };
  } catch {
    return null;
  }
}

export function channelFromAcquisition(
  ctx: AcquisitionContextV1 | CampaignAttribution | null | undefined,
): AttributionChannel {
  if (!ctx) {
    return "UNKNOWN";
  }
  const extended = ctx as Partial<AcquisitionContextV1>;
  if (extended.entryType === "UNKNOWN" && !ctx.source && !ctx.medium) {
    return "UNKNOWN";
  }
  if (extended.entryType === "DIRECT" && !ctx.source && !ctx.medium) {
    return "DIRECT";
  }
  return classifyAttributionChannel({
    source: ctx.source,
    medium: ctx.medium,
  });
}

export function strengthFromAcquisition(
  ctx: AcquisitionContextV1 | null | undefined,
): AttributionStrength {
  if (!ctx) {
    return "UNKNOWN";
  }
  if (ctx.entryType === "UTM" && ctx.source && ctx.medium) {
    return "DIRECT_FIRST_PARTY";
  }
  if (ctx.entryType === "UTM" && (ctx.source || ctx.medium)) {
    return "STRONG";
  }
  if (ctx.entryType === "REFERRER") {
    return "DIRECTIONAL";
  }
  if (ctx.entryType === "DIRECT") {
    return "DIRECT_FIRST_PARTY";
  }
  return "UNKNOWN";
}

/**
 * Coverage semantics:
 * DIRECT = classified/known
 * UNKNOWN = unresolved
 * NOT_CAPTURED = instrumentation unavailable (caller sets)
 */
export function computeAttributionCoverage(
  channels: AttributionChannel[],
): AttributionCoverageBreakdown {
  let knownChannel = 0;
  let direct = 0;
  let unknown = 0;
  for (const channel of channels) {
    if (channel === "UNKNOWN") {
      unknown += 1;
    } else if (channel === "DIRECT") {
      direct += 1;
    } else {
      knownChannel += 1;
    }
  }
  const eligible = channels.length;
  const knownRate =
    eligible > 0
      ? Math.round(((knownChannel + direct) / eligible) * 1000) / 10
      : null;
  return {
    knownChannel,
    direct,
    unknown,
    notCaptured: 0,
    eligible,
    knownRate,
  };
}

function readJsonStorage(
  storage: Storage,
  key: string,
): AcquisitionContextV1 | null {
  try {
    const raw = storage.getItem(key);
    if (!raw) {
      return null;
    }
    const parsed = parseAcquisitionContextFromUnknown(JSON.parse(raw));
    if (!parsed) {
      return null;
    }
    if (key === FIRST_OBSERVED_STORAGE_KEY) {
      const ageMs = Date.now() - Date.parse(parsed.capturedAt || "");
      if (
        !Number.isFinite(ageMs) ||
        ageMs > FIRST_OBSERVED_RETENTION_DAYS * 24 * 60 * 60 * 1000
      ) {
        storage.removeItem(key);
        return null;
      }
    }
    return parsed;
  } catch {
    return null;
  }
}

function writeJsonStorage(
  storage: Storage,
  key: string,
  value: AcquisitionContextV1,
) {
  storage.setItem(key, JSON.stringify(value));
}

function hasUtmParams(params: URLSearchParams): boolean {
  return (
    params.has("utm_source") ||
    params.has("utm_medium") ||
    params.has("utm_campaign")
  );
}

function contextsDifferByCampaign(
  a: AcquisitionContextV1,
  b: AcquisitionContextV1,
): boolean {
  return (
    a.source !== b.source ||
    a.medium !== b.medium ||
    a.campaign !== b.campaign ||
    a.content !== b.content
  );
}

/**
 * Browser capture for NEW journeys going forward.
 * - Current session: sessionStorage (survives internal navigation)
 * - First observed: localStorage, 90-day TTL, never overwritten once set
 * - New UTM entry updates current session only
 * - No fingerprinting / cross-device claims
 */
export function captureAcquisitionInBrowser(): {
  session: AcquisitionContextV1 | null;
  firstObserved: AcquisitionContextV1 | null;
} {
  if (typeof window === "undefined") {
    return { session: null, firstObserved: null };
  }

  try {
    const params = new URLSearchParams(window.location.search);
    const landingPath = window.location.pathname;
    const referrerClass = classifyReferrerHost(document.referrer || null);
    const now = new Date().toISOString();

    let session = readJsonStorage(
      window.sessionStorage,
      SESSION_ATTRIBUTION_STORAGE_KEY,
    );
    let firstObserved = readJsonStorage(
      window.localStorage,
      FIRST_OBSERVED_STORAGE_KEY,
    );

    if (hasUtmParams(params)) {
      const fromUtm = buildAcquisitionContext({
        source: params.get("utm_source"),
        medium: params.get("utm_medium"),
        campaign: params.get("utm_campaign"),
        content: params.get("utm_content"),
        landingPath,
        capturedAt: now,
        referrerClass,
        entryType: "UTM",
      });
      if (fromUtm) {
        if (!session || contextsDifferByCampaign(session, fromUtm)) {
          session = fromUtm;
          writeJsonStorage(
            window.sessionStorage,
            SESSION_ATTRIBUTION_STORAGE_KEY,
            session,
          );
        }
        if (!firstObserved) {
          firstObserved = fromUtm;
          writeJsonStorage(
            window.localStorage,
            FIRST_OBSERVED_STORAGE_KEY,
            firstObserved,
          );
        }
        return { session, firstObserved };
      }
    }

    if (session) {
      return { session, firstObserved };
    }

    // Same-site referrer with no prior session = lost context / internal hop.
    // Do not invent REFERRAL or overwrite with a false DIRECT from internal nav.
    let sameSiteReferrer = false;
    try {
      if (document.referrer) {
        sameSiteReferrer = isSameSiteReferrerHost(
          new URL(document.referrer).hostname,
        );
      }
    } catch {
      sameSiteReferrer = false;
    }
    if (sameSiteReferrer) {
      return { session: null, firstObserved };
    }

    if (referrerClass === "DIRECT") {
      session = buildAcquisitionContext({
        landingPath,
        capturedAt: now,
        referrerClass: "DIRECT",
        entryType: "DIRECT",
      });
    } else if (referrerClass === "UNKNOWN") {
      session = buildAcquisitionContext({
        landingPath,
        capturedAt: now,
        referrerClass: "UNKNOWN",
        entryType: "UNKNOWN",
      });
    } else {
      const inferred = inferUtmFromReferrerClass(referrerClass);
      session = buildAcquisitionContext({
        source: inferred.source,
        medium: inferred.medium,
        landingPath,
        capturedAt: now,
        referrerClass,
        entryType: "REFERRER",
      });
    }

    if (session) {
      writeJsonStorage(
        window.sessionStorage,
        SESSION_ATTRIBUTION_STORAGE_KEY,
        session,
      );
      if (!firstObserved) {
        firstObserved = session;
        writeJsonStorage(
          window.localStorage,
          FIRST_OBSERVED_STORAGE_KEY,
          firstObserved,
        );
      }
    }

    return { session, firstObserved };
  } catch {
    return { session: null, firstObserved: null };
  }
}

export function readAcquisitionForForm(): AcquisitionContextV1 | null {
  if (typeof window === "undefined") {
    return null;
  }
  const { session } = captureAcquisitionInBrowser();
  return session;
}

export function serializeAcquisitionForForm(
  value: AcquisitionContextV1 | CampaignAttribution | null,
): string {
  if (!value) {
    return "";
  }
  return JSON.stringify(value);
}

/** Canonical Facebook Page URL from Organization sameAs (single source). */
export const JS_SOLUTIONS_FACEBOOK_PAGE_URL = (getOrganizationSchema()
  .sameAs[0] ?? "https://www.facebook.com/") as string;

export const GBP_WEBSITE_UTM = {
  source: "google_business_profile",
  medium: "organic_local",
  campaign: "gbp_profile",
  content: "website",
} as const;

export const GBP_POST_UTM = {
  source: "google_business_profile",
  medium: "organic_local",
  campaign: "gbp_profile",
} as const;

export function buildGbpPostContent(slug: string): string | null {
  const normalized = normalizeUtmValue(slug);
  if (!isValidUtmValue(normalized)) {
    return null;
  }
  const value = `post_${normalized}`;
  return value.length <= 80 ? value : null;
}
