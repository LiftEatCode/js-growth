export const COMMERCIAL_SCOPE_VERSION = 1;

/**
 * Mapping quality version for plan → scope derivation (Sprint 4.1+).
 * Increment when consideration dedupe / title defaults / capability inheritance
 * behavior changes. Does not rewrite historical approved scopes.
 */
export const COMMERCIAL_SCOPE_MAPPING_VERSION = 2;

export const COMMERCIAL_SCOPE_STATUSES = [
  "DRAFT",
  "REVIEWED",
  "APPROVED",
  "SUPERSEDED",
] as const;

export type CommercialScopeStatus = (typeof COMMERCIAL_SCOPE_STATUSES)[number];

export const SCOPE_DELIVERABLE_TYPES = [
  "IMPLEMENTATION",
  "REVIEW",
  "CONFIGURATION",
  "CONTENT",
  "TECHNICAL",
  "OPTIMIZATION",
  "OTHER",
] as const;

export type ScopeDeliverableType = (typeof SCOPE_DELIVERABLE_TYPES)[number];

export const SCOPE_ITEM_SOURCES = ["PLAN", "MANUAL"] as const;
export type ScopeItemSource = (typeof SCOPE_ITEM_SOURCES)[number];

export const MAX_SCOPE_TITLE_CHARS = 200;
export const MAX_SCOPE_SUMMARY_CHARS = 2_000;
export const MAX_SECTION_TITLE_CHARS = 160;
export const MAX_SECTION_DESCRIPTION_CHARS = 1_200;
export const MAX_DELIVERABLE_TITLE_CHARS = 240;
export const MAX_DELIVERABLE_DESCRIPTION_CHARS = 800;
export const MAX_ASSUMPTION_CHARS = 500;
export const MAX_EXCLUSION_CHARS = 500;
export const MAX_ASSUMPTIONS = 20;
export const MAX_EXCLUSIONS = 20;
export const MAX_SECTIONS = 12;
export const MAX_DELIVERABLES_PER_SECTION = 20;

/** Action ids that are competitive-gap rationale, not billable deliverables. */
export const EVIDENCE_ONLY_ACTION_ID_PREFIX = "address-competitive-";

export function commercialScopeStatusLabel(
  status: CommercialScopeStatus,
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
