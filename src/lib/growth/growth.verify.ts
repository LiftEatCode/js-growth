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

console.log("growth measurement verification passed");
process.exit(0);
