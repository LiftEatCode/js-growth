/**
 * Growth Sprint 8 — Content Performance Review & Optimization Engine V1
 *
 * Prefer INSUFFICIENT_DATA / KEEP_MONITORING / NO_ACTION over fake confidence.
 * Does not auto-refresh, auto-publish, or invent metrics.
 */

import {
  CONTENT_PERFORMANCE_VERSION,
  CONTENT_REVIEW_WINDOWS,
  daysSincePublished,
  type ContentIndexingState,
  type ContentMeasurementState,
  type ContentPerformanceLabel,
  type ContentPerformanceStateV1,
  type DataAvailability,
  type ManualSearchPerformanceCapture,
} from "@/lib/growth/content-performance";

export const CONTENT_REVIEW_VERSION = 1 as const;

/** Operator checkpoints — not ranking deadlines. */
export const CONTENT_REVIEW_CHECKPOINTS = [
  "POST_PUBLISH_QA",
  "INDEXING_CHECK",
  "DAY_7",
  "DAY_28",
  "DAY_90",
  "MANUAL_REVIEW",
] as const;
export type ContentReviewCheckpoint =
  (typeof CONTENT_REVIEW_CHECKPOINTS)[number];

export const CONTENT_REVIEW_DECISIONS = [
  "KEEP_MONITORING",
  "NO_CHANGE",
  "DISTRIBUTE_MORE",
  "ADD_INTERNAL_LINKS",
  "IMPROVE_CTA",
  "EXPAND_CONTENT",
  "REFRESH_CONTENT",
  "REPURPOSE",
  "CONSOLIDATE",
  "ARCHIVE",
  "INVESTIGATE",
] as const;
export type ContentReviewDecision = (typeof CONTENT_REVIEW_DECISIONS)[number];

export const EVIDENCE_STRENGTHS = [
  "NONE",
  "WEAK",
  "DIRECTIONAL",
  "MEANINGFUL",
] as const;
export type EvidenceStrength = (typeof EVIDENCE_STRENGTHS)[number];

export const TREND_LABELS = ["UP", "DOWN", "FLAT", "UNKNOWN"] as const;
export type TrendLabel = (typeof TREND_LABELS)[number];

export const DUE_REVIEW_QUEUE_KINDS = [
  "DUE_INDEXING_CHECK",
  "DUE_7_DAY_REVIEW",
  "DUE_28_DAY_REVIEW",
  "DUE_90_DAY_REVIEW",
  "MANUAL_REVIEW",
] as const;
export type DueReviewQueueKind = (typeof DUE_REVIEW_QUEUE_KINDS)[number];

/** Internal operating thresholds (not client-facing claims). */
export const CONTENT_REVIEW_THRESHOLDS = {
  TITLE_SNIPPET_MIN_IMPRESSIONS: 100,
  MEANINGFUL_MIN_IMPRESSIONS: 200,
  MEANINGFUL_MIN_CLICKS: 20,
  DIRECTIONAL_MIN_IMPRESSIONS: 40,
  DIRECTIONAL_MIN_CLICKS: 5,
  TREND_MIN_ABS_IMPRESSION_DELTA: 20,
  TREND_MIN_REL_CHANGE: 0.25,
  CTR_RATIO_TOLERANCE: 0.02,
  MAX_REVIEW_HISTORY: 40,
  LEARNING_MIN_SAMPLE: 3,
} as const;

export type ContentReviewRecordV1 = {
  reviewVersion: typeof CONTENT_REVIEW_VERSION;
  id: string;
  checkpoint: ContentReviewCheckpoint;
  createdAt: string;
  createdByEmail: string;
  decision: ContentReviewDecision;
  evidenceStrength: EvidenceStrength;
  performanceLabel: ContentPerformanceLabel;
  measurementState: ContentMeasurementState;
  indexingState: ContentIndexingState;
  observedFacts: string[];
  interpretations: string[];
  hypotheses: string[];
  recommendations: string[];
  notes?: string;
  searchWindowStart?: string;
  searchWindowEnd?: string;
  comparedToPrevious: boolean;
  trend?: TrendLabel;
};

export type DueReviewItem = {
  planId: string;
  slug: string;
  publishedUrl: string | null;
  kind: DueReviewQueueKind;
  checkpoint: ContentReviewCheckpoint;
  dueAt: string;
  reason: string;
};

export function isContentReviewDecision(
  value: string,
): value is ContentReviewDecision {
  return (CONTENT_REVIEW_DECISIONS as readonly string[]).includes(value);
}

export function isContentReviewCheckpoint(
  value: string,
): value is ContentReviewCheckpoint {
  return (CONTENT_REVIEW_CHECKPOINTS as readonly string[]).includes(value);
}

/** Extend indexing states used by Sprint 7 with INDEXING_ISSUE (same performance version). */
export const REVIEW_INDEXING_STATES = [
  "NOT_APPLICABLE",
  "PUBLISHED_NOT_VERIFIED",
  "INDEXING_REQUESTED",
  "INDEXED",
  "INDEXING_ISSUE",
  "UNKNOWN",
] as const;

export function validateSearchCtr(input: {
  clicks: number | null;
  impressions: number | null;
  ctr: number | null;
}): { ok: boolean; warning?: string } {
  if (input.clicks == null || input.impressions == null || input.ctr == null) {
    return { ok: true };
  }
  if (input.impressions === 0) {
    if (input.clicks !== 0) {
      return { ok: false, warning: "Clicks cannot be > 0 when impressions are 0." };
    }
    return { ok: true };
  }
  const expected = input.clicks / input.impressions;
  const delta = Math.abs(expected - input.ctr);
  if (delta > CONTENT_REVIEW_THRESHOLDS.CTR_RATIO_TOLERANCE) {
    return {
      ok: false,
      warning: `CTR (${input.ctr}) disagrees with clicks/impressions (${expected.toFixed(4)}). Correct or clear CTR.`,
    };
  }
  return { ok: true };
}

export function compareSearchWindows(input: {
  current: ManualSearchPerformanceCapture;
  previous: ManualSearchPerformanceCapture;
}): {
  comparable: boolean;
  trend: TrendLabel;
  reason: string;
} {
  const curDays =
    (Date.parse(input.current.windowEnd) -
      Date.parse(input.current.windowStart)) /
    86_400_000;
  const prevDays =
    (Date.parse(input.previous.windowEnd) -
      Date.parse(input.previous.windowStart)) /
    86_400_000;
  if (
    !Number.isFinite(curDays) ||
    !Number.isFinite(prevDays) ||
    Math.abs(curDays - prevDays) > 1.5
  ) {
    return {
      comparable: false,
      trend: "UNKNOWN",
      reason: "Window lengths mismatch — comparison unlabeled.",
    };
  }
  const a = input.current.impressions;
  const b = input.previous.impressions;
  if (a == null || b == null) {
    return {
      comparable: true,
      trend: "UNKNOWN",
      reason: "Impressions missing on one window.",
    };
  }
  const abs = Math.abs(a - b);
  const rel = b === 0 ? (a === 0 ? 0 : 1) : abs / b;
  if (
    abs < CONTENT_REVIEW_THRESHOLDS.TREND_MIN_ABS_IMPRESSION_DELTA &&
    rel < CONTENT_REVIEW_THRESHOLDS.TREND_MIN_REL_CHANGE
  ) {
    return { comparable: true, trend: "FLAT", reason: "Change below noise threshold." };
  }
  if (a > b) {
    return { comparable: true, trend: "UP", reason: "Impressions increased." };
  }
  if (a < b) {
    return { comparable: true, trend: "DOWN", reason: "Impressions decreased." };
  }
  return { comparable: true, trend: "FLAT", reason: "No impression change." };
}

export function computeEvidenceStrength(input: {
  publishedAt: string | null;
  latestSearch: ManualSearchPerformanceCapture | null;
  indexingState: ContentIndexingState | string;
  now?: Date;
}): EvidenceStrength {
  if (!input.publishedAt) return "NONE";
  const days = daysSincePublished(input.publishedAt, input.now) ?? 0;
  const search = input.latestSearch;
  if (!search) return "NONE";
  const imp = search.impressions;
  const clk = search.clicks;
  if (imp == null && clk == null) return "NONE";
  const impressions = imp ?? 0;
  const clicks = clk ?? 0;

  if (
    impressions >= CONTENT_REVIEW_THRESHOLDS.MEANINGFUL_MIN_IMPRESSIONS &&
    clicks >= CONTENT_REVIEW_THRESHOLDS.MEANINGFUL_MIN_CLICKS &&
    days >= CONTENT_REVIEW_WINDOWS.MEASURING_MIN_DAYS &&
    (input.indexingState === "INDEXED" ||
      input.indexingState === "UNKNOWN" ||
      input.indexingState === "INDEXING_REQUESTED")
  ) {
    return "MEANINGFUL";
  }
  if (
    impressions >= CONTENT_REVIEW_THRESHOLDS.DIRECTIONAL_MIN_IMPRESSIONS ||
    clicks >= CONTENT_REVIEW_THRESHOLDS.DIRECTIONAL_MIN_CLICKS
  ) {
    return days >= CONTENT_REVIEW_WINDOWS.EARLY_SIGNAL_MIN_DAYS
      ? "DIRECTIONAL"
      : "WEAK";
  }
  return "WEAK";
}

export function canReviewPerformance(input: {
  planStatus: string;
  measurementState: ContentMeasurementState | string;
  publishedAt: string | null;
}): { ok: boolean; reason: string } {
  if (
    input.planStatus !== "PUBLISHED" &&
    input.planStatus !== "MONITORING"
  ) {
    return { ok: false, reason: "Plan is not published — no performance review." };
  }
  if (!input.publishedAt) {
    return { ok: false, reason: "publishedAt missing." };
  }
  if (input.measurementState === "NOT_PUBLISHED") {
    return { ok: false, reason: "Measurement state NOT_PUBLISHED." };
  }
  return { ok: true, reason: "Eligible for operator review (data may still be insufficient)." };
}

/**
 * Deterministic recommendation. Defaults to KEEP_MONITORING / NO_CHANGE.
 * Never auto-selects REFRESH for recently published /seo with no data.
 */
export function recommendReviewDecision(input: {
  publishedAt: string | null;
  measurementState: ContentMeasurementState | string;
  performanceLabel: ContentPerformanceLabel | string;
  indexingState: ContentIndexingState | string;
  evidenceStrength: EvidenceStrength;
  latestSearch: ManualSearchPerformanceCapture | null;
  now?: Date;
}): {
  decision: ContentReviewDecision;
  observedFacts: string[];
  interpretations: string[];
  hypotheses: string[];
  recommendations: string[];
} {
  const facts: string[] = [];
  const interpretations: string[] = [];
  const hypotheses: string[] = [];
  const recommendations: string[] = [];
  const days = daysSincePublished(input.publishedAt, input.now);

  if (days != null) {
    facts.push(`Days since publish: ${days} (operator checkpoint math only).`);
  }
  facts.push(`Measurement state: ${input.measurementState}.`);
  facts.push(`Indexing state: ${input.indexingState}.`);
  facts.push(`Evidence strength: ${input.evidenceStrength}.`);

  if (
    input.measurementState === "PUBLISHED_AWAITING_DATA" ||
    input.performanceLabel === "NO_DATA" ||
    input.evidenceStrength === "NONE"
  ) {
    interpretations.push("Not enough Search evidence to interpret outcomes.");
    recommendations.push("Keep monitoring; record Search/indexing when available.");
    return {
      decision: "KEEP_MONITORING",
      observedFacts: facts,
      interpretations,
      hypotheses,
      recommendations,
    };
  }

  if (
    input.performanceLabel === "INSUFFICIENT_DATA" ||
    input.evidenceStrength === "WEAK"
  ) {
    interpretations.push("Sample is too small for confident action.");
    recommendations.push("Do not refresh or expand yet.");
    return {
      decision: "KEEP_MONITORING",
      observedFacts: facts,
      interpretations,
      hypotheses,
      recommendations,
    };
  }

  const search = input.latestSearch;
  const imp = search?.impressions;
  const clk = search?.clicks;

  if (
    imp != null &&
    imp >= CONTENT_REVIEW_THRESHOLDS.TITLE_SNIPPET_MIN_IMPRESSIONS &&
    clk != null &&
    imp > 0 &&
    clk / imp < 0.02
  ) {
    facts.push(
      `Observed impressions=${imp}, clicks=${clk} in captured window.`,
    );
    interpretations.push(
      "With enough impressions, CTR appears low relative to clicks/impressions.",
    );
    hypotheses.push(
      "Title/snippet clarity may be limiting clicks (hypothesis — not proven).",
    );
    recommendations.push(
      "Consider INVESTIGATE / title-snippet review; do not rewrite solely from position.",
    );
    return {
      decision: "INVESTIGATE",
      observedFacts: facts,
      interpretations,
      hypotheses,
      recommendations,
    };
  }

  if (input.performanceLabel === "DISCOVERY_GROWING") {
    interpretations.push("Impressions suggest growing discovery (OBSERVED).");
    hypotheses.push("Internal links or distribution may reinforce topic context.");
    recommendations.push("Consider DISTRIBUTE_MORE or ADD_INTERNAL_LINKS — human decides.");
    return {
      decision: "DISTRIBUTE_MORE",
      observedFacts: facts,
      interpretations,
      hypotheses,
      recommendations,
    };
  }

  if (input.performanceLabel === "FLAT" || input.performanceLabel === "DECLINING") {
    interpretations.push("Captured Search window looks flat/declining (OBSERVED label).");
    hypotheses.push("May need CTA/content alignment check — or simply more time.");
    recommendations.push("Prefer INVESTIGATE before REFRESH_CONTENT.");
    return {
      decision: "INVESTIGATE",
      observedFacts: facts,
      interpretations,
      hypotheses,
      recommendations,
    };
  }

  recommendations.push("No strong action rule matched — keep monitoring.");
  return {
    decision: "NO_CHANGE",
    observedFacts: facts,
    interpretations: [
      "Evidence present but no deterministic action threshold met.",
    ],
    hypotheses,
    recommendations,
  };
}

export function nextCheckpointAfterPublish(
  publishedAt: Date | string,
  now: Date = new Date(),
): { checkpoint: ContentReviewCheckpoint; dueAt: Date } {
  const days = daysSincePublished(publishedAt, now) ?? 0;
  const start =
    publishedAt instanceof Date ? publishedAt : new Date(publishedAt);
  if (days < CONTENT_REVIEW_WINDOWS.INDEXING_CHECK_DAYS) {
    return {
      checkpoint: "INDEXING_CHECK",
      dueAt: new Date(
        start.getTime() +
          CONTENT_REVIEW_WINDOWS.INDEXING_CHECK_DAYS * 86_400_000,
      ),
    };
  }
  if (days < 7) {
    return {
      checkpoint: "DAY_7",
      dueAt: new Date(start.getTime() + 7 * 86_400_000),
    };
  }
  if (days < CONTENT_REVIEW_WINDOWS.DAY_28_REVIEW) {
    return {
      checkpoint: "DAY_28",
      dueAt: new Date(
        start.getTime() + CONTENT_REVIEW_WINDOWS.DAY_28_REVIEW * 86_400_000,
      ),
    };
  }
  if (days < CONTENT_REVIEW_WINDOWS.DAY_90_REVIEW) {
    return {
      checkpoint: "DAY_90",
      dueAt: new Date(
        start.getTime() + CONTENT_REVIEW_WINDOWS.DAY_90_REVIEW * 86_400_000,
      ),
    };
  }
  return {
    checkpoint: "MANUAL_REVIEW",
    dueAt: new Date(now.getTime() + 30 * 86_400_000),
  };
}

export function buildDueReviewQueue(input: {
  plans: Array<{
    id: string;
    slug: string;
    status: string;
    publishedUrl: string | null;
    publishedAt: Date | string | null;
    performanceJson: unknown;
  }>;
  now?: Date;
}): DueReviewItem[] {
  const now = input.now ?? new Date();
  const due: DueReviewItem[] = [];

  for (const plan of input.plans) {
    if (plan.status !== "PUBLISHED" && plan.status !== "MONITORING") continue;
    if (!plan.publishedAt) continue;
    const perf = plan.performanceJson as ContentPerformanceStateV1 | null;
    const indexing = perf?.indexingState ?? "PUBLISHED_NOT_VERIFIED";
    const next = nextCheckpointAfterPublish(plan.publishedAt, now);
    const overdue = next.dueAt.getTime() <= now.getTime();

    if (
      indexing === "PUBLISHED_NOT_VERIFIED" ||
      indexing === "INDEXING_REQUESTED"
    ) {
      due.push({
        planId: plan.id,
        slug: plan.slug,
        publishedUrl: plan.publishedUrl,
        kind: "DUE_INDEXING_CHECK",
        checkpoint: "INDEXING_CHECK",
        dueAt: next.dueAt.toISOString(),
        reason: `Indexing state is ${indexing}.`,
      });
    }

    if (!overdue) continue;

    const kind: DueReviewQueueKind =
      next.checkpoint === "DAY_7"
        ? "DUE_7_DAY_REVIEW"
        : next.checkpoint === "DAY_28"
          ? "DUE_28_DAY_REVIEW"
          : next.checkpoint === "DAY_90"
            ? "DUE_90_DAY_REVIEW"
            : next.checkpoint === "INDEXING_CHECK"
              ? "DUE_INDEXING_CHECK"
              : "MANUAL_REVIEW";

    due.push({
      planId: plan.id,
      slug: plan.slug,
      publishedUrl: plan.publishedUrl,
      kind,
      checkpoint: next.checkpoint,
      dueAt: next.dueAt.toISOString(),
      reason: `Checkpoint ${next.checkpoint} is due (operator window, not ranking SLA).`,
    });
  }

  return due.sort((a, b) => a.dueAt.localeCompare(b.dueAt));
}

export function appendReviewHistory(
  state: ContentPerformanceStateV1,
  review: ContentReviewRecordV1,
): ContentPerformanceStateV1 {
  const history = Array.isArray(
    (state as ContentPerformanceStateV1 & { reviewHistory?: ContentReviewRecordV1[] })
      .reviewHistory,
  )
    ? [
        ...((state as ContentPerformanceStateV1 & {
          reviewHistory?: ContentReviewRecordV1[];
        }).reviewHistory as ContentReviewRecordV1[]),
      ]
    : [];
  history.push(review);
  const next = {
    ...state,
    reviewHistory: history.slice(-CONTENT_REVIEW_THRESHOLDS.MAX_REVIEW_HISTORY),
    lastReviewNote: `${review.decision} @ ${review.checkpoint}`,
  } as ContentPerformanceStateV1 & {
    reviewHistory: ContentReviewRecordV1[];
    nextReviewCheckpoint?: ContentReviewCheckpoint;
    nextReviewDueAt?: string;
  };
  const publishedAt = state.publishedAt ?? review.createdAt;
  const nextCp = nextCheckpointAfterPublish(publishedAt, new Date(review.createdAt));
  next.nextReviewCheckpoint = nextCp.checkpoint;
  next.nextReviewDueAt = nextCp.dueAt.toISOString();
  return next;
}

export function getReviewHistory(
  state: ContentPerformanceStateV1 | null,
): ContentReviewRecordV1[] {
  if (!state) return [];
  const hist = (
    state as ContentPerformanceStateV1 & {
      reviewHistory?: ContentReviewRecordV1[];
    }
  ).reviewHistory;
  return Array.isArray(hist) ? hist : [];
}

export function refreshBlockedWithoutEvidence(input: {
  decision: ContentReviewDecision;
  evidenceStrength: EvidenceStrength;
  performanceLabel: ContentPerformanceLabel | string;
}): { blocked: boolean; reason: string } {
  if (input.decision !== "REFRESH_CONTENT") {
    return { blocked: false, reason: "Not a refresh decision." };
  }
  if (
    input.evidenceStrength === "NONE" ||
    input.evidenceStrength === "WEAK" ||
    input.performanceLabel === "NO_DATA" ||
    input.performanceLabel === "INSUFFICIENT_DATA" ||
    input.performanceLabel === "EARLY_SIGNAL"
  ) {
    return {
      blocked: true,
      reason:
        "REFRESH_CONTENT blocked: evidence insufficient. Prefer KEEP_MONITORING.",
    };
  }
  return { blocked: false, reason: "Refresh decision allowed for human workflow." };
}

export function buildSupportingContentIdeas(input: {
  seoPublished: boolean;
}): Array<{ title: string; why: string; collisionNote: string }> {
  if (!input.seoPublished) return [];
  return [
    {
      title: "SEO vs Local SEO for small businesses",
      why: "Clarifies intent split now that /seo exists.",
      collisionNote: "Distinct from /seo and /local-seo — collision check required.",
    },
    {
      title: "Technical SEO foundations for small business sites",
      why: "Supporting PROBLEM_SOLUTION content under SEO topic.",
      collisionNote: "Must not duplicate /seo service page.",
    },
    {
      title: "Google Business Profile + website SEO relationship",
      why: "Bridges GBP gap without inventing a second SEO service URL.",
      collisionNote: "Prefer deepen /local-seo or blog — not another /seo.",
    },
  ];
}

export function learningSampleStatus(sampleSize: number): "INSUFFICIENT_DATA" | "EARLY_OBSERVATIONS" {
  return sampleSize < CONTENT_REVIEW_THRESHOLDS.LEARNING_MIN_SAMPLE
    ? "INSUFFICIENT_DATA"
    : "EARLY_OBSERVATIONS";
}
