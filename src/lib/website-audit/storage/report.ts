import { randomUUID } from "crypto";

import { getAuditGrade } from "../grading";
import type {
  ReportMode,
  WebsiteAuditResult,
} from "../types";
import {
  AUDIT_REPORT_VERSION,
  type AuditReport,
  type AuditReportSourceValue,
  type AuditReportSummary,
} from "./types";

function getHostname(
  url: string,
): string {
  try {
    return new URL(url).hostname.replace(
      /^www\./,
      "",
    );
  } catch {
    return url;
  }
}

export function createAuditReport(
  audit: WebsiteAuditResult,
  reportMode: ReportMode,
  options?: {
    source?: AuditReportSourceValue;
  },
): AuditReport {
  return {
    id: randomUUID(),

    version: AUDIT_REPORT_VERSION,

    createdAt: new Date().toISOString(),

    website: audit.metadata.finalUrl,

    hostname: getHostname(
      audit.metadata.finalUrl,
    ),

    reportMode,

    source: options?.source ?? "PUBLIC_FUNNEL",

    audit,
  };
}

export function summarizeReport(
  report: AuditReport,
): AuditReportSummary {
  return {
    id: report.id,

    createdAt: report.createdAt,

    website: report.website,

    hostname: report.hostname,

    reportMode: report.reportMode,

    overallScore:
      report.audit.overallScore,

    grade: getAuditGrade(
      report.audit.overallScore,
    ).letter,

    criticalIssues:
      report.audit.summary.criticalIssues,

    quickWins:
      report.audit.summary.quickWins,

    opportunityScore:
      report.audit.opportunity.score,

    lead: null,
  };
}