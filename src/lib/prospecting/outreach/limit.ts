import { MAX_AI_DRAFTS_PER_RUN } from "./constants";

export function clampOutreachDraftBatchSize(
  requested: number | null | undefined,
): number {
  if (requested === null || requested === undefined || !Number.isFinite(requested)) {
    return MAX_AI_DRAFTS_PER_RUN;
  }

  return Math.min(MAX_AI_DRAFTS_PER_RUN, Math.max(1, Math.floor(requested)));
}

export function isUsableOutreachDraft(status: string): boolean {
  return (
    status === "DRAFT" ||
    status === "NEEDS_REVIEW" ||
    status === "APPROVED"
  );
}
