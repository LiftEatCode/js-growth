import { AUDIT_REPORT_VERSION } from "@/lib/website-audit/storage/types";

import { MAX_SELECTED_COMPETITORS_PER_PROSPECT } from "../constants";

/** Human-selected competitors only; mirrors Sprint 9 selection cap. */
export const MAX_COMPETITOR_AUDITS_PER_PROSPECT =
  MAX_SELECTED_COMPETITORS_PER_PROSPECT;

/** One prospect batch at a time — selected competitors for a single prospect. */
export const MAX_COMPETITOR_AUDITS_PER_RUN = 3;

export const COMPETITOR_AUDIT_CONCURRENCY = 1;

export const COMPETITOR_AUDIT_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export const STALE_COMPETITOR_AUDIT_RUN_MS = 15 * 60 * 1000;

/** Same integer as AuditReport.version for Sprint 11 score compatibility. */
export const COMPETITOR_AUDIT_ENGINE_VERSION = AUDIT_REPORT_VERSION;
