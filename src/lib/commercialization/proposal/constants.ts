export const COMMERCIAL_PROPOSAL_VERSION = 1;
export const COMMERCIAL_PROPOSAL_PRESENTATION_VERSION = 2;

export const COMMERCIAL_PROPOSAL_STATUSES = [
  "DRAFT",
  "REVIEWED",
  "APPROVED",
  "SUPERSEDED",
] as const;

export type CommercialProposalStatus =
  (typeof COMMERCIAL_PROPOSAL_STATUSES)[number];

export const MAX_PROPOSAL_TITLE_CHARS = 200;
export const MAX_PROPOSAL_SUMMARY_CHARS = 4_000;
export const MAX_PROPOSAL_CONTEXT_CHARS = 3_000;
export const MAX_PROPOSAL_APPROACH_CHARS = 2_000;
export const MAX_PROPOSAL_TIMELINE_CHARS = 1_000;
export const MAX_PROPOSAL_NEXT_STEP_CHARS = 1_500;

export function commercialProposalStatusLabel(
  status: CommercialProposalStatus,
): string {
  switch (status) {
    case "DRAFT":
      return "Draft";
    case "REVIEWED":
      return "Reviewed";
    case "APPROVED":
      return "Approved";
    case "SUPERSEDED":
      return "Superseded";
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}
