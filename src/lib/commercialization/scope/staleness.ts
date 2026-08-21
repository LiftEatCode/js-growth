import { COMMERCIAL_SCOPE_VERSION } from "./constants";
import { parseScopeSourceFingerprint } from "./fingerprint";
import type { ScopeSourceFingerprint } from "./types";

/**
 * Scope becomes stale when source plan identity/versions diverge.
 * Never mutates commercial scope — indicator only.
 */
export function evaluateScopeStaleness(options: {
  storedFingerprint: string;
  current: ScopeSourceFingerprint;
}): { stale: boolean; reasons: string[] } {
  const reasons: string[] = [];
  const stored = parseScopeSourceFingerprint(options.storedFingerprint);

  if (!stored) {
    reasons.push("Scope source fingerprint could not be parsed.");
    return { stale: true, reasons };
  }

  if (stored.opportunityId !== options.current.opportunityId) {
    reasons.push("Opportunity identity no longer matches this Scope.");
  }

  if (stored.scopeVersion !== COMMERCIAL_SCOPE_VERSION) {
    reasons.push("Commercial Scope algorithm version has changed.");
  }

  if (
    (stored.implementationPlanId ?? null) !==
    (options.current.implementationPlanId ?? null)
  ) {
    reasons.push(
      "Implementation Plan linked to this Scope is no longer current.",
    );
  }

  if (
    stored.planVersion != null &&
    options.current.planVersion != null &&
    stored.planVersion !== options.current.planVersion
  ) {
    reasons.push("Implementation Plan algorithm version has changed.");
  }

  if (
    stored.mappingVersion != null &&
    options.current.mappingVersion != null &&
    stored.mappingVersion !== options.current.mappingVersion
  ) {
    reasons.push("Implementation mapping version has changed.");
  }

  return { stale: reasons.length > 0, reasons };
}
