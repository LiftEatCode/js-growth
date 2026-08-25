/**
 * Growth Sprint 12 — Local Growth / GBP Intelligence verify (no external APIs).
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  GBP_EXPERIMENT_SEQUENCE,
  GBP_EXPERIMENTS,
  GBP_POST_FORMATS,
  GBP_SUPPORT_CONTENT_SEED,
  LOCAL_API_SIDE_EFFECT_BUDGET,
  LOCAL_CHECKLIST_ITEMS,
  LOCAL_EVIDENCE_LAYERS,
  LOCAL_GROWTH_VERSION,
  LOCAL_SNAPSHOT_CADENCE,
  MAGNOLIA_LOCAL_PAGE_DECISION,
  WEBSITE_TO_GBP_DECISION,
  buildCanonicalGbpPostUtm,
  buildCanonicalGbpWebsiteUtm,
  compareLikeWindows,
  currentGbpExperimentId,
  formatLocalMetricDisplay,
  nextGbpExperimentId,
  reviewVelocityBetweenSnapshots,
} from "@/lib/growth/local-growth";
import {
  GBP_WEBSITE_UTM as CapturedGbpWebsite,
  buildGbpPostContent,
} from "@/lib/growth/acquisition-capture";
import {
  GROWTH_SNAPSHOT_SOURCES,
  validateGrowthSnapshotMetrics,
} from "@/lib/growth/snapshot";

/** Pure next-action builder copied for verify without server-only import. */
function buildLocalNextActions(input: {
  snapshotCount: number;
  notReviewed: number;
  needsAttention: number;
  mismatches: number;
  websiteUtmStatus: string | null;
  attributionAudits: number;
}) {
  const actions: Array<{ band: string; code: string }> = [];
  if (input.mismatches > 0 || input.needsAttention > 0) {
    actions.push({ band: "NOW", code: "PROFILE_ACCURACY" });
  }
  if (input.websiteUtmStatus !== "OK") {
    actions.push({ band: "NOW", code: "WEBSITE_UTM" });
  }
  if (input.notReviewed > 0) {
    actions.push({ band: "NOW", code: "CHECKLIST_BACKLOG" });
  }
  if (input.snapshotCount === 0) {
    actions.push({ band: "NOW", code: "CAPTURE_BASELINE" });
  }
  return actions;
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(`local-growth.verify failed: ${message}`);
  }
}

const here = dirname(fileURLToPath(import.meta.url));

assert(LOCAL_GROWTH_VERSION === 1, "LOCAL_GROWTH_VERSION = 1");
assert(LOCAL_EVIDENCE_LAYERS.length === 8, "eight evidence layers");
assert(
  !LOCAL_EVIDENCE_LAYERS.includes("SCORE" as never),
  "no fake composite score layer",
);

assert(
  GROWTH_SNAPSHOT_SOURCES.includes("GOOGLE_BUSINESS_PROFILE"),
  "snapshot source includes GBP",
);

const blankMetrics = validateGrowthSnapshotMetrics("GOOGLE_BUSINESS_PROFILE", {
  provenance: "MANUAL",
  localGrowthVersion: 1,
});
assert(blankMetrics.ok, "empty GBP metrics valid");
assert(
  blankMetrics.ok && blankMetrics.metrics.websiteClicks === undefined,
  "blank stays undefined / NOT_CAPTURED",
);

const zeroMetrics = validateGrowthSnapshotMetrics("GOOGLE_BUSINESS_PROFILE", {
  provenance: "MANUAL",
  websiteClicks: 0,
  callClicks: 0,
  reviewCount: 0,
});
assert(zeroMetrics.ok, "observed zeros valid");
assert(
  zeroMetrics.ok && zeroMetrics.metrics.websiteClicks === 0,
  "0 remains 0",
);

const badRating = validateGrowthSnapshotMetrics("GOOGLE_BUSINESS_PROFILE", {
  averageRating: 6,
});
assert(!badRating.ok, "rating > 5 rejected");

assert(formatLocalMetricDisplay(undefined) === "NOT_CAPTURED", "undefined display");
assert(formatLocalMetricDisplay(null) === "NOT_CAPTURED", "null display");
assert(formatLocalMetricDisplay(0) === "0", "zero display");

assert(
  compareLikeWindows({
    currentDays: 7,
    priorDays: 14,
    currentValue: 10,
    priorValue: 5,
  }).label === "UNKNOWN",
  "mismatched windows UNKNOWN",
);

assert(
  reviewVelocityBetweenSnapshots({
    currentReviewCount: 5,
    priorReviewCount: 3,
    daysBetween: 7,
  }).status === "INSUFFICIENT_DATA",
  "tiny sample insufficient",
);

assert(LOCAL_CHECKLIST_ITEMS.length >= 15, "checklist coverage");
assert(
  LOCAL_CHECKLIST_ITEMS.some((i) => i.key === "WEBSITE_UTM"),
  "website UTM checklist item",
);

assert(currentGbpExperimentId() === "GBP-001", "current GBP-001");
assert(nextGbpExperimentId() === "GBP-002", "next GBP-002");
assert(GBP_EXPERIMENT_SEQUENCE[0] === "GBP-001", "sequence starts profile");
assert(GBP_EXPERIMENTS.length === 10, "ten GBP experiments");
assert(
  GBP_EXPERIMENTS.find((e) => e.id === "GBP-001")?.defaultStatus === "ACTIVE",
  "only GBP-001 active by default",
);
assert(
  GBP_EXPERIMENTS.filter((e) => e.defaultStatus === "ACTIVE").length === 1,
  "single initial active experiment",
);

assert(MAGNOLIA_LOCAL_PAGE_DECISION.decision === "TEST_LATER", "magnolia deferred");
assert(MAGNOLIA_LOCAL_PAGE_DECISION.doorwayProtection, "doorway protection");
assert(WEBSITE_TO_GBP_DECISION.decision === "DEFER", "site→GBP deferred");
assert(GBP_POST_FORMATS.includes("UPDATE"), "update format");
assert(LOCAL_SNAPSHOT_CADENCE.label === "JS_SOLUTIONS_OPERATING_RULE", "cadence label");

assert(
  CapturedGbpWebsite.content === "website" &&
    CapturedGbpWebsite.source === "google_business_profile",
  "canonical website UTM",
);
assert(buildGbpPostContent("seo_services_001") === "post_seo_services_001", "post content");

const websiteUtm = buildCanonicalGbpWebsiteUtm("https://jsgrowth.com/website-audit");
assert(websiteUtm.content === "website", "website utm content");
const postUtm = buildCanonicalGbpPostUtm("https://jsgrowth.com/seo", "tips_001");
assert(postUtm.ok && postUtm.content === "post_tips_001", "post utm");

assert(LOCAL_API_SIDE_EFFECT_BUDGET.GBP_API === 0, "no GBP API");
assert(LOCAL_API_SIDE_EFFECT_BUDGET.PLACES === 0, "no Places");
assert(LOCAL_API_SIDE_EFFECT_BUDGET.OPENAI === 0, "no OpenAI");

const actions = buildLocalNextActions({
  snapshotCount: 0,
  notReviewed: 5,
  needsAttention: 1,
  mismatches: 1,
  websiteUtmStatus: "NOT_REVIEWED",
  attributionAudits: 0,
});
assert(actions.some((a) => a.band === "NOW"), "NOW actions present");
assert(actions.some((a) => a.code === "CAPTURE_BASELINE"), "baseline action");

const schema = readFileSync(join(here, "../../../prisma/schema.prisma"), "utf8");
assert(schema.includes("GOOGLE_BUSINESS_PROFILE"), "schema snapshot source");
assert(schema.includes("model LocalGbpProfileChecklistItem"), "checklist model");

const localPage = readFileSync(
  join(here, "../../app/reports/growth/local/page.tsx"),
  "utf8",
);
assert(localPage.includes("LOCAL_GROWTH_VERSION"), "local page version");
assert(localPage.includes("requireInternalSession"), "local page auth");
assert(
  !/businessprofileperformance\.googleapis|places\.googleapis|from ["']openai|@ai-sdk/i.test(
    localPage,
  ),
  "no external APIs on local page",
);

const growthPage = readFileSync(
  join(here, "../../app/reports/growth/page.tsx"),
  "utf8",
);
assert(growthPage.includes("local-growth-compact-card"), "growth compact card");
assert(growthPage.includes("/reports/growth/local"), "growth link to local");

const research = readFileSync(
  join(here, "../../../docs/research/local-search-gbp-intelligence-2026.md"),
  "utf8",
);
assert(research.includes("ACCESS DATE"), "research access date");
assert(research.includes("OFFICIAL_GOOGLE") || research.includes("Google"), "google sources");
assert(research.includes("JS_SOLUTIONS_OPERATING_RULE"), "operating rule labeled");

assert(
  GBP_SUPPORT_CONTENT_SEED.id === "gbp-support-content-v1",
  "support content seed id",
);

console.log("local-growth.verify.ts: PASS");
