import type { ImplementationPlanFingerprint } from "./types";

export function buildImplementationPlanFingerprint(
  input: ImplementationPlanFingerprint,
): ImplementationPlanFingerprint {
  return {
    auditReportId: input.auditReportId,
    comparisonSnapshotId: input.comparisonSnapshotId,
    planVersion: input.planVersion,
    mappingVersion: input.mappingVersion,
    capabilityVersion: input.capabilityVersion,
  };
}

export function fingerprintsMatch(
  a: ImplementationPlanFingerprint,
  b: ImplementationPlanFingerprint,
): boolean {
  return (
    a.auditReportId === b.auditReportId &&
    a.comparisonSnapshotId === b.comparisonSnapshotId &&
    a.planVersion === b.planVersion &&
    a.mappingVersion === b.mappingVersion &&
    a.capabilityVersion === b.capabilityVersion
  );
}

export function serializeFingerprint(
  fingerprint: ImplementationPlanFingerprint,
): string {
  return JSON.stringify(buildImplementationPlanFingerprint(fingerprint));
}
