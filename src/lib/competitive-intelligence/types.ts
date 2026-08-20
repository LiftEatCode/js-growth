import type { BusinessVertical } from "@/lib/business-intelligence/verticals/types";

export type CompetitorValidationLabel =
  | "STRONG"
  | "LIKELY"
  | "WEAK"
  | "REJECTED";

export type CompetitorStatusValue =
  | "CANDIDATE"
  | "VALIDATED"
  | "SELECTED"
  | "REJECTED"
  | "STALE";

export type GeographicBand =
  | "very_near"
  | "near"
  | "regional"
  | "distant"
  | "same_city"
  | "same_region"
  | "unknown";

export type GeographyMode =
  | "EXACT_DISTANCE"
  | "SAME_CITY_FALLBACK"
  | "SAME_REGION_FALLBACK"
  | "UNKNOWN";

export interface CompetitiveProfile {
  prospectId: string;
  businessName: string;
  hostname: string | null;
  website: string | null;
  locationLabel: string;
  city: string | null;
  state: string | null;
  latitude: number | null;
  longitude: number | null;
  sourceRef: string | null;
  industry: string | null;
  campaignIndustries: string[];
  placesCategory: string | null;
  normalizedVerticals: BusinessVertical[];
  searchTerms: string[];
  radiusMiles: number;
}

export interface CompetitorCandidate {
  provider: "GOOGLE_PLACES";
  providerBusinessId: string;
  businessName: string;
  website: string | null;
  normalizedHostname: string | null;
  formattedAddress: string | null;
  city: string | null;
  state: string | null;
  latitude: number | null;
  longitude: number | null;
  primaryType: string | null;
  normalizedVerticals: BusinessVertical[];
  distanceMiles: number | null;
}

export interface CompetitorValidationEvidence {
  matchedVerticals: BusinessVertical[];
  prospectVerticals: BusinessVertical[];
  candidateVerticals: BusinessVertical[];
  verticalScore: number;
  distanceMiles: number | null;
  geographicBand: GeographicBand;
  geographicScore: number;
  geography: {
    mode: GeographyMode;
    distanceMiles: number | null;
    radiusMiles: number;
    band: GeographicBand;
    score: number;
  };
  serviceOverlapScore: number;
  hasWebsite: boolean;
  websiteScore: number;
  localServiceScore: number;
  sameHostname: boolean;
  samePlaceId: boolean;
  rejectionReasons: string[];
}

export interface ValidatedCompetitorCandidate extends CompetitorCandidate {
  validationScore: number;
  validationLabel: CompetitorValidationLabel;
  evidence: CompetitorValidationEvidence;
  status: Extract<CompetitorStatusValue, "VALIDATED" | "REJECTED">;
  isRecommended: boolean;
  competitorProspectId: string | null;
}

export interface ExistingProspectIdentity {
  id: string;
  hostname: string | null;
  sourceRef: string | null;
  businessName: string;
  city: string | null;
  state: string | null;
}
