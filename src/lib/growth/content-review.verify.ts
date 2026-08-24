/**
 * Growth Sprint 8 — content review verification.
 * LIVE OPENAI/META/GSC API = 0
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { GROWTH_BASELINE_V1 } from "@/lib/growth/baseline-v1";
import { CONTENT_PERFORMANCE_VERSION } from "@/lib/growth/content-performance";
import {
  CONTENT_REVIEW_VERSION,
  buildDueReviewQueue,
  buildSupportingContentIdeas,
  canReviewPerformance,
  compareSearchWindows,
  computeEvidenceStrength,
  learningSampleStatus,
  nextCheckpointAfterPublish,
  recommendReviewDecision,
  refreshBlockedWithoutEvidence,
  validateSearchCtr,
} from "@/lib/growth/content-review";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const here = dirname(fileURLToPath(import.meta.url));
const now = new Date("2026-08-23T18:00:00.000Z");

assert(CONTENT_REVIEW_VERSION === 1, "review version");
assert(CONTENT_PERFORMANCE_VERSION === 1, "performance version unchanged");

// CTR validation
assert(validateSearchCtr({ clicks: 2, impressions: 100, ctr: 0.02 }).ok, "ctr ok");
assert(
  !validateSearchCtr({ clicks: 10, impressions: 100, ctr: 0.5 }).ok,
  "ctr mismatch rejected",
);
assert(
  validateSearchCtr({ clicks: null, impressions: 10, ctr: null }).ok,
  "null ctr ok",
);

// Comparison / trend
const winA = {
  windowStart: "2026-08-01",
  windowEnd: "2026-08-08",
  clicks: 1,
  impressions: 10,
  ctr: 0.1,
  averagePosition: 20,
  queryDataStatus: "AVAILABLE" as const,
  capturedAt: now.toISOString(),
  evidenceKind: "OBSERVED" as const,
};
const winB = {
  ...winA,
  windowStart: "2026-08-08",
  windowEnd: "2026-08-15",
  impressions: 50,
  clicks: 3,
  ctr: 0.06,
};
assert(compareSearchWindows({ current: winB, previous: winA }).trend === "UP", "trend up");
const mismatch = compareSearchWindows({
  current: winB,
  previous: { ...winA, windowEnd: "2026-08-20" },
});
assert(mismatch.trend === "UNKNOWN", "mismatched windows unknown");

// Review eligibility
assert(
  !canReviewPerformance({
    planStatus: "DRAFT",
    measurementState: "NOT_PUBLISHED",
    publishedAt: null,
  }).ok,
  "draft not reviewable",
);
assert(
  canReviewPerformance({
    planStatus: "PUBLISHED",
    measurementState: "PUBLISHED_AWAITING_DATA",
    publishedAt: "2026-08-20T00:00:00.000Z",
  }).ok,
  "published awaiting still reviewable for KEEP_MONITORING",
);

// Early /seo behavior: KEEP_MONITORING, refresh blocked
const early = recommendReviewDecision({
  publishedAt: "2026-08-20T00:00:00.000Z",
  measurementState: "PUBLISHED_AWAITING_DATA",
  performanceLabel: "NO_DATA",
  indexingState: "PUBLISHED_NOT_VERIFIED",
  evidenceStrength: "NONE",
  latestSearch: null,
  now,
});
assert(early.decision === "KEEP_MONITORING", "early keep monitoring");
assert(
  refreshBlockedWithoutEvidence({
    decision: "REFRESH_CONTENT",
    evidenceStrength: "NONE",
    performanceLabel: "NO_DATA",
  }).blocked,
  "seo refresh blocked without evidence",
);

// Evidence strength
assert(
  computeEvidenceStrength({
    publishedAt: "2026-08-20T00:00:00.000Z",
    latestSearch: null,
    indexingState: "PUBLISHED_NOT_VERIFIED",
    now,
  }) === "NONE",
  "no search → NONE",
);
assert(
  computeEvidenceStrength({
    publishedAt: "2026-07-01T00:00:00.000Z",
    latestSearch: {
      ...winB,
      impressions: 250,
      clicks: 25,
      ctr: 0.1,
    },
    indexingState: "INDEXED",
    now,
  }) === "MEANINGFUL",
  "large sample meaningful",
);

// Due queue
const due = buildDueReviewQueue({
  plans: [
    {
      id: "p1",
      slug: "seo-service-page-v1",
      status: "PUBLISHED",
      publishedUrl: "/seo",
      publishedAt: "2026-08-10T00:00:00.000Z",
      performanceJson: {
        version: 1,
        indexingState: "PUBLISHED_NOT_VERIFIED",
        measurementState: "EARLY_DATA",
      },
    },
  ],
  now,
});
assert(due.some((d) => d.kind === "DUE_INDEXING_CHECK"), "indexing due");
assert(
  nextCheckpointAfterPublish("2026-08-20T00:00:00.000Z", now).checkpoint ===
    "INDEXING_CHECK" ||
    nextCheckpointAfterPublish("2026-08-20T00:00:00.000Z", now).checkpoint ===
      "DAY_7",
  "checkpoint after publish",
);

// Learning safeguard
assert(learningSampleStatus(1) === "INSUFFICIENT_DATA", "n=1 insufficient");
assert(learningSampleStatus(3) === "EARLY_OBSERVATIONS", "n=3 early");

// Supporting ideas only when seo published
assert(buildSupportingContentIdeas({ seoPublished: false }).length === 0, "no ideas pre-publish");
assert(buildSupportingContentIdeas({ seoPublished: true }).length >= 2, "ideas after publish");

// Side-effect / privacy source checks
const reviewSrc = readFileSync(join(here, "content-review.ts"), "utf8");
assert(!reviewSrc.includes("openai"), "review module no openai");
assert(!reviewSrc.includes("stripe"), "no stripe");
const store = readFileSync(join(here, "content-plan-store.ts"), "utf8");
assert(store.includes("recordContentPerformanceReview"), "store review");
assert(store.includes("createRefreshPlanFromReview"), "refresh plan");
assert(!store.includes("prisma.growthContentRecord.create"), "no fb ledger from review");

const controls = readFileSync(
  join(here, "../../components/growth/content-plan-controls.tsx"),
  "utf8",
);
assert(controls.includes("Record review"), "UI record review");
assert(controls.includes("KEEP_MONITORING"), "UI decisions");

assert(GROWTH_BASELINE_V1.searchConsole.impressions === 2, "baseline immutable");

const research = readFileSync(
  join(here, "../../../docs/research/content-performance-review-2026.md"),
  "utf8",
);
assert(research.includes("ACCESS DATE"), "research dated");
assert(research.includes("average position"), "position guidance");

console.log("content review verification passed");
