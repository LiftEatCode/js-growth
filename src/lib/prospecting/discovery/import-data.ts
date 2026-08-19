import type { ClassifiedDiscoveryCandidate } from "./types";

export function buildImportedProspectData(
  candidate: ClassifiedDiscoveryCandidate,
): {
  businessName: string;
  website: string;
  hostname: string;
  industry: string | null;
  city: string | null;
  state: string | null;
  address: string | null;
  phone: string | null;
  sourceType: "GOOGLE_PLACES";
  sourceRef: string;
} {
  if (
    candidate.status !== "ELIGIBLE" ||
    !candidate.website ||
    !candidate.hostname
  ) {
    throw new Error("Only eligible candidates with websites can be imported.");
  }

  return {
    businessName: candidate.business.businessName,
    website: candidate.website,
    hostname: candidate.hostname,
    industry: candidate.business.category,
    city: candidate.business.city,
    state: candidate.business.state,
    address: candidate.business.formattedAddress,
    phone: candidate.business.phone,
    sourceType: "GOOGLE_PLACES",
    sourceRef: candidate.business.providerBusinessId,
  };
}
