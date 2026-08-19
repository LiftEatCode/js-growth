export const MAX_PROSPECT_AUDITS_PER_RUN = 10;

export const MAX_AUDIT_CONCURRENCY = 2;

export const PROSPECT_AUDIT_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export const STALE_QUALIFICATION_RUN_MS = 12 * 60 * 1000;

export const QUALIFICATION_JSON_VERSION = 1;

export const OUTREACH_FINDING_ALLOWLIST = [
  "site-duplicate-titles",
  "missing-h1",
  "missing-meta-description",
  "empty-meta-description",
  "site-weak-internal-link-support",
  "local-schema-incomplete",
  "local-schema-missing",
  "limited-internal-link-diversity",
  "missing-internal-links",
] as const;

export type OutreachFindingId = (typeof OUTREACH_FINDING_ALLOWLIST)[number];

export const PREFERRED_GAP_CATEGORIES = [
  "content",
  "local",
  "cro",
  "seo",
] as const;

export const SKIP_REASON = {
  WEBSITE_INVALID: "The website is missing or is not a usable public URL.",
  AUDIT_FAILED: "The website audit could not be completed.",
  SUPPRESSED: "This hostname is on the suppression list.",
  EXISTING_LEAD: "An inbound lead already uses this website.",
  CUSTOMER: "This business is marked as a customer.",
  NO_CREDIBLE_FINDING: "NO_CREDIBLE_FINDING",
  WEAK_EVIDENCE: "The crawl did not collect enough reliable evidence.",
  OUTSIDE_TARGETING: "The business location is outside this campaign's targeting.",
} as const;
