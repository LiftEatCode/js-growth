import { COMPETITOR_AUDIT_TTL_MS } from "./constants";
import type { CompetitorAuditStatusValue } from "./types";

export function isReusableCompetitorAudit(options: {
  status: CompetitorAuditStatusValue | string;
  completedAt: Date | string | null | undefined;
  auditEngineVersion: number;
  expectedEngineVersion: number;
  now?: Date;
  ttlMs?: number;
}): boolean {
  if (options.status !== "COMPLETED" || !options.completedAt) {
    return false;
  }

  if (options.auditEngineVersion !== options.expectedEngineVersion) {
    return false;
  }

  const completedAt =
    options.completedAt instanceof Date
      ? options.completedAt
      : new Date(options.completedAt);

  if (Number.isNaN(completedAt.getTime())) {
    return false;
  }

  const now = options.now ?? new Date();
  const ttl = options.ttlMs ?? COMPETITOR_AUDIT_TTL_MS;

  return now.getTime() - completedAt.getTime() < ttl;
}

export function canAuditCompetitorStatus(
  status: string,
): status is "SELECTED" {
  return status === "SELECTED";
}
