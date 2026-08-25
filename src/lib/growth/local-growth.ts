/**
 * Growth Sprint 12 — Local Search / Google Business Profile Intelligence V1.
 *
 * Manual operating system for GBP health. No Google APIs in V1.
 * Extends GrowthSnapshot + checklist model — not a second Growth Engine.
 */

import { JS_SOLUTIONS_BUSINESS_FACTS } from "@/lib/growth/content-intelligence";
import {
  GBP_POST_UTM,
  GBP_WEBSITE_UTM,
  buildGbpPostContent,
} from "@/lib/growth/acquisition-capture";

export const LOCAL_GROWTH_VERSION = 1 as const;

/** Distinct evidence layers — never collapse into one fake GBP score. */
export const LOCAL_EVIDENCE_LAYERS = [
  "PROFILE",
  "VISIBILITY",
  "ENGAGEMENT",
  "REPUTATION",
  "WEBSITE_TRAFFIC",
  "CONVERSION",
  "LOCAL_SEARCH",
  "CONTENT",
] as const;
export type LocalEvidenceLayer = (typeof LOCAL_EVIDENCE_LAYERS)[number];

export const LOCAL_PERFORMANCE_STATES = [
  "NO_DATA",
  "BASELINE_ONLY",
  "EARLY_SIGNAL",
  "MONITORING",
  "DIRECTIONAL_IMPROVEMENT",
  "DIRECTIONAL_DECLINE",
  "REVIEW_REQUIRED",
] as const;
export type LocalPerformanceState = (typeof LOCAL_PERFORMANCE_STATES)[number];

/** Reuse Sprint 8 evidence strength vocabulary. */
export const LOCAL_EVIDENCE_STRENGTHS = [
  "NONE",
  "WEAK",
  "DIRECTIONAL",
  "MEANINGFUL",
] as const;
export type LocalEvidenceStrength = (typeof LOCAL_EVIDENCE_STRENGTHS)[number];

export const LOCAL_CHECKLIST_STATUSES = [
  "NOT_REVIEWED",
  "OK",
  "NEEDS_ATTENTION",
  "NOT_APPLICABLE",
] as const;
export type LocalChecklistStatus = (typeof LOCAL_CHECKLIST_STATUSES)[number];

export const LOCAL_FACT_MATCHES = [
  "MATCH",
  "MISMATCH",
  "NOT_CAPTURED",
  "NOT_APPLICABLE",
] as const;
export type LocalFactMatch = (typeof LOCAL_FACT_MATCHES)[number];

export const LOCAL_EXPERIMENT_STATUSES = [
  "QUEUED",
  "ACTIVE",
  "COMPLETE",
  "PROMOTE",
  "ITERATE",
  "STOP",
] as const;
export type LocalExperimentStatus = (typeof LOCAL_EXPERIMENT_STATUSES)[number];

/**
 * GBP post formats currently modeled for planning.
 * Align with Google Help: Update, Offer, Event (photo is media on an Update).
 * PROVENANCE: OFFICIAL_GOOGLE + JS_SOLUTIONS_OPERATING_RULE
 */
export const GBP_POST_FORMATS = ["UPDATE", "OFFER", "EVENT"] as const;
export type GbpPostFormat = (typeof GBP_POST_FORMATS)[number];

/**
 * Reuse existing content-job taxonomy where possible.
 * LOCAL and FAQ are local-growth planning labels mapped onto Content Intelligence jobs.
 */
export const GBP_CONTENT_JOBS = [
  "EDUCATION",
  "AUTHORITY",
  "PROOF",
  "SERVICE",
  "AUDIT",
  "LOCAL",
  "CASE_STUDY",
  "FAQ",
  "UPDATE",
] as const;
export type GbpContentJob = (typeof GBP_CONTENT_JOBS)[number];

/** Snapshot capture provenance — interpretation ignores source once validated. */
export const GBP_SNAPSHOT_PROVENANCE = ["MANUAL", "API"] as const;
export type GbpSnapshotProvenance =
  (typeof GBP_SNAPSHOT_PROVENANCE)[number];

/**
 * Operating cadence — NOT Google ranking guidance.
 * PROVENANCE: JS_SOLUTIONS_OPERATING_RULE
 */
export const LOCAL_SNAPSHOT_CADENCE = {
  weekly: "WEEKLY_LIGHTWEIGHT",
  monthly: "MONTHLY_DEEPER_REVIEW",
  label: "JS_SOLUTIONS_OPERATING_RULE",
  note: "Avoid daily GBP metric obsession. Capture weekly lightweight Insights; deeper monthly review.",
} as const;

/**
 * Experimental post cadence — NOT Google ranking advice.
 * PROVENANCE: EXPERIMENTAL_OPERATING_CADENCE
 */
export const GBP_EXPERIMENTAL_POST_CADENCE = {
  postsPerWeekMin: 1,
  postsPerWeekMax: 2,
  label: "EXPERIMENTAL_OPERATING_CADENCE",
} as const;

export const LOCAL_CHECKLIST_ITEMS = [
  {
    key: "BUSINESS_NAME",
    section: "Business identity",
    factField: "companyName" as const,
  },
  {
    key: "PRIMARY_CATEGORY",
    section: "Categories",
    factField: null,
  },
  {
    key: "ADDITIONAL_CATEGORIES",
    section: "Categories",
    factField: null,
  },
  {
    key: "BUSINESS_DESCRIPTION",
    section: "Description",
    factField: "positioning" as const,
  },
  {
    key: "WEBSITE",
    section: "Website",
    factField: "siteUrl" as const,
  },
  {
    key: "WEBSITE_UTM",
    section: "Website",
    factField: null,
  },
  {
    key: "PHONE",
    section: "NAP",
    factField: "phone" as const,
  },
  {
    key: "HOURS",
    section: "Hours",
    factField: null,
  },
  {
    key: "SPECIAL_HOURS",
    section: "Hours",
    factField: null,
  },
  {
    key: "ADDRESS_OR_SERVICE_AREA",
    section: "NAP",
    factField: "serviceAreaLabel" as const,
  },
  {
    key: "SERVICES",
    section: "Services",
    factField: null,
  },
  {
    key: "ATTRIBUTES",
    section: "Attributes",
    factField: null,
  },
  {
    key: "PHOTOS",
    section: "Photos",
    factField: null,
  },
  {
    key: "LOGO",
    section: "Photos",
    factField: null,
  },
  {
    key: "COVER",
    section: "Photos",
    factField: null,
  },
  {
    key: "POSTS",
    section: "Posts",
    factField: null,
  },
  {
    key: "REVIEWS",
    section: "Reviews",
    factField: null,
  },
  {
    key: "REVIEW_RESPONSES",
    section: "Reviews",
    factField: null,
  },
  {
    key: "QUESTIONS_ANSWERS",
    section: "Q&A",
    factField: null,
  },
  {
    key: "SOCIAL_PROFILES",
    section: "Social",
    factField: null,
  },
] as const;

export type LocalChecklistItemKey =
  (typeof LOCAL_CHECKLIST_ITEMS)[number]["key"];

export function isLocalChecklistStatus(
  value: string,
): value is LocalChecklistStatus {
  return (LOCAL_CHECKLIST_STATUSES as readonly string[]).includes(value);
}

export function isLocalFactMatch(value: string): value is LocalFactMatch {
  return (LOCAL_FACT_MATCHES as readonly string[]).includes(value);
}

export function isLocalChecklistItemKey(
  value: string,
): value is LocalChecklistItemKey {
  return LOCAL_CHECKLIST_ITEMS.some((item) => item.key === value);
}

/**
 * Canonical local business facts for GBP comparison.
 * Extends Content Intelligence facts — Growth Engine is NOT the authority
 * that mutates these; checklist only observes vs compares.
 */
export const JS_SOLUTIONS_LOCAL_FACTS = {
  ...JS_SOLUTIONS_BUSINESS_FACTS,
  phone: null as string | null,
  /** Service-area business — do not force a public street address. */
  addressPublic: false as const,
  serviceAreaLabel: "Magnolia, TX and nearby northwest Houston suburbs",
  primaryMarket: "Magnolia, TX",
  relevantGbpServices: [
    "Web Design",
    "SEO",
    "Local SEO",
    "Google Business Profile Optimization",
    "Website Audits",
    "AI / Automation",
    "Custom Software",
  ] as const,
  gbpWebsiteUtm: GBP_WEBSITE_UTM,
  gbpPostUtmBase: GBP_POST_UTM,
} as const;

export type GbpExperimentDef = {
  id: string;
  /** Human label GBP-001 … */
  label: string;
  title: string;
  goal: string;
  measurement: string;
  /** Default operating status before operator decisions. */
  defaultStatus: LocalExperimentStatus;
};

/**
 * GBP experiment catalog. IDs use GBP-NNN for GrowthExperimentDecision rows
 * (extended ID pattern). Sequence: profile → UTM → content → conversion.
 */
export const GBP_EXPERIMENTS: readonly GbpExperimentDef[] = [
  {
    id: "GBP-001",
    label: "GBP-001",
    title: "Profile completeness / accuracy review",
    goal: "Sync Profile from Google, then review exceptions and subjective fields only.",
    measurement:
      "Checklist auto-populated from API where supported; operator completes mismatches and subjective reviews — not ranking claims.",
    defaultStatus: "ACTIVE",
  },
  {
    id: "GBP-002",
    label: "GBP-002",
    title: "UTM website link",
    goal: "Make GBP website traffic first-party classifiable.",
    measurement: "Future GBP-tagged acquisitions (do not rewrite historical UNKNOWN).",
    defaultStatus: "QUEUED",
  },
  {
    id: "GBP-003",
    label: "GBP-003",
    title: "GBP content cadence",
    goal: "Test experimental 1–2 posts/week after profile + attribution hygiene.",
    measurement: "Post ledger + engagement observations — not ranking guarantees.",
    defaultStatus: "QUEUED",
  },
  {
    id: "GBP-004",
    label: "GBP-004",
    title: "Photo / content mix",
    goal: "Improve profile quality and engagement experiments.",
    measurement: "Photo observations + engagement — ranking effect is HYPOTHESIS.",
    defaultStatus: "QUEUED",
  },
  {
    id: "GBP-005",
    label: "GBP-005",
    title: "Service inventory clarity",
    goal: "Align GBP services with actual JS Solutions offerings.",
    measurement: "Checklist SERVICES vs JS_SOLUTIONS_LOCAL_FACTS.",
    defaultStatus: "QUEUED",
  },
  {
    id: "GBP-006",
    label: "GBP-006",
    title: "Review response workflow",
    goal: "Consistent human review responses.",
    measurement: "Response coverage / operational completion — not ranking claims.",
    defaultStatus: "QUEUED",
  },
  {
    id: "GBP-007",
    label: "GBP-007",
    title: "Site → GBP follow path",
    goal: "Evaluate soft website→GBP placement for reviews/Maps proof.",
    measurement: "Placement decision IMPLEMENT | EXPERIMENT | DEFER.",
    defaultStatus: "QUEUED",
  },
  {
    id: "GBP-008",
    label: "GBP-008",
    title: "GBP post → audit CTA",
    goal: "Selected posts with Start Free Website Growth Audit + tagged URL.",
    measurement: "GBP attribution → audit/contact — not every post conversion-optimized.",
    defaultStatus: "QUEUED",
  },
  {
    id: "GBP-009",
    label: "GBP-009",
    title: "Local service content",
    goal: "Support content that clarifies Local SEO vs SEO vs GBP.",
    measurement: "Content plans + Search Intelligence collision rules.",
    defaultStatus: "QUEUED",
  },
  {
    id: "GBP-010",
    label: "GBP-010",
    title: "Magnolia local landing evaluation",
    goal: "Decide whether a Magnolia-specific page is justified without doorway risk.",
    measurement: "JUSTIFIED_NOW | TEST_LATER | NOT_JUSTIFIED with DISTINCT_USER_VALUE.",
    defaultStatus: "QUEUED",
  },
] as const;

/** Recommended initial sequence — profile and attribution before volume. */
export const GBP_EXPERIMENT_SEQUENCE = [
  "GBP-001",
  "GBP-002",
  "GBP-003",
  "GBP-008",
  "GBP-004",
  "GBP-006",
] as const;

export function getGbpExperiment(id: string): GbpExperimentDef | undefined {
  return GBP_EXPERIMENTS.find((exp) => exp.id === id);
}

export function currentGbpExperimentId(): string {
  return "GBP-001";
}

export function nextGbpExperimentId(): string {
  return "GBP-002";
}

/**
 * Magnolia-specific service page decision.
 * PROVENANCE: JS_SOLUTIONS_OPERATING_RULE + Sprint 5 anti-doorway.
 */
export const MAGNOLIA_LOCAL_PAGE_DECISION = {
  decision: "TEST_LATER" as const,
  reasoning:
    "A Magnolia SEO/services page may eventually be justified with distinct local proof, case detail, and service-area clarity. Creating /seo-magnolia (or sibling city pages) solely for keyword targeting is a doorway pattern and is blocked. Revisit after GBP profile hygiene and when DISTINCT_USER_VALUE + INTENT + COLLISION + BUSINESS_RELEVANCE all pass.",
  doorwayProtection: true,
} as const;

/**
 * Website → GBP link prominence.
 * PROVENANCE: JS_SOLUTIONS_OPERATING_RULE
 */
export const WEBSITE_TO_GBP_DECISION = {
  decision: "DEFER" as const,
  reasoning:
    "Organization sameAs already covers Facebook. A soft GBP/Maps link can help reviews and social proof, but conversion pages (audit/contact) must stay uncluttered. Evaluate as GBP-007 after profile + UTM hygiene — do not force homepage chrome now.",
} as const;

export const GBP_SUPPORT_CONTENT_SEED = {
  id: "gbp-support-content-v1",
  title: "Google Business Profile Optimization for Local Businesses",
  recommendedPath: "/blog/google-business-profile-optimization",
  statusHint: "NOW" as const,
  note: "Strong candidate after profile hygiene. Collision/content architecture must confirm before publish — do not hard-code publication.",
} as const;

export const REVIEW_REQUEST_SAFETY = {
  allowed: [
    "Ask real customers for honest reviews",
    "Provide a direct link to the Business Profile review form when appropriate",
  ],
  notAllowed: [
    "Review gating (only asking happy customers)",
    "Incentivized or fake reviews",
    "Fabricated reviews",
    "Employee review manipulation",
    "Automated review generation",
  ],
  autoSendInSprint12: false,
  futureWorkflow: "FUTURE_OPTION — human-triggered review request workflow only",
} as const;

export const REVIEW_RESPONSE_TEMPLATES = {
  positive: {
    label: "Positive review",
    guidance:
      "Thank the customer, reference the service generically if known, invite future contact. No fabricated claims. Human posts only.",
    draftHint:
      "Thank you for sharing your experience with JS Solutions. We’re glad we could help — reach out anytime if you need website, Local SEO, or growth support.",
  },
  neutral: {
    label: "Neutral review",
    guidance:
      "Acknowledge feedback, invite clarification offline, stay factual. No defensive ranking claims.",
    draftHint:
      "Thank you for the feedback. We take every review seriously and would welcome the chance to learn more so we can improve.",
  },
  negative: {
    label: "Negative review",
    guidance:
      "Stay calm, acknowledge concern, invite private follow-up, do not argue publicly or invent facts. AI drafting = FUTURE_OPTION only.",
    draftHint:
      "We’re sorry this fell short of your expectations. Please contact us directly so we can understand what happened and make it right where we can.",
  },
  autoPost: false,
  aiDrafting: "FUTURE_OPTION",
} as const;

export const CLIENT_SAFE_LOCAL_LANGUAGE = {
  safe: [
    "Google Business Profile activity is being measured.",
    "We can attribute tagged website actions back to the profile.",
    "Reviews and profile engagement are monitored over time.",
    "We use profile, search, website, and commercial evidence separately.",
  ],
  unsafe: [
    "We guarantee higher Maps rankings.",
    "More GBP posts automatically improve ranking.",
    "Reviews directly cause ranking increases.",
    "We know every call came from Google.",
    "We dominate local search.",
  ],
} as const;

export const LOCAL_API_SIDE_EFFECT_BUDGET = {
  OPENAI: 0,
  META: 0,
  GSC_API: 0,
  GBP_API: 0,
  PLACES: 0,
  CRAWL: 0,
  RESEND: 0,
  STRIPE: 0,
  TWILIO: 0,
  FUTURE_GBP_API: "Manual capture now; API ingestion later without changing downstream models.",
} as const;

export function buildCanonicalGbpWebsiteUtm(destinationUrl: string): {
  source: string;
  medium: string;
  campaign: string;
  content: string;
  destinationUrl: string;
} {
  return {
    destinationUrl,
    ...GBP_WEBSITE_UTM,
  };
}

export function buildCanonicalGbpPostUtm(
  destinationUrl: string,
  slug: string,
): {
  ok: true;
  source: string;
  medium: string;
  campaign: string;
  content: string;
  destinationUrl: string;
} | { ok: false; error: string } {
  const content = buildGbpPostContent(slug);
  if (!content) {
    return { ok: false, error: "Invalid post slug for utm_content" };
  }
  return {
    ok: true,
    destinationUrl,
    ...GBP_POST_UTM,
    content,
  };
}

export function formatLocalMetricDisplay(
  value: number | null | undefined,
): string {
  if (value === null || value === undefined) {
    return "NOT_CAPTURED";
  }
  if (value === 0) {
    return "0";
  }
  return new Intl.NumberFormat("en-US").format(value);
}

/**
 * Compare like windows only. Mismatched windows → UNKNOWN.
 */
export function compareLikeWindows(input: {
  currentDays: number;
  priorDays: number;
  currentValue: number | null;
  priorValue: number | null;
}): {
  delta: number | null;
  label: "UNKNOWN" | "UP" | "DOWN" | "FLAT" | "INSUFFICIENT_DATA";
} {
  if (input.currentDays !== input.priorDays) {
    return { delta: null, label: "UNKNOWN" };
  }
  if (input.currentValue == null || input.priorValue == null) {
    return { delta: null, label: "INSUFFICIENT_DATA" };
  }
  const delta = input.currentValue - input.priorValue;
  if (delta === 0) {
    return { delta, label: "FLAT" };
  }
  return { delta, label: delta > 0 ? "UP" : "DOWN" };
}

export function reviewVelocityBetweenSnapshots(input: {
  currentReviewCount: number | null;
  priorReviewCount: number | null;
  daysBetween: number | null;
}): {
  reviewsGained: number | null;
  reviewsPerMonthApprox: number | null;
  status: "OBSERVATIONAL" | "INSUFFICIENT_DATA" | "NOT_CAPTURED";
} {
  if (
    input.currentReviewCount == null ||
    input.priorReviewCount == null ||
    input.daysBetween == null ||
    input.daysBetween <= 0
  ) {
    return {
      reviewsGained: null,
      reviewsPerMonthApprox: null,
      status:
        input.currentReviewCount == null && input.priorReviewCount == null
          ? "NOT_CAPTURED"
          : "INSUFFICIENT_DATA",
    };
  }
  const gained = input.currentReviewCount - input.priorReviewCount;
  if (input.daysBetween < 14) {
    return {
      reviewsGained: gained,
      reviewsPerMonthApprox: null,
      status: "INSUFFICIENT_DATA",
    };
  }
  const perMonth = (gained / input.daysBetween) * 30;
  return {
    reviewsGained: gained,
    reviewsPerMonthApprox: Math.round(perMonth * 10) / 10,
    status: "OBSERVATIONAL",
  };
}
