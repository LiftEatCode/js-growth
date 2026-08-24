/**
 * Growth Sprint 1 — first-party campaign context (bounded).
 * Growth Sprint 10 — form parse normalizes via acquisition-capture helpers without
 * circular browser imports (browser capture lives in acquisition-capture.ts).
 *
 * Stores only marketing attribution fields for aggregate funnel analysis.
 * Never stores PII, commercial IDs, or arbitrary query strings.
 */

import { sanitizeAnalyticsPagePath } from "@/lib/analytics/page-path";
import { isValidUtmValue, normalizeUtmValue } from "@/lib/growth/utm";

export const FIRST_PARTY_ATTRIBUTION_VERSION = "first-party-attribution-v1";
export const ATTRIBUTION_STORAGE_KEY = "jsg-growth-attribution-v1";

const MAX_PATH_LENGTH = 200;

export type CampaignAttribution = {
  source: string | null;
  medium: string | null;
  campaign: string | null;
  content: string | null;
  landingPath: string;
  capturedAt: string;
};

export type CampaignAttributionInput = {
  source?: string | null;
  medium?: string | null;
  campaign?: string | null;
  content?: string | null;
  landingPath: string;
  capturedAt?: string;
};

function optionalUtm(value: string | null | undefined): string | null {
  if (value == null || !String(value).trim()) {
    return null;
  }
  const normalized = normalizeUtmValue(String(value));
  return isValidUtmValue(normalized) ? normalized : null;
}

export function parseCampaignAttribution(
  input: CampaignAttributionInput,
): CampaignAttribution | null {
  const landingPath = sanitizeAnalyticsPagePath(
    String(input.landingPath || "/").slice(0, MAX_PATH_LENGTH),
  );

  if (!landingPath.startsWith("/")) {
    return null;
  }

  return {
    source: optionalUtm(input.source),
    medium: optionalUtm(input.medium),
    campaign: optionalUtm(input.campaign),
    content: optionalUtm(input.content),
    landingPath,
    capturedAt:
      typeof input.capturedAt === "string" && input.capturedAt.trim()
        ? input.capturedAt.trim().slice(0, 40)
        : new Date().toISOString(),
  };
}

export function parseCampaignAttributionFromSearchParams(
  searchParams: URLSearchParams,
  landingPath: string,
): CampaignAttribution | null {
  return parseCampaignAttribution({
    source: searchParams.get("utm_source"),
    medium: searchParams.get("utm_medium"),
    campaign: searchParams.get("utm_campaign"),
    content: searchParams.get("utm_content"),
    landingPath,
  });
}

export function parseCampaignAttributionFromUnknown(
  value: unknown,
): CampaignAttribution | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const record = value as Record<string, unknown>;
  return parseCampaignAttribution({
    source: typeof record.source === "string" ? record.source : null,
    medium: typeof record.medium === "string" ? record.medium : null,
    campaign: typeof record.campaign === "string" ? record.campaign : null,
    content: typeof record.content === "string" ? record.content : null,
    landingPath:
      typeof record.landingPath === "string" ? record.landingPath : "/",
    capturedAt:
      typeof record.capturedAt === "string" ? record.capturedAt : undefined,
  });
}

/**
 * Form parse — dynamic import avoided; callers that need Sprint 10 normalize
 * should use normalizeAcquisitionForPersistence from acquisition-capture.
 * This keeps a safe fallback that still rejects junk JSON.
 */
export function parseCampaignAttributionFromFormData(
  formData: FormData,
): CampaignAttribution | null {
  const raw = formData.get("growth_attribution");
  if (typeof raw !== "string" || !raw.trim()) {
    return null;
  }

  try {
    return parseCampaignAttributionFromUnknown(JSON.parse(raw));
  } catch {
    return null;
  }
}

/**
 * @deprecated Prefer captureAcquisitionInBrowser from acquisition-capture.
 * Kept for barrel compatibility; forwards when window is available.
 */
export function captureCampaignAttributionInBrowser(): CampaignAttribution | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    // Lazy require pattern avoided — call site should use acquisition-capture.
    // Minimal compatible behavior: read existing session key only.
    const existing = window.sessionStorage.getItem(ATTRIBUTION_STORAGE_KEY);
    if (existing) {
      return parseCampaignAttributionFromUnknown(JSON.parse(existing));
    }
    const params = new URLSearchParams(window.location.search);
    const hasUtm =
      params.has("utm_source") ||
      params.has("utm_medium") ||
      params.has("utm_campaign");
    if (!hasUtm) {
      return null;
    }
    const attribution = parseCampaignAttributionFromSearchParams(
      params,
      window.location.pathname,
    );
    if (!attribution) {
      return null;
    }
    window.sessionStorage.setItem(
      ATTRIBUTION_STORAGE_KEY,
      JSON.stringify(attribution),
    );
    return attribution;
  } catch {
    return null;
  }
}

export function readCampaignAttributionFromBrowser(): CampaignAttribution | null {
  return captureCampaignAttributionInBrowser();
}

export function serializeCampaignAttributionForForm(
  attribution: CampaignAttribution | null,
): string {
  if (!attribution) {
    return "";
  }
  return JSON.stringify(attribution);
}
