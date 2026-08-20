import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { isForbiddenAnalyticsParamKey } from "@/lib/analytics/commercial-events";
import { buildCompetitiveComparison } from "@/lib/competitive-intelligence/comparison/compare";
import type {
  ComparisonCompetitorInput,
  ComparisonInputAudit,
} from "@/lib/competitive-intelligence/comparison/types";
import type { CompetitiveInterpretationContent } from "@/lib/competitive-intelligence/interpretation/types";

import { buildCompetitiveGrowthReport } from "./build-report";
import { COMPETITIVE_REPORT_VERSION } from "./constants";
import { buildSampleDisclosure } from "./format";
import { getCompetitiveReportReadiness } from "./readiness";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function collectTsFiles(root: string): string[] {
  const entries = readdirSync(root);
  const files: string[] = [];

  for (const entry of entries) {
    const full = join(root, entry);
    const stats = statSync(full);

    if (stats.isDirectory()) {
      files.push(...collectTsFiles(full));
      continue;
    }

    if (extname(full) === ".ts" || extname(full) === ".tsx") {
      files.push(full);
    }
  }

  return files;
}

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, "../../../..");

assert(COMPETITIVE_REPORT_VERSION === 1, "report version is 1");

assert(
  getCompetitiveReportReadiness({
    hasTargetAudit: false,
    hasComparison: false,
    comparisonStale: false,
    hasCompletedInterpretation: false,
    interpretationStale: false,
    interpretationMatchesComparison: false,
  }).status === "MISSING_TARGET_AUDIT",
  "missing target audit",
);

assert(
  getCompetitiveReportReadiness({
    hasTargetAudit: true,
    hasComparison: false,
    comparisonStale: false,
    hasCompletedInterpretation: false,
    interpretationStale: false,
    interpretationMatchesComparison: false,
  }).status === "MISSING_COMPARISON",
  "missing comparison",
);

assert(
  getCompetitiveReportReadiness({
    hasTargetAudit: true,
    hasComparison: true,
    comparisonStale: true,
    comparisonStaleReasons: ["audit changed"],
    hasCompletedInterpretation: true,
    interpretationStale: false,
    interpretationMatchesComparison: true,
  }).status === "STALE_COMPARISON",
  "stale comparison",
);

assert(
  getCompetitiveReportReadiness({
    hasTargetAudit: true,
    hasComparison: true,
    comparisonStale: false,
    hasCompletedInterpretation: false,
    interpretationStale: false,
    interpretationMatchesComparison: false,
  }).status === "MISSING_INTERPRETATION",
  "missing interpretation",
);

assert(
  getCompetitiveReportReadiness({
    hasTargetAudit: true,
    hasComparison: true,
    comparisonStale: false,
    hasCompletedInterpretation: true,
    interpretationStale: true,
    interpretationStaleReasons: ["prompt changed"],
    interpretationMatchesComparison: true,
  }).status === "STALE_INTERPRETATION",
  "stale interpretation",
);

assert(
  getCompetitiveReportReadiness({
    hasTargetAudit: true,
    hasComparison: true,
    comparisonStale: false,
    hasCompletedInterpretation: true,
    interpretationStale: false,
    interpretationMatchesComparison: false,
  }).status === "STALE_INTERPRETATION",
  "interpretation not matching comparison is stale",
);

assert(
  getCompetitiveReportReadiness({
    hasTargetAudit: true,
    hasComparison: true,
    comparisonStale: false,
    hasCompletedInterpretation: true,
    interpretationStale: false,
    interpretationMatchesComparison: true,
  }).ready === true,
  "ready when comparison + interpretation current",
);

assert(
  buildSampleDisclosure(1).includes("1 selected competitor"),
  "one-competitor disclosure",
);
assert(
  !buildSampleDisclosure(1).toLowerCase().includes("market average"),
  "one-competitor avoids market average",
);
assert(
  buildSampleDisclosure(3).includes("3 selected local competitors"),
  "three-competitor disclosure",
);

const targetAudit: ComparisonInputAudit = {
  overallScore: 74,
  auditEngineVersion: 1,
  categoryScores: [
    {
      category: "technical",
      label: "Technical SEO",
      score: 85,
      maxScore: 100,
      applicable: true,
    },
    {
      category: "seo",
      label: "Search Optimization",
      score: 65,
      maxScore: 100,
      applicable: true,
    },
    {
      category: "content",
      label: "Content",
      score: 53,
      maxScore: 100,
      applicable: true,
    },
    {
      category: "cro",
      label: "Conversion",
      score: 80,
      maxScore: 100,
      applicable: true,
    },
    {
      category: "performance",
      label: "Performance",
      score: 90,
      maxScore: 100,
      applicable: true,
    },
  ],
  findings: [
    {
      id: "content-thin",
      title: "Thin service content",
      category: "content",
      status: "fail",
      priority: "high",
    },
    {
      id: "email-detection",
      title: "Email address was not detected",
      category: "content",
      status: "pass",
      priority: "low",
    },
  ],
};

function competitor(options: {
  id: string;
  name: string;
  overall: number;
  technical: number;
  seo: number;
  content: number;
  cro: number;
  performance: number;
}): ComparisonCompetitorInput {
  return {
    prospectCompetitorId: options.id,
    competitorAuditId: `audit-${options.id}`,
    businessName: options.name,
    website: `https://${options.id}.example`,
    competitiveRelevanceScore: 100,
    distanceMiles: 8,
    auditedAt: "2026-08-20T00:00:00.000Z",
    audit: {
      overallScore: options.overall,
      auditEngineVersion: 1,
      categoryScores: [
        {
          category: "technical",
          label: "Technical SEO",
          score: options.technical,
          maxScore: 100,
          applicable: true,
        },
        {
          category: "seo",
          label: "Search Optimization",
          score: options.seo,
          maxScore: 100,
          applicable: true,
        },
        {
          category: "content",
          label: "Content",
          score: options.content,
          maxScore: 100,
          applicable: true,
        },
        {
          category: "cro",
          label: "Conversion",
          score: options.cro,
          maxScore: 100,
          applicable: true,
        },
        {
          category: "performance",
          label: "Performance",
          score: options.performance,
          maxScore: 100,
          applicable: true,
        },
      ],
      findings: [
        {
          id: "content-thin",
          title: "Thin service content",
          category: "content",
          status: "pass",
          priority: "high",
        },
        {
          id: "email-detection",
          title: "Email address was not detected",
          category: "content",
          status: "fail",
          priority: "low",
        },
      ],
    },
  };
}

const comparison = buildCompetitiveComparison({
  prospectId: "p1",
  campaignId: "c1",
  auditReportId: "a1",
  targetLabel: "Rooftop Solutions",
  target: targetAudit,
  competitors: [
    competitor({
      id: "bradbury",
      name: "Bradbury Brothers",
      overall: 77,
      technical: 95,
      seo: 85,
      content: 95,
      cro: 90,
      performance: 70,
    }),
    competitor({
      id: "cover",
      name: "Cover HVAC",
      overall: 90,
      technical: 98,
      seo: 95,
      content: 97,
      cro: 95,
      performance: 75,
    }),
    competitor({
      id: "prestige",
      name: "Prestige Heating & Air",
      overall: 100,
      technical: 97,
      seo: 90,
      content: 95,
      cro: 94,
      performance: 75,
    }),
  ],
});

// Align fixture averages with production-style expectations where practical.
assert(comparison.overall.targetScore === 74, "target score 74");
assert(comparison.competitorsCompared.length === 3, "3 competitors");
assert(comparison.overall.targetRank === 4, "rank 4 of 4");

const contentCategory = comparison.categories.find((row) => row.category === "content");
const seoCategory = comparison.categories.find((row) => row.category === "seo");
const croCategory = comparison.categories.find((row) => row.category === "cro");
const technicalCategory = comparison.categories.find(
  (row) => row.category === "technical",
);
const performanceCategory = comparison.categories.find(
  (row) => row.category === "performance",
);

assert(contentCategory?.position === "MAJOR_GAP", "content major gap");
assert(seoCategory?.position === "MAJOR_GAP", "seo major gap");
assert(croCategory?.position === "GAP" || croCategory?.position === "MAJOR_GAP", "conversion gap");
assert(
  technicalCategory?.position === "GAP" || technicalCategory?.position === "MAJOR_GAP",
  "technical gap",
);
assert(
  performanceCategory?.position === "MAJOR_ADVANTAGE" ||
    performanceCategory?.position === "ADVANTAGE",
  "performance advantage",
);

const interpretation: CompetitiveInterpretationContent = {
  executiveSummary: {
    headline: "Website trails the selected comparison group",
    summary:
      "Content and search optimization are the clearest measured gaps. Performance remains a strength to preserve while closing weaker areas.",
  },
  competitivePosition: {
    assessment: "Behind the selected comparison group overall",
    explanation:
      "The Website Growth Score sits below the selected competitor average in this comparison.",
  },
  risks: [
    {
      sourceKey: "category:content",
      title: "Content gap",
      explanation: "Content is the largest measured gap in the current comparison.",
    },
    {
      sourceKey: "category:seo",
      title: "Search optimization gap",
      explanation:
        "Search Optimization deserves attention because the deterministic comparison shows a substantial gap.",
    },
  ],
  advantages: [
    {
      sourceKey: "category:performance",
      title: "Performance strength",
      explanation:
        "Preserve the site's performance strength while improving weaker areas.",
    },
  ],
  priorities: [
    {
      sourceKey: "category:content",
      supportingSourceKeys: ["advantage:category-performance"],
      title: "Strengthen content without sacrificing performance",
      rationale:
        "Content is the largest measured gap; preserve existing performance strength while closing it.",
      recommendedActions: [
        "Strengthen core service pages",
        "Improve location and service-area content",
        "Clarify service information",
      ],
    },
    {
      sourceKey: "category:seo",
      supportingSourceKeys: [],
      title: "Improve search optimization fundamentals",
      rationale:
        "Search Optimization shows a major gap versus the selected comparison group.",
      recommendedActions: [
        "Make important service pages easier for search engines to understand",
      ],
    },
    {
      sourceKey: "category:cro",
      supportingSourceKeys: [],
      title: "Clarify conversion paths",
      rationale: "Conversion trails the selected comparison group.",
      recommendedActions: [
        "Make the next step clearer for visitors",
        "Strengthen calls to action",
      ],
    },
  ],
  ninetyDayPlan: [
    {
      phase: "Days 1–30",
      objective: "Address the largest competitive weaknesses first.",
      actions: ["Prioritize content depth on core service pages"],
      sourceKeys: ["category:content"],
    },
    {
      phase: "Days 31–60",
      objective: "Strengthen secondary gaps.",
      actions: ["Improve search optimization fundamentals"],
      sourceKeys: ["category:seo"],
    },
    {
      phase: "Days 61–90",
      objective: "Refine and reassess.",
      actions: ["Clarify conversion paths and reassess priorities"],
      sourceKeys: ["category:cro", "overall"],
    },
  ],
  internalTalkingPoints: [
    "INTERNAL ONLY: mention pricing strategy privately.",
  ],
};

const report = buildCompetitiveGrowthReport({
  businessName: "Rooftop Solutions",
  locationLabel: "Magnolia, TX",
  analysisDate: new Date("2026-08-20T12:00:00.000Z"),
  comparison,
  interpretation,
});

assert(report.metrics.websiteGrowthScore === 74, "report uses Sprint 11 score");
assert(report.competitorCount === 3, "report competitor count 3");
assert(
  report.opportunities[0]?.title === "Content",
  "content is biggest opportunity",
);
assert(
  report.opportunities.some((row) => row.title === "Search Optimization"),
  "seo opportunity present",
);
assert(
  report.advantages.some((row) => row.title === "Performance"),
  "performance advantage prominent",
);
assert(
  !report.advantages.some((row) =>
    row.title.toLowerCase().includes("email address"),
  ),
  "low-value email finding does not dominate advantages",
);
assert(
  report.sampleDisclosure.includes("3 selected local competitors"),
  "selected competitors language",
);
assert(
  !JSON.stringify(report).toLowerCase().includes("market average"),
  "no market average language",
);
assert(
  !JSON.stringify(report).toLowerCase().includes("industry average"),
  "no industry average language",
);
assert(
  !JSON.stringify(report).includes("sourceKey"),
  "no sourceKey in report view model",
);
assert(
  !JSON.stringify(report).includes("INTERNAL ONLY"),
  "no internal talking points exposed",
);
assert(
  !JSON.stringify(report).includes("will generate more leads"),
  "no unsupported commercial guarantees",
);
assert(
  report.priorities[0]?.evidenceLines.length > 0,
  "priority evidence shown once from Sprint 11",
);
assert(report.cta.primaryHref === "/contact", "safe existing contact href");

const serializedReport = JSON.stringify(report);
assert(!serializedReport.includes("COMPETITIVE_GAP"), "no COMPETITIVE_GAP enum on client report");
assert(!serializedReport.includes("MAJOR_GAP"), "no MAJOR_GAP enum on client report");
assert(!serializedReport.includes("MAJOR_ADVANTAGE"), "no MAJOR_ADVANTAGE enum on client report");
assert(!serializedReport.includes("TARGET_ONLY_WEAKNESS"), "no finding enum leakage");
assert(!serializedReport.includes("sourceKey"), "no sourceKey in report view model");
assert(
  !serializedReport.includes("supportingSourceKeys"),
  "no supportingSourceKeys in report view model",
);

const viewSource = readFileSync(
  join(
    repoRoot,
    "src/components/prospecting/competitive-growth-report-view.tsx",
  ),
  "utf8",
);
assert(viewSource.includes('(your website)'), "your website label present");
assert(
  viewSource.includes('{" "}') || viewSource.includes(" (your website)"),
  "your website spacing includes leading space",
);
assert(!viewSource.includes("internalTalkingPoints"), "UI hides talking points");
assert(!viewSource.includes("sourceKey"), "UI hides source keys");
assert(viewSource.includes("print:"), "print-friendly classes present");

const reportModuleFiles = collectTsFiles(here).filter(
  (file) => !file.endsWith(".verify.ts"),
);
for (const file of reportModuleFiles) {
  const source = readFileSync(file, "utf8");
  assert(!source.includes("openai"), `${file}: no OpenAI`);
  assert(!source.includes("OpenAI"), `${file}: no OpenAI client`);
  assert(!source.includes("places.googleapis"), `${file}: no Places`);
  assert(!source.includes("resend"), `${file}: no Resend`);
  assert(!source.includes("runDeterministicWebsiteAudit"), `${file}: no crawl`);
  assert(!source.includes("discoverContacts"), `${file}: no contact discovery`);
}

const routeSource = readFileSync(
  join(
    repoRoot,
    "src/app/reports/prospecting/[campaignId]/prospects/[prospectId]/competitive-report/page.tsx",
  ),
  "utf8",
);
assert(routeSource.includes("index: false"), "report route is noindex");
assert(
  routeSource.includes("loadCompetitiveGrowthReport"),
  "report route loads view model",
);
assert(!routeSource.includes("generateCompetitive"), "no generation on report route");

assert(
  isForbiddenAnalyticsParamKey("competitive_report"),
  "competitive_report analytics forbidden",
);
assert(
  isForbiddenAnalyticsParamKey("competitive_growth_analysis"),
  "competitive_growth_analysis analytics forbidden",
);
assert(
  isForbiddenAnalyticsParamKey("source_key"),
  "source_key analytics forbidden",
);

const publicReportFiles = collectTsFiles(join(repoRoot, "src/app/report"));
for (const file of publicReportFiles) {
  const source = readFileSync(file, "utf8");
  assert(
    !source.includes("CompetitiveGrowthReport"),
    `${file}: public report isolation`,
  );
  assert(
    !source.includes("competitive-report"),
    `${file}: no competitive report imports on public routes`,
  );
}

console.log("report.verify.ts: PASS");
