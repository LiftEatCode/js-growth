import {
  COMMERCIAL_SCOPE_MAPPING_VERSION,
  COMMERCIAL_SCOPE_VERSION,
} from "./constants";
import type { ScopeSourceFingerprint } from "./types";

export function buildScopeSourceFingerprint(
  input: Omit<ScopeSourceFingerprint, "scopeVersion" | "scopeMappingVersion"> & {
    scopeVersion?: number;
    scopeMappingVersion?: number;
  },
): string {
  const payload: ScopeSourceFingerprint = {
    opportunityId: input.opportunityId,
    implementationPlanId: input.implementationPlanId,
    planVersion: input.planVersion,
    mappingVersion: input.mappingVersion,
    scopeVersion: input.scopeVersion ?? COMMERCIAL_SCOPE_VERSION,
    scopeMappingVersion:
      input.scopeMappingVersion ?? COMMERCIAL_SCOPE_MAPPING_VERSION,
  };
  return JSON.stringify(payload);
}

export function parseScopeSourceFingerprint(
  raw: string,
): ScopeSourceFingerprint | null {
  try {
    const parsed = JSON.parse(raw) as Partial<ScopeSourceFingerprint>;
    if (typeof parsed.opportunityId !== "string") {
      return null;
    }
    return {
      opportunityId: parsed.opportunityId,
      implementationPlanId: parsed.implementationPlanId ?? null,
      planVersion:
        typeof parsed.planVersion === "number" ? parsed.planVersion : null,
      mappingVersion:
        typeof parsed.mappingVersion === "number"
          ? parsed.mappingVersion
          : null,
      scopeVersion:
        typeof parsed.scopeVersion === "number"
          ? parsed.scopeVersion
          : COMMERCIAL_SCOPE_VERSION,
      scopeMappingVersion:
        typeof parsed.scopeMappingVersion === "number"
          ? parsed.scopeMappingVersion
          : 1,
    };
  } catch {
    return null;
  }
}
