import { MAX_DISCOVERY_CANDIDATES_PER_RUN } from "./constants";

export function clampDiscoveryLimit(requested: number | null | undefined): number {
  if (
    requested === null ||
    requested === undefined ||
    !Number.isFinite(requested)
  ) {
    return MAX_DISCOVERY_CANDIDATES_PER_RUN;
  }

  return Math.min(
    MAX_DISCOVERY_CANDIDATES_PER_RUN,
    Math.max(1, Math.floor(requested)),
  );
}
