/**
 * Growth Sprint 9 — Lead Conversion Intelligence V1
 *
 * Observation + decision support. Commercial models remain authoritative.
 * Prefer INSUFFICIENT_DATA / UNKNOWN / ROI_NOT_AVAILABLE over invented causation.
 */

export const LEAD_CONVERSION_INTELLIGENCE_VERSION = 1 as const;

/** Canonical business-growth funnel stages (observation labels). */
export const LEAD_CONVERSION_FUNNEL_STAGES = [
  "VISITOR",
  "QUALIFIED_VISIT",
  "AUDIT_STARTED",
  "AUDIT_SUBMITTED",
  "AUDIT_COMPLETED",
  "CONTACT",
  "INBOUND_LEAD",
  "OUTBOUND_PROSPECT",
  "OPPORTUNITY",
  "PROPOSAL",
  "AGREEMENT",
  "PAYMENT",
  "CLIENT",
] as const;
export type LeadConversionFunnelStage =
  (typeof LEAD_CONVERSION_FUNNEL_STAGES)[number];

export const ATTRIBUTION_CHANNELS = [
  "FACEBOOK",
  "ORGANIC_SEARCH",
  "ORGANIC_SOCIAL",
  "DIRECT",
  "REFERRAL",
  "GBP",
  "PAID",
  "OUTBOUND",
  "UNKNOWN",
] as const;
export type AttributionChannel = (typeof ATTRIBUTION_CHANNELS)[number];

export const ATTRIBUTION_STRENGTHS = [
  "DIRECT_FIRST_PARTY",
  "STRONG",
  "DIRECTIONAL",
  "INFERRED",
  "UNKNOWN",
] as const;
export type AttributionStrength = (typeof ATTRIBUTION_STRENGTHS)[number];

export const ACQUISITION_PATHS = [
  "INBOUND",
  "OUTBOUND",
  "REFERRAL",
  "UNKNOWN",
] as const;
export type AcquisitionPath = (typeof ACQUISITION_PATHS)[number];

export const SAMPLE_QUALITY_LABELS = [
  "INSUFFICIENT_DATA",
  "EARLY_DIRECTIONAL",
  "USABLE",
] as const;
export type SampleQualityLabel = (typeof SAMPLE_QUALITY_LABELS)[number];

export const LEAD_AGE_BANDS = ["NEW", "ACTIVE", "AGING", "STALE"] as const;
export type LeadAgeBand = (typeof LEAD_AGE_BANDS)[number];

export const ATTENTION_QUEUE_KINDS = [
  "NEW_INBOUND_LEAD",
  "FOLLOW_UP_DUE",
  "AGING_INBOUND_LEAD",
  "STALE_INBOUND_LEAD",
  "OPPORTUNITY_OVERDUE",
  "OPPORTUNITY_NO_NEXT_ACTION",
  "PROPOSAL_AWAITING_DECISION",
  "AGREEMENT_AWAITING_ACCEPTANCE",
  "PAYMENT_PENDING",
] as const;
export type AttentionQueueKind = (typeof ATTENTION_QUEUE_KINDS)[number];

export const NEXT_ACTION_RECOMMENDATIONS = [
  "REVIEW_LEAD",
  "FOLLOW_UP",
  "QUALIFY",
  "PREPARE_SCOPE",
  "REVIEW_PROPOSAL_STATUS",
  "CHECK_AGREEMENT",
  "CHECK_PAYMENT",
  "WATCH",
] as const;
export type NextActionRecommendation =
  (typeof NEXT_ACTION_RECOMMENDATIONS)[number];

export const PRIORITY_BANDS = ["NOW", "NEXT", "WATCH"] as const;
export type PriorityBand = (typeof PRIORITY_BANDS)[number];

export const REVENUE_EVIDENCE_KINDS = [
  "ATTRIBUTED_REVENUE",
  "OBSERVED_REVENUE",
  "UNATTRIBUTED_REVENUE",
] as const;
export type RevenueEvidenceKind = (typeof REVENUE_EVIDENCE_KINDS)[number];

/** JS Solutions operating rules — not industry truth. */
export const LEAD_CONVERSION_THRESHOLDS = {
  RATE_MIN_DENOMINATOR: 5,
  SAMPLE_INSUFFICIENT_MAX: 4,
  SAMPLE_EARLY_MAX: 19,
  CHANNEL_COMPARE_MIN: 5,
  LEAD_AGE_NEW_DAYS: 3,
  LEAD_AGE_ACTIVE_DAYS: 14,
  LEAD_AGE_AGING_DAYS: 30,
  ATTENTION_QUEUE_MAX: 25,
  ACTION_LIST_MAX: 8,
  VELOCITY_MIN_SAMPLES: 3,
} as const;

export type CountObservation = {
  status: "AVAILABLE" | "ZERO" | "NOT_CAPTURED" | "UNKNOWN";
  value: number | null;
};

export type RateObservation = {
  status:
    | "AVAILABLE"
    | "ZERO"
    | "INSUFFICIENT_DATA"
    | "NOT_CAPTURED"
    | "UNKNOWN";
  value: number | null;
  numerator: number | null;
  denominator: number | null;
};

export type PriorityAction = {
  band: PriorityBand;
  action: NextActionRecommendation;
  reason: string;
};

export type AttentionItem = {
  kind: AttentionQueueKind;
  title: string;
  href: string;
  recommendedAction: NextActionRecommendation;
  ageBand?: LeadAgeBand;
  createdAt?: string;
};

export function observeCount(value: number | null | undefined): CountObservation {
  if (value == null) {
    return { status: "NOT_CAPTURED", value: null };
  }
  if (value === 0) {
    return { status: "ZERO", value: 0 };
  }
  return { status: "AVAILABLE", value };
}

export function sampleQuality(n: number): SampleQualityLabel {
  if (n <= LEAD_CONVERSION_THRESHOLDS.SAMPLE_INSUFFICIENT_MAX) {
    return "INSUFFICIENT_DATA";
  }
  if (n <= LEAD_CONVERSION_THRESHOLDS.SAMPLE_EARLY_MAX) {
    return "EARLY_DIRECTIONAL";
  }
  return "USABLE";
}

/**
 * Conversion rate only when both sides are known numbers and denominator
 * meets the minimum sample. Unknown ≠ zero.
 */
export function conversionRate(input: {
  numerator: number | null | undefined;
  denominator: number | null | undefined;
  numeratorCaptured?: boolean;
  denominatorCaptured?: boolean;
}): RateObservation {
  const numCaptured = input.numeratorCaptured !== false;
  const denCaptured = input.denominatorCaptured !== false;
  if (!numCaptured || !denCaptured) {
    return {
      status: "NOT_CAPTURED",
      value: null,
      numerator: null,
      denominator: null,
    };
  }
  if (input.numerator == null || input.denominator == null) {
    return {
      status: "UNKNOWN",
      value: null,
      numerator: input.numerator ?? null,
      denominator: input.denominator ?? null,
    };
  }
  const numerator = input.numerator;
  const denominator = input.denominator;
  if (denominator < LEAD_CONVERSION_THRESHOLDS.RATE_MIN_DENOMINATOR) {
    return {
      status: "INSUFFICIENT_DATA",
      value: null,
      numerator,
      denominator,
    };
  }
  if (numerator === 0) {
    return { status: "ZERO", value: 0, numerator, denominator };
  }
  const pct = Math.round((numerator / denominator) * 1000) / 10;
  return { status: "AVAILABLE", value: pct, numerator, denominator };
}

export function classifyLeadAge(
  createdAt: Date,
  now: Date = new Date(),
): LeadAgeBand {
  const days =
    (now.getTime() - createdAt.getTime()) / (24 * 60 * 60 * 1000);
  if (days <= LEAD_CONVERSION_THRESHOLDS.LEAD_AGE_NEW_DAYS) {
    return "NEW";
  }
  if (days <= LEAD_CONVERSION_THRESHOLDS.LEAD_AGE_ACTIVE_DAYS) {
    return "ACTIVE";
  }
  if (days <= LEAD_CONVERSION_THRESHOLDS.LEAD_AGE_AGING_DAYS) {
    return "AGING";
  }
  return "STALE";
}

export function classifyAcquisitionPath(input: {
  kind: "inbound_lead" | "outbound_prospect" | "unknown";
}): AcquisitionPath {
  if (input.kind === "inbound_lead") {
    return "INBOUND";
  }
  if (input.kind === "outbound_prospect") {
    return "OUTBOUND";
  }
  return "UNKNOWN";
}

export function classifyOutboundProspectSource(
  sourceType: string | null | undefined,
): "MANUAL_PROSPECTING" | "GOOGLE_PLACES" | "PROVIDER" | "WEBSITE" | "UNKNOWN" {
  switch (sourceType) {
    case "MANUAL":
      return "MANUAL_PROSPECTING";
    case "GOOGLE_PLACES":
      return "GOOGLE_PLACES";
    case "PROVIDER":
      return "PROVIDER";
    case "WEBSITE":
      return "WEBSITE";
    default:
      return "UNKNOWN";
  }
}

/**
 * Map known first-party UTM pairs to acquisition channels.
 * Does not invent GBP when source is absent.
 */
export function classifyAttributionChannel(input: {
  source?: string | null;
  medium?: string | null;
}): AttributionChannel {
  const source = (input.source ?? "").trim().toLowerCase();
  const medium = (input.medium ?? "").trim().toLowerCase();

  if (
    !source ||
    source === "(none)" ||
    source === "(direct)" ||
    source === "direct"
  ) {
    if (!medium || medium === "(none)" || medium === "(not set)") {
      return "DIRECT";
    }
  }

  if (source === "google_business_profile" || medium === "organic_local") {
    return "GBP";
  }

  if (
    medium === "cpc" ||
    medium === "paid_social" ||
    medium === "paid_video" ||
    medium.startsWith("paid")
  ) {
    return "PAID";
  }

  if (source === "facebook" || source === "instagram") {
    if (medium === "organic_social" || medium === "organic_video" || !medium) {
      return "FACEBOOK";
    }
    return "ORGANIC_SOCIAL";
  }

  if (
    medium === "organic" ||
    medium === "organic_search" ||
    (source === "google" && medium !== "cpc")
  ) {
    return "ORGANIC_SEARCH";
  }

  if (medium === "referral" || source === "partner") {
    return "REFERRAL";
  }

  if (source === "outreach") {
    return "OUTBOUND";
  }

  if (!source && !medium) {
    return "UNKNOWN";
  }

  return "UNKNOWN";
}

export function classifyAttributionStrength(input: {
  hasFirstPartyUtm: boolean;
  hasSourceAndMedium: boolean;
  linkedToAudit: boolean;
  path: AcquisitionPath;
}): AttributionStrength {
  if (input.path === "OUTBOUND") {
    return "DIRECT_FIRST_PARTY";
  }
  if (
    input.hasFirstPartyUtm &&
    input.hasSourceAndMedium &&
    input.linkedToAudit
  ) {
    return "DIRECT_FIRST_PARTY";
  }
  if (input.hasFirstPartyUtm && input.linkedToAudit) {
    return "STRONG";
  }
  if (input.linkedToAudit) {
    return "DIRECTIONAL";
  }
  if (input.path === "INBOUND") {
    return "INFERRED";
  }
  return "UNKNOWN";
}

/**
 * First-party storage captures at most one tab-session UTM bundle.
 * Do not invent FIRST_TOUCH / LATEST_TOUCH history.
 */
export const TOUCH_SEMANTICS = {
  FIRST_TOUCH: "NOT_MODELED_IN_FIRST_PARTY",
  LATEST_TOUCH: "NOT_MODELED_IN_FIRST_PARTY",
  SESSION_CAPTURE: "TAB_SESSION_FIRST_UTM_WHEN_PRESENT",
} as const;

export function pipelineVelocityMedianDays(durationsDays: number[]): {
  status: "AVAILABLE" | "INSUFFICIENT_DATA";
  medianDays: number | null;
  count: number;
} {
  if (durationsDays.length < LEAD_CONVERSION_THRESHOLDS.VELOCITY_MIN_SAMPLES) {
    return {
      status: "INSUFFICIENT_DATA",
      medianDays: null,
      count: durationsDays.length,
    };
  }
  const sorted = [...durationsDays].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median =
    sorted.length % 2 === 0
      ? (sorted[mid - 1]! + sorted[mid]!) / 2
      : sorted[mid]!;
  return {
    status: "AVAILABLE",
    medianDays: Math.round(median * 10) / 10,
    count: sorted.length,
  };
}

export function dropOffObservation(input: {
  fromCount: number | null;
  toCount: number | null;
  fromCaptured?: boolean;
  toCaptured?: boolean;
}): {
  status: "OBSERVED" | "INSUFFICIENT_DATA" | "NOT_CAPTURED" | "UNKNOWN";
  lost: number | null;
  rate: RateObservation;
} {
  const rate = conversionRate({
    numerator: input.toCount,
    denominator: input.fromCount,
    numeratorCaptured: input.toCaptured,
    denominatorCaptured: input.fromCaptured,
  });
  if (rate.status === "NOT_CAPTURED") {
    return { status: "NOT_CAPTURED", lost: null, rate };
  }
  if (rate.status === "UNKNOWN") {
    return { status: "UNKNOWN", lost: null, rate };
  }
  if (rate.status === "INSUFFICIENT_DATA") {
    return { status: "INSUFFICIENT_DATA", lost: null, rate };
  }
  if (input.fromCount == null || input.toCount == null) {
    return { status: "UNKNOWN", lost: null, rate };
  }
  return {
    status: "OBSERVED",
    lost: Math.max(0, input.fromCount - input.toCount),
    rate,
  };
}

export function revenueEvidenceKind(input: {
  paidCents: number;
  hasMarketingAttribution: boolean;
}): RevenueEvidenceKind {
  if (input.paidCents <= 0) {
    return "UNATTRIBUTED_REVENUE";
  }
  if (input.hasMarketingAttribution) {
    return "ATTRIBUTED_REVENUE";
  }
  return "OBSERVED_REVENUE";
}

/** Organic work without represented cost must not fabricate $0 spend. */
export function marketingRoiStatus(input: {
  costKnown: boolean;
  revenueAttributionStrong: boolean;
  windowCompatible: boolean;
}): "ROI_NOT_AVAILABLE" | "ROI_ELIGIBLE" {
  if (
    !input.costKnown ||
    !input.revenueAttributionStrong ||
    !input.windowCompatible
  ) {
    return "ROI_NOT_AVAILABLE";
  }
  return "ROI_ELIGIBLE";
}

export function buildPriorityActions(input: {
  attention: AttentionItem[];
  inboundLeads: number;
  outboundProspects: number;
  opportunities: number;
  attributedAudits: number;
  unknownAttributionAudits: number;
  sampleLabel: SampleQualityLabel;
}): PriorityAction[] {
  const actions: PriorityAction[] = [];
  const followUps = input.attention.filter(
    (a) =>
      a.kind === "FOLLOW_UP_DUE" ||
      a.kind === "OPPORTUNITY_OVERDUE" ||
      a.kind === "PAYMENT_PENDING",
  ).length;
  if (followUps > 0) {
    actions.push({
      band: "NOW",
      action: "FOLLOW_UP",
      reason: `${followUps} item(s) need operator follow-up (commercial queue).`,
    });
  }
  const aging = input.attention.filter(
    (a) =>
      a.kind === "AGING_INBOUND_LEAD" || a.kind === "STALE_INBOUND_LEAD",
  ).length;
  if (aging > 0) {
    actions.push({
      band: "NOW",
      action: "REVIEW_LEAD",
      reason: `${aging} inbound lead(s) aging/stale under JS Solutions operating rules.`,
    });
  }
  if (input.unknownAttributionAudits > 0 && input.attributedAudits === 0) {
    actions.push({
      band: "NEXT",
      action: "WATCH",
      reason:
        "Public audits lack first-party UTM context — improve tagged links before ranking channels.",
    });
  }
  if (input.inboundLeads === 0 && input.outboundProspects > 0) {
    actions.push({
      band: "WATCH",
      action: "WATCH",
      reason:
        "Outbound prospecting active; inbound marketing leads not observed in window.",
    });
  }
  if (input.sampleLabel === "INSUFFICIENT_DATA") {
    actions.push({
      band: "WATCH",
      action: "WATCH",
      reason: "Sample too small to declare channel or content winners.",
    });
  }
  if (input.opportunities > 0) {
    actions.push({
      band: "NEXT",
      action: "PREPARE_SCOPE",
      reason:
        "Opportunities exist — advance commercial workflow where next actions are set.",
    });
  }
  return actions.slice(0, LEAD_CONVERSION_THRESHOLDS.ACTION_LIST_MAX);
}

/**
 * Business signal for content review — OBSERVED only, never "SEO successful."
 */
export function contentBusinessSignalLabel(input: {
  attributedAudits: number;
  attributedLeads: number;
  attributedOpportunities: number;
}): "NONE" | "BUSINESS_SIGNAL" | "INSUFFICIENT_DATA" {
  const n =
    input.attributedAudits +
    input.attributedLeads +
    input.attributedOpportunities;
  if (n === 0) {
    return "NONE";
  }
  if (n < 3 && input.attributedOpportunities === 0) {
    return "INSUFFICIENT_DATA";
  }
  if (input.attributedOpportunities > 0 || input.attributedLeads > 0) {
    return "BUSINESS_SIGNAL";
  }
  return "INSUFFICIENT_DATA";
}

export function formatCentsUsd(cents: number | null | undefined): string {
  if (cents == null) {
    return "NOT CAPTURED";
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}
