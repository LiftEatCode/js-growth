/**
 * Growth Sprint 7 — content performance / publishing verification.
 * LIVE OPENAI = 0 · META = 0 · GSC API = 0
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { GROWTH_BASELINE_V1 } from "@/lib/growth/baseline-v1";
import { buildSeoServiceDistributionPlan } from "@/lib/growth/content-distribution";
import {
  CONTENT_PERFORMANCE_VERSION,
  SEO_SERVICE_PAGE_PUBLIC_SLUG,
  buildContentLearningSummary,
  canEnterPublishingHandoff,
  canMarkPlanPublished,
  createInitialPerformanceState,
  deriveMeasurementAndLabel,
  performanceStateAfterPublish,
  resolveCanonicalDraftSource,
} from "@/lib/growth/content-performance";
import {
  detectContentCollision,
  recommendNextContent,
} from "@/lib/growth/content-intelligence";
import { SEARCH_PAGE_INVENTORY } from "@/lib/growth/search-intelligence";
import { seoPageMeta } from "@/content/services/seo";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const here = dirname(fileURLToPath(import.meta.url));

assert(CONTENT_PERFORMANCE_VERSION === 1, "performance version");
assert(SEO_SERVICE_PAGE_PUBLIC_SLUG === "seo_service_page", "public slug");

// Publication gates
assert(!canEnterPublishingHandoff("BRIEF_READY").ok, "BRIEF_READY blocked");
assert(!canEnterPublishingHandoff("IN_REVIEW").ok, "IN_REVIEW blocked");
assert(canEnterPublishingHandoff("APPROVED").ok, "APPROVED handoff ok");
assert(
  !canMarkPlanPublished({
    status: "DRAFT",
    publishedUrl: "/seo",
    hasCanonicalDraft: true,
  }).ok,
  "DRAFT cannot publish",
);
assert(
  canMarkPlanPublished({
    status: "APPROVED",
    publishedUrl: "/seo",
    hasCanonicalDraft: true,
  }).ok,
  "APPROVED can publish",
);

// Canonical draft authority
const humanWins = resolveCanonicalDraftSource({
  humanDraftJson: { body: "human" },
  generationJson: { body: "ai" },
  candidateDraftJson: { body: "candidate" },
});
assert(humanWins.source === "humanDraftJson", "human > generation");
assert(humanWins.candidateIsNotAuthority, "candidate never publish authority");

const genOnly = resolveCanonicalDraftSource({
  humanDraftJson: null,
  generationJson: { body: "ai" },
  candidateDraftJson: { body: "c" },
});
assert(genOnly.source === "generationJson", "generation fallback");

// Measurement: NO_DATA not fabricated zero history
const initial = createInitialPerformanceState({
  publicContentSlug: SEO_SERVICE_PAGE_PUBLIC_SLUG,
  recommendedLinks: ["/website-audit"],
  implementedLinks: ["/website-audit"],
});
assert(initial.performanceLabel === "NO_DATA", "pre-publish NO_DATA");
assert(initial.measurementState === "NOT_PUBLISHED", "not published");

const after = performanceStateAfterPublish({
  previous: initial,
  publishedAt: new Date("2026-08-23T12:00:00.000Z"),
  publicContentSlug: SEO_SERVICE_PAGE_PUBLIC_SLUG,
  recommendedLinks: ["/website-audit"],
  implementedLinks: ["/website-audit"],
});
assert(after.measurementState === "PUBLISHED_AWAITING_DATA", "awaiting data");
assert(after.indexingState === "PUBLISHED_NOT_VERIFIED", "not claiming indexed");
assert(after.ga4Status === "NO_DATA", "ga4 NO_DATA not 0");

const early = deriveMeasurementAndLabel({
  publishedAt: new Date("2026-08-20T12:00:00.000Z"),
  latestSearch: null,
  now: new Date("2026-08-23T12:00:00.000Z"),
});
assert(early.performanceLabel === "NO_DATA" || early.performanceLabel === "INSUFFICIENT_DATA", "early unknown");

const withZero = deriveMeasurementAndLabel({
  publishedAt: new Date("2026-07-01T12:00:00.000Z"),
  latestSearch: {
    windowStart: "2026-07-01",
    windowEnd: "2026-07-28",
    clicks: 0,
    impressions: 0,
    ctr: 0,
    averagePosition: null,
    queryDataStatus: "AVAILABLE",
    capturedAt: "2026-08-01T00:00:00.000Z",
    evidenceKind: "OBSERVED",
  },
  now: new Date("2026-08-23T12:00:00.000Z"),
});
assert(withZero.performanceLabel === "FLAT", "observed zero → FLAT after window");

// Learning: n=1 insufficient
const learning = buildContentLearningSummary({
  contentType: "SERVICE_PAGE",
  topic: "SEO",
  intent: "SERVICE",
  publisher: "COMPANY",
  publishedAssetCount: 1,
  performanceLabel: "NO_DATA",
});
assert(learning.status === "INSUFFICIENT_DATA", "n=1 insufficient");
assert(learning.causationBoundary.includes("causation"), "causation boundary");

// Collision / recommendation feedback
assert(
  SEARCH_PAGE_INVENTORY.some((p) => p.path === "/seo" && p.inSitemap),
  "/seo in inventory + sitemap flag",
);
const collision = detectContentCollision({
  contentType: "SERVICE_PAGE",
  topic: "SEO",
  searchIntent: "SERVICE",
  targetPath: "/seo",
  sourceType: "SERVICE_GAP",
});
assert(collision.state === "RELATED_EXISTING_CONTENT", "no duplicate SEO page");

const recs = recommendNextContent();
const seoRec = recs.find((r) => r.slug === "seo-service-page-v1");
assert(seoRec, "seo plan still listed");
assert(seoRec!.priorityBand === "LATER", "not NOW recreate");
assert(
  seoRec!.why.some((w) => /published|awaiting performance/i.test(w)),
  "why updated",
);

// Distribution
const dist = buildSeoServiceDistributionPlan({ publishedUrl: "/seo" });
assert(dist.items.some((i) => i.channel === "FACEBOOK_COMPANY"), "fb company");
assert(dist.items.every((i) => i.autoPost === false), "no auto post");
assert(
  dist.items.find((i) => i.channel === "FACEBOOK_FOUNDER")?.founderInputRequired,
  "founder safety",
);
assert(dist.notes.some((n) => /018|ACTIVE|QUEUED/i.test(n)), "018 noted");

// /seo page artifacts
const seoPage = readFileSync(join(here, "../../app/seo/page.tsx"), "utf8");
assert(seoPage.includes("seoPageMeta"), "seo page uses content module");
assert(seoPage.includes('canonical: seoPageMeta.canonicalPath'), "canonical");
assert(seoPage.includes("index: true"), "indexable");
assert(seoPage.includes("getServiceSchema"), "service schema");
assert(!seoPage.includes("FAQPage"), "no FAQ schema");
assert(!seoPage.includes("humanDraftJson"), "no draft JSON leak");
assert(!/sk_live|stripe_|cuid/i.test(seoPage), "no secrets/ids");
assert(seoPageMeta.canonicalPath === "/seo", "meta path");

const sitemap = readFileSync(join(here, "../../app/sitemap.ts"), "utf8");
assert(sitemap.includes('getAbsoluteUrl("/seo")'), "sitemap includes /seo");
assert(!sitemap.includes("/proposal/"), "no proposal tokens");
assert(!sitemap.includes("/reports/"), "no reports in sitemap");

const robots = readFileSync(join(here, "../../app/robots.ts"), "utf8");
assert(robots.includes('/reports/'), "robots still disallows reports");

const store = readFileSync(join(here, "content-plan-store.ts"), "utf8");
assert(store.includes("canMarkPlanPublished"), "publish gate");
assert(store.includes("createDerivativeContentPlan"), "derivative");
assert(!store.includes("prisma.growthContentRecord.create"), "no ledger create");
assert(!store.includes("createContentAiProvider"), "store does not call OpenAI provider");

const events = readFileSync(join(here, "events.ts"), "utf8");
assert(events.includes("service_cta_clicked"), "cta event exists");
assert(!events.includes("contentPlanId"), "no plan id events");

assert(GROWTH_BASELINE_V1.searchConsole.impressions === 2, "baseline immutable");

const research = readFileSync(
  join(here, "../../../docs/research/content-publishing-performance-2026.md"),
  "utf8",
);
assert(research.includes("ACCESS DATE"), "research access date");
assert(research.includes("OFFICIAL"), "official section");

console.log("content performance verification passed");
