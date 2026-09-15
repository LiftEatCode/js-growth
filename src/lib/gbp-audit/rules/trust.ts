import { THRESHOLDS } from "../constants";
import { createGbpFinding } from "../engine";
import type { GbpAuditRule } from "../types";
import {
  daysSince,
  deriveMostRecentReviewAt,
  deriveOwnerResponseCount,
  hasOpenHours,
  hasText,
} from "../utils";

/**
 * Trust rules reuse some of the same raw fields as Reviews and Profile.
 * They answer a different question (does this profile look credible to a
 * customer?) rather than re-running optimization checklists.
 */

export const reviewQualityTrustRule: GbpAuditRule = {
  id: "trust.review_quality",
  category: "trust_authority",
  title: "Review quality signal",
  evaluate({ profile, isNewBusiness }) {
    const rating = profile.reviews.averageRating;
    const count = profile.reviews.totalCount;
    if (rating === null || count === null) {
      return createGbpFinding({
        id: "trust.review_quality",
        category: "trust_authority",
        title: "Review quality signal",
        status: "insufficient_data",
        summary: "Rating or review count was not observed.",
        whyItMatters:
          "Trust scoring needs both volume and rating. Overlaps Reviews category; here the question is whether a stranger would trust the score.",
        recommendation: "Refresh review aggregates.",
        evidence: { averageRating: rating, totalCount: count },
      });
    }

    if (count === 0) {
      return createGbpFinding({
        id: "trust.review_quality",
        category: "trust_authority",
        title: "Review quality signal",
        status: isNewBusiness ? "warning" : "fail",
        severity: isNewBusiness ? "low" : "high",
        summary: isNewBusiness
          ? "New profile has no reviews to support a trust signal yet."
          : "No reviews, so there is no public reputation to inspect.",
        whyItMatters:
          "Customers often treat a blank review card as unknown risk. New businesses are not expected to look established.",
        recommendation: "Collect honest reviews from completed customers.",
        evidence: { totalCount: 0, isNewBusiness },
      });
    }

    const enoughVolume =
      isNewBusiness || count >= THRESHOLDS.reviewCountModest;
    if (rating >= THRESHOLDS.averageRatingPass && enoughVolume) {
      return createGbpFinding({
        id: "trust.review_quality",
        category: "trust_authority",
        title: "Review quality signal",
        status: "pass",
        summary: isNewBusiness
          ? `${rating.toFixed(1)} average across ${count} early review(s). A strong start, not established authority.`
          : `${rating.toFixed(1)} average across ${count} review(s).`,
        whyItMatters: isNewBusiness
          ? "Early ratings can look excellent while the listing is still new. Optimization score and maturity are separate."
          : "A solid average with some volume is a customer-trust cue. Same inputs as Reviews; this rule combines them.",
        recommendation: isNewBusiness
          ? "Keep collecting honest reviews. Do not present this as a long-standing reputation."
          : "Maintain the service quality behind the rating.",
        evidence: { averageRating: rating, totalCount: count, isNewBusiness },
      });
    }

    if (rating >= THRESHOLDS.averageRatingWarning) {
      return createGbpFinding({
        id: "trust.review_quality",
        category: "trust_authority",
        title: "Review quality signal",
        status: "warning",
        summary: `${rating.toFixed(1)} average across ${count} review(s) — mixed trust signal.`,
        whyItMatters: "The rating or volume is not strong enough to look clearly established.",
        recommendation: "Improve weak service themes and keep collecting reviews.",
        evidence: { averageRating: rating, totalCount: count },
      });
    }

    return createGbpFinding({
      id: "trust.review_quality",
      category: "trust_authority",
      title: "Review quality signal",
      status: "fail",
      summary: `${rating.toFixed(1)} average across ${count} review(s).`,
      whyItMatters: "A weak public rating is a trust problem for new customers.",
      recommendation: "Address repeat complaints before asking for more reviews.",
      evidence: { averageRating: rating, totalCount: count },
    });
  },
};

export const reviewRecencyTrustRule: GbpAuditRule = {
  id: "trust.review_recency",
  category: "trust_authority",
  title: "Review recency (trust)",
  evaluate({ profile, asOf, isNewBusiness }) {
    const latest = deriveMostRecentReviewAt(profile);
    const count = profile.reviews.totalCount ?? 0;

    if (count === 0) {
      return createGbpFinding({
        id: "trust.review_recency",
        category: "trust_authority",
        title: "Review recency (trust)",
        status: "not_applicable",
        summary: "No reviews to date.",
        whyItMatters:
          "Recency trust is skipped when there is no history. Avoids stacking with review-count failures.",
        recommendation: "Collect the first reviews.",
        evidence: { totalCount: 0 },
      });
    }

    if (!latest) {
      return createGbpFinding({
        id: "trust.review_recency",
        category: "trust_authority",
        title: "Review recency (trust)",
        status: "insufficient_data",
        summary: "Review dates were not observed.",
        whyItMatters:
          "Overlaps Reviews → recent activity. Trust uses the same date when available.",
        recommendation: "Sync review dates.",
        evidence: { mostRecentReviewAt: null },
      });
    }

    const age = daysSince(latest, asOf);
    if (age <= THRESHOLDS.recentReviewDaysPass) {
      return createGbpFinding({
        id: "trust.review_recency",
        category: "trust_authority",
        title: "Review recency (trust)",
        status: "pass",
        summary: isNewBusiness
          ? `Latest review ${age} day(s) ago on a new listing. Recency here reflects a short history, not long-running authority.`
          : `Latest review ${age} day(s) ago.`,
        whyItMatters:
          "Primary recency scoring lives in Reviews. This is a lighter trust echo of the same date, not a second full penalty.",
        recommendation: isNewBusiness
          ? "Keep collecting reviews as the listing ages."
          : "Keep the request habit going.",
        evidence: { daysSinceReview: age, isNewBusiness },
      });
    }

    return createGbpFinding({
      id: "trust.review_recency",
      category: "trust_authority",
      title: "Review recency (trust)",
      status: isNewBusiness ? "warning" : "warning",
      severity: "medium",
      summary: `Latest review ${age} day(s) ago.`,
      whyItMatters: "Older reviews can look stale even when the average is high.",
      recommendation: "Ask recent customers to review the current experience.",
      evidence: { daysSinceReview: age, isNewBusiness },
    });
  },
};

export const ownerEngagementTrustRule: GbpAuditRule = {
  id: "trust.owner_engagement",
  category: "trust_authority",
  title: "Owner engagement",
  evaluate({ profile }) {
    const count = profile.reviews.totalCount;
    if (!count) {
      return createGbpFinding({
        id: "trust.owner_engagement",
        category: "trust_authority",
        title: "Owner engagement",
        status: "not_applicable",
        summary: "No reviews to engage with.",
        whyItMatters: "Engagement is skipped without a review set.",
        recommendation: "Reply as reviews arrive.",
        evidence: { totalCount: count },
      });
    }

    const responses = deriveOwnerResponseCount(profile);
    if (responses === null) {
      return createGbpFinding({
        id: "trust.owner_engagement",
        category: "trust_authority",
        title: "Owner engagement",
        status: "insufficient_data",
        summary: "Owner replies were not observed.",
        whyItMatters:
          "Overlaps Reviews → response rate. Trust asks whether the owner appears present.",
        recommendation: "Sync review responses when available.",
        evidence: { ownerResponseCount: null },
      });
    }

    const rate = responses / count;
    if (rate >= THRESHOLDS.ownerResponseRateWarning) {
      return createGbpFinding({
        id: "trust.owner_engagement",
        category: "trust_authority",
        title: "Owner engagement",
        status: "pass",
        summary: `Owner replies cover ${Math.round(rate * 100)}% of reviews.`,
        whyItMatters: "Visible replies are a credibility cue for other customers.",
        recommendation: "Continue responding, especially to critical reviews.",
        evidence: { ratePct: Math.round(rate * 100) },
      });
    }

    return createGbpFinding({
      id: "trust.owner_engagement",
      category: "trust_authority",
      title: "Owner engagement",
      status: "fail",
      summary: `Owner replies cover ${Math.round(rate * 100)}% of reviews.`,
      whyItMatters: "A silent owner can look inattentive next to unanswered reviews.",
      recommendation: "Reply to the backlog, newest first.",
      evidence: { ratePct: Math.round(rate * 100) },
    });
  },
};

export const profileCompletenessTrustRule: GbpAuditRule = {
  id: "trust.profile_completeness",
  category: "trust_authority",
  title: "Profile completeness",
  evaluate({ profile }) {
    const checks: Array<[string, boolean | null]> = [
      ["name", hasText(profile.identity.name)],
      [
        "primaryCategory",
        profile.identity.primaryCategory === null
          ? null
          : hasText(profile.identity.primaryCategory),
      ],
      [
        "description",
        profile.identity.description === null
          ? null
          : hasText(profile.identity.description),
      ],
      [
        "phone",
        profile.identity.phone === null ? null : hasText(profile.identity.phone),
      ],
      [
        "website",
        profile.identity.websiteUrl === null
          ? null
          : hasText(profile.identity.websiteUrl),
      ],
      [
        "hours",
        profile.configuration.regularHours === null
          ? null
          : hasOpenHours(profile.configuration.regularHours),
      ],
      ["logo", profile.media.logoPresent],
      ["cover", profile.media.coverPhotoPresent],
    ];

    if (profile.configuration.locationType !== "STOREFRONT") {
      checks.push(["serviceAreas", profile.configuration.serviceAreas.length > 0]);
    }

    const known = checks.filter(([, value]) => value !== null);
    if (known.length === 0) {
      return createGbpFinding({
        id: "trust.profile_completeness",
        category: "trust_authority",
        title: "Profile completeness",
        status: "insufficient_data",
        summary: "Not enough known fields to compute completeness.",
        whyItMatters:
          "This composite uses identity fields also scored in Profile Optimization. Trust asks how complete the card looks overall.",
        recommendation: "Fill the snapshot before scoring completeness.",
        evidence: { knownFields: 0 },
      });
    }

    const filled = known.filter(([, value]) => value === true).length;
    const ratio = filled / known.length;
    const pct = Math.round(ratio * 100);

    if (ratio >= THRESHOLDS.profileCompletenessPass) {
      return createGbpFinding({
        id: "trust.profile_completeness",
        category: "trust_authority",
        title: "Profile completeness",
        status: "pass",
        summary: `${pct}% of known core fields are filled.`,
        whyItMatters: "A complete card looks more legitimate than a half-empty one.",
        recommendation: "Fill remaining gaps when they exist.",
        evidence: { filled, known: known.length, completenessPct: pct },
      });
    }

    if (ratio >= THRESHOLDS.profileCompletenessWarning) {
      return createGbpFinding({
        id: "trust.profile_completeness",
        category: "trust_authority",
        title: "Profile completeness",
        status: "warning",
        summary: `${pct}% of known core fields are filled.`,
        whyItMatters: "Several core fields are still empty, which weakens first impression.",
        recommendation: "Complete hours, media, and contact fields first.",
        evidence: { filled, known: known.length, completenessPct: pct },
      });
    }

    return createGbpFinding({
      id: "trust.profile_completeness",
      category: "trust_authority",
      title: "Profile completeness",
      status: "fail",
      summary: `${pct}% of known core fields are filled.`,
      whyItMatters: "A sparse profile is harder to trust or contact.",
      recommendation: "Work through the Profile Optimization findings in priority order.",
      evidence: { filled, known: known.length, completenessPct: pct },
    });
  },
};

export const mediaPresenceTrustRule: GbpAuditRule = {
  id: "trust.media_presence",
  category: "trust_authority",
  title: "Media presence",
  evaluate({ profile }) {
    const { photoCount, logoPresent, coverPhotoPresent } = profile.media;
    if (photoCount === null && logoPresent === null && coverPhotoPresent === null) {
      return createGbpFinding({
        id: "trust.media_presence",
        category: "trust_authority",
        title: "Media presence",
        status: "insufficient_data",
        summary: "No media fields were observed.",
        whyItMatters:
          "Overlaps Profile photo/logo/cover rules. Trust asks whether the profile looks visually established.",
        recommendation: "Sync media when APIs are available.",
        evidence: { photoCount, logoPresent, coverPhotoPresent },
      });
    }

    const photosOk =
      photoCount !== null && photoCount >= THRESHOLDS.photoCountWarning;
    const brandingOk = logoPresent === true || coverPhotoPresent === true;

    if (photosOk && brandingOk) {
      return createGbpFinding({
        id: "trust.media_presence",
        category: "trust_authority",
        title: "Media presence",
        status: "pass",
        summary: "Photos and branding media are present.",
        whyItMatters: "Visual presence supports a legitimate-looking listing.",
        recommendation: "Keep adding recent work photos.",
        evidence: { photoCount, logoPresent, coverPhotoPresent },
      });
    }

    if (photosOk || brandingOk) {
      return createGbpFinding({
        id: "trust.media_presence",
        category: "trust_authority",
        title: "Media presence",
        status: "warning",
        summary: "Some visual media is present, but the set is incomplete.",
        whyItMatters: "A logo without photos (or the reverse) still looks unfinished.",
        recommendation: "Add the missing logo, cover, or additional photos.",
        evidence: { photoCount, logoPresent, coverPhotoPresent },
      });
    }

    return createGbpFinding({
      id: "trust.media_presence",
      category: "trust_authority",
      title: "Media presence",
      status: "fail",
      summary: "Little or no visual media is present.",
      whyItMatters: "Empty galleries make it harder for a stranger to trust the listing.",
      recommendation: "Upload a logo, cover, and a few real photos of the work.",
      evidence: { photoCount, logoPresent, coverPhotoPresent },
    });
  },
};

export const trustRules: GbpAuditRule[] = [
  reviewQualityTrustRule,
  reviewRecencyTrustRule,
  ownerEngagementTrustRule,
  profileCompletenessTrustRule,
  mediaPresenceTrustRule,
];
