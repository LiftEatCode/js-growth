import { COMPETITIVE_COMPARISON_VERSION } from "./constants";

export interface ComparisonFingerprint {
  auditReportId: string;
  auditEngineVersion: number;
  comparisonVersion: number;
  selectedCompetitorIds: string[];
  competitorAuditIds: string[];
}

export function buildComparisonFingerprint(input: {
  auditReportId: string;
  auditEngineVersion: number;
  selectedCompetitorIds: string[];
  competitorAuditIds: string[];
}): ComparisonFingerprint {
  return {
    auditReportId: input.auditReportId,
    auditEngineVersion: input.auditEngineVersion,
    comparisonVersion: COMPETITIVE_COMPARISON_VERSION,
    selectedCompetitorIds: [...input.selectedCompetitorIds].sort(),
    competitorAuditIds: [...input.competitorAuditIds].sort(),
  };
}

export function fingerprintsMatch(
  left: ComparisonFingerprint,
  right: ComparisonFingerprint,
): boolean {
  return (
    left.auditReportId === right.auditReportId &&
    left.auditEngineVersion === right.auditEngineVersion &&
    left.comparisonVersion === right.comparisonVersion &&
    left.selectedCompetitorIds.join("|") ===
      right.selectedCompetitorIds.join("|") &&
    left.competitorAuditIds.join("|") === right.competitorAuditIds.join("|")
  );
}
