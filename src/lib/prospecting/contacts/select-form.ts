import type { NormalizedContactFormCandidate } from "./form-types";

const CONFIDENCE_RANK: Record<string, number> = {
  HIGH: 30,
  MEDIUM: 18,
  LOW: 8,
};

export function contactFormSelectionScore(
  candidate: Pick<NormalizedContactFormCandidate, "confidence" | "detectedFields">,
): number {
  const confidence = CONFIDENCE_RANK[candidate.confidence] ?? 0;
  const messageBonus = candidate.detectedFields.hasMessage ? 8 : 0;
  const identityBonus =
    candidate.detectedFields.hasName || candidate.detectedFields.hasEmail ? 4 : 0;

  return confidence + messageBonus + identityBonus;
}

export function selectPrimaryContactForm<T extends NormalizedContactFormCandidate>(
  candidates: T[],
): T | null {
  if (candidates.length === 0) {
    return null;
  }

  return [...candidates].sort((left, right) => {
    const delta =
      contactFormSelectionScore(right) - contactFormSelectionScore(left);

    if (delta !== 0) {
      return delta;
    }

    return left.normalizedUrl.localeCompare(right.normalizedUrl);
  })[0] ?? null;
}
