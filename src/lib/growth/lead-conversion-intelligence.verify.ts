import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  ATTRIBUTION_VERSION,
  CONTENT_PERFORMANCE_VERSION,
  CONTENT_REVIEW_VERSION,
  GROWTH_BASELINE_VERSION,
  SEARCH_INTELLIGENCE_VERSION,
} from "@/lib/growth";
import {
  LEAD_CONVERSION_INTELLIGENCE_VERSION,
  LEAD_CONVERSION_FUNNEL_STAGES,
  TOUCH_SEMANTICS,
  buildPriorityActions,
  classifyAcquisitionPath,
  classifyAttributionChannel,
  classifyAttributionStrength,
  classifyLeadAge,
  classifyOutboundProspectSource,
  contentBusinessSignalLabel,
  conversionRate,
  dropOffObservation,
  marketingRoiStatus,
  observeCount,
  pipelineVelocityMedianDays,
  revenueEvidenceKind,
  sampleQuality,
} from "@/lib/growth/lead-conversion-intelligence";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

const here = dirname(fileURLToPath(import.meta.url));

assert(
  LEAD_CONVERSION_INTELLIGENCE_VERSION === 1,
  "lead conversion version",
);
assert(CONTENT_REVIEW_VERSION === 1, "content review unchanged");
assert(CONTENT_PERFORMANCE_VERSION === 1, "content performance unchanged");
assert(SEARCH_INTELLIGENCE_VERSION === 1, "search intelligence unchanged");
assert(GROWTH_BASELINE_VERSION === 1, "baseline unchanged");
assert(ATTRIBUTION_VERSION === "attribution-v1", "utm version unchanged");

assert(
  LEAD_CONVERSION_FUNNEL_STAGES.includes("INBOUND_LEAD"),
  "inbound lead stage",
);
assert(
  LEAD_CONVERSION_FUNNEL_STAGES.includes("OUTBOUND_PROSPECT"),
  "outbound prospect stage",
);
assert(
  !(LEAD_CONVERSION_FUNNEL_STAGES as readonly string[]).includes("LEAD"),
  "does not collapse inbound/outbound into one LEAD stage",
);

assert(observeCount(null).status === "NOT_CAPTURED", "null not zero");
assert(observeCount(0).status === "ZERO", "zero preserved");
assert(observeCount(4).status === "AVAILABLE", "positive available");

assert(sampleQuality(0) === "INSUFFICIENT_DATA", "n=0 insufficient");
assert(sampleQuality(4) === "INSUFFICIENT_DATA", "n=4 insufficient");
assert(sampleQuality(5) === "EARLY_DIRECTIONAL", "n=5 early");
assert(sampleQuality(20) === "USABLE", "n=20 usable");

const tinyRate = conversionRate({ numerator: 1, denominator: 1 });
assert(tinyRate.status === "INSUFFICIENT_DATA", "tiny denom no fake rate");

const unknownRate = conversionRate({
  numerator: 1,
  denominator: null,
});
assert(unknownRate.status === "UNKNOWN", "unknown denom not zero rate");

const uncaptured = conversionRate({
  numerator: 2,
  denominator: 100,
  denominatorCaptured: false,
});
assert(uncaptured.status === "NOT_CAPTURED", "pageviews clients rate blocked");

const okRate = conversionRate({ numerator: 2, denominator: 10 });
assert(okRate.status === "AVAILABLE" && okRate.value === 20, "20% rate");

const zeroRate = conversionRate({ numerator: 0, denominator: 10 });
assert(zeroRate.status === "ZERO" && zeroRate.value === 0, "known zero rate");

assert(
  classifyAttributionChannel({ source: "facebook", medium: "organic_social" }) ===
    "FACEBOOK",
  "facebook utm",
);
assert(
  classifyAttributionChannel({
    source: "google_business_profile",
    medium: "organic_local",
  }) === "GBP",
  "gbp utm",
);
assert(
  classifyAttributionChannel({ source: null, medium: null }) === "DIRECT" ||
    classifyAttributionChannel({ source: null, medium: null }) === "UNKNOWN",
  "empty source classified",
);
assert(
  classifyAttributionChannel({ source: "", medium: "" }) === "DIRECT",
  "blank is direct",
);
assert(
  classifyAttributionChannel({ source: "mystery", medium: "weird" }) ===
    "UNKNOWN",
  "unknown channel stays unknown",
);

assert(
  classifyAttributionStrength({
    hasFirstPartyUtm: true,
    hasSourceAndMedium: true,
    linkedToAudit: true,
    path: "INBOUND",
  }) === "DIRECT_FIRST_PARTY",
  "strong first-party",
);
assert(
  classifyAttributionStrength({
    hasFirstPartyUtm: false,
    hasSourceAndMedium: false,
    linkedToAudit: false,
    path: "INBOUND",
  }) === "INFERRED",
  "inbound without utm inferred",
);
assert(
  classifyAttributionStrength({
    hasFirstPartyUtm: false,
    hasSourceAndMedium: false,
    linkedToAudit: false,
    path: "UNKNOWN",
  }) === "UNKNOWN",
  "do not force attribution",
);

assert(
  classifyAcquisitionPath({ kind: "inbound_lead" }) === "INBOUND",
  "inbound path",
);
assert(
  classifyAcquisitionPath({ kind: "outbound_prospect" }) === "OUTBOUND",
  "outbound path",
);
assert(
  classifyOutboundProspectSource("MANUAL") === "MANUAL_PROSPECTING",
  "manual outbound",
);
assert(
  classifyOutboundProspectSource("GOOGLE_PLACES") === "GOOGLE_PLACES",
  "places outbound",
);

const now = new Date("2026-08-24T12:00:00.000Z");
assert(
  classifyLeadAge(new Date("2026-08-23T12:00:00.000Z"), now) === "NEW",
  "new lead age",
);
assert(
  classifyLeadAge(new Date("2026-08-01T12:00:00.000Z"), now) === "AGING",
  "aging lead age",
);
assert(
  classifyLeadAge(new Date("2026-07-01T12:00:00.000Z"), now) === "STALE",
  "stale lead age",
);

const drop = dropOffObservation({ fromCount: 20, toCount: 5 });
assert(drop.status === "OBSERVED" && drop.lost === 15, "drop-off observed");
const thinDrop = dropOffObservation({ fromCount: 2, toCount: 0 });
assert(thinDrop.status === "INSUFFICIENT_DATA", "drop-off sample safety");
const unknownDrop = dropOffObservation({
  fromCount: 10,
  toCount: null,
  toCaptured: false,
});
assert(unknownDrop.status === "NOT_CAPTURED", "drop-off unknown not zero");

assert(
  pipelineVelocityMedianDays([1, 2]).status === "INSUFFICIENT_DATA",
  "velocity n<3",
);
assert(
  pipelineVelocityMedianDays([1, 2, 3]).medianDays === 2,
  "velocity median",
);

assert(
  revenueEvidenceKind({ paidCents: 0, hasMarketingAttribution: false }) ===
    "UNATTRIBUTED_REVENUE",
  "no paid revenue",
);
assert(
  revenueEvidenceKind({ paidCents: 1000, hasMarketingAttribution: false }) ===
    "OBSERVED_REVENUE",
  "observed not attributed",
);
assert(
  revenueEvidenceKind({ paidCents: 1000, hasMarketingAttribution: true }) ===
    "ATTRIBUTED_REVENUE",
  "attributed when join exists",
);

assert(
  marketingRoiStatus({
    costKnown: false,
    revenueAttributionStrong: true,
    windowCompatible: true,
  }) === "ROI_NOT_AVAILABLE",
  "no $0 organic cost",
);

assert(
  contentBusinessSignalLabel({
    attributedAudits: 0,
    attributedLeads: 0,
    attributedOpportunities: 0,
  }) === "NONE",
  "seo no invented business",
);
assert(
  contentBusinessSignalLabel({
    attributedAudits: 1,
    attributedLeads: 0,
    attributedOpportunities: 0,
  }) === "INSUFFICIENT_DATA",
  "one audit not a winner",
);
assert(
  contentBusinessSignalLabel({
    attributedAudits: 1,
    attributedLeads: 1,
    attributedOpportunities: 1,
  }) === "BUSINESS_SIGNAL",
  "opportunity is business signal not SEO successful",
);

assert(
  TOUCH_SEMANTICS.FIRST_OBSERVED.includes("90D"),
  "first observed modeled with retention",
);
assert(
  TOUCH_SEMANTICS.CROSS_DEVICE === "NOT_MODELED",
  "no cross-device claims",
);
assert(
  TOUCH_SEMANTICS.LATEST_TOUCH === "NOT_MODELED_AS_GA4_LAST_CLICK",
  "no invented latest touch",
);

const actions = buildPriorityActions({
  attention: [
    {
      kind: "FOLLOW_UP_DUE",
      title: "Acme",
      href: "/reports/x",
      recommendedAction: "FOLLOW_UP",
    },
  ],
  inboundLeads: 0,
  outboundProspects: 8,
  opportunities: 1,
  attributedAudits: 0,
  unknownAttributionAudits: 3,
  sampleLabel: "INSUFFICIENT_DATA",
});
assert(actions.some((a) => a.band === "NOW"), "now band from follow-up");
assert(actions.some((a) => a.band === "WATCH"), "watch small sample");
assert(actions.length <= 8, "action list bounded");

const core = readFileSync(join(here, "lead-conversion-intelligence.ts"), "utf8");
assert(!core.includes("STATISTICALLY_SIGNIFICANT"), "no fake significance");
assert(!core.includes("Growth Score"), "no vanity score");
assert(!/resend|stripe\.charges|openai/i.test(core), "core has no send/charge/ai");
assert(!core.includes("prisma."), "pure module does not query");

const metrics = readFileSync(join(here, "lead-conversion-metrics.ts"), "utf8");
assert(metrics.includes('import "server-only"'), "metrics server-only");
assert(!metrics.includes("prisma.lead.update"), "observe-only leads");
assert(!metrics.includes("prisma.opportunity.create"), "no auto opportunity");
assert(!metrics.includes("prisma.opportunity.update"), "no status mutation");
assert(!metrics.includes("resend"), "no auto email");
assert(!/openai|OpenAI/i.test(metrics), "no openai");
assert(metrics.includes("INBOUND"), "inbound split");
assert(metrics.includes("outboundProspects"), "outbound split");
assert(metrics.includes("NOT_CAPTURED"), "unknown vs zero");

const page = readFileSync(
  join(here, "../../app/reports/growth/conversion/page.tsx"),
  "utf8",
);
assert(page.includes("getLeadConversionIntelligence"), "conversion page loads");
assert(
  !/from ["']openai|AnalyticsDataClient|graph\.facebook\.com|searchconsole\.googleapis/i.test(
    page,
  ),
  "page no API clients",
);
assert(page.includes("requireInternalSession"), "conversion gated");

const dashboard = readFileSync(
  join(here, "../../app/reports/growth/page.tsx"),
  "utf8",
);
assert(
  dashboard.includes("Lead Conversion"),
  "dashboard conversion section",
);
assert(
  dashboard.includes("/reports/growth/conversion"),
  "dashboard links detail",
);
assert(
  !/openai|OpenAI|AnalyticsDataClient|graph\.facebook/i.test(dashboard),
  "dashboard still no paid APIs",
);

const analyticsVerify = readFileSync(
  join(here, "../analytics/analytics.verify.ts"),
  "utf8",
);
assert(
  analyticsVerify.includes("isForbiddenAnalyticsParamKey(\"prospect_id\")") ||
    analyticsVerify.includes('isForbiddenAnalyticsParamKey("prospect_id")') ||
    analyticsVerify.includes("prospect_id"),
  "analytics still forbids prospect ids",
);

const sanitizer = readFileSync(
  join(here, "../analytics/page-path.ts"),
  "utf8",
);
assert(sanitizer.includes("/reports/clients"), "clients route redaction");
assert(sanitizer.includes("/reports/opportunities"), "opportunity route redaction");
assert(sanitizer.includes("/reports/prospecting"), "prospecting route redaction");

const funnelTracker = readFileSync(join(here, "audit-funnel.ts"), "utf8");
assert(
  funnelTracker.includes("FUNNEL_FIRED_PREFIX") ||
    funnelTracker.includes("jsg-audit-funnel-fired"),
  "sprint 2 event dedupe remains",
);

const baselineSrc = readFileSync(join(here, "baseline-v1.ts"), "utf8");
assert(baselineSrc.includes("GROWTH_BASELINE_VERSION = 1"), "baseline file immutable");

const research = readFileSync(
  join(here, "../../../docs/research/lead-conversion-intelligence-2026.md"),
  "utf8",
);
assert(research.includes("JS SOLUTIONS DECISION"), "research decisions");
assert(research.includes("OFFICIAL"), "research official layer");

console.log("lead conversion intelligence verification passed");
