import type { AuditFinding, WebsiteAuditResult } from "@/lib/website-audit/types";

import { SKIP_REASON } from "./constants";
import { selectOutreachFindings } from "./findings";
import { clampQualificationBatchSize } from "./limit";
import { qualifyProspectAudit } from "./qualify";
import { rankCampaignProspects } from "./rank";
import type { QualificationContext } from "./types";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function finding(
  partial: Partial<AuditFinding> & Pick<AuditFinding, "id" | "title">,
): AuditFinding {
  return {
    description:
      partial.description ??
      `${partial.title} is visible on the website and can be explained to the owner with specific page evidence.`,
    recommendation: "Fix the issue on the affected pages.",
    status: "fail",
    category: "content",
    scoreImpact: 6,
    priority: "high",
    businessImpact: "high",
    difficulty: "easy",
    estimatedFixMinutes: 20,
    quickWin: false,
    ...partial,
  };
}

function audit(overrides: Partial<WebsiteAuditResult> = {}): WebsiteAuditResult {
  return {
    success: true,
    metadata: {
      requestedUrl: "https://example.com",
      finalUrl: "https://example.com",
      statusCode: 200,
      contentType: "text/html",
      fetchedAt: "2026-01-01T00:00:00.000Z",
    },
    pageData: {} as WebsiteAuditResult["pageData"],
    findings: [],
    categoryScores: [
      {
        category: "content",
        label: "Content",
        score: 10,
        maxScore: 15,
        applicable: true,
      },
      {
        category: "seo",
        label: "Search Optimization",
        score: 16,
        maxScore: 20,
        applicable: true,
      },
      {
        category: "local",
        label: "Local SEO",
        score: 7,
        maxScore: 10,
        applicable: true,
      },
      {
        category: "cro",
        label: "Conversion",
        score: 12,
        maxScore: 15,
        applicable: true,
      },
      {
        category: "performance",
        label: "Performance",
        score: 8,
        maxScore: 10,
        applicable: true,
      },
    ],
    overallScore: 80,
    summary: {
      passed: 4,
      warnings: 1,
      failed: 1,
      criticalIssues: 0,
      quickWins: 1,
      highImpactFindings: 1,
      estimatedFixMinutes: 30,
    },
    opportunity: {
      score: 99,
      level: "very-high",
      trafficGainPercent: { minimum: 40, maximum: 80 },
      monthlyLeadGain: { minimum: 10, maximum: 20 },
      monthlyRevenueOpportunity: { minimum: 5000, maximum: 12000 },
      estimatedFixMinutes: 30,
      confidence: "high",
      assumptions: ["modeled"],
      insights: [],
    },
    ...overrides,
  };
}

const context: QualificationContext = {
  hostname: "example.com",
  website: "https://example.com",
  city: "Magnolia",
  state: "TX",
  campaignCity: "Magnolia",
  campaignState: "TX",
  suppressed: false,
  customerSuppressed: false,
  existingLead: false,
};

const countryAir = qualifyProspectAudit(
  audit({
    overallScore: 88,
    findings: [
      finding({
        id: "missing-meta-description",
        title: "Missing meta description",
        category: "seo",
      }),
    ],
    categoryScores: [
      {
        category: "content",
        label: "Content",
        score: 8,
        maxScore: 15,
        applicable: true,
      },
    ],
  }),
  context,
);
assert(countryAir.label !== "SKIP", "88 overall with a content/SEO finding still qualifies");
assert(countryAir.score > 0, "high overall score is not a hard reject");

const happyPlumbing = qualifyProspectAudit(
  audit({
    overallScore: 87,
    findings: [
      finding({
        id: "site-duplicate-titles",
        title: "Duplicate titles across important pages",
        category: "seo",
        businessImpact: "high",
        priority: "high",
      }),
    ],
  }),
  context,
);
assert(happyPlumbing.primaryFindingId === "site-duplicate-titles", "duplicate titles are the primary hook");
assert(happyPlumbing.label === "STRONG" || happyPlumbing.label === "GOOD", "duplicate-title evidence qualifies strongly");

const rooftop = qualifyProspectAudit(
  audit({
    overallScore: 74,
    findings: [
      finding({
        id: "missing-meta-description",
        title: "Missing meta description",
        category: "seo",
      }),
      finding({
        id: "site-weak-internal-link-support",
        title: "Weak internal linking between key pages",
        category: "content",
        businessImpact: "medium",
        priority: "medium",
      }),
    ],
  }),
  context,
);
assert(rooftop.label !== "SKIP", "missing meta plus weak linking qualifies");

const roa = qualifyProspectAudit(
  audit({
    overallScore: 77,
    findings: [
      finding({
        id: "missing-h1",
        title: "The page is missing a meaningful H1",
        category: "content",
        businessImpact: "high",
        priority: "high",
      }),
    ],
    categoryScores: [
      {
        category: "content",
        label: "Content",
        score: 0,
        maxScore: 15,
        applicable: true,
      },
    ],
  }),
  context,
);
assert(roa.primaryFindingId === "missing-h1", "missing H1 is selected over a Content 0 category score");
assert(roa.label !== "SKIP", "missing H1 qualifies");
assert(
  !roa.factors.some((factor) => factor.detail.includes("Content 0")),
  "category zero is not the outreach hook",
);

const montenegro = qualifyProspectAudit(
  audit({
    overallScore: 83,
    findings: [
      finding({
        id: "site-duplicate-titles",
        title: "Multiple pages share the same title",
        category: "seo",
      }),
      finding({
        id: "local-schema-incomplete",
        title: "LocalBusiness schema is incomplete",
        category: "local",
        businessImpact: "medium",
        priority: "medium",
      }),
    ],
  }),
  context,
);
assert(montenegro.label !== "SKIP", "duplicate titles plus incomplete LocalBusiness qualify");
assert(
  montenegro.primaryFindingId === "site-duplicate-titles" ||
    montenegro.secondaryFindingId === "local-schema-incomplete",
  "LocalBusiness incomplete is a valid outreach finding",
);

const performanceOnly = qualifyProspectAudit(
  audit({
    overallScore: 41,
    findings: [
      finding({
        id: "performance-html-size",
        title: "HTML document is large",
        category: "performance",
        description: "The HTML document is larger than expected for a local service homepage.",
      }),
    ],
  }),
  context,
);
assert(performanceOnly.label === "SKIP", "performance-only issues do not dominate ranking");
assert(performanceOnly.skipReason === SKIP_REASON.NO_CREDIBLE_FINDING, "performance-only skips for no credible finding");

const noFinding = qualifyProspectAudit(audit({ overallScore: 90, findings: [] }), context);
assert(noFinding.skipReason === SKIP_REASON.NO_CREDIBLE_FINDING, "no allowlisted finding skips");

const selected = selectOutreachFindings([
  finding({
    id: "performance-html-size",
    title: "Large HTML document",
    category: "performance",
  }),
  finding({
    id: "missing-h1",
    title: "The homepage is missing an H1",
    category: "content",
  }),
]);
assert(selected.primary?.id === "missing-h1", "allowlist prefers missing H1 over performance");

const manyQuickWins = qualifyProspectAudit(
  audit({
    findings: [
      finding({
        id: "missing-h1",
        title: "Missing H1 on the homepage",
        quickWin: true,
      }),
      finding({
        id: "missing-meta-description",
        title: "Missing meta description",
        category: "seo",
        quickWin: true,
      }),
      finding({
        id: "empty-meta-description",
        title: "Empty meta description tag",
        category: "seo",
        quickWin: true,
      }),
      finding({
        id: "missing-internal-links",
        title: "Homepage has no internal links",
        quickWin: true,
      }),
      finding({
        id: "limited-internal-link-diversity",
        title: "Internal links point at too few pages",
        quickWin: true,
      }),
    ],
  }),
  context,
);
const quickWinFactor = manyQuickWins.factors.find((factor) => factor.id === "quick-wins");
assert(quickWinFactor !== undefined, "quick wins contribute");
assert((quickWinFactor?.delta ?? 0) <= 9, "quick win points are capped");

assert(
  !manyQuickWins.factors.some((factor) => factor.detail.toLowerCase().includes("revenue")),
  "modeled revenue estimates are not qualification factors",
);

const ranked = rankCampaignProspects(
  [
    {
      prospectId: "p-low",
      businessName: "Low",
      qualificationStatus: "QUALIFIED",
      score: 40,
    },
    {
      prospectId: "p-high",
      businessName: "High",
      qualificationStatus: "QUALIFIED",
      score: 90,
    },
    {
      prospectId: "p-mid",
      businessName: "Mid",
      qualificationStatus: "QUALIFIED",
      score: 70,
    },
    {
      prospectId: "p-skip",
      businessName: "Skip",
      qualificationStatus: "SKIPPED",
      score: 95,
    },
  ],
  2,
);
assert(
  ranked.find((row) => row.prospectId === "p-high")?.isSelectedTopN === true,
  "highest score is selected",
);
assert(
  ranked.find((row) => row.prospectId === "p-mid")?.isSelectedTopN === true,
  "second score is selected",
);
assert(
  ranked.find((row) => row.prospectId === "p-low")?.isSelectedTopN === false,
  "third score is outside top N",
);
assert(
  ranked.find((row) => row.prospectId === "p-skip")?.isSelectedTopN === false,
  "skipped prospects are not auto-selected",
);
assert(
  ranked.find((row) => row.prospectId === "p-high")?.qualificationRank === 1,
  "ranking is deterministic",
);

assert(clampQualificationBatchSize(25) === 10, "more than 10 prospects does not exceed the server limit");

console.log("qualification.verify.ts passed");
