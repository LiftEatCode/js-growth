import type {
  ReportMode,
  WebsiteAuditResult,
} from "../types";

export const AUDIT_REPORT_VERSION = 1;

export type AuditLeadStatus =
  | "NEW"
  | "CONTACTED"
  | "QUALIFIED"
  | "PROPOSAL"
  | "WON"
  | "LOST";

export type AuditReportSourceValue = "PUBLIC_FUNNEL" | "PROSPECTING";

/** Bounded marketing attribution stored on public-funnel audits only. */
export type AuditReportAttribution = {
  source: string | null;
  medium: string | null;
  campaign: string | null;
  content: string | null;
  landingPath: string;
  capturedAt: string;
};

export interface AuditReport {
  id: string;

  version: number;

  createdAt: string;

  website: string;

  hostname: string;

  reportMode: ReportMode;

  /**
   * Distinguishes inbound customer audits from internal prospecting scans.
   * Older in-memory reports omit this and are treated as PUBLIC_FUNNEL.
   */
  source?: AuditReportSourceValue;

  /** First-party campaign context — no PII or commercial IDs. */
  attribution?: AuditReportAttribution | null;

  audit: WebsiteAuditResult;
}

export interface AuditReportLeadSummary {
  id: string;

  createdAt: string;

  updatedAt: string;

  firstName: string;

  lastName: string;

  email: string;

  phone: string | null;

  company: string | null;

  contacted: boolean;

  status: AuditLeadStatus;

  followUpAt: string | null;

  notes: string | null;
}

export interface AuditReportSummary {
  id: string;

  createdAt: string;

  website: string;

  hostname: string;

  reportMode: ReportMode;

  overallScore: number;

  grade: string;

  criticalIssues: number;

  quickWins: number;

  opportunityScore: number;

  lead: AuditReportLeadSummary | null;
}