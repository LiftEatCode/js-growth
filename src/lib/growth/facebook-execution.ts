/**
 * Growth Sprint 4 — Facebook 30-day execution engine (facebook-execution-v1).
 *
 * Observational + operator workflow helpers. No Meta API. No OpenAI.
 * Growth Baseline V1 and facebook-growth-v1 taxonomies remain authoritative.
 */

import { GROWTH_BASELINE_V1 } from "@/lib/growth/baseline-v1";
import type {
  FacebookContentFormat,
  FacebookContentJob,
  FacebookContentPillar,
  FacebookPublisherType,
} from "@/lib/growth/facebook-growth";

export const FACEBOOK_EXECUTION_VERSION = "facebook-execution-v1" as const;

/** Execution window — experimental operating period (not a forecast). */
export const FACEBOOK_EXECUTION_WINDOW = {
  startDate: "2026-08-24",
  endDate: "2026-09-22",
  label: "30-day Facebook organic execution",
  weeklySnapshotWeekday: "Monday",
  weeklySnapshotNote:
    "Capture aggregate FACEBOOK GrowthSnapshot each Monday (America/Chicago ops day).",
} as const;

export const FACEBOOK_CONTENT_METRIC_CHECKPOINTS = [
  "INITIAL",
  "HOURS_72",
  "DAYS_7",
] as const;
export type FacebookContentMetricCheckpoint =
  (typeof FACEBOOK_CONTENT_METRIC_CHECKPOINTS)[number];

export function isFacebookContentMetricCheckpoint(
  value: string,
): value is FacebookContentMetricCheckpoint {
  return (FACEBOOK_CONTENT_METRIC_CHECKPOINTS as readonly string[]).includes(
    value,
  );
}

/** Hours after publish before a checkpoint becomes due (operational, not exact). */
export const FACEBOOK_CHECKPOINT_DUE_HOURS = {
  HOURS_72: 72,
  DAYS_7: 168,
} as const;

export type MeasurementDueStatus =
  | "WAITING_72H"
  | "DUE_72H"
  | "WAITING_7D"
  | "DUE_7D"
  | "COMPLETE";

export function getMeasurementDueStatus(input: {
  publishedAt: Date;
  hasInitial: boolean;
  has72h: boolean;
  has7d: boolean;
  now?: Date;
}): MeasurementDueStatus {
  const now = input.now ?? new Date();
  const hours =
    (now.getTime() - input.publishedAt.getTime()) / (1000 * 60 * 60);

  if (input.has7d) {
    return "COMPLETE";
  }
  if (hours >= FACEBOOK_CHECKPOINT_DUE_HOURS.DAYS_7) {
    return "DUE_7D";
  }
  if (input.has72h) {
    return "WAITING_7D";
  }
  if (hours >= FACEBOOK_CHECKPOINT_DUE_HOURS.HOURS_72) {
    return "DUE_72H";
  }
  return "WAITING_72H";
}

/**
 * Experimental operating cadence — NOT claimed optimal.
 * Capacity + observation needs; Meta does not publish a universal daily quota.
 */
export const FACEBOOK_EXPERIMENTAL_CADENCE = {
  label: "EXPERIMENTAL OPERATING CADENCE",
  companyPostsPerWeek: { floor: 3, target: 4, stretch: 5 },
  founderPostsPerWeek: { floor: 2, target: 3, stretch: 4 },
  notes: [
    "Quality and reply capacity beat volume.",
    "Avoid engagement bait and unoriginal spam patterns.",
    "Isolate experiments — do not change format+CTA+publisher in the same post.",
    "Recalibrate after Week 2 if Insights show clear fatigue or unused capacity.",
  ],
} as const;

/**
 * 30-day TARGET bands — goals, not forecasts.
 * Anchored to Baseline V1 followers = 75.
 */
export const FACEBOOK_30_DAY_TARGETS = {
  label: "TARGET",
  baselineFollowers: GROWTH_BASELINE_V1.facebook.followers,
  followers: {
    floorAbsoluteGain: 5,
    targetAbsoluteGain: 10,
    stretchAbsoluteGain: 18,
    rationale:
      "Floor = evidence the loop works; Target = meaningful social-proof step from 75; Stretch = strong discovery→follow conversion without vanity chasing.",
  },
  pageVisits: {
    floor: 12,
    target: 20,
    stretch: 35,
    baselinePeriod: GROWTH_BASELINE_V1.facebook.visits,
    rationale: "Baseline period had 9 visits — modest lift expected with consistent posting + follow CTAs.",
  },
  engagements: {
    floor: 12,
    target: 25,
    stretch: 45,
    baselinePeriod: GROWTH_BASELINE_V1.facebook.engagements,
    rationale: "Baseline period 5 engagements — prioritize meaningful comments over bait.",
  },
  nonFollowerViewPercent: {
    observeOnly: true,
    baseline: GROWTH_BASELINE_V1.facebook.viewsByFollowerStatus.nonFollowersPercent,
    note: "Track directionally; do not force a target — discovery quality matters more than maximizing %. ",
  },
  facebookAttributedAuditStarts: {
    floor: 1,
    target: 3,
    stretch: 6,
    rationale: "Low-volume first-party signal; floor proves attribution path works.",
  },
  facebookAttributedWebsiteSessions: {
    note: "Review in GA4 (not auto-loaded). Target: any consistent facebook/organic_social sessions week-over-week.",
  },
} as const;

export function followerTargetProgress(input: {
  currentFollowers: number | null;
}): {
  status: "AVAILABLE" | "NOT_CAPTURED";
  absoluteGain: number | null;
  percentGain: number | null;
  band: "BELOW_FLOOR" | "FLOOR" | "TARGET" | "STRETCH" | "NOT_CAPTURED";
} {
  if (input.currentFollowers == null) {
    return {
      status: "NOT_CAPTURED",
      absoluteGain: null,
      percentGain: null,
      band: "NOT_CAPTURED",
    };
  }
  const baseline = FACEBOOK_30_DAY_TARGETS.baselineFollowers;
  const absoluteGain = input.currentFollowers - baseline;
  const percentGain =
    baseline > 0
      ? Math.round((absoluteGain / baseline) * 1000) / 10
      : null;
  const { floorAbsoluteGain, targetAbsoluteGain, stretchAbsoluteGain } =
    FACEBOOK_30_DAY_TARGETS.followers;

  let band: "BELOW_FLOOR" | "FLOOR" | "TARGET" | "STRETCH" = "BELOW_FLOOR";
  if (absoluteGain >= stretchAbsoluteGain) {
    band = "STRETCH";
  } else if (absoluteGain >= targetAbsoluteGain) {
    band = "TARGET";
  } else if (absoluteGain >= floorAbsoluteGain) {
    band = "FLOOR";
  }

  return { status: "AVAILABLE", absoluteGain, percentGain, band };
}

export const FACEBOOK_EXPERIMENT_SEQUENCE = {
  current: "2026-012",
  next: "2026-011",
  backlog: [
    "2026-017",
    "2026-016",
    "2026-010",
    "2026-015",
    "2026-013",
    "2026-014",
    "2026-018",
  ],
  rationale: {
    "2026-012":
      "Highest early learning: company vs founder inventory/trust jobs with separate UTMs.",
    "2026-011":
      "Native value vs link — critical for distribution vs website traffic tradeoff.",
    "2026-017": "Meaningful discussion vs broadcast (engagement quality).",
    "2026-016": "Soft follow CTA after discovery signal is clearer.",
    "2026-010": "Photo vs text after publisher/link lessons.",
    "2026-015": "Reel vs static once static baseline exists.",
    "2026-013": "CTA hardness after traffic path works.",
    "2026-014": "Edu vs proof mid-month.",
    "2026-018":
      "Website→Facebook queued — soft placement after Week 2 measurement hygiene is stable.",
  },
} as const;

export const GROWTH_EXPERIMENT_DECISIONS = [
  "CONTINUE",
  "ITERATE",
  "PROMOTE",
  "STOP",
  "INCONCLUSIVE",
] as const;
export type GrowthExperimentDecisionKind =
  (typeof GROWTH_EXPERIMENT_DECISIONS)[number];

export function isGrowthExperimentDecisionKind(
  value: string,
): value is GrowthExperimentDecisionKind {
  return (GROWTH_EXPERIMENT_DECISIONS as readonly string[]).includes(value);
}

export type ScheduledFacebookPost = {
  date: string;
  publisher: FacebookPublisherType;
  contentJob: FacebookContentJob;
  contentPillar: FacebookContentPillar;
  contentFormat: FacebookContentFormat;
  experimentId: string | null;
  ctaClass: "NONE" | "SOFT_FOLLOW" | "SOFT_AUDIT" | "SOFT_RESOURCE" | "DISCUSSION";
  link: boolean;
  slugHint: string;
  titleHint: string;
};

/**
 * Strategic 30-day schedule (Week 1–4). Copy written separately.
 * Dates: 2026-08-24 → 2026-09-22.
 */
export const FACEBOOK_30_DAY_SCHEDULE: ScheduledFacebookPost[] = [
  // Week 1 — establish cadence + start 012
  {
    date: "2026-08-24",
    publisher: "COMPANY",
    contentJob: "AUTHORITY",
    contentPillar: "SEO",
    contentFormat: "PHOTO",
    experimentId: "2026-012",
    ctaClass: "NONE",
    link: false,
    slugHint: "seo_authority_w1_a",
    titleHint: "Company: educational SEO visual (native)",
  },
  {
    date: "2026-08-25",
    publisher: "FOUNDER",
    contentJob: "TRUST",
    contentPillar: "BUILDING_JS_SOLUTIONS",
    contentFormat: "TEXT",
    experimentId: "2026-012",
    ctaClass: "DISCUSSION",
    link: false,
    slugHint: "building_js_w1_a",
    titleHint: "Founder: building JS Solutions lesson",
  },
  {
    date: "2026-08-26",
    publisher: "COMPANY",
    contentJob: "PROOF",
    contentPillar: "CASE_STUDIES",
    contentFormat: "PHOTO",
    experimentId: null,
    ctaClass: "SOFT_AUDIT",
    link: true,
    slugHint: "proof_audit_signal_w1",
    titleHint: "Company: anonymized audit finding + soft audit CTA",
  },
  {
    date: "2026-08-27",
    publisher: "FOUNDER",
    contentJob: "ENGAGEMENT",
    contentPillar: "SMALL_BUSINESS_GROWTH",
    contentFormat: "TEXT",
    experimentId: "2026-012",
    ctaClass: "DISCUSSION",
    link: false,
    slugHint: "smb_observation_w1",
    titleHint: "Founder: local SMB observation question",
  },
  {
    date: "2026-08-28",
    publisher: "COMPANY",
    contentJob: "REACH",
    contentPillar: "COMMON_MISTAKES",
    contentFormat: "CAROUSEL",
    experimentId: null,
    ctaClass: "SOFT_FOLLOW",
    link: false,
    slugHint: "mistakes_carousel_w1",
    titleHint: "Company: common website mistakes carousel",
  },
  {
    date: "2026-08-29",
    publisher: "FOUNDER",
    contentJob: "COMMUNITY",
    contentPillar: "LOCAL_SEO",
    contentFormat: "PHOTO",
    experimentId: null,
    ctaClass: "DISCUSSION",
    link: false,
    slugHint: "local_seo_chat_w1",
    titleHint: "Founder: local SEO conversation starter",
  },
  // Week 2 — native vs link (011) + follower growth
  {
    date: "2026-08-31",
    publisher: "COMPANY",
    contentJob: "AUTHORITY",
    contentPillar: "WEBSITE_AUDITS",
    contentFormat: "PHOTO",
    experimentId: "2026-011",
    ctaClass: "NONE",
    link: false,
    slugHint: "audit_native_w2",
    titleHint: "Company: native audit education (no link)",
  },
  {
    date: "2026-09-01",
    publisher: "COMPANY",
    contentJob: "TRAFFIC",
    contentPillar: "WEBSITE_AUDITS",
    contentFormat: "LINK",
    experimentId: "2026-011",
    ctaClass: "SOFT_AUDIT",
    link: true,
    slugHint: "audit_link_w2",
    titleHint: "Company: same topic with outbound UTM link",
  },
  {
    date: "2026-09-02",
    publisher: "FOUNDER",
    contentJob: "FOLLOWER_GROWTH",
    contentPillar: "BEHIND_THE_SCENES",
    contentFormat: "PHOTO",
    experimentId: null,
    ctaClass: "SOFT_FOLLOW",
    link: false,
    slugHint: "bts_follow_w2",
    titleHint: "Founder: BTS + soft follow",
  },
  {
    date: "2026-09-03",
    publisher: "COMPANY",
    contentJob: "AUDIT_CONVERSION",
    contentPillar: "WEBSITE_CONVERSION",
    contentFormat: "PHOTO",
    experimentId: null,
    ctaClass: "SOFT_AUDIT",
    link: true,
    slugHint: "conversion_audit_w2",
    titleHint: "Company: traffic-without-leads theme → audit",
  },
  {
    date: "2026-09-04",
    publisher: "FOUNDER",
    contentJob: "AUTHORITY",
    contentPillar: "AI_AUTOMATION",
    contentFormat: "TEXT",
    experimentId: null,
    ctaClass: "NONE",
    link: false,
    slugHint: "ai_opinion_w2",
    titleHint: "Founder: AI/automation opinion for SMBs",
  },
  {
    date: "2026-09-05",
    publisher: "COMPANY",
    contentJob: "ENGAGEMENT",
    contentPillar: "GBP",
    contentFormat: "TEXT",
    experimentId: "2026-017",
    ctaClass: "DISCUSSION",
    link: false,
    slugHint: "gbp_discussion_w2",
    titleHint: "Company: GBP discussion prompt",
  },
  // Week 3 — follow CTA + formats
  {
    date: "2026-09-07",
    publisher: "COMPANY",
    contentJob: "FOLLOWER_GROWTH",
    contentPillar: "RESOURCES",
    contentFormat: "PHOTO",
    experimentId: "2026-016",
    ctaClass: "SOFT_FOLLOW",
    link: false,
    slugHint: "resource_follow_w3",
    titleHint: "Company: resource tip + follow CTA",
  },
  {
    date: "2026-09-08",
    publisher: "COMPANY",
    contentJob: "AUTHORITY",
    contentPillar: "RESOURCES",
    contentFormat: "PHOTO",
    experimentId: "2026-016",
    ctaClass: "NONE",
    link: false,
    slugHint: "resource_nofollow_w3",
    titleHint: "Company: matched tip without follow CTA",
  },
  {
    date: "2026-09-09",
    publisher: "FOUNDER",
    contentJob: "TRUST",
    contentPillar: "BUILDING_JS_SOLUTIONS",
    contentFormat: "REEL",
    experimentId: "2026-015",
    ctaClass: "NONE",
    link: false,
    slugHint: "building_reel_w3",
    titleHint: "Founder: Reel — building in public",
  },
  {
    date: "2026-09-10",
    publisher: "COMPANY",
    contentJob: "AUTHORITY",
    contentPillar: "SEO",
    contentFormat: "PHOTO",
    experimentId: "2026-010",
    ctaClass: "NONE",
    link: false,
    slugHint: "seo_photo_w3",
    titleHint: "Company: SEO topic as PHOTO",
  },
  {
    date: "2026-09-11",
    publisher: "COMPANY",
    contentJob: "AUTHORITY",
    contentPillar: "SEO",
    contentFormat: "TEXT",
    experimentId: "2026-010",
    ctaClass: "NONE",
    link: false,
    slugHint: "seo_text_w3",
    titleHint: "Company: same SEO topic as TEXT",
  },
  {
    date: "2026-09-12",
    publisher: "FOUNDER",
    contentJob: "LEAD_GENERATION",
    contentPillar: "SMALL_BUSINESS_GROWTH",
    contentFormat: "TEXT",
    experimentId: null,
    ctaClass: "SOFT_AUDIT",
    link: true,
    slugHint: "founder_soft_audit_w3",
    titleHint: "Founder: soft invite to free audit",
  },
  // Week 4 — proof + conversion + review buffer
  {
    date: "2026-09-14",
    publisher: "COMPANY",
    contentJob: "PROOF",
    contentPillar: "CASE_STUDIES",
    contentFormat: "CAROUSEL",
    experimentId: "2026-014",
    ctaClass: "SOFT_RESOURCE",
    link: true,
    slugHint: "proof_carousel_w4",
    titleHint: "Company: proof/case-study style",
  },
  {
    date: "2026-09-15",
    publisher: "COMPANY",
    contentJob: "AUTHORITY",
    contentPillar: "WEBSITE_CONVERSION",
    contentFormat: "PHOTO",
    experimentId: "2026-014",
    ctaClass: "NONE",
    link: false,
    slugHint: "edu_conversion_w4",
    titleHint: "Company: educational conversion topic",
  },
  {
    date: "2026-09-16",
    publisher: "FOUNDER",
    contentJob: "ENGAGEMENT",
    contentPillar: "COMMON_MISTAKES",
    contentFormat: "TEXT",
    experimentId: null,
    ctaClass: "DISCUSSION",
    link: false,
    slugHint: "mistakes_ask_w4",
    titleHint: "Founder: mistakes discussion",
  },
  {
    date: "2026-09-17",
    publisher: "COMPANY",
    contentJob: "AUDIT_CONVERSION",
    contentPillar: "WEBSITE_AUDITS",
    contentFormat: "PHOTO",
    experimentId: "2026-013",
    ctaClass: "SOFT_AUDIT",
    link: true,
    slugHint: "soft_cta_audit_w4",
    titleHint: "Company: soft audit CTA",
  },
  {
    date: "2026-09-18",
    publisher: "COMPANY",
    contentJob: "LEAD_GENERATION",
    contentPillar: "WEBSITE_AUDITS",
    contentFormat: "LINK",
    experimentId: "2026-013",
    ctaClass: "SOFT_AUDIT",
    link: true,
    slugHint: "directish_cta_w4",
    titleHint: "Company: more direct audit CTA (still no bait)",
  },
  {
    date: "2026-09-19",
    publisher: "FOUNDER",
    contentJob: "COMMUNITY",
    contentPillar: "LOCAL_SEO",
    contentFormat: "PHOTO",
    experimentId: null,
    ctaClass: "SOFT_FOLLOW",
    link: false,
    slugHint: "community_wrap_w4",
    titleHint: "Founder: community wrap + soft follow",
  },
  {
    date: "2026-09-22",
    publisher: "COMPANY",
    contentJob: "AUTHORITY",
    contentPillar: "RESOURCES",
    contentFormat: "PHOTO",
    experimentId: null,
    ctaClass: "SOFT_RESOURCE",
    link: true,
    slugHint: "month_wrap_resource",
    titleHint: "Company: month wrap resource + 30-day review prep",
  },
];

export function scheduleForDate(dateIso: string): ScheduledFacebookPost[] {
  return FACEBOOK_30_DAY_SCHEDULE.filter((row) => row.date === dateIso);
}

export function scheduleToday(now = new Date()): ScheduledFacebookPost[] {
  const iso = now.toISOString().slice(0, 10);
  return scheduleForDate(iso);
}

export const WEBSITE_TO_FACEBOOK_DECISION = {
  experimentId: "2026-018",
  status: "ACTIVE" as const,
  reason:
    "Sprint 10: soft follow CTA on audit completion (inline) and contact success with facebook_follow_cta_clicked. Click ≠ follower acquired. No popup/modal/sitewide banner.",
  candidatePlacement: "Audit completion + contact success (soft link)",
} as const;
