import type { BusinessDiscoveryProvider } from "@/lib/prospecting/discovery/types";

import { MAX_COMPETITOR_PROVIDER_REQUESTS_PER_PROSPECT } from "./constants";
import { dedupeCompetitorCandidates } from "./dedupe";
import { normalizeCompetitorCandidate } from "./normalize";
import { recommendTopCompetitors } from "./rank";
import type {
  CompetitiveProfile,
  ExistingProspectIdentity,
  ValidatedCompetitorCandidate,
} from "./types";
import { validateCompetitorCandidate } from "./validate";

export interface DiscoverCompetitorCandidatesResult {
  candidates: ValidatedCompetitorCandidate[];
  providerRequests: number;
}

export function linkExistingProspect(
  candidate: ValidatedCompetitorCandidate,
  existing: ExistingProspectIdentity[],
): ValidatedCompetitorCandidate {
  const byPlace = existing.find(
    (row) => row.sourceRef && row.sourceRef === candidate.providerBusinessId,
  );

  if (byPlace) {
    return { ...candidate, competitorProspectId: byPlace.id };
  }

  if (candidate.normalizedHostname) {
    const byHost = existing.find(
      (row) =>
        row.hostname && row.hostname === candidate.normalizedHostname,
    );

    if (byHost) {
      return { ...candidate, competitorProspectId: byHost.id };
    }
  }

  return candidate;
}

export async function discoverCompetitorCandidates(options: {
  profile: CompetitiveProfile;
  provider: BusinessDiscoveryProvider;
  existingProspects?: ExistingProspectIdentity[];
}): Promise<DiscoverCompetitorCandidatesResult> {
  const queries = options.profile.searchTerms.slice(
    0,
    MAX_COMPETITOR_PROVIDER_REQUESTS_PER_PROSPECT,
  );
  const raw = [];
  let providerRequests = 0;

  for (const query of queries) {
    if (providerRequests >= MAX_COMPETITOR_PROVIDER_REQUESTS_PER_PROSPECT) {
      break;
    }

    const page = await options.provider.search({
      query,
      pageSize: 10,
    });
    providerRequests += 1;
    raw.push(...page.businesses);
  }

  const normalized = raw.map((business) =>
    normalizeCompetitorCandidate(business, options.profile),
  );
  const deduped = dedupeCompetitorCandidates(normalized, options.profile);
  const validated = deduped.map((candidate) =>
    validateCompetitorCandidate(candidate, options.profile),
  );
  const recommended = recommendTopCompetitors(validated);
  const existing = options.existingProspects ?? [];

  return {
    candidates: recommended.map((candidate) =>
      linkExistingProspect(candidate, existing),
    ),
    providerRequests,
  };
}
