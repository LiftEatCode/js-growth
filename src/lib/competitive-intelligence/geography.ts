import { geographicBandForDistance, haversineDistanceMiles } from "./distance";
import {
  citiesMatch,
  resolveComparableLocation,
  statesMatch,
} from "./location-label";
import type { CompetitiveProfile, CompetitorCandidate } from "./types";

export type GeographyMode =
  | "EXACT_DISTANCE"
  | "SAME_CITY_FALLBACK"
  | "SAME_REGION_FALLBACK"
  | "UNKNOWN";

export type GeographyBand =
  | "very_near"
  | "near"
  | "regional"
  | "distant"
  | "same_city"
  | "same_region"
  | "unknown";

export interface GeographyEvidence {
  mode: GeographyMode;
  distanceMiles: number | null;
  radiusMiles: number;
  band: GeographyBand;
  score: number;
}

export interface GeographySortInput {
  validationScore: number;
  distanceMiles: number | null;
  geographyMode: GeographyMode;
  businessName: string;
  providerBusinessId: string;
}

function readCoordinate(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);

    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

export function readCoordinates(
  latitude: number | null | undefined,
  longitude: number | null | undefined,
): { latitude: number; longitude: number } | null {
  const lat = readCoordinate(latitude);
  const lng = readCoordinate(longitude);

  if (lat === null || lng === null) {
    return null;
  }

  return { latitude: lat, longitude: lng };
}

export function resolveCandidateDistanceMiles(
  profile: Pick<
    CompetitiveProfile,
    "latitude" | "longitude" | "city" | "state" | "radiusMiles"
  >,
  candidate: Pick<
    CompetitorCandidate,
    "latitude" | "longitude" | "city" | "state"
  >,
): number | null {
  const target = readCoordinates(profile.latitude, profile.longitude);
  const point = readCoordinates(candidate.latitude, candidate.longitude);

  if (!target || !point) {
    return null;
  }

  return haversineDistanceMiles(target, point);
}

export function scoreGeography(
  profile: Pick<
    CompetitiveProfile,
    | "latitude"
    | "longitude"
    | "city"
    | "state"
    | "radiusMiles"
    | "locationLabel"
  >,
  candidate: Pick<
    CompetitorCandidate,
    "latitude" | "longitude" | "city" | "state" | "formattedAddress"
  >,
  distanceMiles: number | null,
): GeographyEvidence {
  const radiusMiles = profile.radiusMiles;

  if (distanceMiles !== null) {
    const band = geographicBandForDistance(distanceMiles, radiusMiles);

    switch (band) {
      case "very_near":
        return {
          mode: "EXACT_DISTANCE",
          distanceMiles,
          radiusMiles,
          band,
          score: 25,
        };
      case "near":
        return {
          mode: "EXACT_DISTANCE",
          distanceMiles,
          radiusMiles,
          band,
          score: 20,
        };
      case "regional":
        return {
          mode: "EXACT_DISTANCE",
          distanceMiles,
          radiusMiles,
          band,
          score: 10,
        };
      case "distant":
        return {
          mode: "EXACT_DISTANCE",
          distanceMiles,
          radiusMiles,
          band,
          score: 0,
        };
      default:
        break;
    }
  }

  const target = resolveComparableLocation({
    city: profile.city,
    state: profile.state,
    locationLabel: profile.locationLabel,
  });
  const point = resolveComparableLocation({
    city: candidate.city,
    state: candidate.state,
    formattedAddress: candidate.formattedAddress,
  });

  if (citiesMatch(target.city, point.city) && statesMatch(target.state, point.state)) {
    return {
      mode: "SAME_CITY_FALLBACK",
      distanceMiles: null,
      radiusMiles,
      band: "same_city",
      score: 14,
    };
  }

  if (statesMatch(target.state, point.state)) {
    return {
      mode: "SAME_REGION_FALLBACK",
      distanceMiles: null,
      radiusMiles,
      band: "same_region",
      score: 10,
    };
  }

  return {
    mode: "UNKNOWN",
    distanceMiles: null,
    radiusMiles,
    band: "unknown",
    score: 8,
  };
}

export function geographyRejectionReason(
  geography: GeographyEvidence,
): string | null {
  if (geography.mode === "EXACT_DISTANCE" && geography.band === "distant") {
    return "outside_market";
  }

  return null;
}

export function geographySortRank(mode: GeographyMode): number {
  switch (mode) {
    case "EXACT_DISTANCE":
      return 0;
    case "SAME_CITY_FALLBACK":
      return 1;
    case "SAME_REGION_FALLBACK":
      return 2;
    default:
      return 3;
  }
}

export function compareGeographyForRanking(
  left: GeographySortInput,
  right: GeographySortInput,
): number {
  if (right.validationScore !== left.validationScore) {
    return right.validationScore - left.validationScore;
  }

  const leftRank = geographySortRank(left.geographyMode);
  const rightRank = geographySortRank(right.geographyMode);

  if (leftRank !== rightRank) {
    return leftRank - rightRank;
  }

  const leftDistance = left.distanceMiles ?? Number.POSITIVE_INFINITY;
  const rightDistance = right.distanceMiles ?? Number.POSITIVE_INFINITY;

  if (leftDistance !== rightDistance) {
    return leftDistance - rightDistance;
  }

  const name = left.businessName.localeCompare(right.businessName);

  if (name !== 0) {
    return name;
  }

  return left.providerBusinessId.localeCompare(right.providerBusinessId);
}

export function formatCompetitorDistanceDisplay(input: {
  distanceMiles: number | null;
  geographyMode: GeographyMode;
  geographyBand: GeographyBand;
}): string {
  if (input.geographyMode === "EXACT_DISTANCE" && input.distanceMiles !== null) {
    return `${input.distanceMiles} mi`;
  }

  if (input.geographyMode === "SAME_CITY_FALLBACK") {
    return "Same city";
  }

  if (input.geographyMode === "SAME_REGION_FALLBACK") {
    return "Same region";
  }

  return "—";
}
