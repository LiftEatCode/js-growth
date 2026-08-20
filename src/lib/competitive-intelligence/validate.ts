import { geographicBandForDistance } from "./distance";
import { normalizeBusinessIdentity } from "./normalize";
import type {
  CompetitiveProfile,
  CompetitorCandidate,
  CompetitorValidationEvidence,
  CompetitorValidationLabel,
  ValidatedCompetitorCandidate,
} from "./types";

const SUPPLIER_PATTERN =
  /\b(supply|supplier|wholesale|wholesaler|distributor|manufacturer|depot|home depot|lowe'?s|ferguson|grainger)\b/i;

const RETAILER_PATTERN =
  /\b(retail|store|warehouse|big box|appliance store)\b/i;

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function labelForScore(
  score: number,
  rejected: boolean,
): CompetitorValidationLabel {
  if (rejected) {
    return "REJECTED";
  }

  if (score >= 80) {
    return "STRONG";
  }

  if (score >= 60) {
    return "LIKELY";
  }

  if (score >= 40) {
    return "WEAK";
  }

  return "REJECTED";
}

export function validateCompetitorCandidate(
  candidate: CompetitorCandidate,
  profile: CompetitiveProfile,
): ValidatedCompetitorCandidate {
  const rejectionReasons: string[] = [];
  const sameHostname = Boolean(
    profile.hostname &&
      candidate.normalizedHostname &&
      profile.hostname === candidate.normalizedHostname,
  );
  const samePlaceId = Boolean(
    profile.sourceRef && candidate.providerBusinessId === profile.sourceRef,
  );

  if (sameHostname) {
    rejectionReasons.push("same_hostname");
  }

  if (samePlaceId) {
    rejectionReasons.push("same_place_id");
  }

  const matchedVerticals = candidate.normalizedVerticals.filter((vertical) =>
    profile.normalizedVerticals.includes(vertical),
  );
  const strongMatch = matchedVerticals.filter(
    (vertical) => vertical !== "HOME_SERVICES" && vertical !== "OTHER",
  );

  let verticalScore = 0;

  if (strongMatch.length > 0) {
    verticalScore = Math.min(40, 28 + strongMatch.length * 6);
  } else if (matchedVerticals.includes("HOME_SERVICES")) {
    verticalScore = 8;
  } else if (
    profile.normalizedVerticals.includes("OTHER") ||
    candidate.normalizedVerticals.includes("OTHER")
  ) {
    verticalScore = 4;
  }

  if (verticalScore === 0) {
    rejectionReasons.push("unrelated_vertical");
  }

  const combinedText = [
    candidate.businessName,
    candidate.primaryType ?? "",
  ].join(" ");

  if (SUPPLIER_PATTERN.test(combinedText)) {
    rejectionReasons.push("supplier");
  }

  if (RETAILER_PATTERN.test(combinedText)) {
    rejectionReasons.push("retailer");
  }

  const band = geographicBandForDistance(
    candidate.distanceMiles,
    profile.radiusMiles,
  );

  let geographicScore = 0;

  switch (band) {
    case "very_near":
      geographicScore = 25;
      break;
    case "near":
      geographicScore = 20;
      break;
    case "regional":
      geographicScore = 10;
      break;
    case "distant":
      geographicScore = 0;
      rejectionReasons.push("outside_market");
      break;
    default:
      geographicScore = 8;
  }

  const prospectName = normalizeBusinessIdentity(profile.businessName);
  const candidateName = normalizeBusinessIdentity(candidate.businessName);
  let serviceOverlapScore = 0;

  if (strongMatch.length > 0) {
    serviceOverlapScore += 12;
  }

  if (
    prospectName &&
    candidateName &&
    (candidateName.includes(prospectName.split(" ")[0] ?? "") === false)
  ) {
    serviceOverlapScore += matchedVerticals.length > 0 ? 3 : 0;
  }

  if (candidate.primaryType && strongMatch.length > 0) {
    serviceOverlapScore = Math.min(15, serviceOverlapScore + 3);
  }

  const hasWebsite = Boolean(candidate.website && candidate.normalizedHostname);
  const websiteScore = hasWebsite ? 10 : 0;
  const localServiceScore =
    candidate.city || candidate.state || candidate.latitude !== null ? 10 : 4;

  const rejected = rejectionReasons.length > 0;
  const rawScore = rejected
    ? 0
    : verticalScore +
      geographicScore +
      serviceOverlapScore +
      websiteScore +
      localServiceScore;
  const validationScore = clampScore(rawScore);
  const validationLabel = labelForScore(validationScore, rejected);

  const evidence: CompetitorValidationEvidence = {
    matchedVerticals,
    prospectVerticals: profile.normalizedVerticals,
    candidateVerticals: candidate.normalizedVerticals,
    verticalScore,
    distanceMiles: candidate.distanceMiles,
    geographicBand: band,
    geographicScore,
    serviceOverlapScore,
    hasWebsite,
    websiteScore,
    localServiceScore,
    sameHostname,
    samePlaceId,
    rejectionReasons,
  };

  return {
    ...candidate,
    validationScore,
    validationLabel,
    evidence,
    status: validationLabel === "REJECTED" ? "REJECTED" : "VALIDATED",
    isRecommended: false,
    competitorProspectId: null,
  };
}
