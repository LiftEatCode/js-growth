import { normalizeProspectWebsite } from "@/lib/prospecting/hostname";

import type {
  ClassifiedDiscoveryCandidate,
  DiscoveredBusiness,
  DiscoveryCandidateStatusValue,
  DiscoveryDedupContext,
} from "./types";

export function classifyDiscoveredBusinesses(
  businesses: DiscoveredBusiness[],
  context: DiscoveryDedupContext,
): ClassifiedDiscoveryCandidate[] {
  const seenPlaceIds = new Set<string>();
  const seenHostnames = new Set<string>();
  const classified: ClassifiedDiscoveryCandidate[] = [];

  for (const business of businesses) {
    classified.push(
      classifyOne(business, context, seenPlaceIds, seenHostnames),
    );
  }

  return classified;
}

function classifyOne(
  business: DiscoveredBusiness,
  context: DiscoveryDedupContext,
  seenPlaceIds: Set<string>,
  seenHostnames: Set<string>,
): ClassifiedDiscoveryCandidate {
  const placeId = business.providerBusinessId;

  if (!placeId || seenPlaceIds.has(placeId)) {
    return result(
      business,
      null,
      null,
      "DUPLICATE_PLACE",
      "Duplicate Google Place ID in this discovery run.",
    );
  }

  seenPlaceIds.add(placeId);

  if (!business.website) {
    return result(
      business,
      null,
      null,
      "NO_WEBSITE",
      "Google did not return a public website.",
    );
  }

  const normalized = normalizeProspectWebsite(business.website);

  if (!normalized.success) {
    return result(
      business,
      null,
      business.website,
      "INVALID_WEBSITE",
      "The listed website is not a usable public URL.",
    );
  }

  const hostname = normalized.hostname;
  const website = normalized.website;

  if (seenHostnames.has(hostname)) {
    return result(
      business,
      hostname,
      website,
      "DUPLICATE_HOSTNAME",
      "Duplicate hostname in this discovery run.",
    );
  }

  seenHostnames.add(hostname);

  if (context.suppressedHostnames.has(hostname)) {
    return result(
      business,
      hostname,
      website,
      "SUPPRESSED",
      "Hostname is on the suppression list.",
    );
  }

  if (
    context.campaignProspectHostnames.has(hostname) ||
    context.campaignProspectPlaceIds.has(placeId)
  ) {
    return result(
      business,
      hostname,
      website,
      "ALREADY_IN_CAMPAIGN",
      "This business is already a prospect in this campaign.",
    );
  }

  if (context.leadHostnames.has(hostname)) {
    return result(
      business,
      hostname,
      website,
      "EXISTING_LEAD",
      "An inbound lead already uses this website.",
    );
  }

  if (
    context.prospectHostnames.has(hostname) ||
    context.prospectPlaceIds.has(placeId)
  ) {
    return result(
      business,
      hostname,
      website,
      "EXISTING_PROSPECT",
      "An existing Prospect already uses this website.",
    );
  }

  return result(business, hostname, website, "ELIGIBLE", null);
}

function result(
  business: DiscoveredBusiness,
  hostname: string | null,
  website: string | null,
  status: DiscoveryCandidateStatusValue,
  exclusionReason: string | null,
): ClassifiedDiscoveryCandidate {
  return {
    business,
    hostname,
    website,
    status,
    exclusionReason,
  };
}

export function countClassifications(
  classified: ClassifiedDiscoveryCandidate[],
): {
  returnedCount: number;
  eligibleCount: number;
  skippedDuplicateCount: number;
  skippedSuppressedCount: number;
  skippedNoWebsiteCount: number;
} {
  let eligibleCount = 0;
  let skippedDuplicateCount = 0;
  let skippedSuppressedCount = 0;
  let skippedNoWebsiteCount = 0;

  for (const candidate of classified) {
    switch (candidate.status) {
      case "ELIGIBLE":
        eligibleCount += 1;
        break;
      case "NO_WEBSITE":
      case "INVALID_WEBSITE":
        skippedNoWebsiteCount += 1;
        break;
      case "SUPPRESSED":
        skippedSuppressedCount += 1;
        break;
      default:
        skippedDuplicateCount += 1;
        break;
    }
  }

  return {
    returnedCount: classified.length,
    eligibleCount,
    skippedDuplicateCount,
    skippedSuppressedCount,
    skippedNoWebsiteCount,
  };
}
