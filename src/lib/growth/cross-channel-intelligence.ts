/**
 * Growth Sprint 13 — Cross-Channel Growth Intelligence V1
 *
 * Deterministic decision layer over existing Growth Engine evidence.
 * No fake composite score. No AI. Unknown ≠ zero.
 */

import {
  LEAD_CONVERSION_THRESHOLDS,
  sampleQuality,
  type SampleQualityLabel,
} from "@/lib/growth/lead-conversion-intelligence";
import {
  CONTENT_REVIEW_THRESHOLDS,
} from "@/lib/growth/content-review";

export const CROSS_CHANNEL_INTELLIGENCE_VERSION = 1 as const;

/** Evidence domains — do not collapse into one universal metric. */
export const CROSS_CHANNEL_EVIDENCE_DOMAINS = [
  "WEBSITE",
  "SEARCH",
  "FACEBOOK",
  "GBP",
  "CONTENT",
  "AUDIT",
  "CONTACT",
  "INBOUND_LEAD",
  "OUTBOUND_PROSPECT",
  "OPPORTUNITY",
  "FOLLOW_UP",
  "PROPOSAL",
  "AGREEMENT",
  "PAYMENT",
  "CLIENT",
] as const;
export type CrossChannelEvidenceDomain =
  (typeof CROSS_CHANNEL_EVIDENCE_DOMAINS)[number];

export const EVIDENCE_STRENGTHS = [
  "NONE",
  "WEAK",
  "DIRECTIONAL",
  "MEANINGFUL",
] as const;
export type EvidenceStrength = (typeof EVIDENCE_STRENGTHS)[number];

export const OBSERVATION_TYPES = [
  "UNKNOWN",
  "NOT_CAPTURED",
  "INSUFFICIENT_DATA",
  "OBSERVED_ZERO",
  "OBSERVED",
] as const;
export type ObservationType = (typeof OBSERVATION_TYPES)[number];

export const INDICATOR_CLASSES = [
  "LEADING",
  "MID_FUNNEL",
  "LAGGING",
] as const;
export type IndicatorClass = (typeof INDICATOR_CLASSES)[number];

export const CHANNEL_HEALTH_STATES = [
  "NO_DATA",
  "INSUFFICIENT_DATA",
  "BASELINE",
  "MONITORING",
  "NEEDS_ATTENTION",
  "DIRECTIONAL_POSITIVE",
  "DIRECTIONAL_NEGATIVE",
  "ACTION_REQUIRED",
] as const;
export type ChannelHealthState = (typeof CHANNEL_HEALTH_STATES)[number];

export const CHANNEL_KEYS = [
  "WEBSITE",
  "SEARCH",
  "FACEBOOK",
  "GBP",
  "CONTENT",
  "CONVERSION",
  "FOLLOW_UP",
  "COMMERCIAL",
] as const;
export type ChannelKey = (typeof CHANNEL_KEYS)[number];

export const SIGNAL_TYPES = [
  "DISCOVERY_SIGNAL",
  "TRAFFIC_SIGNAL",
  "ENGAGEMENT_SIGNAL",
  "CONVERSION_SIGNAL",
  "PIPELINE_SIGNAL",
  "REVENUE_SIGNAL",
  "RETENTION_SIGNAL",
  "FOLLOW_UP_SIGNAL",
  "CONTENT_SIGNAL",
  "LOCAL_SIGNAL",
] as const;
export type SignalType = (typeof SIGNAL_TYPES)[number];

export const BOTTLENECK_CODES = [
  "HIGH_VISIBILITY_LOW_TRAFFIC",
  "TRAFFIC_WITHOUT_CONVERSION",
  "AUDITS_WITHOUT_LEADS",
  "LEADS_WITHOUT_FOLLOW_UP",
  "LEADS_WITHOUT_OPPORTUNITIES",
  "OPPORTUNITIES_WITHOUT_PROPOSALS",
  "PROPOSALS_WITHOUT_AGREEMENTS",
  "AGREEMENTS_WITHOUT_PAYMENT",
  "LOW_ATTRIBUTION_COVERAGE",
  "INSUFFICIENT_DISCOVERY",
  "CONTENT_WITHOUT_DISTRIBUTION",
  "GBP_PROFILE_INCOMPLETE",
  "SEARCH_CONTENT_GAP",
] as const;
export type BottleneckCode = (typeof BOTTLENECK_CODES)[number];

export const CROSS_CHANNEL_ACTION_TYPES = [
  "FOLLOW_UP_LEAD",
  "ADVANCE_OPPORTUNITY",
  "REVIEW_PROPOSAL",
  "CHECK_PAYMENT",
  "FIX_ATTRIBUTION",
  "PUBLISH_CONTENT",
  "DISTRIBUTE_CONTENT",
  "ADD_INTERNAL_LINK",
  "REVIEW_SEARCH_PERFORMANCE",
  "REVIEW_GBP_PROFILE",
  "CAPTURE_GBP_SNAPSHOT",
  "RUN_FACEBOOK_EXPERIMENT",
  "WAIT_FOR_MORE_DATA",
  "INVESTIGATE_DROP_OFF",
  "IMPROVE_CTA",
  "CREATE_SUPPORTING_CONTENT",
  "KEEP_MONITORING",
  "RESPECT_ACTIVE_EXPERIMENT",
] as const;
export type CrossChannelActionType =
  (typeof CROSS_CHANNEL_ACTION_TYPES)[number];

export const PRIORITY_BANDS = ["NOW", "NEXT", "WATCH"] as const;
export type PriorityBand = (typeof PRIORITY_BANDS)[number];

export const ATTRIBUTION_HEALTH_STATES = [
  "GOOD_COVERAGE",
  "PARTIAL_COVERAGE",
  "LOW_COVERAGE",
  "INSUFFICIENT_DATA",
] as const;
export type AttributionHealthState =
  (typeof ATTRIBUTION_HEALTH_STATES)[number];

export const RELATIONSHIP_CLAIM_KINDS = [
  "ATTRIBUTED",
  "OBSERVED",
  "INFERRED",
  "HYPOTHESIS",
] as const;
export type RelationshipClaimKind =
  (typeof RELATIONSHIP_CLAIM_KINDS)[number];

export const CROSS_CHANNEL_THRESHOLDS = {
  SAMPLE_INSUFFICIENT_MAX: LEAD_CONVERSION_THRESHOLDS.SAMPLE_INSUFFICIENT_MAX,
  SAMPLE_EARLY_MAX: LEAD_CONVERSION_THRESHOLDS.SAMPLE_EARLY_MAX,
  RATE_MIN_DENOMINATOR: LEAD_CONVERSION_THRESHOLDS.RATE_MIN_DENOMINATOR,
  ATTRIBUTION_ELIGIBLE_MIN: 5,
  ATTRIBUTION_GOOD_RATE: 70,
  ATTRIBUTION_PARTIAL_RATE: 40,
  SEARCH_CTR_MIN_IMPRESSIONS:
    CONTENT_REVIEW_THRESHOLDS.TITLE_SNIPPET_MIN_IMPRESSIONS,
  SEARCH_EARLY_IMPRESSIONS_MAX: 49,
  NOW_MAX: 3,
  NEXT_MAX: 5,
  WATCH_MAX: 5,
} as const;

/**
 * External dependency — not an operator retry error.
 * Google API project allowlisting may still be pending.
 */
export const GBP_API_EXTERNAL_DEPENDENCY = {
  code: "GBP_API_APPROVAL_PENDING" as const,
  severity: "WATCH" as const,
  interpretation:
    "Google GBP API allowlisting pending; continue manual Local Growth cadence until approved. Dashboard load does not call GBP APIs.",
};

export const CROSS_CHANNEL_SIDE_EFFECT_BUDGET = {
  OPENAI: 0,
  META: 0,
  GSC: 0,
  GBP: 0,
  PLACES: 0,
  CRAWL: 0,
  RESEND: 0,
  STRIPE_MUTATIONS: 0,
} as const;

/**
 * Persistence decision (Sprint 13):
 * Prefer derived intelligence. No new Prisma table.
 * Existing GrowthSnapshot (per-source) + commercial DB remain authoritative.
 * Optional future INTERNAL weekly rollup may store summaries only — not a score.
 */
export const CROSS_CHANNEL_PERSISTENCE_DECISION =
  "DERIVED_ONLY_NO_NEW_TABLE_V1" as const;

/** Commercial proximity outranks marketing busywork (lower = higher priority). */
export const PRIORITY_SORT_WEIGHTS = {
  CHECK_PAYMENT: 10,
  REVIEW_PROPOSAL: 15,
  ADVANCE_OPPORTUNITY: 20,
  FOLLOW_UP_LEAD: 25,
  INVESTIGATE_DROP_OFF: 35,
  FIX_ATTRIBUTION: 40,
  IMPROVE_CTA: 50,
  REVIEW_SEARCH_PERFORMANCE: 60,
  PUBLISH_CONTENT: 70,
  DISTRIBUTE_CONTENT: 72,
  CREATE_SUPPORTING_CONTENT: 74,
  ADD_INTERNAL_LINK: 76,
  REVIEW_GBP_PROFILE: 80,
  CAPTURE_GBP_SNAPSHOT: 82,
  RUN_FACEBOOK_EXPERIMENT: 85,
  RESPECT_ACTIVE_EXPERIMENT: 90,
  KEEP_MONITORING: 92,
  WAIT_FOR_MORE_DATA: 95,
  GBP_API_APPROVAL_PENDING: 98,
} as const;

export type CrossChannelEvidence = {
  domain: CrossChannelEvidenceDomain;
  metric: string;
  value: number | null;
  window: string;
  provenance: string;
  strength: EvidenceStrength;
  observationType: ObservationType;
  indicatorClass: IndicatorClass;
  relatedPublicAsset?: string | null;
  attributionContext?: string | null;
};

export type ChannelStateObservation = {
  channel: ChannelKey;
  state: ChannelHealthState;
  explanation: string;
  evidenceRefs: string[];
};

export type GrowthSignal = {
  type: SignalType;
  sourceDomain: CrossChannelEvidenceDomain | ChannelKey;
  evidence: string;
  window: string;
  strength: EvidenceStrength;
  interpretation: string;
  provenance: string;
  limitations: string;
};

export type BottleneckObservation = {
  code: BottleneckCode;
  evidence: string;
  strength: EvidenceStrength;
  sampleQuality: SampleQualityLabel | null;
  interpretation: string;
};

export type PriorityRecommendation = {
  band: PriorityBand;
  action: CrossChannelActionType;
  title: string;
  why: string[];
  evidence: string[];
  strength: EvidenceStrength;
  href: string | null;
  sortWeight: number;
  doNotContact?: boolean;
};

export type AttributionHealthObservation = {
  state: AttributionHealthState;
  knownChannel: number;
  direct: number;
  unknown: number;
  eligible: number;
  knownRate: number | null;
  interpretation: string;
};

export type ActiveExperimentGuard = {
  experimentId: string;
  status: "ACTIVE" | "QUEUED" | "OTHER";
  channel: string;
  recommendation: string;
};

export type WeeklyReviewAnswers = {
  whatChanged: string;
  whatNeedsAction: string;
  whatWaitingOn: string;
  whatEvidenceWeak: string;
  currentBottleneck: string;
  whatNotToWorkOn: string;
  activeExperiments: string;
  commercialAttention: string;
  reviewsDue: string;
  attributionCoverageImproved: string;
};

export type CrossChannelIntelligenceInput = {
  windowLabel: string;
  comparablePriorWindow: boolean;
  websiteSessions: number | null;
  searchImpressions: number | null;
  searchClicks: number | null;
  searchIndexedSeo: boolean;
  searchEarlyStage: boolean;
  facebookReach: number | null;
  facebookEngagement: number | null;
  gbpProfileViews: number | null;
  gbpWebsiteClicks: number | null;
  gbpChecklistNeedsAttention: number;
  gbpSnapshotCount: number;
  gbpApiApprovalPending: boolean;
  contentPublishedCount: number;
  contentDistributedCount: number;
  contentReviewsDue: number;
  audits: number | null;
  contacts: number | null;
  inboundLeads: number | null;
  outboundProspects: number | null;
  opportunities: number | null;
  proposals: number | null;
  agreements: number | null;
  paymentsPending: number;
  paymentsPaid: number | null;
  clients: number | null;
  overdueFollowUps: number;
  suppressedSubjects: number;
  attributionKnownChannel: number;
  attributionDirect: number;
  attributionUnknown: number;
  attributionEligible: number;
  activeFacebookExperimentIds: string[];
  activeGbpExperimentIds: string[];
  searchContentGaps: number;
  /** Candidate actions from subsystems (pre-ranked later). */
  commercialAttention: Array<{
    action: CrossChannelActionType;
    title: string;
    why: string[];
    evidence: string[];
    href: string | null;
    doNotContact?: boolean;
  }>;
};

export type CrossChannelIntelligenceReport = {
  version: typeof CROSS_CHANNEL_INTELLIGENCE_VERSION;
  windowLabel: string;
  evidence: CrossChannelEvidence[];
  channelStates: ChannelStateObservation[];
  signals: GrowthSignal[];
  bottlenecks: BottleneckObservation[];
  recommendations: {
    now: PriorityRecommendation[];
    next: PriorityRecommendation[];
    watch: PriorityRecommendation[];
  };
  attributionHealth: AttributionHealthObservation;
  activeExperiments: ActiveExperimentGuard[];
  gbpDependency: typeof GBP_API_EXTERNAL_DEPENDENCY | null;
  weeklyReview: WeeklyReviewAnswers;
  sideEffectBudget: typeof CROSS_CHANNEL_SIDE_EFFECT_BUDGET;
  persistenceDecision: typeof CROSS_CHANNEL_PERSISTENCE_DECISION;
};

function obsType(
  value: number | null | undefined,
): ObservationType {
  if (value == null) return "NOT_CAPTURED";
  if (value === 0) return "OBSERVED_ZERO";
  return "OBSERVED";
}

function strengthFromSample(n: number): EvidenceStrength {
  if (n <= 0) return "NONE";
  if (n <= CROSS_CHANNEL_THRESHOLDS.SAMPLE_INSUFFICIENT_MAX) return "WEAK";
  if (n <= CROSS_CHANNEL_THRESHOLDS.SAMPLE_EARLY_MAX) return "DIRECTIONAL";
  return "MEANINGFUL";
}

export function classifyAttributionHealth(input: {
  knownChannel: number;
  direct: number;
  unknown: number;
  eligible: number;
}): AttributionHealthObservation {
  const { knownChannel, direct, unknown, eligible } = input;
  const knownRate =
    eligible > 0
      ? Math.round(((knownChannel + direct) / eligible) * 1000) / 10
      : null;

  if (eligible < CROSS_CHANNEL_THRESHOLDS.ATTRIBUTION_ELIGIBLE_MIN) {
    return {
      state: "INSUFFICIENT_DATA",
      knownChannel,
      direct,
      unknown,
      eligible,
      knownRate,
      interpretation:
        "Too few attributable conversions to judge coverage. Historical UNKNOWN preserved.",
    };
  }
  if (
    knownRate != null &&
    knownRate >= CROSS_CHANNEL_THRESHOLDS.ATTRIBUTION_GOOD_RATE
  ) {
    return {
      state: "GOOD_COVERAGE",
      knownChannel,
      direct,
      unknown,
      eligible,
      knownRate,
      interpretation: `Known+direct coverage ${knownRate}% — channel ranking by conversion is more defensible.`,
    };
  }
  if (
    knownRate != null &&
    knownRate >= CROSS_CHANNEL_THRESHOLDS.ATTRIBUTION_PARTIAL_RATE
  ) {
    return {
      state: "PARTIAL_COVERAGE",
      knownChannel,
      direct,
      unknown,
      eligible,
      knownRate,
      interpretation: `Partial coverage (${knownRate}%). Prefer tagged journeys before ranking channels by conversion.`,
    };
  }
  return {
    state: "LOW_COVERAGE",
    knownChannel,
    direct,
    unknown,
    eligible,
    knownRate,
    interpretation: `Low known attribution coverage (${knownRate ?? "n/a"}%). FIX_ATTRIBUTION before trusting channel conversion comparisons. UNKNOWN ≠ rewritten.`,
  };
}

export function percentChange(input: {
  current: number | null;
  previous: number | null;
  comparableWindows: boolean;
}): { status: "AVAILABLE" | "UNKNOWN"; value: number | null } {
  if (!input.comparableWindows) {
    return { status: "UNKNOWN", value: null };
  }
  if (input.current == null || input.previous == null) {
    return { status: "UNKNOWN", value: null };
  }
  if (input.previous === 0) {
    return input.current === 0
      ? { status: "AVAILABLE", value: 0 }
      : { status: "UNKNOWN", value: null };
  }
  const pct =
    Math.round(((input.current - input.previous) / input.previous) * 1000) /
    10;
  return { status: "AVAILABLE", value: pct };
}

export function shouldRecommendSearchCtrReview(input: {
  impressions: number | null;
  clicks: number | null;
}): boolean {
  if (input.impressions == null || input.clicks == null) return false;
  if (
    input.impressions < CROSS_CHANNEL_THRESHOLDS.SEARCH_CTR_MIN_IMPRESSIONS
  ) {
    return false;
  }
  const ctr = input.clicks / input.impressions;
  return ctr < 0.02;
}

export function shouldBlockConflictingFacebookExperiment(input: {
  activeExperimentIds: string[];
}): boolean {
  return input.activeExperimentIds.length > 0;
}

/**
 * DNC / suppressed subjects must never receive FOLLOW_UP_LEAD.
 */
export function filterSuppressedRecommendations(
  items: PriorityRecommendation[],
): PriorityRecommendation[] {
  return items.filter((item) => {
    if (item.doNotContact === true && item.action === "FOLLOW_UP_LEAD") {
      return false;
    }
    return true;
  });
}

export function detectBottlenecks(
  input: CrossChannelIntelligenceInput,
  attribution: AttributionHealthObservation,
): BottleneckObservation[] {
  const out: BottleneckObservation[] = [];

  const impressions = input.searchImpressions;
  const clicks = input.searchClicks;
  if (
    impressions != null &&
    impressions >= CROSS_CHANNEL_THRESHOLDS.SEARCH_CTR_MIN_IMPRESSIONS &&
    clicks != null &&
    clicks / impressions < 0.01
  ) {
    out.push({
      code: "HIGH_VISIBILITY_LOW_TRAFFIC",
      evidence: `Search impressions=${impressions}, clicks=${clicks}`,
      strength: "DIRECTIONAL",
      sampleQuality: sampleQuality(impressions),
      interpretation:
        "Search visibility exists but click-through is weak relative to impressions.",
    });
  }

  if (
    input.websiteSessions != null &&
    input.websiteSessions >= CROSS_CHANNEL_THRESHOLDS.RATE_MIN_DENOMINATOR &&
    (input.inboundLeads == null || input.inboundLeads === 0) &&
    (input.contacts == null || input.contacts === 0)
  ) {
    out.push({
      code: "TRAFFIC_WITHOUT_CONVERSION",
      evidence: `Sessions=${input.websiteSessions}, inboundLeads=${input.inboundLeads ?? "NOT_CAPTURED"}, contacts=${input.contacts ?? "NOT_CAPTURED"}`,
      strength: strengthFromSample(input.websiteSessions),
      sampleQuality: sampleQuality(input.websiteSessions),
      interpretation:
        "Traffic observed without inbound conversion evidence in window.",
    });
  }

  if (
    input.audits != null &&
    input.audits >= CROSS_CHANNEL_THRESHOLDS.RATE_MIN_DENOMINATOR &&
    input.inboundLeads != null
  ) {
    const sq = sampleQuality(input.audits);
    if (input.inboundLeads === 0 || input.inboundLeads / input.audits < 0.1) {
      out.push({
        code: "AUDITS_WITHOUT_LEADS",
        evidence: `Audits=${input.audits}, inboundLeads=${input.inboundLeads}`,
        strength:
          sq === "INSUFFICIENT_DATA"
            ? "WEAK"
            : sq === "EARLY_DIRECTIONAL"
              ? "DIRECTIONAL"
              : "MEANINGFUL",
        sampleQuality: sq,
        interpretation:
          sq === "INSUFFICIENT_DATA"
            ? "Audit→lead ratio looks weak but sample remains INSUFFICIENT_DATA."
            : "Audits are not converting to inbound leads at a usable rate.",
      });
    }
  }

  if (
    input.inboundLeads != null &&
    input.inboundLeads > 0 &&
    input.overdueFollowUps > 0
  ) {
    out.push({
      code: "LEADS_WITHOUT_FOLLOW_UP",
      evidence: `Inbound leads=${input.inboundLeads}, overdueFollowUps=${input.overdueFollowUps}`,
      strength: "MEANINGFUL",
      sampleQuality: sampleQuality(input.overdueFollowUps),
      interpretation:
        "Inbound leads exist with overdue follow-up — commercial proximity is high.",
    });
  }

  if (
    input.inboundLeads != null &&
    input.inboundLeads >= CROSS_CHANNEL_THRESHOLDS.RATE_MIN_DENOMINATOR &&
    (input.opportunities == null || input.opportunities === 0)
  ) {
    out.push({
      code: "LEADS_WITHOUT_OPPORTUNITIES",
      evidence: `Inbound leads=${input.inboundLeads}, opportunities=${input.opportunities ?? "NOT_CAPTURED"}`,
      strength: strengthFromSample(input.inboundLeads),
      sampleQuality: sampleQuality(input.inboundLeads),
      interpretation: "Inbound leads without observed opportunities in window.",
    });
  }

  if (
    input.opportunities != null &&
    input.opportunities >= CROSS_CHANNEL_THRESHOLDS.RATE_MIN_DENOMINATOR &&
    (input.proposals == null || input.proposals === 0)
  ) {
    out.push({
      code: "OPPORTUNITIES_WITHOUT_PROPOSALS",
      evidence: `Opportunities=${input.opportunities}, proposals=${input.proposals ?? "NOT_CAPTURED"}`,
      strength: strengthFromSample(input.opportunities),
      sampleQuality: sampleQuality(input.opportunities),
      interpretation: "Opportunities without proposals in window.",
    });
  }

  if (
    input.proposals != null &&
    input.proposals >= CROSS_CHANNEL_THRESHOLDS.RATE_MIN_DENOMINATOR &&
    (input.agreements == null || input.agreements === 0)
  ) {
    out.push({
      code: "PROPOSALS_WITHOUT_AGREEMENTS",
      evidence: `Proposals=${input.proposals}, agreements=${input.agreements ?? "NOT_CAPTURED"}`,
      strength: strengthFromSample(input.proposals),
      sampleQuality: sampleQuality(input.proposals),
      interpretation: "Proposals without accepted agreements in window.",
    });
  }

  if (input.agreements != null && input.agreements > 0 && input.paymentsPending > 0) {
    out.push({
      code: "AGREEMENTS_WITHOUT_PAYMENT",
      evidence: `Agreements=${input.agreements}, paymentsPending=${input.paymentsPending}`,
      strength: "MEANINGFUL",
      sampleQuality: sampleQuality(input.paymentsPending),
      interpretation: "Accepted commercial work awaiting payment attention.",
    });
  }

  if (
    attribution.state === "LOW_COVERAGE" ||
    (attribution.state === "PARTIAL_COVERAGE" && attribution.unknown > 0)
  ) {
    out.push({
      code: "LOW_ATTRIBUTION_COVERAGE",
      evidence: `Unknown=${attribution.unknown}, eligible=${attribution.eligible}, knownRate=${attribution.knownRate}`,
      strength: attribution.state === "LOW_COVERAGE" ? "MEANINGFUL" : "DIRECTIONAL",
      sampleQuality: sampleQuality(attribution.eligible),
      interpretation: attribution.interpretation,
    });
  }

  const discoveryScore =
    (input.searchImpressions ?? 0) +
    (input.facebookReach ?? 0) +
    (input.gbpProfileViews ?? 0);
  if (
    input.searchImpressions != null &&
    input.facebookReach != null &&
    input.gbpProfileViews != null &&
    discoveryScore === 0
  ) {
    out.push({
      code: "INSUFFICIENT_DISCOVERY",
      evidence: "Search/Facebook/GBP discovery metrics all observed zero",
      strength: "DIRECTIONAL",
      sampleQuality: null,
      interpretation: "No discovery signal across primary channels in window.",
    });
  }

  if (
    input.contentPublishedCount > 0 &&
    input.contentDistributedCount === 0
  ) {
    out.push({
      code: "CONTENT_WITHOUT_DISTRIBUTION",
      evidence: `Published=${input.contentPublishedCount}, distributed=${input.contentDistributedCount}`,
      strength: "DIRECTIONAL",
      sampleQuality: sampleQuality(input.contentPublishedCount),
      interpretation:
        "Published content lacks recorded distribution — engagement may stall.",
    });
  }

  if (input.gbpChecklistNeedsAttention > 0) {
    out.push({
      code: "GBP_PROFILE_INCOMPLETE",
      evidence: `Checklist needsAttention=${input.gbpChecklistNeedsAttention}`,
      strength: "DIRECTIONAL",
      sampleQuality: null,
      interpretation:
        "GBP checklist has NEEDS_ATTENTION / MISMATCH items requiring operator review.",
    });
  }

  if (input.searchContentGaps > 0) {
    out.push({
      code: "SEARCH_CONTENT_GAP",
      evidence: `Open search content gaps=${input.searchContentGaps}`,
      strength: "DIRECTIONAL",
      sampleQuality: null,
      interpretation:
        "Search opportunity still missing a supporting page — do not duplicate existing plans.",
    });
  }

  return out;
}

export function deriveChannelStates(
  input: CrossChannelIntelligenceInput,
  bottlenecks: BottleneckObservation[],
): ChannelStateObservation[] {
  const has = (code: BottleneckCode) =>
    bottlenecks.some((b) => b.code === code);

  const searchState = (): ChannelStateObservation => {
    if (input.searchImpressions == null && input.searchClicks == null) {
      return {
        channel: "SEARCH",
        state: "NO_DATA",
        explanation: "No Search Console snapshot evidence in window.",
        evidenceRefs: ["SEARCH"],
      };
    }
    if (input.searchEarlyStage || input.searchImpressions == null) {
      return {
        channel: "SEARCH",
        state: "MONITORING",
        explanation:
          "Search early evidence — keep monitoring; conversion evidence insufficient to declare success.",
        evidenceRefs: ["SEARCH", "CONTENT"],
      };
    }
    if (has("HIGH_VISIBILITY_LOW_TRAFFIC")) {
      return {
        channel: "SEARCH",
        state: "NEEDS_ATTENTION",
        explanation:
          "Search visibility is present but traffic conversion from SERP is weak.",
        evidenceRefs: ["SEARCH"],
      };
    }
    if (
      input.searchIndexedSeo &&
      (input.searchImpressions ?? 0) > 0 &&
      (input.inboundLeads == null || input.inboundLeads === 0)
    ) {
      return {
        channel: "SEARCH",
        state: "DIRECTIONAL_POSITIVE",
        explanation:
          "Search visibility is emerging, but conversion evidence is insufficient.",
        evidenceRefs: ["SEARCH", "INBOUND_LEAD"],
      };
    }
    if ((input.searchImpressions ?? 0) === 0) {
      return {
        channel: "SEARCH",
        state: "INSUFFICIENT_DATA",
        explanation: "Observed zero impressions — not a fabricated decline.",
        evidenceRefs: ["SEARCH"],
      };
    }
    return {
      channel: "SEARCH",
      state: "MONITORING",
      explanation: "Search evidence present; continue collection windows.",
      evidenceRefs: ["SEARCH"],
    };
  };

  const facebookState = (): ChannelStateObservation => {
    if (input.facebookReach == null) {
      return {
        channel: "FACEBOOK",
        state: "NO_DATA",
        explanation: "No Facebook metric snapshots available.",
        evidenceRefs: ["FACEBOOK"],
      };
    }
    if (input.activeFacebookExperimentIds.length > 0) {
      return {
        channel: "FACEBOOK",
        state: "MONITORING",
        explanation: `Active experiment(s) ${input.activeFacebookExperimentIds.join(", ")} — collect required evidence before new experiments.`,
        evidenceRefs: ["FACEBOOK"],
      };
    }
    return {
      channel: "FACEBOOK",
      state: "BASELINE",
      explanation:
        "Facebook metrics observed. Reach/engagement ≠ revenue attribution.",
      evidenceRefs: ["FACEBOOK"],
    };
  };

  const gbpState = (): ChannelStateObservation => {
    if (input.gbpSnapshotCount === 0 && input.gbpProfileViews == null) {
      return {
        channel: "GBP",
        state: "NO_DATA",
        explanation: "No GBP snapshots yet — capture manual Insights if needed.",
        evidenceRefs: ["GBP"],
      };
    }
    if (has("GBP_PROFILE_INCOMPLETE")) {
      return {
        channel: "GBP",
        state: "NEEDS_ATTENTION",
        explanation: "GBP profile checklist requires operator attention.",
        evidenceRefs: ["GBP"],
      };
    }
    if (input.gbpApiApprovalPending) {
      return {
        channel: "GBP",
        state: "MONITORING",
        explanation:
          "Local evidence usable (manual/API historical). GBP API allowlisting pending is a dependency, not a sync failure.",
        evidenceRefs: ["GBP"],
      };
    }
    return {
      channel: "GBP",
      state: "BASELINE",
      explanation: "GBP evidence present without forcing Map-pack causation.",
      evidenceRefs: ["GBP"],
    };
  };

  const conversionState = (): ChannelStateObservation => {
    if (has("LEADS_WITHOUT_FOLLOW_UP") || input.paymentsPending > 0) {
      return {
        channel: "CONVERSION",
        state: "ACTION_REQUIRED",
        explanation:
          "Commercial follow-up or payment attention required — outranks marketing busywork.",
        evidenceRefs: ["INBOUND_LEAD", "FOLLOW_UP", "PAYMENT"],
      };
    }
    if (has("AUDITS_WITHOUT_LEADS") || has("TRAFFIC_WITHOUT_CONVERSION")) {
      return {
        channel: "CONVERSION",
        state: "NEEDS_ATTENTION",
        explanation: "Funnel drop-off observed; sample labels still apply.",
        evidenceRefs: ["AUDIT", "INBOUND_LEAD"],
      };
    }
    if (
      (input.inboundLeads ?? 0) + (input.opportunities ?? 0) === 0 &&
      (input.audits == null || input.audits <= CROSS_CHANNEL_THRESHOLDS.SAMPLE_INSUFFICIENT_MAX)
    ) {
      return {
        channel: "CONVERSION",
        state: "INSUFFICIENT_DATA",
        explanation: "Conversion sample too small for channel winners.",
        evidenceRefs: ["INBOUND_LEAD"],
      };
    }
    return {
      channel: "CONVERSION",
      state: "MONITORING",
      explanation: "Conversion evidence collecting under sample-safety rules.",
      evidenceRefs: ["AUDIT", "INBOUND_LEAD", "OPPORTUNITY"],
    };
  };

  const followUpState = (): ChannelStateObservation => {
    if (input.overdueFollowUps > 0) {
      return {
        channel: "FOLLOW_UP",
        state: "ACTION_REQUIRED",
        explanation: `${input.overdueFollowUps} overdue follow-up(s). DNC/suppressed subjects excluded.`,
        evidenceRefs: ["FOLLOW_UP"],
      };
    }
    return {
      channel: "FOLLOW_UP",
      state: "MONITORING",
      explanation: "No overdue follow-ups in compact observation.",
      evidenceRefs: ["FOLLOW_UP"],
    };
  };

  const commercialState = (): ChannelStateObservation => {
    if (input.paymentsPending > 0) {
      return {
        channel: "COMMERCIAL",
        state: "ACTION_REQUIRED",
        explanation: "Payment pending — highest commercial proximity.",
        evidenceRefs: ["PAYMENT"],
      };
    }
    if ((input.opportunities ?? 0) > 0 || (input.proposals ?? 0) > 0) {
      return {
        channel: "COMMERCIAL",
        state: "NEEDS_ATTENTION",
        explanation: "Open pipeline items need operator advancement.",
        evidenceRefs: ["OPPORTUNITY", "PROPOSAL"],
      };
    }
    return {
      channel: "COMMERCIAL",
      state: "BASELINE",
      explanation: "No urgent commercial attention from current counts.",
      evidenceRefs: ["OPPORTUNITY", "PAYMENT", "CLIENT"],
    };
  };

  const contentState = (): ChannelStateObservation => {
    if (input.contentReviewsDue > 0) {
      return {
        channel: "CONTENT",
        state: "NEEDS_ATTENTION",
        explanation: `${input.contentReviewsDue} content review(s) due.`,
        evidenceRefs: ["CONTENT"],
      };
    }
    if (has("CONTENT_WITHOUT_DISTRIBUTION") || has("SEARCH_CONTENT_GAP")) {
      return {
        channel: "CONTENT",
        state: "NEEDS_ATTENTION",
        explanation: "Distribution gap or search content gap observed.",
        evidenceRefs: ["CONTENT", "SEARCH"],
      };
    }
    return {
      channel: "CONTENT",
      state: "MONITORING",
      explanation: "Content lifecycle observed; no forced publish automation.",
      evidenceRefs: ["CONTENT"],
    };
  };

  const websiteState = (): ChannelStateObservation => {
    if (input.websiteSessions == null) {
      return {
        channel: "WEBSITE",
        state: "NO_DATA",
        explanation: "Website session totals not captured in this join.",
        evidenceRefs: ["WEBSITE"],
      };
    }
    if (has("TRAFFIC_WITHOUT_CONVERSION")) {
      return {
        channel: "WEBSITE",
        state: "NEEDS_ATTENTION",
        explanation: "Website traffic without conversion evidence.",
        evidenceRefs: ["WEBSITE", "CONTACT"],
      };
    }
    return {
      channel: "WEBSITE",
      state: "MONITORING",
      explanation: "Website traffic observation present.",
      evidenceRefs: ["WEBSITE"],
    };
  };

  return [
    websiteState(),
    searchState(),
    facebookState(),
    gbpState(),
    contentState(),
    conversionState(),
    followUpState(),
    commercialState(),
  ];
}

export function buildGrowthSignals(
  input: CrossChannelIntelligenceInput,
  attribution: AttributionHealthObservation,
): GrowthSignal[] {
  const signals: GrowthSignal[] = [];

  if (input.searchImpressions != null) {
    signals.push({
      type: "DISCOVERY_SIGNAL",
      sourceDomain: "SEARCH",
      evidence: `impressions=${input.searchImpressions}`,
      window: input.windowLabel,
      strength: strengthFromSample(input.searchImpressions),
      interpretation:
        input.searchImpressions === 0
          ? "Observed zero search impressions."
          : "Search impressions observed (leading indicator).",
      provenance: "GrowthSnapshot SEARCH_CONSOLE or content performanceJson",
      limitations:
        "GSC impressions ≠ CRM outcomes; anonymized queries / aggregation caveats apply.",
    });
  }

  if (input.websiteSessions != null) {
    signals.push({
      type: "TRAFFIC_SIGNAL",
      sourceDomain: "WEBSITE",
      evidence: `sessions=${input.websiteSessions}`,
      window: input.windowLabel,
      strength: strengthFromSample(input.websiteSessions),
      interpretation: "Website sessions observed where captured.",
      provenance: "INTERNAL / GA4 snapshot",
      limitations: "Sessions alone are not qualified traffic or revenue.",
    });
  }

  if (input.facebookEngagement != null) {
    signals.push({
      type: "ENGAGEMENT_SIGNAL",
      sourceDomain: "FACEBOOK",
      evidence: `engagement=${input.facebookEngagement}`,
      window: input.windowLabel,
      strength: strengthFromSample(input.facebookEngagement),
      interpretation:
        "Facebook engagement observed. Does not prove website or pipeline outcomes.",
      provenance: "GrowthContentMetricSnapshot",
      limitations: "Engagement ≠ follower ≠ attributed lead.",
    });
  }

  if (input.inboundLeads != null) {
    signals.push({
      type: "CONVERSION_SIGNAL",
      sourceDomain: "INBOUND_LEAD",
      evidence: `inboundLeads=${input.inboundLeads}`,
      window: input.windowLabel,
      strength: strengthFromSample(input.inboundLeads),
      interpretation: "Inbound leads counted separately from outbound prospects.",
      provenance: "Lead commercial model",
      limitations: "Without attributionJson, channel cause remains UNKNOWN/INFERRED.",
    });
  }

  if (input.opportunities != null) {
    signals.push({
      type: "PIPELINE_SIGNAL",
      sourceDomain: "OPPORTUNITY",
      evidence: `opportunities=${input.opportunities}`,
      window: input.windowLabel,
      strength: strengthFromSample(input.opportunities),
      interpretation: "Pipeline opportunities observed (lagging relative to discovery).",
      provenance: "Opportunity commercial model",
      limitations: "Read-only from Growth Engine.",
    });
  }

  if (input.paymentsPaid != null && input.paymentsPaid > 0) {
    signals.push({
      type: "REVENUE_SIGNAL",
      sourceDomain: "PAYMENT",
      evidence: `paymentsPaidCount=${input.paymentsPaid}`,
      window: input.windowLabel,
      strength: "MEANINGFUL",
      interpretation:
        "Observed payments. ROI remains unavailable without represented cost.",
      provenance: "CommercialPayment",
      limitations: "ATTRIBUTED vs OBSERVED vs UNATTRIBUTED still apply.",
    });
  }

  if (input.overdueFollowUps > 0 || input.inboundLeads != null) {
    signals.push({
      type: "FOLLOW_UP_SIGNAL",
      sourceDomain: "FOLLOW_UP",
      evidence: `overdue=${input.overdueFollowUps}, suppressedExcluded=${input.suppressedSubjects}`,
      window: input.windowLabel,
      strength: input.overdueFollowUps > 0 ? "MEANINGFUL" : "WEAK",
      interpretation:
        input.overdueFollowUps > 0
          ? "Overdue follow-ups require operator action."
          : "Follow-up queue observed without overdue items.",
      provenance: "FollowUpActivity / followUpAt authority",
      limitations: "No auto-outreach; DNC respected.",
    });
  }

  if (input.contentPublishedCount > 0 || input.contentReviewsDue > 0) {
    signals.push({
      type: "CONTENT_SIGNAL",
      sourceDomain: "CONTENT",
      evidence: `published=${input.contentPublishedCount}, reviewsDue=${input.contentReviewsDue}, distributed=${input.contentDistributedCount}`,
      window: input.windowLabel,
      strength: "DIRECTIONAL",
      interpretation:
        "Content lifecycle signal. Derivative engagement ≠ source SEO causation.",
      provenance: "GrowthContentPlan performance/review",
      limitations: "ATTRIBUTED/OBSERVED/INFERRED/HYPOTHESIS boundaries apply.",
    });
  }

  if (
    input.gbpProfileViews != null ||
    input.gbpWebsiteClicks != null ||
    input.gbpSnapshotCount > 0
  ) {
    signals.push({
      type: "LOCAL_SIGNAL",
      sourceDomain: "GBP",
      evidence: `profileViews=${input.gbpProfileViews ?? "NOT_CAPTURED"}, websiteClicks=${input.gbpWebsiteClicks ?? "NOT_CAPTURED"}, snapshots=${input.gbpSnapshotCount}`,
      window: input.windowLabel,
      strength:
        input.gbpSnapshotCount >= 4 ? "DIRECTIONAL" : "WEAK",
      interpretation:
        "Local/GBP evidence present. Generic Google referrer ≠ GBP.",
      provenance: "GOOGLE_BUSINESS_PROFILE snapshots (MANUAL|API)",
      limitations: GBP_API_EXTERNAL_DEPENDENCY.interpretation,
    });
  }

  signals.push({
    type: "CONVERSION_SIGNAL",
    sourceDomain: "AUDIT",
    evidence: `attributionHealth=${attribution.state}, unknown=${attribution.unknown}`,
    window: input.windowLabel,
    strength:
      attribution.state === "LOW_COVERAGE" ? "MEANINGFUL" : "DIRECTIONAL",
    interpretation: attribution.interpretation,
    provenance: "AuditReport/ContactSubmission attributionJson",
    limitations: "Do not rewrite historical UNKNOWN.",
  });

  return signals;
}

function weightForAction(action: CrossChannelActionType): number {
  return PRIORITY_SORT_WEIGHTS[action] ?? 99;
}

export function buildPriorityRecommendations(
  input: CrossChannelIntelligenceInput,
  bottlenecks: BottleneckObservation[],
  attribution: AttributionHealthObservation,
): PriorityRecommendation[] {
  const items: PriorityRecommendation[] = [];

  for (const c of input.commercialAttention) {
    if (c.doNotContact && c.action === "FOLLOW_UP_LEAD") {
      continue;
    }
    items.push({
      band: "NOW",
      action: c.action,
      title: c.title,
      why: c.why,
      evidence: c.evidence,
      strength: "MEANINGFUL",
      href: c.href,
      sortWeight: weightForAction(c.action),
      doNotContact: c.doNotContact,
    });
  }

  if (input.paymentsPending > 0) {
    items.push({
      band: "NOW",
      action: "CHECK_PAYMENT",
      title: "Check pending payment",
      why: [
        `${input.paymentsPending} payment(s) pending`,
        "Commercial proximity outranks marketing busywork",
      ],
      evidence: ["PAYMENT", "CommercialPayment"],
      strength: "MEANINGFUL",
      href: "/reports/growth/conversion",
      sortWeight: PRIORITY_SORT_WEIGHTS.CHECK_PAYMENT,
    });
  }

  if (input.overdueFollowUps > 0) {
    items.push({
      band: "NOW",
      action: "FOLLOW_UP_LEAD",
      title: "Follow up overdue inbound work",
      why: [
        `${input.overdueFollowUps} overdue follow-up(s)`,
        "Lead not marked DNC (suppressed subjects excluded)",
        "Closer to revenue than publishing another post",
      ],
      evidence: ["FOLLOW_UP", "Lead", "FollowUpActivity"],
      strength: "MEANINGFUL",
      href: "/reports/growth/follow-up",
      sortWeight: PRIORITY_SORT_WEIGHTS.FOLLOW_UP_LEAD,
    });
  }

  if (
    attribution.state === "LOW_COVERAGE" ||
    (attribution.state === "PARTIAL_COVERAGE" &&
      attribution.unknown >= CROSS_CHANNEL_THRESHOLDS.ATTRIBUTION_ELIGIBLE_MIN)
  ) {
    items.push({
      band: "NEXT",
      action: "FIX_ATTRIBUTION",
      title: "Improve tagged acquisition coverage",
      why: [
        attribution.interpretation,
        "Do not rank channels by conversion until coverage improves",
      ],
      evidence: ["AUDIT attributionJson", "acquisition-capture-v1"],
      strength: "MEANINGFUL",
      href: "/reports/growth/attribution",
      sortWeight: PRIORITY_SORT_WEIGHTS.FIX_ATTRIBUTION,
    });
  }

  if (
    bottlenecks.some((b) => b.code === "AUDITS_WITHOUT_LEADS") &&
    (input.audits ?? 0) >= CROSS_CHANNEL_THRESHOLDS.RATE_MIN_DENOMINATOR
  ) {
    items.push({
      band: "NEXT",
      action: "INVESTIGATE_DROP_OFF",
      title: "Investigate audit → lead drop-off",
      why: [
        "Audits observed without proportional inbound leads",
        `Sample quality: ${sampleQuality(input.audits ?? 0)}`,
      ],
      evidence: ["AUDIT", "INBOUND_LEAD"],
      strength: strengthFromSample(input.audits ?? 0),
      href: "/reports/growth/conversion",
      sortWeight: PRIORITY_SORT_WEIGHTS.INVESTIGATE_DROP_OFF,
    });
  }

  if (
    shouldRecommendSearchCtrReview({
      impressions: input.searchImpressions,
      clicks: input.searchClicks,
    })
  ) {
    items.push({
      band: "NEXT",
      action: "REVIEW_SEARCH_PERFORMANCE",
      title: "Review title/snippet CTR",
      why: [
        `Impressions ≥ ${CROSS_CHANNEL_THRESHOLDS.SEARCH_CTR_MIN_IMPRESSIONS}`,
        "CTR appears weak relative to clicks/impressions",
      ],
      evidence: ["SEARCH", "CONTENT_REVIEW"],
      strength: "DIRECTIONAL",
      href: "/reports/growth/content",
      sortWeight: PRIORITY_SORT_WEIGHTS.REVIEW_SEARCH_PERFORMANCE,
    });
  } else if (
    input.searchEarlyStage ||
    (input.searchImpressions != null &&
      input.searchImpressions <=
        CROSS_CHANNEL_THRESHOLDS.SEARCH_EARLY_IMPRESSIONS_MAX)
  ) {
    items.push({
      band: "WATCH",
      action: "KEEP_MONITORING",
      title: "Keep monitoring early search evidence",
      why: [
        "Search evidence still early",
        "CTR recommendations blocked below impression threshold",
      ],
      evidence: ["SEARCH"],
      strength: "WEAK",
      href: "/reports/growth",
      sortWeight: PRIORITY_SORT_WEIGHTS.KEEP_MONITORING,
    });
  }

  if (input.searchContentGaps > 0) {
    items.push({
      band: "NEXT",
      action: "CREATE_SUPPORTING_CONTENT",
      title: "Plan supporting search content",
      why: [
        `${input.searchContentGaps} search content gap(s)`,
        "Do not duplicate existing content plans",
      ],
      evidence: ["SEARCH", "CONTENT"],
      strength: "DIRECTIONAL",
      href: "/reports/growth/content",
      sortWeight: PRIORITY_SORT_WEIGHTS.CREATE_SUPPORTING_CONTENT,
    });
  }

  if (
    input.contentPublishedCount > 0 &&
    input.contentDistributedCount === 0
  ) {
    items.push({
      band: "NEXT",
      action: "DISTRIBUTE_CONTENT",
      title: "Distribute published content",
      why: ["Published assets lack recorded distribution"],
      evidence: ["CONTENT"],
      strength: "DIRECTIONAL",
      href: "/reports/growth/content",
      sortWeight: PRIORITY_SORT_WEIGHTS.DISTRIBUTE_CONTENT,
    });
  }

  if (input.contentReviewsDue > 0) {
    items.push({
      band: "NEXT",
      action: "REVIEW_SEARCH_PERFORMANCE",
      title: "Complete due content reviews",
      why: [`${input.contentReviewsDue} review window(s) due`],
      evidence: ["CONTENT_REVIEW"],
      strength: "DIRECTIONAL",
      href: "/reports/growth/content",
      sortWeight: PRIORITY_SORT_WEIGHTS.REVIEW_SEARCH_PERFORMANCE + 1,
    });
  }

  if (input.gbpChecklistNeedsAttention > 0) {
    items.push({
      band: "NEXT",
      action: "REVIEW_GBP_PROFILE",
      title: "Review GBP profile checklist",
      why: [
        `${input.gbpChecklistNeedsAttention} checklist item(s) need attention`,
        "Outranked by overdue leads / pending payments when present",
      ],
      evidence: ["GBP checklist"],
      strength: "DIRECTIONAL",
      href: "/reports/growth/local",
      sortWeight: PRIORITY_SORT_WEIGHTS.REVIEW_GBP_PROFILE,
    });
  }

  if (input.gbpSnapshotCount === 0) {
    items.push({
      band: "WATCH",
      action: "CAPTURE_GBP_SNAPSHOT",
      title: "Capture GBP Insights snapshot",
      why: ["No GBP snapshots yet — blank stays NOT_CAPTURED"],
      evidence: ["GBP"],
      strength: "WEAK",
      href: "/reports/growth/local",
      sortWeight: PRIORITY_SORT_WEIGHTS.CAPTURE_GBP_SNAPSHOT,
    });
  }

  if (shouldBlockConflictingFacebookExperiment({
    activeExperimentIds: input.activeFacebookExperimentIds,
  })) {
    items.push({
      band: "WATCH",
      action: "RESPECT_ACTIVE_EXPERIMENT",
      title: "Respect active Facebook experiment",
      why: [
        `Active: ${input.activeFacebookExperimentIds.join(", ")}`,
        "Prefer collecting required evidence over a conflicting experiment",
      ],
      evidence: ["FACEBOOK_EXPERIMENT"],
      strength: "MEANINGFUL",
      href: "/reports/growth",
      sortWeight: PRIORITY_SORT_WEIGHTS.RESPECT_ACTIVE_EXPERIMENT,
    });
  } else if (
    input.facebookReach != null &&
    input.activeFacebookExperimentIds.length === 0
  ) {
    // Only suggest new experiment when none active — still WATCH by default.
    items.push({
      band: "WATCH",
      action: "WAIT_FOR_MORE_DATA",
      title: "Wait for Facebook sample maturity",
      why: ["No active FB experiment conflict; still avoid busywork experiments"],
      evidence: ["FACEBOOK"],
      strength: "WEAK",
      href: "/reports/growth",
      sortWeight: PRIORITY_SORT_WEIGHTS.WAIT_FOR_MORE_DATA,
    });
  }

  if (input.gbpApiApprovalPending) {
    items.push({
      band: "WATCH",
      action: "WAIT_FOR_MORE_DATA",
      title: "GBP API allowlisting pending",
      why: [GBP_API_EXTERNAL_DEPENDENCY.interpretation],
      evidence: ["GBP_API_APPROVAL_PENDING"],
      strength: "NONE",
      href: "/reports/growth/local",
      sortWeight: PRIORITY_SORT_WEIGHTS.GBP_API_APPROVAL_PENDING,
    });
  }

  if (
    (input.inboundLeads ?? 0) + (input.audits ?? 0) <=
    CROSS_CHANNEL_THRESHOLDS.SAMPLE_INSUFFICIENT_MAX
  ) {
    items.push({
      band: "WATCH",
      action: "WAIT_FOR_MORE_DATA",
      title: "Wait for usable conversion sample",
      why: ["Sample below USABLE threshold — do not declare channel winners"],
      evidence: ["INBOUND_LEAD", "AUDIT"],
      strength: "WEAK",
      href: "/reports/growth/conversion",
      sortWeight: PRIORITY_SORT_WEIGHTS.WAIT_FOR_MORE_DATA,
    });
  }

  const deduped = dedupeRecommendations(items);
  return filterSuppressedRecommendations(deduped).sort(
    (a, b) => a.sortWeight - b.sortWeight || a.title.localeCompare(b.title),
  );
}

function dedupeRecommendations(
  items: PriorityRecommendation[],
): PriorityRecommendation[] {
  const seen = new Set<string>();
  const out: PriorityRecommendation[] = [];
  for (const item of items) {
    const key = `${item.action}::${item.title}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

export function assignPriorityBands(
  sorted: PriorityRecommendation[],
): {
  now: PriorityRecommendation[];
  next: PriorityRecommendation[];
  watch: PriorityRecommendation[];
} {
  const now: PriorityRecommendation[] = [];
  const next: PriorityRecommendation[] = [];
  const watch: PriorityRecommendation[] = [];

  for (const item of sorted) {
    // Force commercial urgency into NOW when weight is high-priority.
    const forcedNow =
      item.sortWeight <= PRIORITY_SORT_WEIGHTS.FOLLOW_UP_LEAD ||
      item.action === "CHECK_PAYMENT" ||
      item.action === "FOLLOW_UP_LEAD" ||
      item.action === "REVIEW_PROPOSAL" ||
      item.action === "ADVANCE_OPPORTUNITY";

    const forcedWatch =
      item.action === "WAIT_FOR_MORE_DATA" ||
      item.action === "KEEP_MONITORING" ||
      item.action === "RESPECT_ACTIVE_EXPERIMENT" ||
      item.sortWeight >= PRIORITY_SORT_WEIGHTS.RESPECT_ACTIVE_EXPERIMENT;

    if (forcedNow && now.length < CROSS_CHANNEL_THRESHOLDS.NOW_MAX) {
      now.push({ ...item, band: "NOW" });
      continue;
    }
    if (forcedWatch && watch.length < CROSS_CHANNEL_THRESHOLDS.WATCH_MAX) {
      watch.push({ ...item, band: "WATCH" });
      continue;
    }
    if (item.band === "NOW" && now.length < CROSS_CHANNEL_THRESHOLDS.NOW_MAX) {
      now.push({ ...item, band: "NOW" });
    } else if (next.length < CROSS_CHANNEL_THRESHOLDS.NEXT_MAX) {
      next.push({ ...item, band: "NEXT" });
    } else if (watch.length < CROSS_CHANNEL_THRESHOLDS.WATCH_MAX) {
      watch.push({ ...item, band: "WATCH" });
    }
  }

  return { now, next, watch };
}

export function buildWeeklyReviewAnswers(input: {
  bottlenecks: BottleneckObservation[];
  recommendations: {
    now: PriorityRecommendation[];
    next: PriorityRecommendation[];
    watch: PriorityRecommendation[];
  };
  attribution: AttributionHealthObservation;
  activeExperiments: ActiveExperimentGuard[];
  gbpPending: boolean;
  contentReviewsDue: number;
  comparablePriorWindow: boolean;
}): WeeklyReviewAnswers {
  const topBottleneck = input.bottlenecks[0];
  return {
    whatChanged: input.comparablePriorWindow
      ? "Comparable prior window available — compare channel snapshots manually; no fabricated % without like windows."
      : "UNKNOWN — no comparable prior window; do not invent % change.",
    whatNeedsAction:
      input.recommendations.now.map((r) => r.title).join("; ") ||
      "No NOW items from current evidence.",
    whatWaitingOn: [
      ...input.recommendations.watch.map((r) => r.title),
      input.gbpPending ? "GBP API allowlisting" : null,
    ]
      .filter(Boolean)
      .join("; ") || "Nothing explicit.",
    whatEvidenceWeak:
      input.attribution.state === "INSUFFICIENT_DATA" ||
      input.attribution.state === "LOW_COVERAGE"
        ? input.attribution.interpretation
        : "Review channel states marked INSUFFICIENT_DATA / WEAK.",
    currentBottleneck: topBottleneck
      ? `${topBottleneck.code}: ${topBottleneck.interpretation}`
      : "No bottleneck surfaced — required evidence missing or healthy.",
    whatNotToWorkOn:
      "Do not start conflicting experiments while ACTIVE ones need evidence; do not optimize CTR below impression floors; do not chase GBP API retries daily while allowlisting is pending.",
    activeExperiments:
      input.activeExperiments.map((e) => `${e.experimentId} (${e.status})`).join(", ") ||
      "None recorded.",
    commercialAttention:
      input.recommendations.now
        .filter((r) =>
          ["FOLLOW_UP_LEAD", "CHECK_PAYMENT", "REVIEW_PROPOSAL", "ADVANCE_OPPORTUNITY"].includes(
            r.action,
          ),
        )
        .map((r) => r.title)
        .join("; ") || "None in NOW.",
    reviewsDue:
      input.contentReviewsDue > 0
        ? `${input.contentReviewsDue} content/search review(s) due`
        : "No content reviews due in current observation.",
    attributionCoverageImproved: input.comparablePriorWindow
      ? "Compare knownRate to prior INTERNAL/attribution coverage — UNKNOWN history not rewritten."
      : "UNKNOWN — no comparable prior coverage window.",
  };
}

export function buildEvidenceList(
  input: CrossChannelIntelligenceInput,
): CrossChannelEvidence[] {
  const w = input.windowLabel;
  const row = (
    domain: CrossChannelEvidenceDomain,
    metric: string,
    value: number | null,
    indicatorClass: IndicatorClass,
    provenance: string,
    relatedPublicAsset?: string | null,
  ): CrossChannelEvidence => ({
    domain,
    metric,
    value,
    window: w,
    provenance,
    strength: value == null ? "NONE" : strengthFromSample(value),
    observationType: obsType(value),
    indicatorClass,
    relatedPublicAsset: relatedPublicAsset ?? null,
    attributionContext: null,
  });

  return [
    row("WEBSITE", "sessions", input.websiteSessions, "LEADING", "GA4/INTERNAL snapshot"),
    row("SEARCH", "impressions", input.searchImpressions, "LEADING", "SEARCH_CONSOLE snapshot"),
    row("SEARCH", "clicks", input.searchClicks, "LEADING", "SEARCH_CONSOLE snapshot"),
    row("FACEBOOK", "reach", input.facebookReach, "LEADING", "Facebook metric snapshot"),
    row("FACEBOOK", "engagement", input.facebookEngagement, "LEADING", "Facebook metric snapshot"),
    row("GBP", "profileViews", input.gbpProfileViews, "LEADING", "GBP snapshot"),
    row("GBP", "websiteClicks", input.gbpWebsiteClicks, "LEADING", "GBP snapshot"),
    row("AUDIT", "publicAudits", input.audits, "MID_FUNNEL", "AuditReport"),
    row("CONTACT", "submissions", input.contacts, "MID_FUNNEL", "ContactSubmission"),
    row("INBOUND_LEAD", "created", input.inboundLeads, "MID_FUNNEL", "Lead"),
    row("OUTBOUND_PROSPECT", "created", input.outboundProspects, "MID_FUNNEL", "Prospect"),
    row("FOLLOW_UP", "overdue", input.overdueFollowUps, "MID_FUNNEL", "FollowUpActivity"),
    row("OPPORTUNITY", "created", input.opportunities, "LAGGING", "Opportunity"),
    row("PROPOSAL", "created", input.proposals, "LAGGING", "Proposal"),
    row("AGREEMENT", "accepted", input.agreements, "LAGGING", "Agreement"),
    row("PAYMENT", "paidCount", input.paymentsPaid, "LAGGING", "CommercialPayment"),
    row("PAYMENT", "pendingCount", input.paymentsPending, "LAGGING", "CommercialPayment"),
    row("CLIENT", "created", input.clients, "LAGGING", "Client"),
    row("CONTENT", "published", input.contentPublishedCount, "LEADING", "GrowthContentPlan"),
    row("CONTENT", "reviewsDue", input.contentReviewsDue, "MID_FUNNEL", "content-review"),
  ];
}

export function buildCrossChannelIntelligence(
  input: CrossChannelIntelligenceInput,
): CrossChannelIntelligenceReport {
  const attributionHealth = classifyAttributionHealth({
    knownChannel: input.attributionKnownChannel,
    direct: input.attributionDirect,
    unknown: input.attributionUnknown,
    eligible: input.attributionEligible,
  });

  const evidence = buildEvidenceList(input);
  const bottlenecks = detectBottlenecks(input, attributionHealth);
  const channelStates = deriveChannelStates(input, bottlenecks);
  const signals = buildGrowthSignals(input, attributionHealth);
  const sorted = buildPriorityRecommendations(
    input,
    bottlenecks,
    attributionHealth,
  );
  const recommendations = assignPriorityBands(sorted);

  const activeExperiments: ActiveExperimentGuard[] = [
    ...input.activeFacebookExperimentIds.map((id) => ({
      experimentId: id,
      status: "ACTIVE" as const,
      channel: "FACEBOOK",
      recommendation:
        "Collect required evidence; do not recommend conflicting RUN_FACEBOOK_EXPERIMENT.",
    })),
    ...input.activeGbpExperimentIds.map((id) => ({
      experimentId: id,
      status: "ACTIVE" as const,
      channel: "GBP",
      recommendation:
        "Respect GBP experiment lifecycle; prefer exception review over re-typing.",
    })),
  ];

  const weeklyReview = buildWeeklyReviewAnswers({
    bottlenecks,
    recommendations,
    attribution: attributionHealth,
    activeExperiments,
    gbpPending: input.gbpApiApprovalPending,
    contentReviewsDue: input.contentReviewsDue,
    comparablePriorWindow: input.comparablePriorWindow,
  });

  return {
    version: CROSS_CHANNEL_INTELLIGENCE_VERSION,
    windowLabel: input.windowLabel,
    evidence,
    channelStates,
    signals,
    bottlenecks,
    recommendations,
    attributionHealth,
    activeExperiments,
    gbpDependency: input.gbpApiApprovalPending
      ? GBP_API_EXTERNAL_DEPENDENCY
      : null,
    weeklyReview,
    sideEffectBudget: CROSS_CHANNEL_SIDE_EFFECT_BUDGET,
    persistenceDecision: CROSS_CHANNEL_PERSISTENCE_DECISION,
  };
}

/** Compact card helper for /reports/growth hub. */
export function summarizeCrossChannelCompact(
  report: CrossChannelIntelligenceReport,
): {
  version: typeof CROSS_CHANNEL_INTELLIGENCE_VERSION;
  topBottleneck: string;
  nowCount: number;
  nextCount: number;
  watchCount: number;
  attributionHealth: AttributionHealthState;
  gbpDependency: string | null;
} {
  return {
    version: report.version,
    topBottleneck: report.bottlenecks[0]?.code ?? "NONE",
    nowCount: report.recommendations.now.length,
    nextCount: report.recommendations.next.length,
    watchCount: report.recommendations.watch.length,
    attributionHealth: report.attributionHealth.state,
    gbpDependency: report.gbpDependency?.code ?? null,
  };
}
