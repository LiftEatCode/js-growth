import { SERVICE_CAPABILITY_VERSION } from "../capabilities/types";
import {
  IMPLEMENTATION_MAPPING_VERSION,
  IMPLEMENTATION_PLAN_VERSION,
} from "./constants";
import {
  buildImplementationPlanFingerprint,
  fingerprintsMatch,
} from "./fingerprint";
import type { ImplementationPlanFingerprint } from "./types";

export function computeCurrentPlanFingerprint(options: {
  auditReportId: string;
  /** Current comparison snapshot id only when comparison is current (not stale). */
  currentComparisonSnapshotId: string | null;
}): ImplementationPlanFingerprint {
  return buildImplementationPlanFingerprint({
    auditReportId: options.auditReportId,
    comparisonSnapshotId: options.currentComparisonSnapshotId,
    planVersion: IMPLEMENTATION_PLAN_VERSION,
    mappingVersion: IMPLEMENTATION_MAPPING_VERSION,
    capabilityVersion: SERVICE_CAPABILITY_VERSION,
  });
}

export function evaluatePlanStaleness(options: {
  stored: ImplementationPlanFingerprint;
  current: ImplementationPlanFingerprint;
}): { stale: boolean; reasons: string[] } {
  const reasons: string[] = [];

  if (options.stored.auditReportId !== options.current.auditReportId) {
    reasons.push("Website Growth Audit has changed.");
  }

  if (
    options.stored.comparisonSnapshotId !==
    options.current.comparisonSnapshotId
  ) {
    if (
      options.stored.comparisonSnapshotId &&
      !options.current.comparisonSnapshotId
    ) {
      reasons.push(
        "Competitive comparison is no longer current; competitive evidence was excluded.",
      );
    } else if (
      !options.stored.comparisonSnapshotId &&
      options.current.comparisonSnapshotId
    ) {
      reasons.push("A current competitive comparison is now available.");
    } else {
      reasons.push("Competitive comparison snapshot has changed.");
    }
  }

  if (options.stored.planVersion !== options.current.planVersion) {
    reasons.push("Implementation plan algorithm version has changed.");
  }

  if (options.stored.mappingVersion !== options.current.mappingVersion) {
    reasons.push("Capability mapping version has changed.");
  }

  if (options.stored.capabilityVersion !== options.current.capabilityVersion) {
    reasons.push("Service capability taxonomy version has changed.");
  }

  return {
    stale: !fingerprintsMatch(options.stored, options.current),
    reasons,
  };
}
