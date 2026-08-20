import { normalizeBusinessVerticals } from "@/lib/business-intelligence/verticals/normalize";
import { VERTICAL_SEARCH_PHRASES } from "@/lib/business-intelligence/verticals/taxonomy";
import type { BusinessVertical } from "@/lib/business-intelligence/verticals/types";
import { tryNormalizeProspectHostname } from "@/lib/prospecting/hostname";

import { DEFAULT_COMPETITOR_RADIUS_MILES } from "./constants";
import { resolveTargetLocation } from "./location-label";
import type { CompetitiveProfile } from "./types";

export interface CompetitiveProfileInput {
  prospectId: string;
  businessName: string;
  website: string | null;
  hostname: string | null;
  industry: string | null;
  city: string | null;
  state: string | null;
  address: string | null;
  sourceRef: string | null;
  campaignLocationLabel: string;
  campaignCity: string | null;
  campaignState: string | null;
  campaignRadiusMiles: number | null;
  campaignIndustries: string[];
  placesCategory: string | null;
  latitude: number | null;
  longitude: number | null;
  discoveryCity?: string | null;
  discoveryState?: string | null;
}

export function buildCompetitiveProfile(
  input: CompetitiveProfileInput,
): CompetitiveProfile {
  const locationLabel =
    input.campaignLocationLabel.trim() ||
    [input.city ?? input.campaignCity, input.state ?? input.campaignState]
      .filter(Boolean)
      .join(", ");

  const hostname =
    input.hostname ?? tryNormalizeProspectHostname(input.website);

  const normalized = normalizeBusinessVerticals([
    { source: "business_name", text: input.businessName },
    { source: "industry", text: input.industry ?? "" },
    ...input.campaignIndustries.map((industry) => ({
      source: "campaign" as const,
      text: industry,
    })),
    { source: "places_type", text: input.placesCategory ?? "" },
    { source: "places_display", text: input.placesCategory ?? "" },
  ]);

  const searchTerms = buildSearchTerms(
    normalized.verticals,
    locationLabel,
    input.campaignRadiusMiles,
  );

  const targetLocation = resolveTargetLocation({
    prospectCity: input.city,
    prospectState: input.state,
    prospectAddress: input.address,
    campaignCity: input.campaignCity,
    campaignState: input.campaignState,
    campaignLocationLabel: input.campaignLocationLabel,
    discoveryCity: input.discoveryCity,
    discoveryState: input.discoveryState,
  });

  return {
    prospectId: input.prospectId,
    businessName: input.businessName,
    hostname,
    website: input.website,
    locationLabel,
    city: targetLocation.city,
    state: targetLocation.state,
    latitude: input.latitude,
    longitude: input.longitude,
    sourceRef: input.sourceRef,
    industry: input.industry,
    campaignIndustries: input.campaignIndustries,
    placesCategory: input.placesCategory,
    normalizedVerticals: normalized.verticals,
    searchTerms,
    radiusMiles:
      input.campaignRadiusMiles && input.campaignRadiusMiles > 0
        ? input.campaignRadiusMiles
        : DEFAULT_COMPETITOR_RADIUS_MILES,
  };
}

export function buildSearchTerms(
  verticals: BusinessVertical[],
  locationLabel: string,
  radiusMiles: number | null,
): string[] {
  const location = locationLabel.trim();
  const phrases = verticals.flatMap(
    (vertical) => VERTICAL_SEARCH_PHRASES[vertical] ?? [],
  );
  const unique = [...new Set(phrases)].slice(0, 3);
  const near =
    radiusMiles && radiusMiles > 0
      ? ` near ${location}`
      : ` in ${location}`;

  return unique.map((phrase) => `${phrase}${near}`);
}
