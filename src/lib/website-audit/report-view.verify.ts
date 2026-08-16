import {
  getActionPlan,
  getCategoryScorecard,
  getQuickWins,
  getScoreBand,
  getStrongestCategory,
  getTopPriorities,
  getWeakestCategory,
  formatEstimatedEffort,
  getReportCapabilities,
  buildGrowthReportViewModel,
} from "./report-view";
import { normalizeAuditReport } from "./report-compat";
import type {
  AuditCategoryScore,
  AuditFinding,
  WebsiteAuditResult,
} from "./types";

function assert(condition: unknown, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function finding(
  partial: Partial<AuditFinding> & Pick<AuditFinding, "id" | "title">,
): AuditFinding {
  return {
    description: partial.description ?? partial.title,
    recommendation: "Do the recommended fix.",
    status: "warning",
    category: "seo",
    scoreImpact: 4,
    priority: "medium",
    businessImpact: "medium",
    difficulty: "medium",
    estimatedFixMinutes: 20,
    quickWin: false,
    ...partial,
  };
}

assert(getScoreBand(95).id === "excellent", "score band 95 excellent");
assert(getScoreBand(84).id === "strong", "score band 84 strong");
assert(getScoreBand(72).id === "good-foundation", "score band 72 foundation");
assert(getScoreBand(64).id === "needs-improvement", "score band 64");
assert(getScoreBand(50).id === "significant-opportunities", "score band 50");
assert(getScoreBand(12).id === "high-priority", "score band 12");
assert(getScoreBand(Number.NaN).id === "high-priority", "NaN score band");

const categoryScores: AuditCategoryScore[] = [
  { category: "technical", label: "Technical", score: 18, maxScore: 20 },
  { category: "seo", label: "Search", score: 10, maxScore: 20 },
  { category: "cro", label: "Conversion", score: 6, maxScore: 15 },
];

const mixedFindings: AuditFinding[] = [
  finding({
    id: "noindex",
    title: "Page is blocked from indexing",
    category: "technical",
    status: "fail",
    priority: "critical",
    businessImpact: "high",
    difficulty: "medium",
    scoreImpact: 12,
    estimatedFixMinutes: 45,
  }),
  finding({
    id: "conversion-path",
    title: "Primary conversion path is missing",
    category: "cro",
    status: "fail",
    priority: "high",
    businessImpact: "high",
    difficulty: "medium",
    scoreImpact: 10,
    estimatedFixMinutes: 60,
  }),
  finding({
    id: "local-schema-missing",
    title: "LocalBusiness schema missing",
    category: "local",
    status: "warning",
    priority: "medium",
    businessImpact: "medium",
    difficulty: "medium",
    scoreImpact: 4,
    estimatedFixMinutes: 30,
  }),
  finding({
    id: "meta-description",
    title: "Meta description is missing",
    category: "seo",
    status: "warning",
    priority: "low",
    businessImpact: "low",
    difficulty: "easy",
    scoreImpact: 2,
    estimatedFixMinutes: 10,
    quickWin: true,
  }),
  finding({
    id: "title-ok",
    title: "Title is present",
    category: "seo",
    status: "pass",
    priority: "low",
    scoreImpact: 5,
  }),
];

const priorities = getTopPriorities(mixedFindings, 5);
assert(priorities[0]?.id === "noindex", "indexability is first priority");
assert(priorities[1]?.id === "conversion-path", "conversion is second");
assert(
  priorities.findIndex((item) => item.id === "meta-description") >
    priorities.findIndex((item) => item.id === "conversion-path"),
  "low metadata does not outrank conversion",
);

const scorecard = getCategoryScorecard(categoryScores, mixedFindings);
assert(getStrongestCategory(scorecard)?.category === "technical", "strongest technical");
assert(getWeakestCategory(scorecard)?.category === "cro", "weakest conversion");

const easyWin = finding({
  id: "phone-link",
  title: "Make the phone number clickable",
  category: "cro",
  priority: "medium",
  businessImpact: "high",
  difficulty: "easy",
  estimatedFixMinutes: 15,
  quickWin: true,
});
const hardFix = finding({
  id: "rebuild-content",
  title: "Rebuild thin location pages",
  category: "content",
  priority: "high",
  businessImpact: "high",
  difficulty: "hard",
  estimatedFixMinutes: 240,
  quickWin: false,
});
const wins = getQuickWins([easyWin, hardFix], 5);
assert(wins.some((item) => item.id === "phone-link"), "easy win included");
assert(
  !wins.some((item) => item.id === "rebuild-content"),
  "hard fix is not a quick win",
);

const plan = getActionPlan(mixedFindings.concat(hardFix));
const planIds = plan.phases.flatMap((phase) =>
  phase.findings.map((item) => item.id),
);
assert(new Set(planIds).size === planIds.length, "action plan has no duplicates");
assert(
  plan.phases[0]?.findings.some((item) => item.id === "noindex"),
  "phase 1 includes indexability",
);
assert(
  plan.phases[0]?.findings.some((item) => item.id === "conversion-path"),
  "phase 1 includes conversion",
);

assert(formatEstimatedEffort(20) === "< 1 hour", "effort under an hour");
assert(formatEstimatedEffort(90) === "1–3 hours", "effort 1-3");
assert(formatEstimatedEffort(200) === "3–6 hours", "effort 3-6");
assert(formatEstimatedEffort(400) === "6–12 hours", "effort 6-12");
assert(formatEstimatedEffort(800) === "1–2 days", "effort 1-2 days");
assert(formatEstimatedEffort(2000) === "Several days", "effort several days");

const free = getReportCapabilities("free");
assert(free.maxPriorityFindings === 3, "free max 3 priorities");
assert(free.maxQuickWins === 3, "free max 3 quick wins");
assert(free.showActionPlan === false, "free hides action plan");
assert(free.showFullFindings === false, "free hides all findings");
assert(free.showRecommendations === false, "free limits recommendations");
assert(free.showUpgradeCta === true, "free shows upgrade");
assert(free.showImplementationCta === false, "free keeps implementation CTA secondary");

const professional = getReportCapabilities("professional");
assert(professional.showActionPlan === true, "pro action plan");
assert(professional.showFullFindings === true, "pro all findings");
assert(professional.showRecommendations === true, "pro recommendations");
assert(professional.maxPriorityFindings === 5, "pro 5 priorities");
assert(professional.showUpgradeCta === false, "pro has no upgrade");

const oldReport = normalizeAuditReport({
  success: true,
  metadata: {
    requestedUrl: "https://example.com",
    finalUrl: "https://example.com",
    statusCode: 200,
    contentType: "text/html",
    fetchedAt: "2024-01-01T00:00:00.000Z",
  },
  pageData: {
    title: "Example",
    h1Count: 1,
    h2Count: 0,
    h3Count: 0,
    imageCount: 0,
    imagesWithoutAlt: 0,
    internalLinkCount: 0,
    externalLinkCount: 0,
    structuredDataTypes: [],
    hasStructuredData: false,
    hasPhoneNumber: false,
    hasEmailAddress: false,
    hasPhysicalAddressSignals: false,
    hasLocalBusinessSignals: false,
  } as unknown as WebsiteAuditResult["pageData"],
  findings: [
    {
      id: "legacy-title",
      title: "Title is present",
      description: "A title exists.",
      status: "pass",
      category: "seo",
      scoreImpact: 5,
    } as AuditFinding,
  ],
  categoryScores: [
    { category: "seo", label: "Search", score: 10, maxScore: 20 },
  ],
  overallScore: 50,
  summary: {
    passed: 1,
    warnings: 0,
    failed: 0,
    criticalIssues: 0,
    quickWins: 0,
    highImpactFindings: 0,
    estimatedFixMinutes: 0,
  },
  opportunity: {
    score: 20,
    level: "low",
    trafficGainPercent: { minimum: 0, maximum: 0 },
    monthlyLeadGain: { minimum: 0, maximum: 0 },
    monthlyRevenueOpportunity: { minimum: 0, maximum: 0 },
    estimatedFixMinutes: 0,
    confidence: "low",
    assumptions: [],
    insights: [],
  },
});

assert(oldReport.overallScore === 50, "old overall score preserved");
assert(oldReport.findings[0]?.priority === "medium", "legacy finding gets defaults");
assert(
  Number.isFinite(oldReport.overallScore) && oldReport.overallScore >= 0,
  "no NaN overall score",
);

const excellent = buildGrowthReportViewModel(
  {
    success: true,
    metadata: oldReport.metadata,
    pageData: oldReport.pageData,
    findings: [
      finding({
        id: "pass-1",
        title: "Page is indexable",
        category: "technical",
        status: "pass",
        scoreImpact: 8,
      }),
      finding({
        id: "tiny",
        title: "Add slightly richer alt text",
        category: "accessibility",
        status: "warning",
        priority: "low",
        businessImpact: "low",
        difficulty: "easy",
        scoreImpact: 1,
        estimatedFixMinutes: 10,
        quickWin: true,
      }),
    ],
    categoryScores: [
      { category: "technical", label: "Technical", score: 19, maxScore: 20 },
      { category: "accessibility", label: "Accessibility", score: 9, maxScore: 10 },
    ],
    overallScore: 94,
    summary: {
      passed: 1,
      warnings: 1,
      failed: 0,
      criticalIssues: 0,
      quickWins: 1,
      highImpactFindings: 0,
      estimatedFixMinutes: 10,
    },
    opportunity: {
      score: 10,
      level: "low",
      trafficGainPercent: { minimum: 0, maximum: 0 },
      monthlyLeadGain: { minimum: 0, maximum: 0 },
      monthlyRevenueOpportunity: { minimum: 0, maximum: 0 },
      estimatedFixMinutes: 10,
      confidence: "low",
      assumptions: [],
      insights: [],
    },
  },
  "public",
);

assert(excellent.scoreBand.id === "excellent", "excellent report band");
assert(excellent.topPriorities.length === 1, "excellent report is not empty");
assert(excellent.summary.heading.toLowerCase().includes("strong"), "excellent heading");

const weightedResult: WebsiteAuditResult = {
  success: true,
  metadata: oldReport.metadata,
  pageData: oldReport.pageData,
  findings: mixedFindings,
  categoryScores,
  overallScore: 61,
  summary: {
    passed: 1,
    warnings: 3,
    failed: 2,
    criticalIssues: 1,
    quickWins: 1,
    highImpactFindings: 2,
    estimatedFixMinutes: 165,
  },
  opportunity: {
    score: 70,
    level: "high",
    trafficGainPercent: { minimum: 0, maximum: 0 },
    monthlyLeadGain: { minimum: 0, maximum: 0 },
    monthlyRevenueOpportunity: { minimum: 0, maximum: 0 },
    estimatedFixMinutes: 165,
    confidence: "medium",
    assumptions: [],
    insights: [],
  },
};

const freeView = buildGrowthReportViewModel(weightedResult, "public");

assert(freeView.tier === "free", "public maps to free");
assert(freeView.topPriorities.length === 3, "free shows 3 priorities");
assert(freeView.actionPlan.phases.length === 0, "free does not expose action plan");
assert(freeView.capabilities.showUpgradeCta, "free upgrade visible");

const paidPublicView = buildGrowthReportViewModel(weightedResult, "public", {
  professionallyUnlocked: true,
});
assert(paidPublicView.tier === "professional", "paid public maps to professional");
assert(paidPublicView.capabilities.showActionPlan, "paid public shows action plan");
assert(
  paidPublicView.capabilities.showUpgradeCta === false,
  "paid public hides upgrade",
);

const proView = buildGrowthReportViewModel(weightedResult, "consultation");
assert(proView.tier === "professional", "consultation maps to professional");
assert(proView.capabilities.showActionPlan, "professional action plan");
assert(proView.actionPlan.phases.length > 0, "professional has phases");
assert(proView.topPriorities.length >= 3, "professional has full priorities");

console.log("report view verification passed");
process.exit(0);
