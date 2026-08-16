import { getAuditGrade } from "../grading";
import { getCompetitiveVisibility } from "../competitive/visibility";
import {
  getQuickWins,
  getTopPriorities,
  isActionableFinding,
  type ReportActionPlan,
} from "../report-view";
import { buildGrowthReportViewModel } from "../report-view";
import type { AuditFinding, WebsiteAuditResult } from "../types";
import {
  MAX_AI_ACTION_PLAN_ITEMS,
  MAX_AI_COMPETITIVE_GAPS,
  MAX_AI_COMPETITIVE_OPPORTUNITIES,
  MAX_AI_COMPETITIVE_STRENGTHS,
  MAX_AI_FINDINGS,
  MAX_AI_QUICK_WINS,
  MAX_AI_SITE_PATTERNS,
} from "./constants";
import type { AiAuditContext, AiAuditFindingContext } from "./types";

function clip(value: string, max: number): string {
  const trimmed = value.trim();
  if (trimmed.length <= max) {
    return trimmed;
  }

  return `${trimmed.slice(0, max - 1).trimEnd()}…`;
}

function compactFinding(finding: AuditFinding): AiAuditFindingContext {
  return {
    id: finding.id,
    category: finding.category,
    status: finding.status,
    priority: finding.priority,
    businessImpact: finding.businessImpact,
    difficulty: finding.difficulty,
    estimatedFixMinutes: finding.estimatedFixMinutes,
    quickWin: finding.quickWin,
    title: clip(finding.title, 160),
    description: clip(finding.description, 400),
    recommendation: finding.recommendation
      ? clip(finding.recommendation, 280)
      : undefined,
  };
}

function sitePatterns(result: WebsiteAuditResult): string[] {
  const siteData = result.siteData;
  if (!siteData) {
    return [];
  }

  const patterns: string[] = [];
  const { content, conversion, local, links, metadata, indexability } =
    siteData;

  if (content.thinServicePageCount > 0) {
    patterns.push(
      `${content.thinServicePageCount} scanned service page(s) classified thin`,
    );
  }

  if (content.thinLocationPageCount > 0) {
    patterns.push(
      `${content.thinLocationPageCount} scanned location page(s) classified thin`,
    );
  }

  if (content.similarPagePairs.length > 0) {
    patterns.push(
      `${content.similarPagePairs.length} highly similar commercial page pair(s)`,
    );
  }

  if (conversion.keyPageCount > 0) {
    patterns.push(
      `Key-page conversion-path coverage ${conversion.keyPagesWithConversionPath}/${conversion.keyPageCount}`,
    );
  }

  if (local.contactPageFound) {
    patterns.push("Contact page found in the representative scan");
  }

  if (local.aboutPageFound) {
    patterns.push("About page found in the representative scan");
  }

  if (local.inconsistentContact) {
    patterns.push("Contact information looks inconsistent across key pages");
  }

  if (links.verifiedBrokenCount > 0) {
    patterns.push(
      `${links.verifiedBrokenCount} verified broken internal link(s) in the scan`,
    );
  }

  if (metadata.duplicateTitleGroups.length > 0) {
    patterns.push("Duplicate titles found among scanned pages");
  }

  if (indexability.importantNoindexPaths.length > 0) {
    patterns.push(
      `${indexability.importantNoindexPaths.length} important scanned page(s) appear noindex`,
    );
  }

  if (siteData.crawl.truncated) {
    patterns.push("Representative scan was truncated at the page or time cap");
  }

  return patterns.slice(0, MAX_AI_SITE_PATTERNS);
}

function pageTypeCounts(
  result: WebsiteAuditResult,
): Record<string, number> | undefined {
  if (!result.siteData) {
    return undefined;
  }

  const counts: Record<string, number> = {};
  for (const page of result.siteData.pages) {
    if (page.fetchStatus !== "success") {
      continue;
    }

    counts[page.pageType] = (counts[page.pageType] ?? 0) + 1;
  }

  return counts;
}

function actionPlanLines(plan: ReportActionPlan): string[] {
  const lines: string[] = [];

  for (const phase of plan.phases) {
    for (const finding of phase.findings) {
      lines.push(`${phase.title}: ${finding.title}`);
      if (lines.length >= MAX_AI_ACTION_PLAN_ITEMS) {
        return lines;
      }
    }
  }

  return lines;
}

export function buildAiAuditContext(
  result: WebsiteAuditResult,
): AiAuditContext {
  const view = buildGrowthReportViewModel(result, "consultation");
  const findings = view.report.findings
    .filter(isActionableFinding)
    .sort((left, right) => {
      const leftRank =
        left.priority === "critical"
          ? 4
          : left.priority === "high"
            ? 3
            : left.priority === "medium"
              ? 2
              : 1;
      const rightRank =
        right.priority === "critical"
          ? 4
          : right.priority === "high"
            ? 3
            : right.priority === "medium"
              ? 2
              : 1;

      if (rightRank !== leftRank) {
        return rightRank - leftRank;
      }

      return right.scoreImpact - left.scoreImpact;
    })
    .slice(0, MAX_AI_FINDINGS)
    .map(compactFinding);

  const competitive = result.competitiveData;
  const competitiveVisible =
    getCompetitiveVisibility(competitive, {
      showCompetitiveIntelligence: true,
    }) === "full";

  return {
    interpretationVersion: "v1",
    audit: {
      overallScore: view.report.overallScore,
      grade: getAuditGrade(view.report.overallScore).letter,
      categoryScores: view.report.categoryScores.map((score) => ({
        category: score.category,
        label: score.label,
        score: score.score,
        maxScore: score.maxScore,
      })),
      summary: {
        warnings: view.report.summary.warnings,
        failed: view.report.summary.failed,
        criticalIssues: view.report.summary.criticalIssues,
        quickWins: view.report.summary.quickWins,
        highImpactFindings: view.report.summary.highImpactFindings,
        estimatedFixMinutes: view.report.summary.estimatedFixMinutes,
      },
    },
    findings,
    site: result.siteData
      ? {
          available: true,
          pagesDiscovered: result.siteData.crawl.discoveredCount,
          pagesScanned: result.siteData.crawl.crawledCount,
          truncated: result.siteData.crawl.truncated,
          pageTypeCounts: pageTypeCounts(result),
          patterns: sitePatterns(result),
        }
      : { available: false, patterns: [] },
    competitive:
      competitiveVisible && competitive
        ? {
            available: true,
            suppliedCount: competitive.suppliedCount,
            analyzedCount: competitive.analyzedCount,
            status: competitive.status,
            gaps: competitive.findings.slice(0, MAX_AI_COMPETITIVE_GAPS).map(
              (item) => ({
                metric: item.metric,
                direction: item.direction,
                magnitude: item.magnitude,
                customerValue: item.customerValue,
                benchmarkValue: item.benchmarkValue,
              }),
            ),
            strengths: competitive.strengths
              .slice(0, MAX_AI_COMPETITIVE_STRENGTHS)
              .map((item) => ({
                metric: item.metric,
                title: item.title,
              })),
            opportunities: competitive.opportunities
              .slice(0, MAX_AI_COMPETITIVE_OPPORTUNITIES)
              .map((item) => ({
                title: item.title,
                description: clip(item.description, 240),
                magnitude: item.magnitude,
              })),
          }
        : { available: false },
    deterministicPlan: {
      quickWins: getQuickWins(view.report.findings, MAX_AI_QUICK_WINS).map(
        (item) => item.title,
      ),
      priorities: getTopPriorities(view.report.findings, 5).map(
        (item) => item.title,
      ),
      actionPlan: actionPlanLines(view.actionPlan),
    },
  };
}

export function aiContextContainsNeedle(
  context: AiAuditContext,
  needle: string,
): boolean {
  return JSON.stringify(context).includes(needle);
}
