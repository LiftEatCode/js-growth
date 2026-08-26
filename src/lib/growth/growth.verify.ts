/**
 * Growth Sprint 1 verification — event taxonomy, UTM, attribution, snapshots,
 * privacy boundary. No external analytics APIs.
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { isForbiddenAnalyticsParamKey } from "@/lib/analytics/commercial-events";
import {
  ATTRIBUTION_VERSION,
  buildGrowthBaselineV1SnapshotPayloads,
  buildUtmUrl,
  DATA_STATUS,
  FACEBOOK_FOUNDER_UTM,
  FACEBOOK_PAGE_UTM,
  GA4_PRODUCTION_MEASUREMENT_ID,
  GBP_UTM,
  GROWTH_BASELINE_DATE,
  GROWTH_BASELINE_PERIOD,
  GROWTH_BASELINE_V1,
  GROWTH_BASELINE_VERSION,
  GROWTH_EVENT_VERSION,
  GROWTH_EVENTS,
  GROWTH_KEY_EVENT_CANDIDATES,
  isAllowedGrowthEventParamKey,
  isGrowthEventName,
  isInsufficientData,
  isKnownUtmMedium,
  isKnownUtmSource,
  isNotCaptured,
  isValidUtmValue,
  KPI_HIERARCHY,
  normalizeUtmValue,
  parseCampaignAttribution,
  parseCampaignAttributionFromUnknown,
  QUALIFIED_TRAFFIC_INDICATORS,
  sanitizeGrowthEventParams,
  snapshotMetricIsExplicitlyUnavailable,
  UTM_STANDARD_VERSION,
  validateGrowthSnapshotMetrics,
  AUDIT_FUNNEL_VERSION,
  AUDIT_FUNNEL_STEPS,
  mergeAttributionWithFunnelContext,
  parseAuditFunnelContextFromUnknown,
  isAuditFunnelStep,
  FACEBOOK_CONTENT_FORMATS,
  FACEBOOK_CONTENT_JOBS,
  FACEBOOK_CONTENT_PILLARS,
  FACEBOOK_FOLLOWER_TARGET_FRAMEWORK,
  FACEBOOK_GROWTH_VERSION,
  FACEBOOK_METRIC_LAYERS,
  FACEBOOK_PAGE_CAMPAIGN,
  FACEBOOK_PUBLISHER_TYPES,
  FACEBOOK_SCORECARD,
  buildFacebookCompanyUtmContent,
  buildFacebookFounderUtmContent,
  classifyFacebookOrganicPublisher,
  followerGrowthRatePercent,
  isFacebookContentFormat,
  isFacebookContentJob,
  isFacebookContentPillar,
  isFacebookPublisherType,
  netFollowerChange,
  safePercent,
  validateFacebookManualMetrics,
  SEARCH_INTELLIGENCE_VERSION,
  SEARCH_INTENTS,
  SEARCH_TOPICS,
  SEARCH_CAPABILITY_MAP,
  SEARCH_OPPORTUNITY_SOURCES,
  SEARCH_OPPORTUNITY_STATUSES,
  SEARCH_PRIORITY_BANDS,
  SEARCH_EVIDENCE_KINDS,
  SEARCH_CONSOLE_STAGES,
  SEARCH_PAGE_INVENTORY,
  SEARCH_BLOG_INVENTORY,
  SEARCH_CONTENT_GAPS,
  SEARCH_INTERNAL_LINK_RECS,
  SEARCH_OPPORTUNITY_SEEDS,
  SEARCH_BASELINE_SUMMARY,
  PREFERRED_SOURCES_DECISION,
  AI_SEARCH_GUIDANCE_SUMMARY,
  SOCIAL_VIDEO_SEARCH_DECISION,
  isSearchIntent,
  isSearchTopic,
  isSearchOpportunitySource,
  isSearchEvidenceKind,
  resolveSearchConsoleStage,
  computeSearchPriorityBand,
  rankSeedOpportunities,
  buildContentBriefFromSeed,
} from "@/lib/growth";
import {
  formatFunnelCount,
  formatFunnelRate,
  FUNNEL_METRIC_STATUS,
} from "@/lib/growth/audit-funnel-display";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

assert(GROWTH_EVENT_VERSION === "growth-events-v1", "growth event version");
assert(ATTRIBUTION_VERSION === "attribution-v1", "attribution version");
assert(UTM_STANDARD_VERSION === "utm-standard-v1", "utm standard version");

assert(
  GROWTH_EVENTS.auditLandingView === "audit_landing_view",
  "audit_landing_view name",
);
assert(GROWTH_EVENTS.auditStarted === "audit_started", "audit_started name");
assert(
  GROWTH_EVENTS.auditSubmitted === "audit_submitted",
  "audit_submitted name",
);
assert(
  GROWTH_EVENTS.contactFormSubmitted === "contact_form_submitted",
  "contact_form_submitted name",
);
assert(isGrowthEventName("audit_completed"), "audit_completed is growth event");
assert(!isGrowthEventName("button_clicked"), "noisy events not in taxonomy");

assert(
  GROWTH_KEY_EVENT_CANDIDATES.includes(GROWTH_EVENTS.auditSubmitted),
  "audit_submitted is key-event candidate",
);
assert(
  GROWTH_KEY_EVENT_CANDIDATES.includes(GROWTH_EVENTS.contactFormSubmitted),
  "contact_form_submitted is key-event candidate",
);

const safe = sanitizeGrowthEventParams({
  placement: "blog",
  cta_kind: "audit",
  pages_scanned: 3,
  report_id: "3ad43538-a0b0-4f39-937b-b119be11f62f",
  prospect_id: "abc",
} as Record<string, string | number | boolean>);
assert(safe?.placement === "blog", "keeps placement");
assert(safe?.pages_scanned === 3, "keeps pages_scanned");
assert(safe && !("report_id" in safe), "strips report_id");
assert(safe && !("prospect_id" in safe), "strips prospect_id");
assert(isAllowedGrowthEventParamKey("placement"), "placement allowed");
assert(!isAllowedGrowthEventParamKey("email"), "email not allowed growth key");

for (const key of [
  "prospect_id",
  "opportunity_id",
  "client_id",
  "project_id",
  "proposal_id",
  "agreement_id",
  "payment_id",
  "email",
  "phone",
]) {
  assert(isForbiddenAnalyticsParamKey(key), `${key} must be forbidden`);
}

assert(isForbiddenAnalyticsParamKey("prospect_id"), "prospect_id forbidden");
assert(isForbiddenAnalyticsParamKey("opportunity_id"), "opportunity_id forbidden");
assert(isForbiddenAnalyticsParamKey("client_id"), "client_id forbidden");
assert(isForbiddenAnalyticsParamKey("project_id"), "project_id forbidden");
assert(isForbiddenAnalyticsParamKey("proposal_id"), "proposal_id forbidden");
assert(isForbiddenAnalyticsParamKey("agreement_id"), "agreement_id forbidden");
assert(isForbiddenAnalyticsParamKey("email"), "email forbidden");

assert(normalizeUtmValue(" FaceBook ") === "facebook", "utm normalize");
assert(isValidUtmValue("website_growth"), "valid campaign");
assert(!isValidUtmValue(""), "empty invalid");
assert(!isValidUtmValue("bad value!"), "special chars invalid");
assert(isKnownUtmSource("facebook"), "facebook source");
assert(isKnownUtmMedium("organic_social"), "organic_social medium");
assert(isKnownUtmMedium("organic_local"), "organic_local medium");

const built = buildUtmUrl({
  destinationUrl: "https://jsgrowth.com/website-audit",
  source: "facebook",
  medium: "organic_social",
  campaign: "website_growth",
  content: "website_leads_post_01",
});
assert(built.ok, "utm builder succeeds");
if (built.ok) {
  assert(
    built.url.includes("utm_source=facebook"),
    "utm_source encoded",
  );
  assert(
    built.url.includes("utm_medium=organic_social"),
    "utm_medium encoded",
  );
  assert(
    built.url.includes("utm_campaign=website_growth"),
    "utm_campaign encoded",
  );
  assert(
    built.url.includes("utm_content=website_leads_post_01"),
    "utm_content encoded",
  );
}

const bad = buildUtmUrl({
  destinationUrl: "not-a-url",
  source: "facebook",
  medium: "organic_social",
  campaign: "x",
});
assert(!bad.ok, "invalid destination rejected");

assert(FACEBOOK_PAGE_UTM.source === "facebook", "fb page source");
assert(FACEBOOK_FOUNDER_UTM.campaign === "founder_content", "founder campaign");
assert(GBP_UTM.source === "google_business_profile", "gbp source");
assert(GBP_UTM.medium === "organic_local", "gbp medium");

const attr = parseCampaignAttribution({
  source: "facebook",
  medium: "organic_social",
  campaign: "website_growth",
  content: "post_01",
  landingPath: "/website-audit",
});
assert(attr?.source === "facebook", "attribution source");
assert(attr?.landingPath === "/website-audit", "attribution landing");

const leaked = parseCampaignAttributionFromUnknown({
  source: "facebook",
  medium: "organic_social",
  campaign: "x",
  content: "y",
  landingPath: "/website-audit",
  prospect_id: "should-not-survive",
  email: "a@b.com",
});
assert(leaked !== null, "bounded attribution parses");
assert(
  leaked && !("prospect_id" in leaked) && !("email" in leaked),
  "attribution omits commercial/PII keys",
);

const invalidAttr = parseCampaignAttribution({
  source: "!!!",
  medium: "organic_social",
  campaign: "ok",
  landingPath: "/website-audit",
});
assert(invalidAttr?.source === null, "invalid source becomes null");

const ga4Snap = validateGrowthSnapshotMetrics("GA4", {
  users: 10,
  sessions: 12,
  organicSearchSessions: 4,
});
assert(ga4Snap.ok, "GA4 snapshot valid");

const badSnap = validateGrowthSnapshotMetrics("GA4", {
  users: -1,
});
assert(!badSnap.ok, "negative users rejected");

const fbSnap = validateGrowthSnapshotMetrics("FACEBOOK", {
  property: "js_solutions_page",
  followers: 100,
  reach: 500,
});
assert(fbSnap.ok, "facebook snapshot valid");

const internalSnap = validateGrowthSnapshotMetrics("INTERNAL", {
  auditsCreated: 3,
  clientsCreated: 1,
});
assert(internalSnap.ok, "internal snapshot valid");

assert(QUALIFIED_TRAFFIC_INDICATORS.length >= 4, "qualified indicators defined");
assert(KPI_HIERARCHY.length === 5, "five KPI levels");
assert(KPI_HIERARCHY[0]?.level === 1, "level 1 business");
assert(KPI_HIERARCHY[4]?.level === 5, "level 5 visibility");

const here = dirname(fileURLToPath(import.meta.url));
const srcRoot = join(here, "../..");

function walkTsFiles(directory: string, files: string[] = []): string[] {
  for (const entry of readdirSync(directory)) {
    if (entry === "generated" || entry === "node_modules") {
      continue;
    }
    const fullPath = join(directory, entry);
    const stats = statSync(fullPath);
    if (stats.isDirectory()) {
      walkTsFiles(fullPath, files);
      continue;
    }
    if (extname(entry) === ".ts" || extname(entry) === ".tsx") {
      files.push(fullPath);
    }
  }
  return files;
}

for (const file of walkTsFiles(srcRoot).filter((f) => !f.endsWith(".verify.ts"))) {
  const source = readFileSync(file, "utf8");
  if (!source.includes("trackGrowthEvent") && !source.includes("trackCommercialEvent")) {
    continue;
  }
  assert(
    !/trackGrowthEvent\([\s\S]*?prospect_id\s*:/.test(source),
    `${file} must not send prospect_id to trackGrowthEvent`,
  );
  assert(
    !/trackGrowthEvent\([\s\S]*?opportunity_id\s*:/.test(source),
    `${file} must not send opportunity_id to trackGrowthEvent`,
  );
}

const schema = readFileSync(
  join(here, "../../../prisma/schema.prisma"),
  "utf8",
);
assert(schema.includes("model GrowthSnapshot"), "GrowthSnapshot in schema");
assert(schema.includes("attributionJson"), "attributionJson on AuditReport");

// ─── Growth Baseline V1 ─────────────────────────────────────────────────────

assert(GROWTH_BASELINE_VERSION === 1, "baseline version is 1");
assert(GROWTH_BASELINE_DATE === "2026-08-23", "baseline date");
assert(GROWTH_BASELINE_PERIOD.start === "2026-07-26", "baseline period start");
assert(GROWTH_BASELINE_PERIOD.end === "2026-08-22", "baseline period end");

assert(GROWTH_BASELINE_V1.searchConsole.clicks === 0, "GSC clicks");
assert(GROWTH_BASELINE_V1.searchConsole.impressions === 2, "GSC impressions");
assert(GROWTH_BASELINE_V1.searchConsole.averageCtr === 0, "GSC CTR");
assert(GROWTH_BASELINE_V1.searchConsole.averagePosition === 77, "GSC avg position");
assert(
  isInsufficientData(GROWTH_BASELINE_V1.searchConsole.queryDataStatus),
  "GSC query data insufficient",
);
assert(
  isInsufficientData(GROWTH_BASELINE_V1.searchConsole.topQueries),
  "topQueries is INSUFFICIENT_DATA not []",
);
assert(
  !Array.isArray(GROWTH_BASELINE_V1.searchConsole.topQueries),
  "insufficient query data must not be an empty array",
);

assert(GROWTH_BASELINE_V1.facebook.followers === 75, "FB followers");
assert(GROWTH_BASELINE_V1.facebook.visits === 9, "FB visits");
assert(GROWTH_BASELINE_V1.facebook.engagements === 5, "FB engagements");
assert(
  GROWTH_BASELINE_V1.facebook.viewsByFollowerStatus.nonFollowersPercent === 95.3,
  "FB non-follower views",
);
assert(
  GROWTH_BASELINE_V1.facebook.viewsByContentType.photoPercent === 90.3,
  "FB photo views",
);
assert(
  isNotCaptured(GROWTH_BASELINE_V1.facebook.totalViewsStatus),
  "FB total views NOT_CAPTURED",
);
assert(
  GROWTH_BASELINE_V1.facebook.totalViewsStatus === DATA_STATUS.NOT_CAPTURED,
  "FB total views must remain NOT_CAPTURED (not numeric zero)",
);

assert(
  GA4_PRODUCTION_MEASUREMENT_ID === "G-0REXF012SK",
  "GA4 production measurement ID",
);
assert(GROWTH_BASELINE_V1.ga4.productionTrackingVerified === true, "GA4 verified");
assert(
  isNotCaptured(GROWTH_BASELINE_V1.ga4.historicalTrafficTotalsStatus),
  "GA4 historical totals not captured from Realtime",
);
assert(
  GROWTH_BASELINE_V1.ga4.monitorEventCardinality.status ===
    "MONITOR_EVENT_CARDINALITY",
  "cardinality monitor flag",
);
assert(
  GROWTH_BASELINE_V1.ga4.monitorEventCardinality.observedDuringRealtimeValidation
    .audit_submitted === 1,
  "monitor submitted count",
);
assert(
  GROWTH_BASELINE_V1.ga4.monitorEventCardinality.observedDuringRealtimeValidation
    .audit_completed === 2,
  "monitor completed count",
);

const baselinePayloads = buildGrowthBaselineV1SnapshotPayloads();
const gscValidated = validateGrowthSnapshotMetrics(
  "SEARCH_CONSOLE",
  baselinePayloads.searchConsole,
);
assert(gscValidated.ok, "baseline GSC snapshot validates");
if (gscValidated.ok) {
  assert(gscValidated.metrics.clicks === 0, "persisted GSC clicks");
  assert(gscValidated.metrics.impressions === 2, "persisted GSC impressions");
  assert(
    gscValidated.metrics.queryDataStatus === DATA_STATUS.INSUFFICIENT_DATA,
    "persisted query status",
  );
  assert(
    !("topQueries" in gscValidated.metrics),
    "GSC snapshot omits topQueries rather than empty list",
  );
  assert(
    snapshotMetricIsExplicitlyUnavailable(
      gscValidated.metrics,
      "queryDataStatus",
    ),
    "queryDataStatus unavailable helper",
  );
}

const ga4Validated = validateGrowthSnapshotMetrics("GA4", baselinePayloads.ga4);
assert(ga4Validated.ok, "baseline GA4 snapshot validates");
if (ga4Validated.ok) {
  assert(
    !("users" in ga4Validated.metrics) && !("sessions" in ga4Validated.metrics),
    "GA4 baseline does not invent traffic totals",
  );
  assert(
    !JSON.stringify(ga4Validated.metrics).includes(GA4_PRODUCTION_MEASUREMENT_ID),
    "measurement ID not stored in GA4 snapshot metricsJson",
  );
}

const fbValidated = validateGrowthSnapshotMetrics(
  "FACEBOOK",
  baselinePayloads.facebook,
);
assert(fbValidated.ok, "baseline Facebook snapshot validates");
if (fbValidated.ok) {
  assert(fbValidated.metrics.followers === 75, "FB snapshot followers");
  assert(fbValidated.metrics.pageVisits === 9, "FB snapshot visits");
  assert(fbValidated.metrics.engagement === 5, "FB snapshot engagements");
  assert(
    fbValidated.metrics.totalViewsStatus === DATA_STATUS.NOT_CAPTURED,
    "FB totalViewsStatus",
  );
  assert(
    !("contentViews" in fbValidated.metrics) &&
      !("impressions" in fbValidated.metrics),
    "FB NOT_CAPTURED views not stored as zero numeric fields",
  );
  assert(
    snapshotMetricIsExplicitlyUnavailable(
      fbValidated.metrics,
      "totalViewsStatus",
    ),
    "totalViewsStatus unavailable helper",
  );
}

const leakedMeasurementId = sanitizeGrowthEventParams({
  placement: "audit_landing",
  measurement_id: GA4_PRODUCTION_MEASUREMENT_ID,
  ga_measurement_id: GA4_PRODUCTION_MEASUREMENT_ID,
} as Record<string, string | number | boolean>);
assert(leakedMeasurementId?.placement === "audit_landing", "keeps placement");
assert(
  leakedMeasurementId !== undefined &&
    !("measurement_id" in leakedMeasurementId) &&
    !("ga_measurement_id" in leakedMeasurementId),
  "measurement ID stripped from growth event params",
);
assert(
  !JSON.stringify(leakedMeasurementId).includes(GA4_PRODUCTION_MEASUREMENT_ID),
  "measurement ID string absent from sanitized growth params",
);

const baselineDoc = readFileSync(
  join(here, "../../../docs/growth/baselines/growth-baseline-v1.md"),
  "utf8",
);
assert(baselineDoc.includes("GROWTH_BASELINE_VERSION = 1"), "baseline doc version");
assert(baselineDoc.includes("INSUFFICIENT_DATA"), "baseline doc insufficient");
assert(baselineDoc.includes("NOT_CAPTURED"), "baseline doc not captured");
assert(baselineDoc.includes("MONITOR_EVENT_CARDINALITY"), "baseline doc monitor");

const growthPage = readFileSync(
  join(here, "../../app/reports/growth/page.tsx"),
  "utf8",
);
assert(growthPage.includes("GROWTH_BASELINE_V1"), "dashboard renders baseline V1");
assert(
  !/from ["']@google-analytics|from ["']googleapis|AnalyticsDataClient|facebook-nodejs-business-sdk|graph\.facebook\.com\/v\d/i.test(
    growthPage,
  ),
  "growth dashboard has no external analytics API clients",
);
assert(
  !/ensureGrowthBaselineV1Snapshots|persist-growth-baseline/i.test(growthPage),
  "dashboard render path does not run baseline persistence writes",
);
assert(
  growthPage.includes("AUDIT_FUNNEL"),
  "dashboard renders audit funnel section",
);
assert(
  growthPage.includes("getAuditFunnelDashboardMetrics"),
  "dashboard loads audit funnel metrics",
);

assert(AUDIT_FUNNEL_VERSION === 1, "audit funnel version");
assert(AUDIT_FUNNEL_STEPS.length === 7, "audit funnel step count");
assert(isAuditFunnelStep("audit_submitted"), "audit_submitted is funnel step");
assert(!isAuditFunnelStep("purchase"), "purchase not funnel step");

const funnelParsed = parseAuditFunnelContextFromUnknown({
  version: 1,
  landingViewAt: "2026-08-23T12:00:00.000Z",
  startedAt: "2026-08-23T12:01:00.000Z",
});
assert(funnelParsed?.landingViewAt?.startsWith("2026"), "parses funnel milestones");

const merged = mergeAttributionWithFunnelContext(
  parseCampaignAttribution({
    source: "facebook",
    medium: "organic_social",
    campaign: "page",
    content: null,
    landingPath: "/website-audit",
  }),
  funnelParsed,
);
assert(merged && "funnel" in merged && merged.source === "facebook", "merges funnel into attribution");

assert(
  formatFunnelRate({ status: FUNNEL_METRIC_STATUS.INSUFFICIENT_DATA, value: null }) ===
    "INSUFFICIENT DATA",
  "insufficient data rate label",
);
assert(
  formatFunnelCount({ status: FUNNEL_METRIC_STATUS.NOT_CAPTURED, value: null }) ===
    "NOT CAPTURED",
  "not captured count label",
);

const auditTool = readFileSync(
  join(here, "../../components/website-audit/website-audit-tool.tsx"),
  "utf8",
);
assert(
  !auditTool.includes("COMMERCIAL_EVENTS.auditCompleted"),
  "audit_completed no longer double-fired via commercial event",
);
assert(auditTool.includes("trackAuditFunnelEvent"), "audit tool uses funnel tracker");

const ctaParams = sanitizeGrowthEventParams({
  cta_location: "report_upgrade",
  cta_type: "professional_audit",
  report_context: "inline_landing",
  report_id: "3ad43538-a0b0-4f39-937b-b119be11f62f",
} as Record<string, string | number | boolean>);
assert(ctaParams?.cta_location === "report_upgrade", "cta_location allowed");
assert(ctaParams?.report_context === "inline_landing", "report_context allowed");
assert(ctaParams && !("report_id" in ctaParams), "report_id stripped from cta params");

// ─── Growth Sprint 3 — Facebook organic growth ──────────────────────────────

assert(FACEBOOK_GROWTH_VERSION === "facebook-growth-v1", "facebook growth version");
assert(FACEBOOK_PUBLISHER_TYPES.includes("COMPANY"), "company publisher");
assert(FACEBOOK_PUBLISHER_TYPES.includes("FOUNDER"), "founder publisher");
assert(FACEBOOK_CONTENT_JOBS.includes("REACH"), "reach job");
assert(FACEBOOK_CONTENT_JOBS.includes("AUDIT_CONVERSION"), "audit job");
assert(FACEBOOK_CONTENT_PILLARS.includes("SEO"), "seo pillar");
assert(FACEBOOK_CONTENT_FORMATS.includes("PHOTO"), "photo format");
assert(FACEBOOK_CONTENT_FORMATS.includes("REEL"), "reel format");
assert(isFacebookPublisherType("COMPANY"), "publisher type guard");
assert(!isFacebookPublisherType("PAGE"), "invalid publisher rejected");
assert(isFacebookContentJob("ENGAGEMENT"), "job guard");
assert(!isFacebookContentJob("VIRAL"), "invalid job rejected");
assert(isFacebookContentPillar("LOCAL_SEO"), "pillar guard");
assert(!isFacebookContentPillar("RANDOM"), "invalid pillar rejected");
assert(isFacebookContentFormat("CAROUSEL"), "format guard");
assert(!isFacebookContentFormat("STORY"), "story not in V1 formats");

assert(
  buildFacebookCompanyUtmContent("seo_mistakes_001") === "company_seo_mistakes_001",
  "company utm_content",
);
assert(
  buildFacebookFounderUtmContent("lessons_001") === "founder_lessons_001",
  "founder utm_content",
);
assert(buildFacebookCompanyUtmContent("Bad Value!") === null, "rejects bad slug");

const companyUtm = buildUtmUrl({
  destinationUrl: "https://jsgrowth.com/website-audit",
  source: FACEBOOK_PAGE_UTM.source,
  medium: FACEBOOK_PAGE_UTM.medium,
  campaign: FACEBOOK_PAGE_UTM.campaign,
  content: buildFacebookCompanyUtmContent("seo_mistakes_001") ?? undefined,
});
assert(companyUtm.ok, "company UTM builds");
if (companyUtm.ok) {
  assert(companyUtm.url.includes("utm_campaign=page_organic"), "page_organic campaign");
  assert(
    companyUtm.url.includes("utm_content=company_seo_mistakes_001"),
    "company content param",
  );
}

const founderUtm = buildUtmUrl({
  destinationUrl: "https://jsgrowth.com/website-audit",
  source: FACEBOOK_FOUNDER_UTM.source,
  medium: FACEBOOK_FOUNDER_UTM.medium,
  campaign: FACEBOOK_FOUNDER_UTM.campaign,
  content: buildFacebookFounderUtmContent("lessons_001") ?? undefined,
});
assert(founderUtm.ok, "founder UTM builds");
if (founderUtm.ok) {
  assert(
    founderUtm.url.includes("utm_campaign=founder_content"),
    "founder campaign",
  );
  assert(
    founderUtm.url.includes("utm_content=founder_lessons_001"),
    "founder content param",
  );
}

assert(FACEBOOK_PAGE_UTM.campaign === FACEBOOK_PAGE_CAMPAIGN, "page campaign constant");
assert(
  classifyFacebookOrganicPublisher({
    source: "facebook",
    medium: "organic_social",
    content: "company_seo_mistakes_001",
  }) === "COMPANY",
  "classifies company from content",
);
assert(
  classifyFacebookOrganicPublisher({
    source: "facebook",
    medium: "organic_social",
    content: "founder_lessons_001",
  }) === "FOUNDER",
  "classifies founder from content",
);
assert(
  classifyFacebookOrganicPublisher({
    source: "facebook",
    medium: "organic_social",
    campaign: "founder_content",
  }) === "FOUNDER",
  "classifies founder from campaign",
);
assert(
  classifyFacebookOrganicPublisher({
    source: "facebook",
    medium: "organic_social",
    campaign: "page_organic",
  }) === "COMPANY",
  "classifies company from campaign",
);
assert(
  classifyFacebookOrganicPublisher({
    source: "google",
    medium: "organic",
  }) === null,
  "non-facebook not classified",
);

const pct = safePercent(5, 10);
assert(pct.status === "AVAILABLE" && pct.value === 50, "safePercent 50%");
assert(safePercent(null, 10).status === "NOT_CAPTURED", "null numerator NOT_CAPTURED");
assert(safePercent(1, 0).status === "UNKNOWN", "zero denominator UNKNOWN");
assert(safePercent(0, 0).status === "ZERO", "0/0 ZERO");
assert(safePercent(1, 3).status === "INSUFFICIENT_DATA", "n<5 insufficient");

const delta = netFollowerChange(80, 75);
assert(delta.status === "AVAILABLE" && delta.value === 5, "net follower +5");
assert(netFollowerChange(null, 75).status === "NOT_CAPTURED", "missing followers");
const growthPct = followerGrowthRatePercent(80, 75);
assert(
  growthPct.status === "AVAILABLE" && growthPct.value === 6.7,
  "follower growth rate",
);
assert(
  followerGrowthRatePercent(5, 0).status === "INSUFFICIENT_DATA",
  "zero baseline growth insufficient",
);

const manualOk = validateFacebookManualMetrics({ views: 10, engagements: 2 });
assert(manualOk.ok, "manual metrics valid");
const manualBad = validateFacebookManualMetrics({ views: -1 });
assert(!manualBad.ok, "negative manual metric rejected");
const manualBlank = validateFacebookManualMetrics({});
assert(manualBlank.ok, "blank metrics ok (NOT_CAPTURED semantics)");

assert(FACEBOOK_METRIC_LAYERS.length === 5, "five metric layers");
assert(FACEBOOK_SCORECARD.leading.includes("reach"), "leading includes reach");
assert(
  FACEBOOK_FOLLOWER_TARGET_FRAMEWORK.label === "TARGET",
  "follower targets labeled TARGET not forecast",
);
assert(
  FACEBOOK_FOLLOWER_TARGET_FRAMEWORK.baselineFollowers === 75,
  "target framework anchors baseline followers",
);

assert(GROWTH_BASELINE_V1.facebook.followers === 75, "baseline followers immutable");
assert(
  GROWTH_BASELINE_V1.facebook.viewsByFollowerStatus.nonFollowersPercent === 95.3,
  "baseline non-follower immutable",
);

assert(schema.includes("model GrowthContentRecord"), "GrowthContentRecord in schema");
assert(schema.includes("enum GrowthContentPublisherType"), "publisher enum in schema");

assert(growthPage.includes("FACEBOOK_GROWTH_VERSION"), "dashboard facebook version");
assert(growthPage.includes("CreateGrowthContentForm"), "dashboard content form");
assert(
  growthPage.includes("getFacebookOrganicAttributionSummary"),
  "dashboard facebook attribution",
);
assert(
  !/graph\.facebook\.com|facebook-nodejs-business-sdk/i.test(growthPage),
  "growth page has no Meta API clients",
);

const contentForm = readFileSync(
  join(here, "../../components/growth/create-content-form.tsx"),
  "utf8",
);
assert(contentForm.includes("isPending"), "content form pending lock");
assert(contentForm.includes("Saving..."), "content form saving label");
assert(
  contentForm.includes("disabled={isPending}"),
  "content form disables while pending",
);

const contentStore = readFileSync(
  join(here, "content-store.ts"),
  "utf8",
);
assert(
  contentStore.includes("GROWTH_CONTENT_RAPID_DUPLICATE_WINDOW_MS"),
  "rapid duplicate window constant",
);
assert(
  contentStore.includes("updateGrowthContentManualMetrics"),
  "same-record metric update helper",
);
assert(
  contentStore.includes("deduplicated"),
  "create returns deduplicated flag",
);
assert(
  contentStore.includes("growthContentMetricSnapshot"),
  "checkpoint snapshots wired",
);
assert(schema.includes("model GrowthContentMetricSnapshot"), "snapshot model");
assert(schema.includes("model GrowthExperimentDecision"), "experiment decision model");

const execution = readFileSync(
  join(here, "facebook-execution.ts"),
  "utf8",
);
assert(execution.includes("facebook-execution-v1"), "execution version");
assert(execution.includes("EXPERIMENTAL OPERATING CADENCE"), "cadence label");
assert(execution.includes("2026-08-24"), "execution start");
assert(growthPage.includes("FACEBOOK_EXECUTION_VERSION"), "dashboard execution");
assert(growthPage.includes("GrowthContentRecordsTable"), "edit metrics table");
assert(growthPage.includes("CreateExperimentDecisionForm"), "experiment form");
assert(
  !/graph\.facebook\.com|facebook-nodejs-business-sdk|openai|OpenAI/i.test(
    growthPage,
  ),
  "no Meta/OpenAI clients on growth page",
);

const researchDoc = readFileSync(
  join(here, "../../../docs/research/facebook-organic-growth-2026.md"),
  "utf8",
);
assert(researchDoc.includes("Research date"), "research doc date");
assert(researchDoc.includes("FACT"), "research FACT/HYPOTHESIS/TEST");

const playbook = readFileSync(
  join(here, "../../../docs/growth/facebook-organic-playbook.md"),
  "utf8",
);
assert(playbook.includes("WHAT WE KNOW"), "playbook sections");

for (const example of ["company_seo_mistakes_001", "founder_lessons_001"]) {
  assert(!example.includes("@"), "utm example has no email");
  assert(!example.includes("prospect_"), "utm example has no prospect_");
  assert(!example.includes("opportunity_"), "utm example has no opportunity_");
  assert(!/\bcuid\b|[0-9a-f]{24}/i.test(example), "utm example has no id-like tokens");
}

// --- Growth Sprint 5: Search Intelligence ---
assert(SEARCH_INTELLIGENCE_VERSION === 1, "search intelligence version");
assert(SEARCH_INTENTS.includes("LOCAL_SERVICE"), "local service intent");
assert(SEARCH_INTENTS.includes("PROBLEM_SOLUTION"), "problem solution intent");
assert(SEARCH_TOPICS.includes("LOCAL_SEO"), "local seo topic");
assert(SEARCH_TOPICS.includes("WEBSITE_AUDITS"), "audits topic");
assert(
  SEARCH_CAPABILITY_MAP.WEBSITE_GROWTH_AUDITS === "CORE_COMMERCIAL",
  "audits core commercial",
);
assert(
  SEARCH_CAPABILITY_MAP.CUSTOM_SOFTWARE === "FUTURE_PRODUCT",
  "custom software future",
);
assert(SEARCH_OPPORTUNITY_SOURCES.includes("GSC_QUERY"), "gsc query source");
assert(SEARCH_OPPORTUNITY_SOURCES.includes("SERVICE_GAP"), "service gap source");
assert(SEARCH_OPPORTUNITY_STATUSES.includes("PLANNED"), "planned status");
assert(SEARCH_PRIORITY_BANDS.includes("NOW"), "now band");
assert(SEARCH_EVIDENCE_KINDS.includes("HYPOTHESIS"), "hypothesis evidence");
assert(SEARCH_EVIDENCE_KINDS.includes("FIRST_PARTY_DATA"), "first party evidence");
assert(isSearchIntent("TOOL"), "tool intent");
assert(!isSearchIntent("RANKING"), "ranking not an intent");
assert(isSearchTopic("SEO"), "seo topic");
assert(isSearchOpportunitySource("MANUAL_RESEARCH"), "manual research source");
assert(isSearchEvidenceKind("INFERENCE"), "inference evidence");

assert(
  resolveSearchConsoleStage({
    impressions: 2,
    queryDataStatus: "INSUFFICIENT_DATA",
  }) === "STAGE_0",
  "baseline remains stage 0",
);
assert(
  resolveSearchConsoleStage({
    impressions: 100,
    queryDataStatus: "AVAILABLE",
    distinctQueryCount: 5,
  }) === "STAGE_1",
  "thin queries stay stage 1",
);

const highPriority = computeSearchPriorityBand({
  commercialRelevance: 3,
  intentStrength: 3,
  contentGap: 3,
  auditFunnelRelevance: 3,
  gscEvidence: 0,
  effort: 1,
});
assert(highPriority.band === "NOW", "high commercial gap is NOW");
assert(highPriority.score >= 28, "NOW score threshold");

const lowPriority = computeSearchPriorityBand({
  commercialRelevance: 1,
  intentStrength: 1,
  contentGap: 1,
  auditFunnelRelevance: 1,
  gscEvidence: 0,
  effort: 3,
});
assert(lowPriority.band === "LATER", "low fit is LATER");

const ranked = rankSeedOpportunities();
assert(ranked.length === SEARCH_OPPORTUNITY_SEEDS.length, "all seeds ranked");
assert(ranked[0]!.priority.score >= ranked[ranked.length - 1]!.priority.score, "desc score");

const brief = buildContentBriefFromSeed(SEARCH_OPPORTUNITY_SEEDS[0]!);
assert(brief.primaryIntent.length > 0, "brief has intent");
assert(brief.avoidClaimConstraints.length >= 3, "brief claim constraints");
assert(
  brief.avoidClaimConstraints.some((c) => /guaranteed|guarantee/i.test(c)),
  "brief forbids ranking guarantees",
);
assert(!("searchVolume" in brief), "brief has no searchVolume field");

assert(SEARCH_BASELINE_SUMMARY.clicks === 0, "baseline clicks immutable");
assert(SEARCH_BASELINE_SUMMARY.impressions === 2, "baseline impressions immutable");
assert(
  SEARCH_BASELINE_SUMMARY.queryDataStatus === "INSUFFICIENT_DATA",
  "baseline query insufficient",
);
assert(
  SEARCH_PAGE_INVENTORY.some((p) => p.path === "/website-audit"),
  "audit in inventory",
);
assert(
  SEARCH_PAGE_INVENTORY.some((p) => p.path === "/ai-solutions" && !p.inSitemap),
  "ai-solutions sitemap gap noted",
);
assert(SEARCH_BLOG_INVENTORY.length === 9, "nine blog posts inventoried");
assert(
  SEARCH_BLOG_INVENTORY.some(
    (p) => p.slug === "how-much-does-seo-cost-small-business",
  ),
  "seo cost blog inventoried",
);
assert(
  SEARCH_BLOG_INVENTORY.some(
    (p) => p.slug === "local-seo-checklist-small-business",
  ),
  "local seo checklist inventoried",
);
assert(
  SEARCH_BLOG_INVENTORY.some(
    (p) => p.slug === "small-business-not-showing-up-on-google",
  ),
  "google visibility article inventoried",
);
assert(SEARCH_CONTENT_GAPS.some((g) => g.kind === "MISSING_SERVICE"), "service gap");
assert(
  SEARCH_CONTENT_GAPS.some((g) => g.id === "gap-local-cities"),
  "local doorway caution",
);
assert(SEARCH_INTERNAL_LINK_RECS.length >= 3, "internal link recs");
assert(SEARCH_CONSOLE_STAGES.length === 6, "six gsc stages");
assert(PREFERRED_SOURCES_DECISION.status === "FUTURE_EXPERIMENT", "preferred sources deferred");
assert(
  SOCIAL_VIDEO_SEARCH_DECISION.status === "FUTURE_CROSS_CHANNEL",
  "social video deferred",
);
assert(
  /SEO best practices remain relevant/i.test(AI_SEARCH_GUIDANCE_SUMMARY.official),
  "ai search official guidance",
);

assert(schema.includes("model GrowthSearchOpportunity"), "search opportunity model");
assert(schema.includes("enum GrowthSearchIntent"), "search intent enum");
assert(schema.includes("enum GrowthSearchEvidenceKind"), "evidence enum");

assert(growthPage.includes("Search Intelligence"), "dashboard search section");
assert(growthPage.includes("SEARCH_INTELLIGENCE_VERSION"), "dashboard version");
assert(growthPage.includes("CreateSearchOpportunityForm"), "opportunity form");
assert(
  !/searchvolume|guaranteed ranking|keyword.?volume api/i.test(growthPage),
  "no fake volume or ranking promises on dashboard",
);
assert(
  !/googleapis\.com\/webmasters|searchconsole\.googleapis|openai|OpenAI/i.test(
    growthPage,
  ),
  "no GSC API or OpenAI on growth page",
);

const searchIntelSrc = readFileSync(join(here, "search-intelligence.ts"), "utf8");
assert(
  !/searchVolume\s*[:=]|monthlySearches\s*[:=]|guaranteed position|guarantee(?:d)? traffic/i.test(
    searchIntelSrc,
  ),
  "no fabricated volume or rank guarantees in model",
);

const searchResearch = readFileSync(
  join(here, "../../../docs/research/seo-search-intelligence-2026.md"),
  "utf8",
);
assert(searchResearch.includes("ACCESS DATE"), "research access date");
assert(searchResearch.includes("GOOGLE OFFICIAL GUIDANCE"), "official section");
assert(searchResearch.includes("OUR HYPOTHESIS"), "hypothesis separated");

const searchIntelDoc = readFileSync(
  join(here, "../../../docs/growth/search-intelligence.md"),
  "utf8",
);
assert(searchIntelDoc.includes("SEARCH_INTELLIGENCE_VERSION"), "ops doc version");

const briefContractDoc = readFileSync(
  join(here, "../../../docs/growth/content-brief-contract.md"),
  "utf8",
);
assert(briefContractDoc.includes("Sprint 6"), "brief contract for sprint 6");

const visibilityPost = readFileSync(
  join(
    here,
    "../../content/blog/small-business-not-showing-up-on-google.tsx",
  ),
  "utf8",
);
assert(
  visibilityPost.includes('slug: "small-business-not-showing-up-on-google"'),
  "visibility article slug",
);
assert(
  visibilityPost.includes("growthEvent=\"blog_cta_clicked\""),
  "visibility article tracks blog CTA",
);
assert(
  visibilityPost.includes('href="/website-audit"'),
  "visibility article links audit",
);
assert(
  !/guaranteed page one|skyrocket rankings|dominate Google/i.test(
    visibilityPost,
  ),
  "visibility article avoids hype claims",
);

const postsIndex = readFileSync(
  join(here, "../../content/blog/posts.tsx"),
  "utf8",
);
assert(
  postsIndex.includes("smallBusinessNotShowingUpOnGooglePost"),
  "visibility post registered",
);

const leadsPost = readFileSync(
  join(
    here,
    "../../content/blog/why-most-small-business-websites-dont-generate-leads.tsx",
  ),
  "utf8",
);
assert(
  leadsPost.includes("/blog/small-business-not-showing-up-on-google"),
  "leads article cross-links visibility article",
);

console.log("growth measurement verification passed");
process.exit(0);
