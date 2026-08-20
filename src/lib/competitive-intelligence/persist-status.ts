import type { CompetitorStatusValue } from "./types";

/** Preserve explicit human review; otherwise use freshly computed status. */
export function resolvePersistedCompetitorStatus(
  existingStatus: string | null | undefined,
  candidateStatus: CompetitorStatusValue,
): CompetitorStatusValue {
  if (existingStatus === "SELECTED" || existingStatus === "REJECTED") {
    return existingStatus;
  }

  return candidateStatus;
}
