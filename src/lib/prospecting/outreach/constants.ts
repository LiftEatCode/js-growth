export const MAX_AI_DRAFTS_PER_RUN = 5;

export const MAX_AI_DRAFT_CONCURRENCY = 1;

export const STALE_OUTREACH_DRAFT_RUN_MS = 12 * 60 * 1000;

export const OUTREACH_GENERATION_TIMEOUT_MS = 40_000;

export const MAX_OUTREACH_SUBJECT_CHARS = 90;

export const MIN_OUTREACH_SUBJECT_CHARS = 8;

export const MAX_OUTREACH_BODY_CHARS = 1_800;

export const MIN_OUTREACH_BODY_CHARS = 180;

export const MAX_OUTREACH_EVIDENCE_CHARS = 280;

// Sprint 5 sending is intentionally low-volume and operator-controlled.
// This cap is enforced server-side before each delivery attempt.
export const MAX_OUTREACH_EMAILS_PER_DAY = 10;

export const MAX_OUTREACH_OUTCOME_NOTES_CHARS = 2_000;

export const JS_SOLUTIONS_OUTREACH_CONTEXT =
  "JS Solutions (js-growth.com) offers a Website Growth Audit that reviews search, content, conversion, local visibility, technical health, and performance. The operator signing the email is Josh. Offer to share the existing analysis. Do not mention pricing.";
