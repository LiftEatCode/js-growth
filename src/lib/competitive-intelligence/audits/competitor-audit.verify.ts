import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { isForbiddenAnalyticsParamKey } from "@/lib/analytics/commercial-events";
import { AUDIT_REPORT_VERSION } from "@/lib/website-audit/storage/types";
import type { WebsiteAuditResult } from "@/lib/website-audit/types";

import {
  COMPETITOR_AUDIT_CONCURRENCY,
  COMPETITOR_AUDIT_ENGINE_VERSION,
  COMPETITOR_AUDIT_TTL_MS,
  MAX_COMPETITOR_AUDITS_PER_PROSPECT,
  MAX_COMPETITOR_AUDITS_PER_RUN,
} from "./constants";
import { canAuditCompetitorStatus, isReusableCompetitorAudit } from "./limit";
import {
  buildCompetitorAuditSummary,
  completedCompetitorAuditData,
  extractCategoryScores,
  extractPagesScanned,
  failedCompetitorAuditData,
} from "./persist";

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

assert(MAX_COMPETITOR_AUDITS_PER_PROSPECT === 3, "max 3 audits per prospect");
assert(MAX_COMPETITOR_AUDITS_PER_RUN === 3, "max 3 audits per run");
assert(COMPETITOR_AUDIT_CONCURRENCY === 1, "concurrency is 1");
assert(
  COMPETITOR_AUDIT_TTL_MS === 30 * 24 * 60 * 60 * 1000,
  "TTL is 30 days",
);
assert(
  COMPETITOR_AUDIT_ENGINE_VERSION === AUDIT_REPORT_VERSION,
  "competitor audit engine version matches AuditReport.version",
);

assert(canAuditCompetitorStatus("SELECTED"), "SELECTED can be audited");
assert(!canAuditCompetitorStatus("VALIDATED"), "VALIDATED alone cannot be audited");
assert(!canAuditCompetitorStatus("REJECTED"), "REJECTED cannot be audited");
assert(!canAuditCompetitorStatus("CANDIDATE"), "CANDIDATE cannot be audited");
assert(!canAuditCompetitorStatus("STALE"), "STALE cannot be audited");

const freshCompleted = isReusableCompetitorAudit({
  status: "COMPLETED",
  completedAt: new Date(),
  auditEngineVersion: COMPETITOR_AUDIT_ENGINE_VERSION,
  expectedEngineVersion: COMPETITOR_AUDIT_ENGINE_VERSION,
});
assert(freshCompleted, "fresh completed audit is reusable within TTL");

const forcedBypass = isReusableCompetitorAudit({
  status: "COMPLETED",
  completedAt: new Date(Date.now() - COMPETITOR_AUDIT_TTL_MS - 1000),
  auditEngineVersion: COMPETITOR_AUDIT_ENGINE_VERSION,
  expectedEngineVersion: COMPETITOR_AUDIT_ENGINE_VERSION,
});
assert(!forcedBypass, "expired audit is not reusable");

const wrongEngine = isReusableCompetitorAudit({
  status: "COMPLETED",
  completedAt: new Date(),
  auditEngineVersion: COMPETITOR_AUDIT_ENGINE_VERSION + 1,
  expectedEngineVersion: COMPETITOR_AUDIT_ENGINE_VERSION,
});
assert(!wrongEngine, "incompatible engine version is not reusable");

const mockAudit = {
  success: true as const,
  metadata: {
    requestedUrl: "https://competitor.example",
    finalUrl: "https://competitor.example/",
    statusCode: 200,
    contentType: "text/html",
    fetchedAt: new Date().toISOString(),
  },
  pageData: {} as WebsiteAuditResult["pageData"],
  findings: [
    {
      id: "seo-title-missing",
      title: "Missing title",
      description: "Page has no title.",
      status: "fail" as const,
      category: "seo" as const,
      scoreImpact: 5,
      priority: "high" as const,
      businessImpact: "high" as const,
      difficulty: "easy" as const,
      estimatedFixMinutes: 15,
      quickWin: true,
    },
  ],
  categoryScores: [
    {
      category: "technical" as const,
      label: "Technical SEO",
      score: 16,
      maxScore: 20,
      applicable: true,
    },
    {
      category: "seo" as const,
      label: "Search Optimization",
      score: 14,
      maxScore: 20,
      applicable: true,
    },
    {
      category: "content" as const,
      label: "Content",
      score: 12,
      maxScore: 15,
      applicable: true,
    },
    {
      category: "cro" as const,
      label: "Conversion",
      score: 11,
      maxScore: 15,
      applicable: true,
    },
    {
      category: "accessibility" as const,
      label: "Accessibility",
      score: 8,
      maxScore: 10,
      applicable: true,
    },
    {
      category: "local" as const,
      label: "Local SEO",
      score: 7,
      maxScore: 10,
      applicable: true,
    },
    {
      category: "performance" as const,
      label: "Performance",
      score: 8,
      maxScore: 10,
      applicable: true,
    },
  ],
  overallScore: 82,
  summary: {
    passed: 20,
    warnings: 4,
    failed: 2,
    criticalIssues: 1,
    quickWins: 3,
    highImpactFindings: 2,
    estimatedFixMinutes: 120,
  },
  opportunity: {
    score: 55,
    level: "medium" as const,
    trafficGainPercent: { minimum: 5, maximum: 15 },
    monthlyLeadGain: { minimum: 1, maximum: 3 },
    monthlyRevenueOpportunity: { minimum: 100, maximum: 500 },
    estimatedFixMinutes: 120,
    confidence: "medium" as const,
    assumptions: [],
    insights: [],
  },
  siteData: {
    crawl: {
      crawledCount: 4,
    },
  } as WebsiteAuditResult["siteData"],
} as WebsiteAuditResult;

const categories = extractCategoryScores(mockAudit);
assert(categories.seoScore === 14, "seo category score persists");
assert(categories.technicalScore === 16, "technical category score persists");
assert(categories.categories.length === 7, "all category snapshots retained");
assert(extractPagesScanned(mockAudit) === 4, "pages scanned from crawl");

const summary = buildCompetitorAuditSummary(mockAudit);
assert(summary.criticalIssues === 1, "summary critical issues persist");
assert(summary.topFindingIds.includes("seo-title-missing"), "finding ids persist");

const completed = completedCompetitorAuditData({
  audit: mockAudit,
  websiteUrl: "https://competitor.example",
  normalizedHostname: "competitor.example",
  startedAt: new Date("2026-08-20T12:00:00.000Z"),
  completedAt: new Date("2026-08-20T12:01:00.000Z"),
});
assert(completed.status === "COMPLETED", "completed snapshot status");
assert(completed.overallScore === 82, "overall score persists");
assert(completed.grade === "B-", "grade persists from shared grading");
assert(completed.auditEngineVersion === AUDIT_REPORT_VERSION, "engine version persists");
assert(completed.criticalIssues === 1, "critical issues column persists");

const failed = failedCompetitorAuditData({
  websiteUrl: "https://competitor.example",
  normalizedHostname: "competitor.example",
  startedAt: new Date("2026-08-20T12:00:00.000Z"),
  failureReason: "Website could not be analyzed.",
});
assert(failed.status === "FAILED", "failed snapshot status");
assert(failed.completedAt === null, "failed audit does not mark completed");
assert(
  failed.failureReason === "Website could not be analyzed.",
  "bounded failure reason stored",
);

const executeSource = readFileSync(join(here, "./execute.ts"), "utf8");
const loadSource = readFileSync(join(here, "./load.ts"), "utf8");
const actionsSource = readFileSync(
  join(repoRoot, "src/app/reports/prospecting/competitor-audit-actions.ts"),
  "utf8",
);
const panelSource = readFileSync(
  join(repoRoot, "src/components/prospecting/competitive-landscape-panel.tsx"),
  "utf8",
);
const detailSource = readFileSync(
  join(
    repoRoot,
    "src/app/reports/prospecting/[campaignId]/prospects/[prospectId]/competitors/[competitorId]/audits/[auditId]/page.tsx",
  ),
  "utf8",
);

assert(
  executeSource.includes("runDeterministicWebsiteAudit"),
  "existing audit engine is reused",
);
assert(
  executeSource.includes("competitor.website"),
  "website URL loaded from persisted competitor record",
);
assert(!executeSource.includes("openai"), "no OpenAI in competitor audit execute");
assert(!executeSource.includes("resend"), "no Resend in competitor audit execute");
assert(
  !executeSource.includes("createGooglePlaces"),
  "no Google Places during competitor auditing",
);
assert(
  !executeSource.includes("discoverProspectContacts"),
  "no contact discovery during competitor auditing",
);
assert(
  !executeSource.includes("campaignProspect.create"),
  "competitors are not imported as prospects",
);
assert(
  !executeSource.includes("prospectContact.create"),
  "no ProspectContact creation",
);
assert(
  !executeSource.includes("outreachMessage.create"),
  "no OutreachMessage creation",
);
assert(!executeSource.includes("lead.create"), "no Lead creation");
assert(
  executeSource.includes("force"),
  "explicit re-run can bypass TTL",
);
assert(
  loadSource.includes("COMPETITOR_AUDIT_CONCURRENCY"),
  "batch uses concurrency constant",
);
assert(
  loadSource.includes("SELECTED"),
  "batch loads SELECTED competitors only",
);
assert(actionsSource.includes("getInternalSession"), "mutations require session");
assert(
  panelSource.includes("Competitive relevance"),
  "UI labels competitive relevance separately",
);
assert(
  panelSource.includes("Website Growth Score"),
  "UI labels Website Growth Score separately",
);
assert(
  panelSource.includes("Audit Selected Competitors"),
  "batch audit action is available",
);
assert(
  detailSource.includes("Internal competitor Website Growth Audit"),
  "detail view is internal",
);
assert(
  !detailSource.includes("you beat"),
  "detail view has no prospect-vs-competitor narrative",
);

assert(
  isForbiddenAnalyticsParamKey("competitor_audit_id"),
  "competitor audit ids are stripped from analytics",
);
assert(
  isForbiddenAnalyticsParamKey("competitor_business_name"),
  "competitor business names are stripped from analytics",
);
assert(
  isForbiddenAnalyticsParamKey("competitor_hostname"),
  "competitor hostnames remain stripped from analytics",
);

const schema = readFileSync(join(repoRoot, "prisma/schema.prisma"), "utf8");
assert(schema.includes("model CompetitorAudit"), "CompetitorAudit model exists");
assert(
  schema.includes("model CompetitorAuditRun"),
  "CompetitorAuditRun model exists",
);
assert(
  schema.includes("auditEngineVersion"),
  "audit engine version column exists",
);

const publicReportPage = readFileSync(
  join(repoRoot, "src/app/report/[id]/page.tsx"),
  "utf8",
);
assert(
  !publicReportPage.includes("CompetitorAudit"),
  "public report page does not load CompetitorAudit",
);
assert(
  !publicReportPage.includes("competitorAudit"),
  "public report page does not reference competitorAudit",
);

const reportPdf = readFileSync(
  join(repoRoot, "src/app/report/[id]/pdf/route.tsx"),
  "utf8",
);
assert(!reportPdf.includes("CompetitorAudit"), "PDF route ignores CompetitorAudit");

const purchaseActions = readFileSync(
  join(repoRoot, "src/app/report/[id]/actions.ts"),
  "utf8",
);
assert(
  !purchaseActions.includes("CompetitorAudit"),
  "Stripe/report purchase ignores CompetitorAudit",
);

const reportSource = readFileSync(
  join(repoRoot, "src/lib/website-audit/report-source.ts"),
  "utf8",
);
assert(
  reportSource.includes("canExposeAuditReportPublicly"),
  "public exposure gate remains for AuditReport",
);

const secureFetch = readFileSync(
  join(repoRoot, "src/lib/website-audit/secure-fetch.ts"),
  "utf8",
);
const auditUrl = readFileSync(
  join(repoRoot, "src/lib/website-audit/audit-url.ts"),
  "utf8",
);
assert(
  auditUrl.includes("fetchPublicHttpResource") ||
    secureFetch.includes("validatePublicDestination"),
  "SSRF protections remain in secure fetch path",
);
assert(
  executeSource.includes("runDeterministicWebsiteAudit"),
  "competitor audits go through deterministic entry that uses secure fetch",
);

const auditModuleFiles = collectTsFiles(here).filter(
  (file) => !file.endsWith(".verify.ts"),
);
for (const file of auditModuleFiles) {
  const source = readFileSync(file, "utf8");
  assert(!/from ["']openai["']/.test(source), `${file} must not import openai`);
  assert(!/\bresend\b/i.test(source), `${file} must not reference resend`);
  assert(
    !source.includes("GOOGLE_PLACES_API_KEY"),
    `${file} must not use Google Places`,
  );
}

console.log("competitor-audit.verify.ts passed");
