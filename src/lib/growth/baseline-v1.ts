/**
 * Growth Baseline V1 — immutable verified production baseline.
 *
 * Recorded 2026-08-23 before Growth Sprint 2 optimization.
 * Do not invent, estimate, or convert unknowns to zero.
 */

export const GROWTH_BASELINE_VERSION = 1 as const;

export const GROWTH_BASELINE_LABEL = "Growth Baseline V1";

/** Calendar date the baseline was recorded (America/Chicago ops day). */
export const GROWTH_BASELINE_DATE = "2026-08-23";

/** Shared measurement window used for GSC + Facebook baselines. */
export const GROWTH_BASELINE_PERIOD = {
  start: "2026-07-26",
  end: "2026-08-22",
} as const;

export const DATA_STATUS = {
  AVAILABLE: "AVAILABLE",
  INSUFFICIENT_DATA: "INSUFFICIENT_DATA",
  NOT_CAPTURED: "NOT_CAPTURED",
  NOT_APPLICABLE: "NOT_APPLICABLE",
} as const;

export type DataStatus = (typeof DATA_STATUS)[keyof typeof DATA_STATUS];

/**
 * Production GA4 measurement ID (ops reference only).
 * Must never appear in public analytics event params.
 */
export const GA4_PRODUCTION_MEASUREMENT_ID = "G-0REXF012SK";

export const GROWTH_BASELINE_V1 = {
  version: GROWTH_BASELINE_VERSION,
  label: GROWTH_BASELINE_LABEL,
  recordedAt: GROWTH_BASELINE_DATE,
  period: GROWTH_BASELINE_PERIOD,

  searchConsole: {
    property: "js-growth.com",
    verificationStatus: "VERIFIED" as const,
    homepageUrl: "https://js-growth.com/",
    homepageInspection: {
      onGoogle: true,
      indexed: true,
      eligibleToAppearInSearch: true,
      httpsValid: true,
    },
    period: GROWTH_BASELINE_PERIOD,
    clicks: 0,
    impressions: 2,
    averageCtr: 0,
    averagePosition: 77,
    queryDataStatus: DATA_STATUS.INSUFFICIENT_DATA,
    /** Do not treat as an empty query list — volume too low to expose queries. */
    topQueries: DATA_STATUS.INSUFFICIENT_DATA,
    topPages: DATA_STATUS.INSUFFICIENT_DATA,
  },

  ga4: {
    measurementId: GA4_PRODUCTION_MEASUREMENT_ID,
    productionTrackingVerified: true,
    verifiedAt: GROWTH_BASELINE_DATE,
    observedRealtimeEvents: [
      "page_view",
      "audit_landing_view",
      "audit_started",
      "audit_submitted",
      "audit_completed",
      "first_visit",
    ] as const,
    verifiedFunnel: [
      "audit_landing_view",
      "audit_started",
      "audit_submitted",
      "audit_completed",
    ] as const,
    keyEventCandidates: [
      "audit_submitted",
      "contact_form_submitted",
    ] as const,
    /**
     * Realtime validation is instrumentation evidence — not a historical
     * traffic baseline. Do not invent users/sessions totals from Realtime.
     */
    historicalTrafficTotalsStatus: DATA_STATUS.NOT_CAPTURED,
    monitorEventCardinality: {
      status: "MONITOR_EVENT_CARDINALITY" as const,
      observedDuringRealtimeValidation: {
        audit_submitted: 1,
        audit_completed: 2,
      },
      reason:
        "Sample size too small to determine whether audit_completed can duplicate per audit. Verify completion-event cardinality before relying on completion-rate calculations.",
    },
  },

  facebook: {
    property: "js_solutions_page" as const,
    source: "JS Solutions Facebook Professional Dashboard",
    period: GROWTH_BASELINE_PERIOD,
    followers: 75,
    followerChangePercentVsPrevious28d: 2.7,
    visits: 9,
    visitChangePercentVsPrevious28d: -78.6,
    engagements: 5,
    engagementChangePercentVsPrevious28d: 100,
    viewsByFollowerStatus: {
      nonFollowersPercent: 95.3,
      followersPercent: 4.7,
    },
    viewsByContentType: {
      photoPercent: 90.3,
      textPercent: 7.0,
      linkPercent: 2.6,
    },
    engagementByFollowerStatus: {
      nonFollowersPercent: 100,
      followersPercent: 0,
    },
    engagementInteractionType: {
      reactionsPercent: 100,
    },
    topFansStatus: DATA_STATUS.INSUFFICIENT_DATA,
    audienceDemographicsStatus: DATA_STATUS.INSUFFICIENT_DATA,
    howPeopleFindContentStatus: DATA_STATUS.INSUFFICIENT_DATA,
    /** Explicitly not estimated from dashboard graphs. */
    totalViewsStatus: DATA_STATUS.NOT_CAPTURED,
  },

  interpretation: {
    search:
      "Organic search visibility is at an early-stage baseline. The site is indexed and eligible for Google Search. Last 28 days: 0 clicks, 2 impressions, 0% CTR, average position 77. This is a clean starting point for SEO growth measurement — not an indexing defect characterization.",
    facebook:
      "Facebook already distributes content beyond the follower base (95.3% non-follower views). Visits=9 and engagements=5 suggest discovery exists but progression to website/audit/lead needs improvement. Hypothesis only — no causation claimed.",
    contentFormat:
      "Photos accounted for 90.3% of Facebook views and 100% of recorded engagement. Supports continued strong visual content while testing formats such as Reels. Insufficient data to conclude Reels perform worse.",
  },

  hypotheses: [
    "Discovery exists on Facebook, but we need to improve progression: content exposure → engagement → profile/page visit → website visit → audit start → audit submission → lead → opportunity → client.",
  ] as const,

  limitations: [
    "GSC query/page breakdown unavailable (INSUFFICIENT_DATA) due to low search volume.",
    "Facebook Total Views NOT_CAPTURED — not estimated from graphs.",
    "Facebook top fans, demographics, and how-people-find-content INSUFFICIENT_DATA.",
    "GA4 Realtime confirms instrumentation only; historical traffic totals NOT_CAPTURED for Baseline V1.",
    "MONITOR_EVENT_CARDINALITY: audit_submitted=1 vs audit_completed=2 in a tiny Realtime sample — not classified as a confirmed defect.",
  ] as const,

  comparisonTargets: {
    search: [
      "impressions",
      "clicks",
      "CTR",
      "average position",
      "ranking queries",
      "ranking pages",
    ],
    facebook: [
      "views",
      "reach where available",
      "engagements",
      "visits",
      "followers",
      "follower growth",
      "non-follower distribution",
      "website/link traffic",
    ],
    website: [
      "users",
      "sessions",
      "qualified visits",
      "audit landing views",
      "audit starts",
      "audit submissions",
      "audit completions",
      "contact submissions",
      "professional audit CTA clicks",
    ],
    business: [
      "prospects",
      "opportunities",
      "proposals",
      "accepted agreements",
      "deposits/payments",
      "clients",
      "attributed revenue where authoritative",
    ],
  },

  nextMeasurementProcess:
    "Before Growth Sprint reviews, re-pull the same windows (or comparable 28-day periods), record new GrowthSnapshots, and compare against Growth Baseline V1 without backfilling unknowns.",
} as const;

export type GrowthBaselineV1 = typeof GROWTH_BASELINE_V1;

/** Snapshot metrics payloads that validate against growth snapshot schemas. */
export function buildGrowthBaselineV1SnapshotPayloads(): {
  searchConsole: Record<string, unknown>;
  ga4: Record<string, unknown>;
  facebook: Record<string, unknown>;
} {
  const b = GROWTH_BASELINE_V1;

  return {
    searchConsole: {
      baselineVersion: GROWTH_BASELINE_VERSION,
      baselineLabel: GROWTH_BASELINE_LABEL,
      clicks: b.searchConsole.clicks,
      impressions: b.searchConsole.impressions,
      averageCtr: b.searchConsole.averageCtr,
      averagePosition: b.searchConsole.averagePosition,
      queryDataStatus: DATA_STATUS.INSUFFICIENT_DATA,
      propertyVerification: "VERIFIED",
      // Intentionally omit topQueries/topPages — INSUFFICIENT_DATA, not empty lists.
      notes:
        "Growth Baseline V1. Property js-growth.com VERIFIED. Homepage indexed and eligible. Query-level data INSUFFICIENT_DATA (too little search volume). Do not interpret missing topQueries as zero queries.",
    },
    ga4: {
      baselineVersion: GROWTH_BASELINE_VERSION,
      baselineLabel: GROWTH_BASELINE_LABEL,
      instrumentationStatus: "VERIFIED_WORKING",
      historicalTrafficTotalsStatus: DATA_STATUS.NOT_CAPTURED,
      keyEventCandidates: [...b.ga4.keyEventCandidates],
      notes:
        "Growth Baseline V1. Production Realtime verified 2026-08-23 for funnel events. Measurement ID is ops config only (not stored here). Realtime is NOT a historical traffic baseline. MONITOR_EVENT_CARDINALITY: during validation audit_submitted=1 audit_completed=2 — monitor, not confirmed defect.",
    },
    facebook: {
      baselineVersion: GROWTH_BASELINE_VERSION,
      baselineLabel: GROWTH_BASELINE_LABEL,
      property: "js_solutions_page",
      followers: b.facebook.followers,
      pageVisits: b.facebook.visits,
      engagement: b.facebook.engagements,
      followerChangePercent: b.facebook.followerChangePercentVsPrevious28d,
      visitChangePercent: b.facebook.visitChangePercentVsPrevious28d,
      engagementChangePercent: b.facebook.engagementChangePercentVsPrevious28d,
      nonFollowerViewPercent: b.facebook.viewsByFollowerStatus.nonFollowersPercent,
      followerViewPercent: b.facebook.viewsByFollowerStatus.followersPercent,
      photoViewPercent: b.facebook.viewsByContentType.photoPercent,
      textViewPercent: b.facebook.viewsByContentType.textPercent,
      linkViewPercent: b.facebook.viewsByContentType.linkPercent,
      engagementNonFollowerPercent:
        b.facebook.engagementByFollowerStatus.nonFollowersPercent,
      engagementFollowerPercent:
        b.facebook.engagementByFollowerStatus.followersPercent,
      engagementReactionsPercent:
        b.facebook.engagementInteractionType.reactionsPercent,
      totalViewsStatus: DATA_STATUS.NOT_CAPTURED,
      topFansStatus: DATA_STATUS.INSUFFICIENT_DATA,
      audienceDemographicsStatus: DATA_STATUS.INSUFFICIENT_DATA,
      howPeopleFindContentStatus: DATA_STATUS.INSUFFICIENT_DATA,
      // contentViews / impressions / reach intentionally omitted (NOT_CAPTURED).
      notes:
        "Growth Baseline V1. JS Solutions Page only (not founder/personal). Total Views NOT_CAPTURED — do not estimate from graphs. Top fans / demographics / how-people-find-content INSUFFICIENT_DATA.",
    },
  };
}

export function isInsufficientData(value: unknown): boolean {
  return value === DATA_STATUS.INSUFFICIENT_DATA;
}

export function isNotCaptured(value: unknown): boolean {
  return value === DATA_STATUS.NOT_CAPTURED;
}
