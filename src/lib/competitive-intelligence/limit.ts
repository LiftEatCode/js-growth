import { COMPETITOR_DISCOVERY_TTL_MS } from "./constants";

export function isReusableCompetitorDiscovery(options: {
  lastCompetitorDiscoveryAt: Date | string | null | undefined;
  hasStoredCompetitors: boolean;
  now?: Date;
  ttlMs?: number;
}): boolean {
  if (!options.lastCompetitorDiscoveryAt || !options.hasStoredCompetitors) {
    return false;
  }

  const discoveredAt =
    options.lastCompetitorDiscoveryAt instanceof Date
      ? options.lastCompetitorDiscoveryAt
      : new Date(options.lastCompetitorDiscoveryAt);

  if (Number.isNaN(discoveredAt.getTime())) {
    return false;
  }

  const now = options.now ?? new Date();
  const ttl = options.ttlMs ?? COMPETITOR_DISCOVERY_TTL_MS;

  return now.getTime() - discoveredAt.getTime() < ttl;
}
