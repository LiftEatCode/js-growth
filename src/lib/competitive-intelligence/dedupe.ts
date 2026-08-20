import { MAX_COMPETITOR_CANDIDATES_PER_PROSPECT } from "./constants";
import { normalizeBusinessIdentity } from "./normalize";
import type { CompetitiveProfile, CompetitorCandidate } from "./types";

function identityKey(candidate: CompetitorCandidate): string {
  return [
    normalizeBusinessIdentity(candidate.businessName),
    (candidate.city ?? "").toLowerCase(),
    (candidate.state ?? "").toLowerCase(),
  ].join("|");
}

export function dedupeCompetitorCandidates(
  candidates: CompetitorCandidate[],
  profile: CompetitiveProfile,
): CompetitorCandidate[] {
  const seenPlaceIds = new Set<string>();
  const seenHostnames = new Set<string>();
  const seenIdentities = new Set<string>();
  const results: CompetitorCandidate[] = [];
  const prospectName = normalizeBusinessIdentity(profile.businessName);

  for (const candidate of candidates) {
    if (results.length >= MAX_COMPETITOR_CANDIDATES_PER_PROSPECT) {
      break;
    }

    if (
      profile.sourceRef &&
      candidate.providerBusinessId === profile.sourceRef
    ) {
      continue;
    }

    if (
      profile.hostname &&
      candidate.normalizedHostname &&
      candidate.normalizedHostname === profile.hostname
    ) {
      continue;
    }

    if (normalizeBusinessIdentity(candidate.businessName) === prospectName) {
      continue;
    }

    if (seenPlaceIds.has(candidate.providerBusinessId)) {
      continue;
    }

    if (
      candidate.normalizedHostname &&
      seenHostnames.has(candidate.normalizedHostname)
    ) {
      continue;
    }

    const key = identityKey(candidate);

    if (seenIdentities.has(key) && key.replace(/\|/g, "").length > 0) {
      continue;
    }

    seenPlaceIds.add(candidate.providerBusinessId);

    if (candidate.normalizedHostname) {
      seenHostnames.add(candidate.normalizedHostname);
    }

    seenIdentities.add(key);
    results.push(candidate);
  }

  return results;
}
