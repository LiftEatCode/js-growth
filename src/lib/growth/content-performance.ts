/**
 * Growth Sprint 7 — Content Performance Feedback V1
 *
 * Observed performance informs deterministic recommendations.
 * It does not auto-modify production content or invent metrics.
 */

export const CONTENT_PERFORMANCE_VERSION = 1 as const;

/** Public-safe content slug for UTM / analytics dimensions — never DB cuids. */
export const SEO_SERVICE_PAGE_PUBLIC_SLUG = "seo_service_page" as const;

export const CONTENT_MEASUREMENT_STATES = [
  "NOT_PUBLISHED",
  "PUBLISHED_AWAITING_DATA",
  "EARLY_DATA",
  "MEASURING",
  "ENOUGH_DATA_FOR_REVIEW",
  "REFRESH_CANDIDATE",
] as const;
export type ContentMeasurementState =
  (typeof CONTENT_MEASUREMENT_STATES)[number];

export const CONTENT_INDEXING_STATES = [
  "NOT_APPLICABLE",
  "PUBLISHED_NOT_VERIFIED",
  "INDEXING_REQUESTED",
  "INDEXED",
  "UNKNOWN",
] as const;
export type ContentIndexingState = (typeof CONTENT_INDEXING_STATES)[number];

export const CONTENT_PERFORMANCE_LABELS = [
  "NO_DATA",
  "EARLY_SIGNAL",
  "DISCOVERY_GROWING",
  "TRAFFIC_GROWING",
  "ENGAGEMENT_SIGNAL",
  "BUSINESS_SIGNAL",
  "FLAT",
  "DECLINING",
  "REVIEW_REQUIRED",
  "INSUFFICIENT_DATA",
] as const;
export type ContentPerformanceLabel =
  (typeof CONTENT_PERFORMANCE_LABELS)[number];

export const EVIDENCE_KINDS = [
  "ATTRIBUTED",
  "OBSERVED",
  "INFERRED",
  "HYPOTHESIS",
] as const;
export type EvidenceKind = (typeof EVIDENCE_KINDS)[number];

export const DATA_AVAILABILITY = [
  "NO_DATA",
  "NOT_CAPTURED",
  "INSUFFICIENT_DATA",
  "AVAILABLE",
] as const;
export type DataAvailability = (typeof DATA_AVAILABILITY)[number];

/** Internal operating review windows — not ranking deadlines. */
export const CONTENT_REVIEW_WINDOWS = {
  EARLY_CHECK_DAYS: 14,
  INDEXING_CHECK_DAYS: 7,
  DAY_28_REVIEW: 28,
  DAY_90_REVIEW: 90,
  /** Minimum days + impressions before DISCOVERY_GROWING can apply. */
  EARLY_SIGNAL_MIN_DAYS: 7,
  EARLY_SIGNAL_MIN_IMPRESSIONS: 10,
  MEASURING_MIN_DAYS: 28,
  REVIEW_MIN_DAYS: 90,
} as const;

export type ManualSearchPerformanceCapture = {
  windowStart: string;
  windowEnd: string;
  clicks: number | null;
  impressions: number | null;
  ctr: number | null;
  averagePosition: number | null;
  queryDataStatus: DataAvailability;
  notes?: string;
  capturedAt: string;
  evidenceKind: "OBSERVED";
};

export type ContentPerformanceStateV1 = {
  version: typeof CONTENT_PERFORMANCE_VERSION;
  publicContentSlug: string;
  measurementState: ContentMeasurementState;
  indexingState: ContentIndexingState;
  performanceLabel: ContentPerformanceLabel;
  publishedAt: string | null;
  recommendedLinks: string[];
  implementedLinks: string[];
  searchEvidence: ManualSearchPerformanceCapture[];
  /** Explicit unknowns — never invent. */
  ga4Status: DataAvailability;
  firstPartyStatus: DataAvailability;
  businessOutcomeStatus: DataAvailability;
  lastReviewNote?: string;
};

export function createInitialPerformanceState(input: {
  publicContentSlug: string;
  recommendedLinks: string[];
  implementedLinks: string[];
}): ContentPerformanceStateV1 {
  return {
    version: CONTENT_PERFORMANCE_VERSION,
    publicContentSlug: input.publicContentSlug,
    measurementState: "NOT_PUBLISHED",
    indexingState: "NOT_APPLICABLE",
    performanceLabel: "NO_DATA",
    publishedAt: null,
    recommendedLinks: input.recommendedLinks,
    implementedLinks: input.implementedLinks,
    searchEvidence: [],
    ga4Status: "NO_DATA",
    firstPartyStatus: "NO_DATA",
    businessOutcomeStatus: "NO_DATA",
  };
}

export function performanceStateAfterPublish(input: {
  previous: ContentPerformanceStateV1 | null;
  publishedAt: Date;
  publicContentSlug: string;
  recommendedLinks: string[];
  implementedLinks: string[];
}): ContentPerformanceStateV1 {
  const base =
    input.previous ??
    createInitialPerformanceState({
      publicContentSlug: input.publicContentSlug,
      recommendedLinks: input.recommendedLinks,
      implementedLinks: input.implementedLinks,
    });
  return {
    ...base,
    version: CONTENT_PERFORMANCE_VERSION,
    publicContentSlug: input.publicContentSlug,
    recommendedLinks: input.recommendedLinks,
    implementedLinks: input.implementedLinks,
    measurementState: "PUBLISHED_AWAITING_DATA",
    indexingState: "PUBLISHED_NOT_VERIFIED",
    performanceLabel: "NO_DATA",
    publishedAt: input.publishedAt.toISOString(),
    // Preserve prior captures if any; new page starts NO_DATA for analytics dims
    ga4Status: "NO_DATA",
    firstPartyStatus: "NO_DATA",
    businessOutcomeStatus: "NO_DATA",
  };
}

export function daysSincePublished(
  publishedAt: Date | string | null,
  now: Date = new Date(),
): number | null {
  if (!publishedAt) return null;
  const start =
    publishedAt instanceof Date ? publishedAt : new Date(publishedAt);
  if (Number.isNaN(start.getTime())) return null;
  return Math.floor((now.getTime() - start.getTime()) / 86_400_000);
}

/**
 * Deterministic measurement + label rules.
 * Zeros after capture are valid; missing capture stays NO_DATA / NOT_CAPTURED.
 */
export function deriveMeasurementAndLabel(input: {
  publishedAt: Date | string | null;
  latestSearch: ManualSearchPerformanceCapture | null;
  now?: Date;
}): {
  measurementState: ContentMeasurementState;
  performanceLabel: ContentPerformanceLabel;
} {
  const now = input.now ?? new Date();
  if (!input.publishedAt) {
    return {
      measurementState: "NOT_PUBLISHED",
      performanceLabel: "NO_DATA",
    };
  }
  const days = daysSincePublished(input.publishedAt, now) ?? 0;
  const search = input.latestSearch;

  if (!search) {
    if (days < CONTENT_REVIEW_WINDOWS.EARLY_CHECK_DAYS) {
      return {
        measurementState: "PUBLISHED_AWAITING_DATA",
        performanceLabel: "NO_DATA",
      };
    }
    return {
      measurementState: "EARLY_DATA",
      performanceLabel: "INSUFFICIENT_DATA",
    };
  }

  const impressions = search.impressions;
  const clicks = search.clicks;

  if (impressions == null && clicks == null) {
    return {
      measurementState:
        days >= CONTENT_REVIEW_WINDOWS.MEASURING_MIN_DAYS
          ? "MEASURING"
          : "EARLY_DATA",
      performanceLabel: "INSUFFICIENT_DATA",
    };
  }

  // Observed zero is valid data.
  const imp = impressions ?? 0;
  const clk = clicks ?? 0;

  let measurementState: ContentMeasurementState = "EARLY_DATA";
  if (days >= CONTENT_REVIEW_WINDOWS.REVIEW_MIN_DAYS) {
    measurementState = "ENOUGH_DATA_FOR_REVIEW";
  } else if (days >= CONTENT_REVIEW_WINDOWS.MEASURING_MIN_DAYS) {
    measurementState = "MEASURING";
  }

  let performanceLabel: ContentPerformanceLabel = "EARLY_SIGNAL";
  if (
    days >= CONTENT_REVIEW_WINDOWS.EARLY_SIGNAL_MIN_DAYS &&
    imp >= CONTENT_REVIEW_WINDOWS.EARLY_SIGNAL_MIN_IMPRESSIONS
  ) {
    performanceLabel = "DISCOVERY_GROWING";
  }
  if (clk >= 5) {
    performanceLabel = "TRAFFIC_GROWING";
  }
  if (days < CONTENT_REVIEW_WINDOWS.EARLY_SIGNAL_MIN_DAYS) {
    performanceLabel = "EARLY_SIGNAL";
  }
  if (imp === 0 && clk === 0 && days >= CONTENT_REVIEW_WINDOWS.DAY_28_REVIEW) {
    performanceLabel = "FLAT";
  }

  return { measurementState, performanceLabel };
}

export function canEnterPublishingHandoff(status: string): {
  ok: boolean;
  error?: string;
} {
  if (status !== "APPROVED") {
    return {
      ok: false,
      error: `Publishing handoff requires APPROVED (current: ${status}).`,
    };
  }
  return { ok: true };
}

export function canMarkPlanPublished(input: {
  status: string;
  publishedUrl: string | null | undefined;
  hasCanonicalDraft: boolean;
}): { ok: boolean; error?: string } {
  const handoff = canEnterPublishingHandoff(input.status);
  if (!handoff.ok) return handoff;
  if (!input.publishedUrl?.trim()) {
    return { ok: false, error: "publishedUrl required." };
  }
  if (!input.hasCanonicalDraft) {
    return {
      ok: false,
      error: "Canonical draft (human preferred) required before PUBLISHED.",
    };
  }
  return { ok: true };
}

/** Canonical draft authority: human > generation; candidate never publishes. */
export function resolveCanonicalDraftSource(input: {
  humanDraftJson: unknown | null;
  generationJson: unknown | null;
  candidateDraftJson: unknown | null;
}): {
  source: "humanDraftJson" | "generationJson" | "none";
  draft: unknown | null;
  candidateIsNotAuthority: true;
} {
  if (input.humanDraftJson != null) {
    return {
      source: "humanDraftJson",
      draft: input.humanDraftJson,
      candidateIsNotAuthority: true,
    };
  }
  if (input.generationJson != null) {
    return {
      source: "generationJson",
      draft: input.generationJson,
      candidateIsNotAuthority: true,
    };
  }
  return {
    source: "none",
    draft: null,
    candidateIsNotAuthority: true,
  };
}

export function parsePerformanceJson(
  value: unknown,
): ContentPerformanceStateV1 | null {
  if (!value || typeof value !== "object") return null;
  const v = value as ContentPerformanceStateV1;
  if (v.version !== CONTENT_PERFORMANCE_VERSION) return null;
  return v;
}

/**
 * Content Learning V1 — with n=1, INSUFFICIENT_DATA dominates.
 * Never declare a winning content type from a single asset.
 */
export type ContentLearningSummaryV1 = {
  version: typeof CONTENT_PERFORMANCE_VERSION;
  sampleSize: number;
  status: "INSUFFICIENT_DATA" | "EARLY_OBSERVATIONS";
  dimensions: {
    contentType: string;
    topic: string;
    intent: string | null;
    publisher: string;
  };
  observations: string[];
  causationBoundary: string;
};

export function buildContentLearningSummary(input: {
  contentType: string;
  topic: string;
  intent: string | null;
  publisher: string;
  publishedAssetCount: number;
  performanceLabel: ContentPerformanceLabel;
}): ContentLearningSummaryV1 {
  const observations: string[] = [];
  if (input.publishedAssetCount < 3) {
    observations.push(
      `Sample size ${input.publishedAssetCount} — do not declare winners by content type.`,
    );
  }
  observations.push(
    `Latest label for this asset class context: ${input.performanceLabel} (OBSERVED/INFERRED only).`,
  );
  return {
    version: CONTENT_PERFORMANCE_VERSION,
    sampleSize: input.publishedAssetCount,
    status:
      input.publishedAssetCount < 3
        ? "INSUFFICIENT_DATA"
        : "EARLY_OBSERVATIONS",
    dimensions: {
      contentType: input.contentType,
      topic: input.topic,
      intent: input.intent,
      publisher: input.publisher,
    },
    observations,
    causationBoundary:
      "Visibility/traffic changes are OBSERVED. Business outcomes require first-party attribution before ATTRIBUTED claims. Never equate correlation with causation.",
  };
}

export const SEO_PAGE_RECOMMENDED_LINKS = [
  "/website-audit",
  "/local-seo",
  "/websites",
  "/contact",
] as const;

export const SEO_PAGE_IMPLEMENTED_LINKS = [
  "/website-audit",
  "/local-seo",
  "/websites",
  "/contact",
] as const;
