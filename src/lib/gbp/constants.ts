/**
 * Growth Sprint 12.1 — Google Business Profile Read Integration V1.
 * READ FIRST. COMPARE SECOND. OPERATOR DECIDES. No GBP writes.
 */

export const GBP_READ_INTEGRATION_VERSION = 1 as const;

/** Official OAuth scope for Business Profile APIs. */
export const GBP_OAUTH_SCOPE =
  "https://www.googleapis.com/auth/business.manage" as const;

/** Deprecated — do not request for new apps. */
export const GBP_OAUTH_SCOPE_DEPRECATED =
  "https://www.googleapis.com/auth/plus.business.manage" as const;

export const GBP_OAUTH_CALLBACK_PATH = "/api/gbp/oauth/callback" as const;

export const GBP_CONNECTION_UI_STATES = [
  "NOT_CONFIGURED",
  "NOT_CONNECTED",
  "CONNECTED",
  "SYNCING",
  "SYNCED",
  "AUTH_EXPIRED",
  "ERROR",
  "DISCONNECTED",
] as const;
export type GbpConnectionUiState = (typeof GBP_CONNECTION_UI_STATES)[number];

export const GBP_SYNC_OPERATIONS = [
  "PROFILE",
  "PERFORMANCE",
  "ALL",
] as const;
export type GbpSyncOperation = (typeof GBP_SYNC_OPERATIONS)[number];

/** Checklist items that can be objectively auto-matched from API fields. */
export const GBP_OBJECTIVE_CHECKLIST_KEYS = [
  "BUSINESS_NAME",
  "WEBSITE",
  "WEBSITE_UTM",
  "PHONE",
  "ADDRESS_OR_SERVICE_AREA",
] as const;

/** Checklist items that stay NOT_REVIEWED after API observation (subjective). */
export const GBP_SUBJECTIVE_CHECKLIST_KEYS = [
  "PRIMARY_CATEGORY",
  "ADDITIONAL_CATEGORIES",
  "BUSINESS_DESCRIPTION",
  "HOURS",
  "SPECIAL_HOURS",
  "SERVICES",
  "ATTRIBUTES",
  "PHOTOS",
  "LOGO",
  "COVER",
  "POSTS",
  "REVIEWS",
  "REVIEW_RESPONSES",
  "QUESTIONS_ANSWERS",
  "SOCIAL_PROFILES",
] as const;

/** Fields unsupported or deferred for V1 sync — not integration failures. */
export const GBP_UNSUPPORTED_FOR_V1 = [
  "PHOTOS",
  "LOGO",
  "COVER",
  "POSTS",
  "QUESTIONS_ANSWERS",
  "SOCIAL_PROFILES",
  "ATTRIBUTES",
  "REVIEW_RESPONSES",
] as const;

export const GBP_READ_SIDE_EFFECT_BUDGET = {
  /** Explicit Sync Profile / Sync Performance may call Google; dashboard load must not. */
  DASHBOARD_LOAD_GBP_API: 0,
  OPENAI: 0,
  META: 0,
  GSC_API: 0,
  PLACES: 0,
  AUTO_WRITE: 0,
  AUTO_POST: 0,
  AUTO_REVIEW_REPLY: 0,
} as const;

export const GBP_PERFORMANCE_METRICS_V1 = [
  "BUSINESS_IMPRESSIONS_DESKTOP_MAPS",
  "BUSINESS_IMPRESSIONS_DESKTOP_SEARCH",
  "BUSINESS_IMPRESSIONS_MOBILE_MAPS",
  "BUSINESS_IMPRESSIONS_MOBILE_SEARCH",
  "CALL_CLICKS",
  "WEBSITE_CLICKS",
  "BUSINESS_DIRECTION_REQUESTS",
  "BUSINESS_CONVERSATIONS",
  "BUSINESS_BOOKINGS",
] as const;

export type GbpProfileSnapshotV1 = {
  version: typeof GBP_READ_INTEGRATION_VERSION;
  locationResourceName: string;
  title: string | null;
  primaryPhone: string | null;
  websiteUri: string | null;
  primaryCategory: { name: string | null; displayName: string | null } | null;
  additionalCategories: Array<{
    name: string | null;
    displayName: string | null;
  }>;
  description: string | null;
  regularHoursSummary: string | null;
  specialHoursSummary: string | null;
  /** Public-safe service-area summary — never force storefront address. */
  serviceAreaSummary: string | null;
  /** True when GBP is service-area / customer-location oriented. */
  isServiceAreaBusiness: boolean;
  /** Storefront address is sensitive when addressPublic=false — omit from analytics. */
  hasStorefrontAddress: boolean;
  serviceItems: string[];
  reviewCount: number | null;
  averageRating: number | null;
  unansweredReviewCount: number | null;
  syncedAt: string;
};

export type GbpPerformanceWindowV1 = {
  periodStart: string;
  periodEnd: string;
  profileViews: number | null;
  searchViews: number | null;
  mapsViews: number | null;
  websiteClicks: number | null;
  callClicks: number | null;
  directionRequests: number | null;
  messages: number | null;
  bookings: number | null;
  topSearchKeywords: Array<{ query: string; impressions: number | null }>;
};
