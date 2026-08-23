/**
 * Growth Sprint 3 — Facebook organic growth model (facebook-growth-v1).
 *
 * Observational only. Does not call Meta APIs. Does not mutate commercial state.
 * Growth Baseline V1 Facebook totals remain immutable comparison anchors.
 */

export const FACEBOOK_GROWTH_VERSION = "facebook-growth-v1" as const;

export const FACEBOOK_PUBLISHER_TYPES = ["COMPANY", "FOUNDER"] as const;
export type FacebookPublisherType = (typeof FACEBOOK_PUBLISHER_TYPES)[number];

export const FACEBOOK_CONTENT_JOBS = [
  "REACH",
  "ENGAGEMENT",
  "FOLLOWER_GROWTH",
  "AUTHORITY",
  "TRUST",
  "TRAFFIC",
  "AUDIT_CONVERSION",
  "LEAD_GENERATION",
  "PROOF",
  "COMMUNITY",
] as const;
export type FacebookContentJob = (typeof FACEBOOK_CONTENT_JOBS)[number];

export const FACEBOOK_CONTENT_PILLARS = [
  "WEBSITE_CONVERSION",
  "SEO",
  "LOCAL_SEO",
  "GBP",
  "SMALL_BUSINESS_GROWTH",
  "WEBSITE_AUDITS",
  "CASE_STUDIES",
  "COMMON_MISTAKES",
  "BEHIND_THE_SCENES",
  "BUILDING_JS_SOLUTIONS",
  "AI_AUTOMATION",
  "RESOURCES",
] as const;
export type FacebookContentPillar = (typeof FACEBOOK_CONTENT_PILLARS)[number];

export const FACEBOOK_CONTENT_FORMATS = [
  "PHOTO",
  "TEXT",
  "LINK",
  "REEL",
  "VIDEO",
  "CAROUSEL",
  "LIVE",
] as const;
export type FacebookContentFormat = (typeof FACEBOOK_CONTENT_FORMATS)[number];

export const FACEBOOK_METRIC_LAYERS = [
  {
    layer: 1,
    id: "DISTRIBUTION",
    name: "Distribution",
    metrics: [
      "reach",
      "views",
      "nonFollowerViewPercent",
      "followerViewPercent",
    ],
  },
  {
    layer: 2,
    id: "ENGAGEMENT",
    name: "Engagement",
    metrics: ["engagements", "reactions", "comments", "shares", "engagementRate"],
  },
  {
    layer: 3,
    id: "AUDIENCE",
    name: "Audience / social proof",
    metrics: ["followers", "netFollowerChange", "pageVisits", "visitToFollowRate"],
  },
  {
    layer: 4,
    id: "TRAFFIC",
    name: "Website traffic",
    metrics: [
      "facebookSessions",
      "qualifiedVisits",
      "auditLandingViews",
      "blogVisits",
      "servicePageVisits",
    ],
  },
  {
    layer: 5,
    id: "BUSINESS",
    name: "Business outcomes",
    metrics: [
      "auditStarts",
      "auditSubmissions",
      "auditCompletions",
      "professionalCtaClicks",
      "contacts",
      "professionalPurchases",
      "prospects",
      "opportunities",
      "agreements",
      "payments",
      "clients",
    ],
  },
] as const;

/** Balanced scorecard — not a single composite Facebook score. */
export const FACEBOOK_SCORECARD = {
  leading: [
    "reach",
    "views",
    "nonFollowerViewPercent",
    "engagements",
    "engagementRate",
    "pageVisits",
  ],
  midFunnel: [
    "followers",
    "netFollowerChange",
    "facebookSessions",
    "qualifiedVisits",
    "auditLandingViews",
    "auditStarts",
    "auditSubmissions",
  ],
  lagging: [
    "auditCompletions",
    "contacts",
    "professionalPurchases",
    "opportunities",
    "clients",
    "revenueWhenAttributable",
  ],
} as const;

export const FACEBOOK_PAGE_CAMPAIGN = "page_organic" as const;
export const FACEBOOK_FOUNDER_CAMPAIGN = "founder_content" as const;

const CONTENT_ID_SLUG_PATTERN = /^[a-z0-9][a-z0-9_-]{0,60}$/;

export function isFacebookPublisherType(
  value: string,
): value is FacebookPublisherType {
  return (FACEBOOK_PUBLISHER_TYPES as readonly string[]).includes(value);
}

export function isFacebookContentJob(value: string): value is FacebookContentJob {
  return (FACEBOOK_CONTENT_JOBS as readonly string[]).includes(value);
}

export function isFacebookContentPillar(
  value: string,
): value is FacebookContentPillar {
  return (FACEBOOK_CONTENT_PILLARS as readonly string[]).includes(value);
}

export function isFacebookContentFormat(
  value: string,
): value is FacebookContentFormat {
  return (FACEBOOK_CONTENT_FORMATS as readonly string[]).includes(value);
}

export function normalizeFacebookContentSlug(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, "_");
}

export function isValidFacebookContentSlug(value: string): boolean {
  return CONTENT_ID_SLUG_PATTERN.test(normalizeFacebookContentSlug(value));
}

/**
 * Bounded non-PII utm_content for company Page posts.
 * Example: company_seo_mistakes_001
 */
export function buildFacebookCompanyUtmContent(slug: string): string | null {
  const normalized = normalizeFacebookContentSlug(slug);
  if (!isValidFacebookContentSlug(normalized)) {
    return null;
  }
  const value = `company_${normalized}`;
  return value.length <= 80 ? value : null;
}

/**
 * Bounded non-PII utm_content for founder/personal posts.
 * Example: founder_lessons_001
 */
export function buildFacebookFounderUtmContent(slug: string): string | null {
  const normalized = normalizeFacebookContentSlug(slug);
  if (!isValidFacebookContentSlug(normalized)) {
    return null;
  }
  const value = `founder_${normalized}`;
  return value.length <= 80 ? value : null;
}

export function classifyFacebookPublisherFromUtmContent(
  content: string | null | undefined,
): FacebookPublisherType | null {
  if (!content) {
    return null;
  }
  const normalized = normalizeFacebookContentSlug(content);
  if (normalized.startsWith("company_")) {
    return "COMPANY";
  }
  if (normalized.startsWith("founder_")) {
    return "FOUNDER";
  }
  return null;
}

export function classifyFacebookPublisherFromCampaign(
  campaign: string | null | undefined,
): FacebookPublisherType | null {
  if (!campaign) {
    return null;
  }
  const normalized = normalizeFacebookContentSlug(campaign);
  if (normalized === FACEBOOK_FOUNDER_CAMPAIGN) {
    return "FOUNDER";
  }
  if (
    normalized === FACEBOOK_PAGE_CAMPAIGN ||
    normalized === "website_growth" ||
    normalized === "page"
  ) {
    return "COMPANY";
  }
  return null;
}

/**
 * Classify Facebook organic attribution using content prefix first, then campaign.
 */
export function classifyFacebookOrganicPublisher(input: {
  source?: string | null;
  medium?: string | null;
  campaign?: string | null;
  content?: string | null;
}): FacebookPublisherType | null {
  const source = input.source?.trim().toLowerCase();
  const medium = input.medium?.trim().toLowerCase();
  if (source !== "facebook" || medium !== "organic_social") {
    return null;
  }
  return (
    classifyFacebookPublisherFromUtmContent(input.content) ??
    classifyFacebookPublisherFromCampaign(input.campaign)
  );
}

export function safePercent(
  numerator: number | null | undefined,
  denominator: number | null | undefined,
):
  | { status: "AVAILABLE"; value: number }
  | { status: "ZERO"; value: 0 }
  | { status: "INSUFFICIENT_DATA" }
  | { status: "NOT_CAPTURED" }
  | { status: "UNKNOWN" } {
  if (numerator == null || denominator == null) {
    return { status: "NOT_CAPTURED" };
  }
  if (denominator === 0 && numerator === 0) {
    return { status: "ZERO", value: 0 };
  }
  if (denominator <= 0) {
    return { status: "UNKNOWN" };
  }
  if (denominator < 5) {
    return { status: "INSUFFICIENT_DATA" };
  }
  return {
    status: "AVAILABLE",
    value: Math.round((numerator / denominator) * 1000) / 10,
  };
}

export function netFollowerChange(
  current: number | null | undefined,
  baseline: number | null | undefined,
):
  | { status: "AVAILABLE"; value: number }
  | { status: "NOT_CAPTURED" } {
  if (current == null || baseline == null) {
    return { status: "NOT_CAPTURED" };
  }
  return { status: "AVAILABLE", value: current - baseline };
}

export function followerGrowthRatePercent(
  current: number | null | undefined,
  baseline: number | null | undefined,
): ReturnType<typeof safePercent> {
  if (current == null || baseline == null) {
    return { status: "NOT_CAPTURED" };
  }
  if (baseline === 0) {
    return current === 0
      ? { status: "ZERO", value: 0 }
      : { status: "INSUFFICIENT_DATA" };
  }
  return safePercent(current - baseline, baseline);
}

export type FacebookManualMetricsInput = {
  views?: number | null;
  reach?: number | null;
  engagements?: number | null;
  reactions?: number | null;
  comments?: number | null;
  shares?: number | null;
  pageVisits?: number | null;
  followersGained?: number | null;
  linkClicks?: number | null;
};

export function validateFacebookManualMetrics(
  input: FacebookManualMetricsInput,
): { ok: true; metrics: Record<string, number> } | { ok: false; error: string } {
  const out: Record<string, number> = {};
  for (const [key, value] of Object.entries(input)) {
    if (value == null) {
      continue;
    }
    if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
      return { ok: false, error: `${key} must be a non-negative number` };
    }
    if (!Number.isInteger(value)) {
      return { ok: false, error: `${key} must be an integer` };
    }
    out[key] = value;
  }
  return { ok: true, metrics: out };
}

/** Experimental 30-day follower TARGET — not a forecast. */
export const FACEBOOK_FOLLOWER_TARGET_FRAMEWORK = {
  baselineFollowers: 75,
  label: "TARGET",
  windows: {
    days30: { minAbsoluteGain: 5, stretchAbsoluteGain: 15 },
    days60: { minAbsoluteGain: 12, stretchAbsoluteGain: 35 },
    days90: { minAbsoluteGain: 20, stretchAbsoluteGain: 60 },
  },
  notes:
    "Targets are experimental operating goals after Sprint 3 measurement begins. They are not predictions. Recalibrate after the first 28-day Facebook snapshot with AVAILABLE totals.",
} as const;
