import {
  GBP_WEBSITE_UTM,
} from "@/lib/growth/acquisition-capture";
import { JS_SOLUTIONS_LOCAL_FACTS } from "@/lib/growth/local-growth";
import type { GbpProfileSnapshotV1 } from "@/lib/gbp/constants";
import type { LocalFactMatch } from "@/lib/growth/local-growth";

function normalizePhone(value: string | null | undefined): string | null {
  if (!value) return null;
  const digits = value.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) {
    return digits.slice(1);
  }
  return digits || null;
}

function normalizeName(value: string | null | undefined): string | null {
  if (!value) return null;
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

/** Normalize URL for base comparison (origin + pathname, no trailing slash). */
export function normalizeWebsiteBase(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    const path = u.pathname.replace(/\/+$/, "") || "";
    return `${u.protocol}//${u.host.toLowerCase()}${path}`.toLowerCase();
  } catch {
    return url.trim().replace(/\/+$/, "").toLowerCase() || null;
  }
}

export function websiteHasCanonicalGbpUtm(
  url: string | null | undefined,
): boolean {
  if (!url) return false;
  try {
    const u = new URL(url);
    const source = (u.searchParams.get("utm_source") ?? "").toLowerCase();
    const medium = (u.searchParams.get("utm_medium") ?? "").toLowerCase();
    const campaign = (u.searchParams.get("utm_campaign") ?? "").toLowerCase();
    const content = (u.searchParams.get("utm_content") ?? "").toLowerCase();
    return (
      source === GBP_WEBSITE_UTM.source &&
      medium === GBP_WEBSITE_UTM.medium &&
      campaign === GBP_WEBSITE_UTM.campaign &&
      content === GBP_WEBSITE_UTM.content
    );
  } catch {
    return false;
  }
}

export type GbpFactComparison = {
  key: string;
  observed: string | null;
  canonical: string | null;
  factMatch: LocalFactMatch;
  mismatchCode: string | null;
};

export function compareGbpProfileToFacts(
  profile: GbpProfileSnapshotV1,
): GbpFactComparison[] {
  const results: GbpFactComparison[] = [];

  const nameMatch =
    normalizeName(profile.title) ===
    normalizeName(JS_SOLUTIONS_LOCAL_FACTS.companyName);
  results.push({
    key: "BUSINESS_NAME",
    observed: profile.title,
    canonical: JS_SOLUTIONS_LOCAL_FACTS.companyName,
    factMatch: profile.title
      ? nameMatch
        ? "MATCH"
        : "MISMATCH"
      : "NOT_CAPTURED",
    mismatchCode: profile.title && !nameMatch ? "BUSINESS_NAME_MISMATCH" : null,
  });

  const canonicalBase = normalizeWebsiteBase(JS_SOLUTIONS_LOCAL_FACTS.siteUrl);
  const observedBase = normalizeWebsiteBase(profile.websiteUri);
  const websiteBaseMatch =
    Boolean(canonicalBase && observedBase) && canonicalBase === observedBase;
  results.push({
    key: "WEBSITE",
    observed: profile.websiteUri,
    canonical: JS_SOLUTIONS_LOCAL_FACTS.siteUrl,
    factMatch: profile.websiteUri
      ? websiteBaseMatch
        ? "MATCH"
        : "MISMATCH"
      : "NOT_CAPTURED",
    mismatchCode:
      profile.websiteUri && !websiteBaseMatch ? "WEBSITE_MISMATCH" : null,
  });

  const hasUtm = websiteHasCanonicalGbpUtm(profile.websiteUri);
  results.push({
    key: "WEBSITE_UTM",
    observed: profile.websiteUri,
    canonical: `${GBP_WEBSITE_UTM.source}/${GBP_WEBSITE_UTM.medium}/${GBP_WEBSITE_UTM.campaign}/${GBP_WEBSITE_UTM.content}`,
    factMatch: profile.websiteUri
      ? hasUtm
        ? "MATCH"
        : "MISMATCH"
      : "NOT_CAPTURED",
    mismatchCode:
      profile.websiteUri && !hasUtm ? "WEBSITE_UTM_MISSING" : null,
  });

  const canonicalPhone = normalizePhone(JS_SOLUTIONS_LOCAL_FACTS.phone);
  const observedPhone = normalizePhone(profile.primaryPhone);
  if (!canonicalPhone) {
    results.push({
      key: "PHONE",
      observed: profile.primaryPhone,
      canonical: null,
      factMatch: profile.primaryPhone ? "NOT_APPLICABLE" : "NOT_CAPTURED",
      mismatchCode: null,
    });
  } else {
    const phoneMatch = Boolean(observedPhone) && observedPhone === canonicalPhone;
    results.push({
      key: "PHONE",
      observed: profile.primaryPhone,
      canonical: JS_SOLUTIONS_LOCAL_FACTS.phone,
      factMatch: profile.primaryPhone
        ? phoneMatch
          ? "MATCH"
          : "MISMATCH"
        : "NOT_CAPTURED",
      mismatchCode:
        profile.primaryPhone && !phoneMatch ? "PHONE_MISMATCH" : null,
    });
  }

  // Service-area: do not force public address; compare summary loosely.
  if (JS_SOLUTIONS_LOCAL_FACTS.addressPublic === false) {
    const area = profile.serviceAreaSummary?.toLowerCase() ?? "";
    const expected = JS_SOLUTIONS_LOCAL_FACTS.serviceAreaLabel.toLowerCase();
    const areaOk =
      profile.isServiceAreaBusiness ||
      area.includes("magnolia") ||
      expected.split(" ").some((w) => w.length > 4 && area.includes(w));
    results.push({
      key: "ADDRESS_OR_SERVICE_AREA",
      observed: profile.serviceAreaSummary,
      canonical: JS_SOLUTIONS_LOCAL_FACTS.serviceAreaLabel,
      factMatch: profile.serviceAreaSummary
        ? areaOk
          ? "MATCH"
          : "MISMATCH"
        : profile.isServiceAreaBusiness
          ? "MATCH"
          : "NOT_CAPTURED",
      mismatchCode:
        profile.serviceAreaSummary && !areaOk
          ? "SERVICE_AREA_MISMATCH"
          : null,
    });
  }

  return results;
}
