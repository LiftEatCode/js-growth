import { MAX_PROSPECT_AUDITS_PER_RUN, PROSPECT_AUDIT_TTL_MS } from "./constants";

export function clampQualificationBatchSize(
  requested: number | null | undefined,
): number {
  if (requested === null || requested === undefined || !Number.isFinite(requested)) {
    return MAX_PROSPECT_AUDITS_PER_RUN;
  }

  return Math.min(
    MAX_PROSPECT_AUDITS_PER_RUN,
    Math.max(1, Math.floor(requested)),
  );
}

export function isReusableProspectingAudit(options: {
  source: string | null | undefined;
  createdAt: Date | string;
  now?: Date;
  ttlMs?: number;
}): boolean {
  if (options.source !== "PROSPECTING") {
    return false;
  }

  const createdAt =
    options.createdAt instanceof Date
      ? options.createdAt
      : new Date(options.createdAt);

  if (Number.isNaN(createdAt.getTime())) {
    return false;
  }

  const now = options.now ?? new Date();
  const ttl = options.ttlMs ?? PROSPECT_AUDIT_TTL_MS;

  return now.getTime() - createdAt.getTime() < ttl;
}
