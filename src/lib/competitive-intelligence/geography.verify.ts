import { haversineDistanceMiles, geographicBandForDistance } from "./distance";
import { parseLocationLabel, resolveTargetLocation } from "./location-label";
import {
  compareGeographyForRanking,
  formatCompetitorDistanceDisplay,
  resolveCandidateDistanceMiles,
  scoreGeography,
} from "./geography";
import { normalizeCompetitorCandidate } from "./normalize";
import { googlePlaceIdVariants, normalizeGooglePlaceId, placeIdsMatch } from "./place-id";
import { profile as buildTestProfile, candidate as buildTestCandidate } from "./geography.test-fixtures";
import { validateCompetitorCandidate } from "./validate";
import { GOOGLE_PLACES_TEXT_SEARCH_FIELD_MASK } from "@/lib/prospecting/discovery/constants";
import type { CompetitiveProfile } from "./types";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function profile(overrides: Partial<CompetitiveProfile> = {}): CompetitiveProfile {
  return buildTestProfile(overrides);
}

function candidate(
  overrides: Partial<ReturnType<typeof buildTestCandidate>> &
    Pick<ReturnType<typeof buildTestCandidate>, "providerBusinessId" | "businessName">,
) {
  return buildTestCandidate(overrides);
}

const houston = { latitude: 29.7604, longitude: -95.3698 };
const spring = { latitude: 30.0799, longitude: -95.4172 };

const parsedLabel = parseLocationLabel("Spring, TX");
assert(parsedLabel.city === "Spring", "parses city from location label");
assert(parsedLabel.state === "TX", "parses state from location label");

const resolved = resolveTargetLocation({
  prospectCity: null,
  prospectState: null,
  prospectAddress: null,
  campaignCity: null,
  campaignState: null,
  campaignLocationLabel: "Spring, TX",
});
assert(resolved.city === "Spring", "resolveTargetLocation uses location label");
assert(resolved.state === "TX", "resolveTargetLocation state from label");

const distance = haversineDistanceMiles(houston, spring);
assert(distance > 20 && distance < 40, "haversine distance is within tolerance");

assert(
  haversineDistanceMiles(houston, spring) === distance,
  "haversine distance is deterministic",
);

assert(
  geographicBandForDistance(8, 25) === "very_near",
  "very near classification",
);
assert(geographicBandForDistance(20, 25) === "near", "near classification");
assert(geographicBandForDistance(40, 25) === "regional", "regional classification");
assert(
  geographicBandForDistance(60, 25) === "distant",
  ">2x radius is distant",
);

const exact = scoreGeography(
  profile({ latitude: houston.latitude, longitude: houston.longitude, radiusMiles: 25 }),
  candidate({
    providerBusinessId: "place-near",
    businessName: "Near Electric",
    latitude: spring.latitude,
    longitude: spring.longitude,
    city: "Spring",
    state: "TX",
  }),
  haversineDistanceMiles(houston, spring),
);
assert(exact.mode === "EXACT_DISTANCE", "exact distance mode");
assert(exact.score === 20, "near exact score for houston-to-spring distance");

const sameCity = scoreGeography(
  profile({ city: "Spring", state: "TX", latitude: null, longitude: null }),
  candidate({
    providerBusinessId: "place-city",
    businessName: "Bear Plumbing",
    city: "Spring",
    state: "TX",
    latitude: null,
    longitude: null,
  }),
  null,
);
assert(sameCity.mode === "SAME_CITY_FALLBACK", "same city fallback");
assert(sameCity.score === 14, "same city score is bounded below very near");
assert(sameCity.band === "same_city", "same city band");

const labelOnlySameCity = scoreGeography(
  profile({
    city: null,
    state: null,
    latitude: null,
    longitude: null,
    locationLabel: "Spring, TX",
  }),
  candidate({
    providerBusinessId: "place-label-city",
    businessName: "Local Plumbing",
    city: "Spring",
    state: "tx",
    latitude: null,
    longitude: null,
  }),
  null,
);
assert(
  labelOnlySameCity.mode === "SAME_CITY_FALLBACK",
  "location label supplies target city/state when profile fields are null",
);
assert(labelOnlySameCity.score === 14, "label-only same city still scores 14");

const addressOnlySameCity = scoreGeography(
  profile({
    city: null,
    state: null,
    latitude: null,
    longitude: null,
    locationLabel: "Spring, TX",
  }),
  candidate({
    providerBusinessId: "place-address-city",
    businessName: "Address Plumbing",
    city: null,
    state: null,
    formattedAddress: "Spring, TX",
    latitude: null,
    longitude: null,
  }),
  null,
);
assert(
  addressOnlySameCity.mode === "SAME_CITY_FALLBACK",
  "candidate formattedAddress Spring, TX cannot score UNKNOWN against Spring, TX",
);

const sameRegion = scoreGeography(
  profile({ city: "Spring", state: "TX", latitude: null, longitude: null }),
  candidate({
    providerBusinessId: "place-region",
    businessName: "Tomball Plumbing",
    city: "Tomball",
    state: "TX",
    latitude: null,
    longitude: null,
  }),
  null,
);
assert(sameRegion.mode === "SAME_REGION_FALLBACK", "same region fallback");
assert(sameRegion.score === 10, "same region score");

const unknown = scoreGeography(
  profile({ city: "Spring", state: "TX", latitude: null, longitude: null }),
  candidate({
    providerBusinessId: "place-unknown",
    businessName: "Far Plumbing",
    city: "Atlanta",
    state: "GA",
    latitude: null,
    longitude: null,
  }),
  null,
);
assert(unknown.mode === "UNKNOWN", "unknown geography when insufficient evidence");
assert(unknown.score === 8, "unknown score");

assert(
  compareGeographyForRanking(
    {
      validationScore: 77,
      distanceMiles: 3.2,
      geographyMode: "EXACT_DISTANCE",
      businessName: "A",
      providerBusinessId: "a",
    },
    {
      validationScore: 77,
      distanceMiles: null,
      geographyMode: "UNKNOWN",
      businessName: "C",
      providerBusinessId: "c",
    },
  ) < 0,
  "exact distance outranks unknown at same score",
);

const normalized = normalizeCompetitorCandidate(
  {
    provider: "GOOGLE_PLACES",
    providerBusinessId: "places/ChIJcandidate",
    businessName: "Candidate Electric",
    website: "https://candidate.example",
    formattedAddress: "Spring, TX",
    city: "Spring",
    state: "TX",
    phone: null,
    category: "electrician",
    latitude: spring.latitude,
    longitude: spring.longitude,
  },
  profile({
    latitude: houston.latitude,
    longitude: houston.longitude,
    city: "Spring",
    state: "TX",
  }),
);
assert(normalized.latitude === spring.latitude, "candidate latitude survives normalization");
assert(normalized.longitude === spring.longitude, "candidate longitude survives normalization");
assert(normalized.distanceMiles !== null, "distance computed when both coordinate pairs exist");

assert(
  normalizeGooglePlaceId("places/ChIJabc") === "ChIJabc",
  "place id normalization strips prefix",
);
assert(
  placeIdsMatch("places/ChIJabc", "ChIJabc"),
  "place ids match across formats",
);
assert(
  googlePlaceIdVariants("ChIJabc").includes("places/ChIJabc"),
  "place id variants include prefixed form",
);

assert(
  GOOGLE_PLACES_TEXT_SEARCH_FIELD_MASK.includes("places.location"),
  "field mask requests coordinates",
);

const nearby = validateCompetitorCandidate(
  candidate({
    providerBusinessId: "place-abc",
    businessName: "ABC Electric",
    latitude: 30.21,
    longitude: -95.75,
    distanceMiles: 4.2,
  }),
  profile({ latitude: 30.18, longitude: -95.68 }),
);
assert(nearby.evidence.geography.mode === "EXACT_DISTANCE", "validation uses exact geography");
assert(nearby.validationScore !== 77 || nearby.evidence.geography.score >= 20, "nearby score uses geography");

const supplier = validateCompetitorCandidate(
  candidate({
    providerBusinessId: "place-supply",
    businessName: "Ferguson Electrical Supply",
    primaryType: "wholesaler",
    normalizedHostname: "ferguson.example",
  }),
  profile(),
);
assert(supplier.validationLabel === "REJECTED", "supplier rejection unchanged");

const distant = validateCompetitorCandidate(
  candidate({
    providerBusinessId: "place-far",
    businessName: "Far Electric",
    latitude: 29.0,
    longitude: -96.0,
    distanceMiles: 120,
  }),
  profile({ latitude: 30.18, longitude: -95.68, radiusMiles: 25 }),
);
assert(distant.validationLabel === "REJECTED", "distant competitor rejected");
assert(
  distant.evidence.rejectionReasons.includes("outside_market"),
  "outside market rejection preserved",
);

assert(
  formatCompetitorDistanceDisplay({
    distanceMiles: 4.8,
    geographyMode: "EXACT_DISTANCE",
    geographyBand: "very_near",
  }) === "4.8 mi",
  "distance display uses miles",
);
assert(
  formatCompetitorDistanceDisplay({
    distanceMiles: null,
    geographyMode: "SAME_CITY_FALLBACK",
    geographyBand: "same_city",
  }) === "Same city",
  "fallback distance display",
);
assert(
  formatCompetitorDistanceDisplay({
    distanceMiles: null,
    geographyMode: "UNKNOWN",
    geographyBand: "unknown",
  }) === "—",
  "unknown distance display",
);

assert(
  resolveCandidateDistanceMiles(
    profile({ latitude: houston.latitude, longitude: houston.longitude }),
    {
      latitude: spring.latitude,
      longitude: spring.longitude,
      city: "Spring",
      state: "TX",
    },
  ) !== null,
  "resolveCandidateDistanceMiles returns value when both pairs exist",
);

console.log("geography.verify.ts passed");
