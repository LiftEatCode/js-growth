import { MAX_CONTACT_DISCOVERY_PER_RUN, CONTACT_TTL_MS } from "./constants";

export function clampContactDiscoveryBatchSize(
  requested: number | null | undefined,
): number {
  if (requested === null || requested === undefined || !Number.isFinite(requested)) {
    return MAX_CONTACT_DISCOVERY_PER_RUN;
  }

  return Math.min(
    MAX_CONTACT_DISCOVERY_PER_RUN,
    Math.max(1, Math.floor(requested)),
  );
}

export function isReusableContactDiscovery(options: {
  lastContactDiscoveryAt: Date | string | null | undefined;
  outreachStatus: string | null | undefined;
  hasUsableContact: boolean;
  now?: Date;
  ttlMs?: number;
}): boolean {
  if (!options.lastContactDiscoveryAt) {
    return false;
  }

  if (
    options.outreachStatus === "CONTACT_DISCOVERY_FAILED" ||
    options.outreachStatus === "DRAFT_GENERATION_FAILED"
  ) {
    return options.hasUsableContact;
  }

  const discoveredAt =
    options.lastContactDiscoveryAt instanceof Date
      ? options.lastContactDiscoveryAt
      : new Date(options.lastContactDiscoveryAt);

  if (Number.isNaN(discoveredAt.getTime())) {
    return false;
  }

  const now = options.now ?? new Date();
  const ttl = options.ttlMs ?? CONTACT_TTL_MS;
  const fresh = now.getTime() - discoveredAt.getTime() < ttl;

  if (!fresh) {
    return false;
  }

  return (
    options.hasUsableContact ||
    options.outreachStatus === "NO_CONTACT" ||
    options.outreachStatus === "SUPPRESSED" ||
    options.outreachStatus === "CONTACT_FOUND" ||
    options.outreachStatus === "DRAFT_READY" ||
    options.outreachStatus === "APPROVED"
  );
}
