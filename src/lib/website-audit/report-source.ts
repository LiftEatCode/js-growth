import type { AuditReportSourceValue } from "./storage/types";

export function isProspectingAuditSource(
  source: AuditReportSourceValue | string | null | undefined,
): boolean {
  return source === "PROSPECTING";
}

/**
 * Customer-facing surfaces (`/report/[id]`, PDF, Professional API, Stripe)
 * may only expose inbound Website Growth Audit reports.
 */
export function canExposeAuditReportPublicly(
  source: AuditReportSourceValue | string | null | undefined,
): boolean {
  return !isProspectingAuditSource(source);
}

export function canCreateCustomerCheckout(options: {
  source: AuditReportSourceValue | string | null | undefined;
  reportMode: string;
}): boolean {
  return (
    canExposeAuditReportPublicly(options.source) &&
    options.reportMode === "public"
  );
}
