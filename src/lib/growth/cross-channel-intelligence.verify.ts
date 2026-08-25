import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  ACQUISITION_CAPTURE_VERSION,
  CONTENT_REVIEW_VERSION,
  GROWTH_BASELINE_VERSION,
  LEAD_CONVERSION_INTELLIGENCE_VERSION,
  LOCAL_GROWTH_VERSION,
  SEARCH_INTELLIGENCE_VERSION,
} from "@/lib/growth";
import { GBP_READ_INTEGRATION_VERSION } from "@/lib/gbp/constants";
import {
  CROSS_CHANNEL_INTELLIGENCE_VERSION,
  CROSS_CHANNEL_PERSISTENCE_DECISION,
  CROSS_CHANNEL_SIDE_EFFECT_BUDGET,
  CROSS_CHANNEL_THRESHOLDS,
  GBP_API_EXTERNAL_DEPENDENCY,
  assignPriorityBands,
  buildCrossChannelIntelligence,
  buildPriorityRecommendations,
  classifyAttributionHealth,
  detectBottlenecks,
  filterSuppressedRecommendations,
  percentChange,
  shouldBlockConflictingFacebookExperiment,
  shouldRecommendSearchCtrReview,
  type CrossChannelIntelligenceInput,
} from "@/lib/growth/cross-channel-intelligence";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

const here = dirname(fileURLToPath(import.meta.url));

assert(
  CROSS_CHANNEL_INTELLIGENCE_VERSION === 1,
  "cross-channel version",
);
assert(LEAD_CONVERSION_INTELLIGENCE_VERSION === 1, "lead conversion unchanged");
assert(LOCAL_GROWTH_VERSION === 1, "local growth unchanged");
assert(GBP_READ_INTEGRATION_VERSION === 1, "gbp read unchanged");
assert(SEARCH_INTELLIGENCE_VERSION === 1, "search unchanged");
assert(CONTENT_REVIEW_VERSION === 1, "content review unchanged");
assert(ACQUISITION_CAPTURE_VERSION === 1, "acquisition unchanged");
assert(GROWTH_BASELINE_VERSION === 1, "baseline unchanged");

assert(
  CROSS_CHANNEL_SIDE_EFFECT_BUDGET.OPENAI === 0 &&
    CROSS_CHANNEL_SIDE_EFFECT_BUDGET.META === 0 &&
    CROSS_CHANNEL_SIDE_EFFECT_BUDGET.GSC === 0 &&
    CROSS_CHANNEL_SIDE_EFFECT_BUDGET.GBP === 0 &&
    CROSS_CHANNEL_SIDE_EFFECT_BUDGET.PLACES === 0 &&
    CROSS_CHANNEL_SIDE_EFFECT_BUDGET.CRAWL === 0 &&
    CROSS_CHANNEL_SIDE_EFFECT_BUDGET.RESEND === 0 &&
    CROSS_CHANNEL_SIDE_EFFECT_BUDGET.STRIPE_MUTATIONS === 0,
  "N: side-effect budget all zero",
);

assert(
  CROSS_CHANNEL_PERSISTENCE_DECISION === "DERIVED_ONLY_NO_NEW_TABLE_V1",
  "migration: derived only",
);

assert(
  GBP_API_EXTERNAL_DEPENDENCY.code === "GBP_API_APPROVAL_PENDING",
  "I: GBP approval pending code",
);
assert(
  GBP_API_EXTERNAL_DEPENDENCY.severity === "WATCH",
  "I: GBP pending is WATCH not ERROR",
);

assert(
  CROSS_CHANNEL_THRESHOLDS.SAMPLE_INSUFFICIENT_MAX === 4,
  "sample reuse ≤4",
);
assert(CROSS_CHANNEL_THRESHOLDS.SAMPLE_EARLY_MAX === 19, "sample reuse 5–19");
assert(
  CROSS_CHANNEL_THRESHOLDS.SEARCH_CTR_MIN_IMPRESSIONS === 100,
  "G: CTR floor 100 impressions",
);

// M: Unknown ≠ zero
assert(
  percentChange({
    current: 10,
    previous: null,
    comparableWindows: true,
  }).status === "UNKNOWN",
  "null previous → UNKNOWN not 0%",
);
assert(
  percentChange({
    current: 10,
    previous: 5,
    comparableWindows: false,
  }).status === "UNKNOWN",
  "L: no fabricated % without comparable windows",
);
assert(
  percentChange({
    current: 12,
    previous: 10,
    comparableWindows: true,
  }).value === 20,
  "comparable % works",
);

// D: attribution health
const lowAttr = classifyAttributionHealth({
  knownChannel: 1,
  direct: 0,
  unknown: 20,
  eligible: 21,
});
assert(lowAttr.state === "LOW_COVERAGE", "D: unknown creates low coverage");
assert(lowAttr.unknown === 20, "D: unknown preserved");

const insuffAttr = classifyAttributionHealth({
  knownChannel: 1,
  direct: 1,
  unknown: 1,
  eligible: 3,
});
assert(
  insuffAttr.state === "INSUFFICIENT_DATA",
  "attribution n<5 insufficient",
);

const goodAttr = classifyAttributionHealth({
  knownChannel: 8,
  direct: 2,
  unknown: 0,
  eligible: 10,
});
assert(goodAttr.state === "GOOD_COVERAGE", "E: good tagged coverage");

// G: CTR recommendation blocked below threshold
assert(
  !shouldRecommendSearchCtrReview({ impressions: 40, clicks: 0 }),
  "G: CTR blocked below 100 impressions",
);
assert(
  shouldRecommendSearchCtrReview({ impressions: 200, clicks: 1 }),
  "CTR allowed at ≥100 with weak CTR",
);

// H: active FB experiment blocks conflicting experiment
assert(
  shouldBlockConflictingFacebookExperiment({
    activeExperimentIds: ["2026-018"],
  }),
  "H: active experiment blocks conflict",
);
assert(
  !shouldBlockConflictingFacebookExperiment({ activeExperimentIds: [] }),
  "no active → not blocked",
);

function baseInput(
  overrides: Partial<CrossChannelIntelligenceInput> = {},
): CrossChannelIntelligenceInput {
  return {
    windowLabel: "2026-07-28 → 2026-08-25",
    comparablePriorWindow: false,
    websiteSessions: null,
    searchImpressions: 20,
    searchClicks: 1,
    searchIndexedSeo: true,
    searchEarlyStage: true,
    facebookReach: 100,
    facebookEngagement: 10,
    gbpProfileViews: 5,
    gbpWebsiteClicks: 1,
    gbpChecklistNeedsAttention: 0,
    gbpSnapshotCount: 2,
    gbpApiApprovalPending: true,
    contentPublishedCount: 1,
    contentDistributedCount: 1,
    contentReviewsDue: 0,
    audits: 2,
    contacts: 0,
    inboundLeads: 0,
    outboundProspects: 0,
    opportunities: 0,
    proposals: 0,
    agreements: 0,
    paymentsPending: 0,
    paymentsPaid: 0,
    clients: 0,
    overdueFollowUps: 0,
    suppressedSubjects: 0,
    attributionKnownChannel: 0,
    attributionDirect: 0,
    attributionUnknown: 0,
    attributionEligible: 0,
    activeFacebookExperimentIds: ["2026-018"],
    activeGbpExperimentIds: ["GBP-001"],
    searchContentGaps: 0,
    commercialAttention: [],
    ...overrides,
  };
}

// B: overdue inbound lead outranks low-priority content optimization
const overdueLead = buildCrossChannelIntelligence(
  baseInput({
    overdueFollowUps: 1,
    inboundLeads: 1,
    gbpChecklistNeedsAttention: 2,
    contentReviewsDue: 1,
    commercialAttention: [
      {
        action: "FOLLOW_UP_LEAD",
        title: "Overdue inbound lead",
        why: ["followUpAt in the past", "not DNC"],
        evidence: ["Lead", "FollowUpActivity"],
        href: "/reports/growth/follow-up",
      },
    ],
  }),
);
assert(overdueLead.recommendations.now.length >= 1, "B: has NOW");
assert(
  overdueLead.recommendations.now[0]!.action === "FOLLOW_UP_LEAD" ||
    overdueLead.recommendations.now[0]!.action === "CHECK_PAYMENT",
  "B: overdue lead outranks GBP/content busywork",
);
assert(
  overdueLead.recommendations.now[0]!.sortWeight <
    (overdueLead.recommendations.next.find((r) => r.action === "REVIEW_GBP_PROFILE")
      ?.sortWeight ?? 999),
  "B: follow-up weight lower than GBP review",
);

// C: pending payment outranks WATCH-level SEO review
const paymentFirst = buildCrossChannelIntelligence(
  baseInput({
    paymentsPending: 1,
    searchEarlyStage: true,
    searchImpressions: 30,
    commercialAttention: [],
  }),
);
assert(
  paymentFirst.recommendations.now.some((r) => r.action === "CHECK_PAYMENT"),
  "C: payment in NOW",
);
assert(
  paymentFirst.recommendations.watch.some(
    (r) =>
      r.action === "KEEP_MONITORING" || r.action === "WAIT_FOR_MORE_DATA",
  ),
  "C: early SEO stays WATCH",
);
const payWeight = paymentFirst.recommendations.now.find(
  (r) => r.action === "CHECK_PAYMENT",
)!.sortWeight;
const watchSeo = paymentFirst.recommendations.watch.find(
  (r) => r.action === "KEEP_MONITORING",
);
assert(
  !watchSeo || payWeight < watchSeo.sortWeight,
  "C: payment outranks SEO WATCH",
);

// F: search early stays WATCH / KEEP_MONITORING
assert(
  paymentFirst.channelStates.find((c) => c.channel === "SEARCH")?.state ===
    "MONITORING" ||
    paymentFirst.recommendations.watch.some(
      (r) => r.action === "KEEP_MONITORING",
    ),
  "F: early search monitoring",
);

// H: RESPECT_ACTIVE_EXPERIMENT in WATCH, no RUN_FACEBOOK_EXPERIMENT
assert(
  overdueLead.recommendations.watch.some(
    (r) => r.action === "RESPECT_ACTIVE_EXPERIMENT",
  ),
  "H: respect active experiment",
);
assert(
  ![
    ...overdueLead.recommendations.now,
    ...overdueLead.recommendations.next,
    ...overdueLead.recommendations.watch,
  ].some((r) => r.action === "RUN_FACEBOOK_EXPERIMENT"),
  "H: no conflicting FB experiment recommendation",
);

// I: GBP API pending does not break report
assert(overdueLead.gbpDependency?.code === "GBP_API_APPROVAL_PENDING", "I");
const gbpPendingOnly = buildCrossChannelIntelligence(
  baseInput({
    gbpChecklistNeedsAttention: 0,
    gbpSnapshotCount: 2,
    gbpApiApprovalPending: true,
    overdueFollowUps: 0,
    paymentsPending: 0,
    commercialAttention: [],
  }),
);
assert(
  gbpPendingOnly.channelStates.find((c) => c.channel === "GBP")?.state ===
    "MONITORING",
  "I: pending alone stays MONITORING (not ACTION_REQUIRED)",
);
assert(
  gbpPendingOnly.recommendations.watch.some((r) =>
    r.why.some((w) => /allowlisting pending/i.test(w)),
  ),
  "I: WATCH note for allowlisting",
);

// J: DNC never gets follow-up recommendation
const dncFiltered = filterSuppressedRecommendations([
  {
    band: "NOW",
    action: "FOLLOW_UP_LEAD",
    title: "Suppressed",
    why: ["test"],
    evidence: ["Lead"],
    strength: "MEANINGFUL",
    href: "/reports/leads/x",
    sortWeight: 25,
    doNotContact: true,
  },
  {
    band: "NOW",
    action: "FOLLOW_UP_LEAD",
    title: "Ok lead",
    why: ["test"],
    evidence: ["Lead"],
    strength: "MEANINGFUL",
    href: "/reports/growth/follow-up",
    sortWeight: 25,
    doNotContact: false,
  },
]);
assert(dncFiltered.length === 1, "J: DNC filtered");
assert(dncFiltered[0]!.title === "Ok lead", "J: only non-DNC remains");

const dncReport = buildCrossChannelIntelligence(
  baseInput({
    commercialAttention: [
      {
        action: "FOLLOW_UP_LEAD",
        title: "Do not contact",
        why: ["suppressed"],
        evidence: ["Lead"],
        href: "/reports/leads/abc",
        doNotContact: true,
      },
    ],
  }),
);
assert(
  !dncReport.recommendations.now.some(
    (r) => r.title === "Do not contact",
  ),
  "J: DNC not in NOW",
);

// Caps
assert(
  overdueLead.recommendations.now.length <= CROSS_CHANNEL_THRESHOLDS.NOW_MAX,
  "NOW max 3",
);
assert(
  overdueLead.recommendations.next.length <= CROSS_CHANNEL_THRESHOLDS.NEXT_MAX,
  "NEXT max 5",
);
assert(
  overdueLead.recommendations.watch.length <=
    CROSS_CHANNEL_THRESHOLDS.WATCH_MAX,
  "WATCH max 5",
);

// Why this now — auditable
const whyNow = overdueLead.recommendations.now[0]!;
assert(whyNow.why.length >= 1, "why present");
assert(whyNow.evidence.length >= 1, "evidence present");
assert(whyNow.strength.length > 0, "strength present");

// Bottleneck: audits without leads (with sample)
const dropOff = detectBottlenecks(
  baseInput({
    audits: 15,
    inboundLeads: 1,
    attributionKnownChannel: 0,
    attributionDirect: 0,
    attributionUnknown: 15,
    attributionEligible: 15,
  }),
  classifyAttributionHealth({
    knownChannel: 0,
    direct: 0,
    unknown: 15,
    eligible: 15,
  }),
);
assert(
  dropOff.some((b) => b.code === "AUDITS_WITHOUT_LEADS"),
  "audits without leads bottleneck",
);
assert(
  dropOff.some((b) => b.code === "LOW_ATTRIBUTION_COVERAGE"),
  "D: attribution bottleneck",
);

// E: good tagged acquisition → classified health
const tagged = buildCrossChannelIntelligence(
  baseInput({
    attributionKnownChannel: 9,
    attributionDirect: 1,
    attributionUnknown: 0,
    attributionEligible: 10,
    inboundLeads: 3,
  }),
);
assert(tagged.attributionHealth.state === "GOOD_COVERAGE", "E: good coverage");

// No fake growth score string in module
const intelSrc = readFileSync(
  join(here, "cross-channel-intelligence.ts"),
  "utf8",
);
assert(!/Growth Score|growthScore|\/100/.test(intelSrc), "no fake score");
assert(!/statistically significant/i.test(intelSrc), "no fake stats claim");

// Dashboard / detail / docs contracts
const growthPage = readFileSync(
  join(here, "../../app/reports/growth/page.tsx"),
  "utf8",
);
assert(
  /cross-channel|Cross-Channel Intelligence|getCrossChannel/i.test(growthPage),
  "A: growth hub references cross-channel",
);

const intelPagePath = join(
  here,
  "../../app/reports/growth/intelligence/page.tsx",
);
const intelPage = readFileSync(intelPagePath, "utf8");
assert(
  /CROSS_CHANNEL_INTELLIGENCE_VERSION|getCrossChannelIntelligence/.test(
    intelPage,
  ),
  "detail route exists",
);

const docsIntel = readFileSync(
  join(here, "../../../docs/growth/cross-channel-intelligence.md"),
  "utf8",
);
assert(
  /CROSS_CHANNEL_INTELLIGENCE_VERSION = 1/.test(docsIntel),
  "docs version",
);

const research = readFileSync(
  join(
    here,
    "../../../docs/research/cross-channel-growth-intelligence-2026.md",
  ),
  "utf8",
);
assert(/FACT|OFFICIAL_GUIDANCE|JS_SOLUTIONS_OPERATING_RULE/.test(research), "research labels");

const weekly = readFileSync(
  join(here, "../../../docs/growth/weekly-review.md"),
  "utf8",
);
assert(/Cross-Channel|bottleneck|attribution coverage/i.test(weekly), "weekly review updated");

const acceptance = readFileSync(
  join(
    here,
    "../../../docs/growth/growth-sprint13-production-acceptance.md",
  ),
  "utf8",
);
assert(/Sprint 13/i.test(acceptance), "acceptance doc");

// K: GA4 privacy — cross-channel module must not emit commercial/Google IDs to analytics helpers
assert(
  !/gtag\(|trackGrowthEvent|sendGAEvent/.test(intelSrc),
  "K: no GA4 emission from intelligence core",
);

// Priority ranking unit: FOLLOW_UP vs REVIEW_GBP
const ranked = buildPriorityRecommendations(
  baseInput({
    overdueFollowUps: 1,
    gbpChecklistNeedsAttention: 3,
    commercialAttention: [],
  }),
  [],
  classifyAttributionHealth({
    knownChannel: 0,
    direct: 0,
    unknown: 0,
    eligible: 0,
  }),
);
const bands = assignPriorityBands(ranked);
assert(
  bands.now.some((r) => r.action === "FOLLOW_UP_LEAD"),
  "follow-up in NOW band",
);

const full = buildCrossChannelIntelligence(baseInput());
assert(full.version === 1, "report version");
assert(full.sideEffectBudget.OPENAI === 0, "report budget");
assert(full.persistenceDecision === "DERIVED_ONLY_NO_NEW_TABLE_V1", "persist");
assert(full.weeklyReview.whatChanged.includes("UNKNOWN"), "L: weekly no fake %");
assert(
  full.evidence.every(
    (e) =>
      e.observationType !== "OBSERVED_ZERO" || e.value === 0,
  ),
  "M: observed zero only when value 0",
);
assert(
  full.evidence.some(
    (e) => e.observationType === "NOT_CAPTURED" && e.value === null,
  ),
  "M: NOT_CAPTURED keeps null",
);

console.log("cross-channel-intelligence.verify.ts PASS");
