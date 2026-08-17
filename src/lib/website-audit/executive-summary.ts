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

export function isUsableOverallScore(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

const UNAVAILABLE_OVERVIEW =
  "The audit identified several opportunities that may improve search visibility, usability, local relevance, and the path from visitor to lead.";

export function buildExecutiveSummary(
  findings: AuditFinding[],
  summary: WebsiteAuditResult["summary"],
  extras: {
    overallScore: number | null | undefined;
    categoryScores?: WebsiteAuditResult["categoryScores"];
  },
): ExecutiveSummary {
  const normalizedFindings = normalizeFindings(findings);
  const strengths = normalizedFindings
    .filter((finding) => finding.status === "pass")
    .slice(0, 3)
    .map((finding) => finding.title);
  const priorities = getTopPriorities(normalizedFindings, 5).map(
    (finding) => finding.title,
  );

  if (!isUsableOverallScore(extras.overallScore)) {
    return {
      heading: "Website overview",
      summary: UNAVAILABLE_OVERVIEW,
      strengths,
      priorities,
      estimatedFixMinutes: summary.estimatedFixMinutes,
    };
  }

  const view = getExecutiveSummary({
    findings: normalizedFindings,
    categoryScores: extras.categoryScores ?? [],
    overallScore: extras.overallScore,
    estimatedFixMinutes: summary.estimatedFixMinutes,
  });

  return {
    heading: view.heading,
    summary: view.overview,
    strengths,
    priorities,
    estimatedFixMinutes: summary.estimatedFixMinutes,
  };
}
