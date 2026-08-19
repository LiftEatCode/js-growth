import type { NormalizedContactCandidate } from "./types";

const SOURCE_RANK: Record<string, number> = {
  WEBSITE_CONTACT_PAGE: 40,
  CONTACT_PAGE: 40,
  WEBSITE_HOMEPAGE: 30,
  WEBSITE: 30,
  WEBSITE_ABOUT_PAGE: 18,
  WEBSITE_TEAM_PAGE: 16,
  WEBSITE_OTHER: 10,
  MANUAL: 8,
  PROVIDER: 4,
};

const CONFIDENCE_RANK: Record<string, number> = {
  HIGH: 30,
  MEDIUM: 18,
  LOW: 8,
};

export function contactSelectionScore(
  candidate: Pick<
    NormalizedContactCandidate,
    "sourceType" | "confidence" | "name"
  >,
): number {
  const source = SOURCE_RANK[candidate.sourceType] ?? 0;
  const confidence = CONFIDENCE_RANK[candidate.confidence] ?? 0;
  const namedOnSecondary =
    candidate.name &&
    (candidate.sourceType === "WEBSITE_TEAM_PAGE" ||
      candidate.sourceType === "WEBSITE_ABOUT_PAGE")
      ? 4
      : 0;

  return source + confidence + namedOnSecondary;
}

export function selectPrimaryContact<T extends NormalizedContactCandidate>(
  candidates: T[],
): T | null {
  if (candidates.length === 0) {
    return null;
  }

  return [...candidates].sort((left, right) => {
    const delta = contactSelectionScore(right) - contactSelectionScore(left);

    if (delta !== 0) {
      return delta;
    }

    return left.normalizedEmail.localeCompare(right.normalizedEmail);
  })[0] ?? null;
}
