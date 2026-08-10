import type {
  ReportMode,
  WebsiteAuditResult,
} from "../types";

export const AUDIT_REPORT_VERSION = 1;

export interface AuditReport {
  id: string;

  version: number;

  createdAt: string;

  website: string;

  hostname: string;

  reportMode: ReportMode;

  audit: WebsiteAuditResult;
}

export interface AuditReportLeadSummary {
  id: string;

  createdAt: string;

  firstName: string;

  lastName: string;

  email: string;

  phone: string | null;

  company: string | null;

  contacted: boolean;
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