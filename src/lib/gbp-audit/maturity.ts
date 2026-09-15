import { MATURITY_THRESHOLDS } from "./constants";
import type {
  BusinessProfileData,
  GbpProfileMaturity,
  GbpProfileMaturityLevel,
} from "./types";
import { daysSince, deriveOldestReviewAt } from "./utils";

function fromOpeningDate(
  ageDays: number,
): { level: GbpProfileMaturityLevel; note: string } {
  if (ageDays <= MATURITY_THRESHOLDS.newDays) {
    return {
      level: "new",
      note: `Opening date is ${ageDays} day(s) ago (≤ ${MATURITY_THRESHOLDS.newDays}).`,
    };
  }
  if (ageDays <= MATURITY_THRESHOLDS.developingDays) {
    return {
      level: "developing",
      note: `Opening date is ${ageDays} day(s) ago (≤ ${MATURITY_THRESHOLDS.developingDays}).`,
    };
  }
  if (ageDays < MATURITY_THRESHOLDS.establishedDays) {
    return {
      level: "established",
      note: `Opening date is ${ageDays} day(s) ago (under ${MATURITY_THRESHOLDS.establishedDays} days / ~5 years).`,
    };
  }
  return {
    level: "mature",
    note: `Opening date is ${ageDays} day(s) ago (≥ ~5 years).`,
  };
}

/**
 * Stage of the listing, not quality of optimization.
 * Does not change overallScore.
 */
export function classifyMaturity(
  profile: BusinessProfileData,
  asOf: string,
): GbpProfileMaturity {
  const evidence: string[] = [];
  const openingDate = profile.configuration.openingDate;

  if (openingDate) {
    const ageDays = Math.max(0, daysSince(openingDate, asOf));
    const classified = fromOpeningDate(ageDays);
    evidence.push(classified.note);
    if (profile.reviews.totalCount !== null) {
      evidence.push(`Review count observed: ${profile.reviews.totalCount}.`);
    }
    return { level: classified.level, evidence };
  }

  evidence.push("Opening date was not supplied.");

  const count = profile.reviews.totalCount;
  const oldest = deriveOldestReviewAt(profile);

  if (count === null && !oldest) {
    evidence.push("No review history available to infer stage.");
    return { level: "unknown", evidence };
  }

  if (count === 0) {
    evidence.push("Zero reviews and no opening date — could be new or neglected.");
    return { level: "unknown", evidence };
  }

  if (!oldest) {
    evidence.push(
      `Review count is ${count}, but no review dates were available. Age is not inferred.`,
    );
    return { level: "unknown", evidence };
  }

  const oldestAge = daysSince(oldest, asOf);
  evidence.push(`Oldest observed review is ${oldestAge} day(s) ago.`);
  if (count !== null) {
    evidence.push(`Review count observed: ${count}.`);
  }

  if (
    oldestAge >= MATURITY_THRESHOLDS.fallbackMatureOldestReviewDays &&
    (count ?? 0) >= MATURITY_THRESHOLDS.fallbackMatureMinReviews
  ) {
    return { level: "mature", evidence };
  }

  if (
    oldestAge >= MATURITY_THRESHOLDS.fallbackEstablishedOldestReviewDays &&
    (count ?? 0) >= MATURITY_THRESHOLDS.fallbackEstablishedMinReviews
  ) {
    return { level: "established", evidence };
  }

  if (oldestAge <= MATURITY_THRESHOLDS.newDays) {
    return { level: "developing", evidence };
  }

  return { level: "developing", evidence };
}
