import type { CompetitiveProfile, CompetitorCandidate } from "./types";

export function profile(
  overrides: Partial<CompetitiveProfile> = {},
): CompetitiveProfile {
  return {
    prospectId: "p-roa",
    businessName: "Roa Electrical Services",
    hostname: "roaelectric.com",
    website: "https://www.roaelectric.com/",
    locationLabel: "Pinehurst, TX",
    city: "Pinehurst",
    state: "TX",
    latitude: 30.18,
    longitude: -95.68,
    sourceRef: "place-roa",
    industry: "electrical",
    campaignIndustries: ["electrical"],
    placesCategory: "electrician",
    normalizedVerticals: ["ELECTRICAL"],
    searchTerms: [
      "electrician near Pinehurst, TX",
      "electrical contractor near Pinehurst, TX",
      "electrical services near Pinehurst, TX",
    ],
    radiusMiles: 25,
    ...overrides,
  };
}

export function candidate(
  overrides: Partial<CompetitorCandidate> &
    Pick<CompetitorCandidate, "providerBusinessId" | "businessName">,
): CompetitorCandidate {
  return {
    provider: "GOOGLE_PLACES",
    website: "https://abc-electric.example",
    normalizedHostname: "abc-electric.example",
    formattedAddress: "Magnolia, TX",
    city: "Magnolia",
    state: "TX",
    latitude: 30.21,
    longitude: -95.75,
    primaryType: "electrician",
    normalizedVerticals: ["ELECTRICAL"],
    distanceMiles: 4.2,
    ...overrides,
  };
}
