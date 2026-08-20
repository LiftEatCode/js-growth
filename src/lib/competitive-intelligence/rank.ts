import { compareGeographyForRanking } from "./geography";
import { MAX_SELECTED_COMPETITORS_PER_PROSPECT } from "./constants";
import type { ValidatedCompetitorCandidate } from "./types";

export function compareCompetitorCandidates(
  left: ValidatedCompetitorCandidate,
  right: ValidatedCompetitorCandidate,
): number {
  return compareGeographyForRanking({
    validationScore: left.validationScore,
    distanceMiles: left.distanceMiles,
    geographyMode: left.evidence.geography.mode,
    businessName: left.businessName,
    providerBusinessId: left.providerBusinessId,
  }, {
    validationScore: right.validationScore,
    distanceMiles: right.distanceMiles,
    geographyMode: right.evidence.geography.mode,
    businessName: right.businessName,
    providerBusinessId: right.providerBusinessId,
  });
}

export function rankCompetitorCandidates(
  candidates: ValidatedCompetitorCandidate[],
): ValidatedCompetitorCandidate[] {
  return [...candidates].sort(compareCompetitorCandidates);
}

export function recommendTopCompetitors(
  candidates: ValidatedCompetitorCandidate[],
): ValidatedCompetitorCandidate[] {
  const ranked = rankCompetitorCandidates(candidates);
  let recommended = 0;

  return ranked.map((candidate) => {
    const canRecommend =
      candidate.status === "VALIDATED" &&
      recommended < MAX_SELECTED_COMPETITORS_PER_PROSPECT;

    if (canRecommend) {
      recommended += 1;
    }

    return {
      ...candidate,
      isRecommended: canRecommend,
    };
  });
}
