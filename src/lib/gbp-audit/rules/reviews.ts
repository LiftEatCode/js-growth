import { THRESHOLDS } from "../constants";
import { createGbpFinding } from "../engine";
import type { GbpAuditFinding, GbpAuditRule, GbpProfileReview } from "../types";
import {
  deriveMostRecentReviewAt,
  deriveOwnerResponseCount,
  daysSince,
} from "../utils";

export const reviewCountRule: GbpAuditRule = {
  id: "reviews.count",
  category: "reviews_reputation",
  title: "Review count",
  evaluate({ profile, isNewBusiness }) {
    const count = profile.reviews.totalCount;
    if (count === null) {
      return createGbpFinding({
        id: "reviews.count",
        category: "reviews_reputation",
        title: "Review count",
        status: "insufficient_data",
        summary: "Review count was not observed.",
        whyItMatters:
          "Review volume is a reputation signal for customers. Unknown volume is not scored as zero reviews.",
        recommendation: "Refresh review aggregates when they are available.",
        evidence: { totalCount: null, isNewBusiness },
      });
    }

    if (isNewBusiness) {
      if (count === 0) {
        return createGbpFinding({
          id: "reviews.count",
          category: "reviews_reputation",
          title: "Review count",
          status: "warning",
          severity: "low",
          summary: "This new business does not have reviews yet.",
          whyItMatters:
            "New profiles rarely have a review history. Treating that as a mature-profile failure would be unfair.",
          recommendation:
            "Ask recent customers for honest reviews. Do not expect a large volume in the first months.",
          evidence: { totalCount: 0, isNewBusiness: true },
        });
      }

      return createGbpFinding({
        id: "reviews.count",
        category: "reviews_reputation",
        title: "Review count",
        status: "pass",
        summary: `This new listing has ${count} review(s). That is a start, not an established reputation.`,
        whyItMatters:
          "New businesses should not be failed for lacking years of reviews. Maturity is reported separately from this optimization check.",
        recommendation:
          "Keep asking recent customers for honest reviews. Do not treat a handful of early reviews as marketplace authority.",
        evidence: { totalCount: count, isNewBusiness: true },
      });
    }

    if (count === 0) {
      return createGbpFinding({
        id: "reviews.count",
        category: "reviews_reputation",
        title: "Review count",
        status: "fail",
        summary: "The profile has no reviews.",
        whyItMatters:
          "Customers often hesitate when they cannot see anyone else's experience. This is a reputation gap, not a ranking guarantee.",
        recommendation:
          "Ask completed customers to leave a review on the Google profile. There is no universal “enough reviews” number for every industry.",
        evidence: { totalCount: 0, isNewBusiness: false },
      });
    }

    if (count < THRESHOLDS.reviewCountModest) {
      return createGbpFinding({
        id: "reviews.count",
        category: "reviews_reputation",
        title: "Review count",
        status: "warning",
        summary: `${count} review(s) — below the modest volume threshold of ${THRESHOLDS.reviewCountModest}.`,
        whyItMatters:
          "A handful of reviews is a start. Thresholds are configurable heuristics, not industry-universal targets.",
        recommendation:
          "Continue collecting reviews after good jobs. Compare against local peers rather than a single magic number.",
        evidence: { totalCount: count },
      });
    }

    return createGbpFinding({
      id: "reviews.count",
      category: "reviews_reputation",
      title: "Review count",
      status: "pass",
      summary: `${count} reviews on the profile.`,
      whyItMatters: "There is enough volume for a customer to scan recent experiences.",
      recommendation: "Keep a steady request habit so volume does not stall.",
      evidence: { totalCount: count },
    });
  },
};

export const averageRatingRule: GbpAuditRule = {
  id: "reviews.average_rating",
  category: "reviews_reputation",
  title: "Average rating",
  evaluate({ profile }) {
    const rating = profile.reviews.averageRating;
    const count = profile.reviews.totalCount;
    if (rating === null || count === 0) {
      const status =
        count === 0 ? "not_applicable" : "insufficient_data";
      return createGbpFinding({
        id: "reviews.average_rating",
        category: "reviews_reputation",
        title: "Average rating",
        status,
        summary:
          count === 0
            ? "No reviews, so average rating is not scored."
            : "Average rating was not observed.",
        whyItMatters:
          "Rating is only meaningful when reviews exist. Missing data is not treated as a low score.",
        recommendation:
          count === 0
            ? "Collect a few reviews before judging rating quality."
            : "Refresh review aggregates.",
        evidence: { averageRating: rating, totalCount: count },
      });
    }

    if (rating < THRESHOLDS.averageRatingWarning) {
      return createGbpFinding({
        id: "reviews.average_rating",
        category: "reviews_reputation",
        title: "Average rating",
        status: "fail",
        summary: `Average rating is ${rating.toFixed(1)}.`,
        whyItMatters:
          "A low average is a customer-trust problem. Improving service and responding to feedback matters more than chasing a number.",
        recommendation:
          "Read recent negative reviews, fix operational issues, and reply professionally. Do not solicit fake reviews.",
        evidence: { averageRating: rating, totalCount: count },
      });
    }

    if (rating < THRESHOLDS.averageRatingPass) {
      return createGbpFinding({
        id: "reviews.average_rating",
        category: "reviews_reputation",
        title: "Average rating",
        status: "warning",
        summary: `Average rating is ${rating.toFixed(1)}.`,
        whyItMatters:
          "The rating is acceptable but below the stronger band used in this heuristic.",
        recommendation:
          "Look for repeat complaints and close those gaps. Ask happy customers to share their experience.",
        evidence: { averageRating: rating, totalCount: count },
      });
    }

    return createGbpFinding({
      id: "reviews.average_rating",
      category: "reviews_reputation",
      title: "Average rating",
      status: "pass",
      summary: `Average rating is ${rating.toFixed(1)}.`,
      whyItMatters: "The published average looks solid for customer trust.",
      recommendation: "Protect the experience that produced this rating.",
      evidence: { averageRating: rating, totalCount: count },
    });
  },
};

export const recentReviewsRule: GbpAuditRule = {
  id: "reviews.recent_activity",
  category: "reviews_reputation",
  title: "Recent review activity",
  evaluate({ profile, asOf, isNewBusiness }) {
    const count = profile.reviews.totalCount;
    const latest = deriveMostRecentReviewAt(profile);

    if (count === 0) {
      return createGbpFinding({
        id: "reviews.recent_activity",
        category: "reviews_reputation",
        title: "Recent review activity",
        status: isNewBusiness ? "warning" : "fail",
        severity: isNewBusiness ? "low" : "high",
        summary: isNewBusiness
          ? "No reviews yet on this new profile."
          : "There are no reviews, so there is no recent review activity.",
        whyItMatters:
          "Ongoing reviews show the business is still serving customers. New profiles are not expected to have a history.",
        recommendation: "Request reviews after completed work.",
        evidence: { totalCount: 0, mostRecentReviewAt: null, isNewBusiness },
      });
    }

    if (!latest) {
      return createGbpFinding({
        id: "reviews.recent_activity",
        category: "reviews_reputation",
        title: "Recent review activity",
        status: "insufficient_data",
        summary:
          "Review volume exists, but no review dates were available to judge recency.",
        whyItMatters:
          "Aggregates without dates cannot support a recency score. That is missing data, not a stale profile.",
        recommendation:
          "Sync individual reviews or a last-review timestamp when the API allows it.",
        evidence: { totalCount: count, mostRecentReviewAt: null },
      });
    }

    const age = daysSince(latest, asOf);
    if (age <= THRESHOLDS.recentReviewDaysPass) {
      return createGbpFinding({
        id: "reviews.recent_activity",
        category: "reviews_reputation",
        title: "Recent review activity",
        status: "pass",
        summary: `Most recent review was ${age} day(s) ago.`,
        whyItMatters: "Recent reviews suggest the reputation is still being updated.",
        recommendation: "Keep requesting reviews after new jobs.",
        evidence: { mostRecentReviewAt: latest, daysSinceReview: age },
      });
    }

    if (age <= THRESHOLDS.recentReviewDaysWarning) {
      return createGbpFinding({
        id: "reviews.recent_activity",
        category: "reviews_reputation",
        title: "Recent review activity",
        status: "warning",
        summary: `Most recent review was ${age} day(s) ago.`,
        whyItMatters: "Review flow has slowed. Customers may wonder if the business is still active.",
        recommendation: "Ask recent customers for reviews to refresh the timeline.",
        evidence: { mostRecentReviewAt: latest, daysSinceReview: age },
      });
    }

    return createGbpFinding({
      id: "reviews.recent_activity",
      category: "reviews_reputation",
      title: "Recent review activity",
      status: "fail",
      summary: `Most recent review was ${age} day(s) ago.`,
      whyItMatters:
        "A long gap can look like an inactive business even when operations continue.",
      recommendation: "Restart a simple review-request process after completed jobs.",
      evidence: { mostRecentReviewAt: latest, daysSinceReview: age },
    });
  },
};

export const ownerResponseRateRule: GbpAuditRule = {
  id: "reviews.owner_response_rate",
  category: "reviews_reputation",
  title: "Owner response rate",
  evaluate({ profile }) {
    const count = profile.reviews.totalCount;
    if (count === null) {
      return createGbpFinding({
        id: "reviews.owner_response_rate",
        category: "reviews_reputation",
        title: "Owner response rate",
        status: "insufficient_data",
        summary: "Review count was not observed, so response rate cannot be scored.",
        whyItMatters: "Response rate needs a known review total.",
        recommendation: "Refresh review aggregates.",
        evidence: { totalCount: null },
      });
    }

    if (count === 0) {
      return createGbpFinding({
        id: "reviews.owner_response_rate",
        category: "reviews_reputation",
        title: "Owner response rate",
        status: "not_applicable",
        summary: "No reviews to respond to.",
        whyItMatters: "Response rate is only scored when reviews exist.",
        recommendation: "Respond as reviews arrive.",
        evidence: { totalCount: 0 },
      });
    }

    const responses = deriveOwnerResponseCount(profile);
    if (responses === null) {
      return createGbpFinding({
        id: "reviews.owner_response_rate",
        category: "reviews_reputation",
        title: "Owner response rate",
        status: "insufficient_data",
        summary: "Owner response counts were not observed.",
        whyItMatters:
          "Current GBP read integration may not include responses. Unknown engagement is not a fail.",
        recommendation: "Sync review responses when that API is available.",
        evidence: { ownerResponseCount: null, totalCount: count },
      });
    }

    const rate = count > 0 ? responses / count : 0;
    const pct = Math.round(rate * 100);

    if (rate >= THRESHOLDS.ownerResponseRatePass) {
      return createGbpFinding({
        id: "reviews.owner_response_rate",
        category: "reviews_reputation",
        title: "Owner response rate",
        status: "pass",
        summary: `Owner has responded to ${pct}% of reviews.`,
        whyItMatters:
          "Replies show the owner is paying attention. This is a trust/process signal, not a documented ranking switch.",
        recommendation: "Keep responding to new reviews, including simple thank-yous.",
        evidence: { ownerResponseCount: responses, totalCount: count, ratePct: pct },
      });
    }

    if (rate >= THRESHOLDS.ownerResponseRateWarning) {
      return createGbpFinding({
        id: "reviews.owner_response_rate",
        category: "reviews_reputation",
        title: "Owner response rate",
        status: "warning",
        summary: `Owner has responded to ${pct}% of reviews.`,
        whyItMatters: "Partial engagement still leaves many reviews unanswered.",
        recommendation: "Reply to the unanswered reviews, starting with the newest.",
        evidence: { ownerResponseCount: responses, totalCount: count, ratePct: pct },
      });
    }

    return createGbpFinding({
      id: "reviews.owner_response_rate",
      category: "reviews_reputation",
      title: "Owner response rate",
      status: "fail",
      summary: `Owner has responded to ${pct}% of reviews.`,
      whyItMatters:
        "Unanswered reviews can look like the business is not monitoring the profile.",
      recommendation: "Set a weekly reminder to reply to new Google reviews.",
      evidence: { ownerResponseCount: responses, totalCount: count, ratePct: pct },
    });
  },
};

function recentNegativeReviews(
  reviews: GbpProfileReview[],
  asOf: string,
): GbpProfileReview[] {
  return reviews.filter((review) => {
    if (review.rating > THRESHOLDS.negativeReviewRatingMax) {
      return false;
    }
    if (!review.publishedAt) {
      return true;
    }
    return daysSince(review.publishedAt, asOf) <= THRESHOLDS.negativeReviewLookbackDays;
  });
}

export const negativeResponsesRule: GbpAuditRule = {
  id: "reviews.negative_responses",
  category: "reviews_reputation",
  title: "Responses to recent negative reviews",
  evaluate({ profile, asOf }): GbpAuditFinding {
    if (profile.reviews.reviews.length === 0) {
      if ((profile.reviews.totalCount ?? 0) > 0) {
        return createGbpFinding({
          id: "reviews.negative_responses",
          category: "reviews_reputation",
          title: "Responses to recent negative reviews",
          status: "insufficient_data",
          summary:
            "Review aggregates exist, but individual reviews were not supplied.",
          whyItMatters:
            "Negative-review replies need per-review data. Missing lists are not scored as ignored complaints.",
          recommendation: "Sync individual reviews when the API allows it.",
          evidence: { individualReviewCount: 0, totalCount: profile.reviews.totalCount },
        });
      }

      return createGbpFinding({
        id: "reviews.negative_responses",
        category: "reviews_reputation",
        title: "Responses to recent negative reviews",
        status: "not_applicable",
        summary: "No reviews available to inspect for negative ratings.",
        whyItMatters: "There is nothing to respond to yet.",
        recommendation: "Reply if a critical review arrives.",
        evidence: { individualReviewCount: 0 },
      });
    }

    const negatives = recentNegativeReviews(profile.reviews.reviews, asOf);
    if (negatives.length === 0) {
      return createGbpFinding({
        id: "reviews.negative_responses",
        category: "reviews_reputation",
        title: "Responses to recent negative reviews",
        status: "pass",
        summary: "No recent low-star reviews in the lookback window.",
        whyItMatters: "There are no recent critical reviews that need a public reply.",
        recommendation: "Keep monitoring for new low-star reviews.",
        evidence: {
          recentNegativeCount: 0,
          lookbackDays: THRESHOLDS.negativeReviewLookbackDays,
        },
      });
    }

    const unanswered = negatives.filter((review) => !review.hasOwnerResponse);
    if (unanswered.length === 0) {
      return createGbpFinding({
        id: "reviews.negative_responses",
        category: "reviews_reputation",
        title: "Responses to recent negative reviews",
        status: "pass",
        summary: `All ${negatives.length} recent low-star review(s) have an owner reply.`,
        whyItMatters:
          "A public reply shows other customers that problems are acknowledged.",
        recommendation: "Keep replies calm, specific, and invitation-to-resolve.",
        evidence: { recentNegativeCount: negatives.length, unanswered: 0 },
      });
    }

    return createGbpFinding({
      id: "reviews.negative_responses",
      category: "reviews_reputation",
      title: "Responses to recent negative reviews",
      status: "fail",
      summary: `${unanswered.length} of ${negatives.length} recent low-star review(s) have no owner reply.`,
      whyItMatters:
        "Unanswered criticism is often the first thing a new customer reads.",
      recommendation:
        "Reply to each low-star review: acknowledge, explain next steps, and take details offline.",
      evidence: {
        recentNegativeCount: negatives.length,
        unanswered: unanswered.length,
      },
    });
  },
};

export const reviewRules: GbpAuditRule[] = [
  reviewCountRule,
  averageRatingRule,
  recentReviewsRule,
  ownerResponseRateRule,
  negativeResponsesRule,
];
