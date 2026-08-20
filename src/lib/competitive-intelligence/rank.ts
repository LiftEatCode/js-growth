import { MAX_SELECTED_COMPETITORS_PER_PROSPECT } from "./constants";
import type { ValidatedCompetitorCandidate } from "./types";

export function compareCompetitorCandidates(
  left: Pick<
    ValidatedCompetitorCandidate,
    "validationScore" | "distanceMiles" | "businessName" | "providerBusinessId"
  >,
  right: Pick<
    ValidatedCompetitorCandidate,
    "validationScore" | "distanceMiles" | "businessName" | "providerBusinessId"
  >,
): number {
  if (right.validationScore !== left.validationScore) {
    return right.validationScore - left.validationScore;
  }

  const leftDistance = left.distanceMiles ?? Number.POSITIVE_INFINITY;
  const rightDistance = right.distanceMiles ?? Number.POSITIVE_INFINITY;

  if (leftDistance !== rightDistance) {
    return leftDistance - rightDistance;
  }

  const name = left.businessName.localeCompare(right.businessName);

  if (name !== 0) {
    return name;
  }

  return left.providerBusinessId.localeCompare(right.providerBusinessId);
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
