import { emptyCompetitiveProfile } from "./competitive/profile";
import { isCompetitiveData } from "./competitive/visibility";
import type { CompetitiveData, CompetitiveFindingView } from "./competitive/types";
import type { GrowthReportViewModel } from "./report-view";
import type {
  AuditFinding,
  AuditOpportunity,
  AuditPageData,
  AuditRobotsDirectiveData,
  WebsiteAuditResult,
} from "./types";

const EMPTY_ROBOTS_DIRECTIVE: AuditRobotsDirectiveData = {
  raw: null,
  directives: [],
  noindex: false,
  nofollow: false,
  none: false,
  noarchive: false,
  nosnippet: false,
  maxSnippet: null,
  maxImagePreview: null,
  maxVideoPreview: null,
};

const TEASER_COMPETITIVE_FINDING: CompetitiveFindingView = {
  id: "COMP_SERVICE_COVERAGE_GAP",
  metric: "service_pages",
  direction: "behind",
  magnitude: "small",
  priority: "low",
  businessImpact: "low",
  title: "",
  description: "",
  recommendation: "",
  customerValue: 0,
  benchmarkValue: 0,
  competitorValues: [],
  unit: "count",
};

function redactFindingForFree(
  finding: AuditFinding,
  keepDescription: boolean,
): AuditFinding {
  return {
    id: finding.id,
    title: finding.title,
    description: keepDescription ? finding.description : "",
    status: finding.status,
    category: finding.category,
    scoreImpact: finding.scoreImpact,
    priority: finding.priority,
    businessImpact: finding.businessImpact,
    difficulty: finding.difficulty,
    estimatedFixMinutes: finding.estimatedFixMinutes,
    quickWin: finding.quickWin,
  };
}

function redactPageDataForFree(): AuditPageData {
  return {
    title: { value: null, count: 0, length: 0, isEmpty: true },
    metaDescription: { value: null, count: 0, length: 0, isEmpty: true },
    canonical: {
      rawValues: [],
      count: 0,
      value: null,
      resolvedUrl: null,
      valid: false,
      selfReferencing: false,
      sameOrigin: false,
      protocolMatches: false,
    },
    viewport: null,
    robots: {
      meta: EMPTY_ROBOTS_DIRECTIVE,
      header: EMPTY_ROBOTS_DIRECTIVE,
      effective: {
        noindex: false,
        nofollow: false,
        noarchive: false,
        nosnippet: false,
      },
    },
    h1Count: 0,
    h1Values: [],
    h2Count: 0,
    h3Count: 0,
    imageCount: 0,
    imagesWithoutAlt: 0,
    internalLinkCount: 0,
    externalLinkCount: 0,
    hasOpenGraphTitle: false,
    hasOpenGraphDescription: false,
    hasOpenGraphImage: false,
    hasStructuredData: false,
    structuredDataTypes: [],
    hasPhoneNumber: false,
    hasEmailAddress: false,
    hasPhysicalAddressSignals: false,
    hasLocalBusinessSignals: false,
  };
}

function redactCompetitiveDataForFree(
  data: CompetitiveData | undefined,
): CompetitiveData | undefined {
  if (!isCompetitiveData(data)) {
    return undefined;
  }

  return {
    status: data.status,
    submittedCount: data.submittedCount,
    suppliedCount: data.suppliedCount,
    analyzedCount: data.analyzedCount,
    customer: emptyCompetitiveProfile(
      data.customer.submittedUrl,
      data.customer.status,
      data.customer.finalUrl,
    ),
    competitors: [],
    skipped: [],
    gaps: [],
    findings: data.findings.map(() => ({ ...TEASER_COMPETITIVE_FINDING })),
    strengths: [],
    opportunities: [],
    disclosure: data.disclosure,
    runtimeMs: 0,
  };
}

function redactOpportunityForFree(opportunity: AuditOpportunity): AuditOpportunity {
  return {
    score: opportunity.score,
    level: opportunity.level,
    trafficGainPercent: { minimum: 0, maximum: 0 },
    monthlyLeadGain: { minimum: 0, maximum: 0 },
    monthlyRevenueOpportunity: { minimum: 0, maximum: 0 },
    estimatedFixMinutes: opportunity.estimatedFixMinutes,
    confidence: opportunity.confidence,
    assumptions: [],
    insights: [],
  };
}

export function listNonEmptyFieldValues(
  value: unknown,
  field: string,
): string[] {
  const found: string[] = [];

  function visit(node: unknown): void {
    if (!node || typeof node !== "object") {
      return;
    }

    if (Array.isArray(node)) {
      for (const item of node) {
        visit(item);
      }
      return;
    }

    for (const [key, child] of Object.entries(node)) {
      if (
        key === field &&
        typeof child === "string" &&
        child.trim().length > 0
      ) {
        found.push(child);
      }

      visit(child);
    }
  }

  visit(value);
  return found;
}

export function sanitizeFreeGrowthReportView(
  view: GrowthReportViewModel,
): GrowthReportViewModel {
  if (view.tier !== "free") {
    return view;
  }

  const surfacedIds = new Set([
    ...view.topPriorities.map((finding) => finding.id),
    ...view.quickWins.map((finding) => finding.id),
  ]);

  function redactScorecardItem(
    item: GrowthReportViewModel["scorecard"][number],
  ): GrowthReportViewModel["scorecard"][number] {
    return {
      ...item,
      topFinding: item.topFinding
        ? redactFindingForFree(
            item.topFinding,
            surfacedIds.has(item.topFinding.id),
          )
        : null,
      positiveFindings: item.positiveFindings.map((finding) =>
        redactFindingForFree(finding, surfacedIds.has(finding.id)),
      ),
    };
  }

  const scorecard = view.scorecard.map(redactScorecardItem);

  return {
    ...view,
    topPriorities: view.topPriorities.map((finding) =>
      redactFindingForFree(finding, true),
    ),
    quickWins: view.quickWins.map((finding) =>
      redactFindingForFree(finding, true),
    ),
    actionPlan: { phases: [] },
    scorecard,
    strongest: view.strongest ? redactScorecardItem(view.strongest) : null,
    weakest: view.weakest ? redactScorecardItem(view.weakest) : null,
    summary: {
      ...view.summary,
      strongest: view.summary.strongest
        ? redactScorecardItem(view.summary.strongest)
        : null,
      weakest: view.summary.weakest
        ? redactScorecardItem(view.summary.weakest)
        : null,
    },
    report: {
      ...view.report,
      findings: view.report.findings.map((finding) =>
        redactFindingForFree(finding, surfacedIds.has(finding.id)),
      ),
      pageData: redactPageDataForFree(),
      siteData: undefined,
      competitiveData: redactCompetitiveDataForFree(view.report.competitiveData),
    },
  };
}

export function toClientWebsiteAuditResult(
  result: WebsiteAuditResult,
  view: GrowthReportViewModel,
): WebsiteAuditResult {
  if (view.tier !== "free") {
    return result;
  }

  return {
    success: true,
    metadata: view.report.metadata,
    pageData: view.report.pageData,
    findings: view.report.findings,
    categoryScores: view.report.categoryScores,
    overallScore: view.report.overallScore,
    summary: view.report.summary,
    opportunity: redactOpportunityForFree(result.opportunity),
    competitiveData: view.report.competitiveData,
  };
}
