import { normalizeFindings } from "./report-compat";
import { getExecutiveSummary, getTopPriorities } from "./report-view";
import type { AuditFinding, WebsiteAuditResult } from "./types";

export interface ExecutiveSummary {
  heading: string;

  summary: string;

  strengths: string[];

  priorities: string[];

  estimatedFixMinutes: number;
}

export function buildExecutiveSummary(
  findings: AuditFinding[],
  summary: WebsiteAuditResult["summary"],
  extras?: {
    overallScore?: number;
    categoryScores?: WebsiteAuditResult["categoryScores"];
  },
): ExecutiveSummary {
  const normalizedFindings = normalizeFindings(findings);
  const view = getExecutiveSummary({
    findings: normalizedFindings,
    categoryScores: extras?.categoryScores ?? [],
    overallScore: extras?.overallScore ?? 0,
    estimatedFixMinutes: summary.estimatedFixMinutes,
  });

  return {
    heading: view.heading,
    summary: view.overview,
    strengths: normalizedFindings
      .filter((finding) => finding.status === "pass")
      .slice(0, 3)
      .map((finding) => finding.title),
    priorities: getTopPriorities(normalizedFindings, 5).map(
      (finding) => finding.title,
    ),
    estimatedFixMinutes: summary.estimatedFixMinutes,
  };
}
