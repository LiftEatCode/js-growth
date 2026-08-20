import { normalizeBusinessVerticals } from "@/lib/business-intelligence/verticals/normalize";
import { tryNormalizeProspectHostname } from "@/lib/prospecting/hostname";
import type { DiscoveredBusiness } from "@/lib/prospecting/discovery/types";

import { haversineDistanceMiles } from "./distance";
import type { CompetitiveProfile, CompetitorCandidate } from "./types";

export function normalizeCompetitorCandidate(
  business: DiscoveredBusiness,
  profile: CompetitiveProfile,
): CompetitorCandidate {
  const normalizedHostname = tryNormalizeProspectHostname(business.website);
  const verticals = normalizeBusinessVerticals([
    { source: "business_name", text: business.businessName },
    { source: "places_type", text: business.category ?? "" },
    { source: "places_display", text: business.category ?? "" },
  ]);

  const distanceMiles =
    profile.latitude !== null &&
    profile.longitude !== null &&
    business.latitude !== null &&
    business.longitude !== null
      ? haversineDistanceMiles(
          { latitude: profile.latitude, longitude: profile.longitude },
          { latitude: business.latitude, longitude: business.longitude },
        )
      : null;

  return {
    provider: "GOOGLE_PLACES",
    providerBusinessId: business.providerBusinessId,
    businessName: business.businessName,
    website: business.website,
    normalizedHostname,
    formattedAddress: business.formattedAddress,
    city: business.city,
    state: business.state,
    latitude: business.latitude,
    longitude: business.longitude,
    primaryType: business.category,
    normalizedVerticals: verticals.verticals,
    distanceMiles,
  };
}

export function normalizeBusinessIdentity(name: string): string {
  return name
    .toLowerCase()
    .replace(/\b(llc|inc|incorporated|co|company|ltd|llp|pllc)\b/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
