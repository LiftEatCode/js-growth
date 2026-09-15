import type { GbpAuditCategory } from "./types";

export const GBP_AUDIT_ENGINE_ID = "gbp-audit-v0.2" as const;

export const CATEGORY_LABELS: Record<GbpAuditCategory, string> = {
  profile_optimization: "Profile Optimization",
  reviews_reputation: "Reviews & Reputation",
  activity_freshness: "Activity & Freshness",
  local_seo: "Local SEO",
  trust_authority: "Trust & Authority",
  conversion_readiness: "Conversion Readiness",
};

/**
 * Category weights as percentages. Must sum to 100.
 * Easy to change without touching rule files.
 */
export const CATEGORY_WEIGHTS: Record<GbpAuditCategory, number> = {
  profile_optimization: 25,
  reviews_reputation: 25,
  activity_freshness: 15,
  local_seo: 15,
  trust_authority: 10,
  conversion_readiness: 10,
};

export const WARNING_SCORE_RATIO = 0.5;

export const SCORE_BANDS = [
  {
    id: "excellent",
    label: "Excellent",
    min: 90,
    max: 100,
  },
  {
    id: "strong",
    label: "Strong",
    min: 80,
    max: 89,
  },
  {
    id: "good_foundation",
    label: "Good Foundation",
    min: 70,
    max: 79,
  },
  {
    id: "needs_improvement",
    label: "Needs Improvement",
    min: 60,
    max: 69,
  },
  {
    id: "significant_opportunity",
    label: "Significant Opportunity",
    min: 0,
    max: 59,
  },
] as const;

export type GbpScoreBandId = (typeof SCORE_BANDS)[number]["id"];

export const THRESHOLDS = {
  descriptionMinChars: 50,
  descriptionRecommendedChars: 250,
  photoCountAdequate: 8,
  photoCountWarning: 3,
  reviewCountModest: 5,
  reviewCountHealthy: 15,
  averageRatingPass: 4,
  averageRatingWarning: 3.5,
  recentReviewDaysPass: 90,
  recentReviewDaysWarning: 180,
  ownerResponseRatePass: 0.8,
  ownerResponseRateWarning: 0.5,
  negativeReviewLookbackDays: 90,
  negativeReviewRatingMax: 3,
  recentPostDaysPass: 30,
  recentPostDaysWarning: 90,
  recentOwnerPhotoDaysPass: 60,
  recentOwnerPhotoDaysWarning: 120,
  recentActivityDaysPass: 30,
  recentActivityDaysWarning: 90,
  newBusinessDays: 180,
  profileCompletenessPass: 0.8,
  profileCompletenessWarning: 0.55,
} as const;

/** Coverage % bands. Score is independent of these. */
export const CONFIDENCE_THRESHOLDS = {
  highMinCoveragePercent: 80,
  mediumMinCoveragePercent: 50,
} as const;

/**
 * Opening-date buckets for maturity. Review history is a fallback only
 * when opening date is missing — never used to invent a precise age.
 */
export const MATURITY_THRESHOLDS = {
  newDays: 180,
  developingDays: 540,
  establishedDays: 1825,
  fallbackMatureOldestReviewDays: 730,
  fallbackEstablishedOldestReviewDays: 365,
  fallbackMatureMinReviews: 15,
  fallbackEstablishedMinReviews: 8,
} as const;

export const RULE_MAX_SCORES = {
  "profile.primary_category": 10,
  "profile.additional_categories": 4,
  "profile.description_present": 8,
  "profile.description_substance": 6,
  "profile.phone": 8,
  "profile.website": 8,
  "profile.regular_hours": 8,
  "profile.service_areas": 8,
  "profile.services": 6,
  "profile.logo": 6,
  "profile.cover": 6,
  "profile.photos": 10,
  "profile.storefront_address": 4,
  "reviews.count": 20,
  "reviews.average_rating": 25,
  "reviews.recent_activity": 20,
  "reviews.owner_response_rate": 20,
  "reviews.negative_responses": 15,
  "activity.recent_posts": 40,
  "activity.recent_owner_photos": 35,
  "activity.recent_profile_activity": 25,
  "local_seo.website": 25,
  "local_seo.name_consistency": 25,
  "local_seo.phone_consistency": 25,
  "local_seo.landing_page": 25,
  "trust.review_quality": 30,
  "trust.review_recency": 10,
  "trust.owner_engagement": 10,
  "trust.profile_completeness": 10,
  "trust.media_presence": 10,
  "conversion.phone": 25,
  "conversion.website": 25,
  "conversion.cta": 20,
  "conversion.hours": 15,
  "conversion.action_path": 15,
} as const;

export type GbpRuleId = keyof typeof RULE_MAX_SCORES;

export const SEVERITY_RANK: Record<"high" | "medium" | "low" | "info", number> =
  {
    high: 0,
    medium: 1,
    low: 2,
    info: 3,
  };
