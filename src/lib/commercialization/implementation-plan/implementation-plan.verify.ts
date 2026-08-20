/**
 * Commercial Sprint 1 — Implementation Plan engine verification.
 * Pure deterministic tests. No OpenAI, Places, crawl, Resend, or DB.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";

import type { CompetitiveComparison } from "@/lib/competitive-intelligence/comparison/types";
import type {
  AuditCategory,
  AuditFinding,
  WebsiteAuditResult,
} from "@/lib/website-audit/types";

import { SERVICE_CAPABILITIES, SERVICE_CAPABILITY_VERSION } from "../capabilities";
import {
  IMPLEMENTATION_MAPPING_VERSION,
  IMPLEMENTATION_PLAN_VERSION,
} from "./constants";
import { generateImplementationPlanFromEvidence } from "./generate";
import {
  computeCurrentPlanFingerprint,
  evaluatePlanStaleness,
} from "./staleness";
import { computeWorkstreamPriorityScore, priorityFromScore } from "./priority";
import type { PlanEvidenceItem } from "./types";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function finding(partial: {
  id: string;
  category: AuditCategory;
  title: string;
  status?: "fail" | "warning" | "pass";
  priority?: "critical" | "high" | "medium" | "low";
}): AuditFinding {
  return {
    id: partial.id,
    category: partial.category,
    title: partial.title,
    description: partial.title,
    recommendation: "Fix it",
    status: partial.status ?? "fail",
    scoreImpact: 5,
    priority: partial.priority ?? "high",
    businessImpact: "high",
    difficulty: "medium",
    estimatedFixMinutes: 30,
    quickWin: false,
  };
}

function categoryScore(
  category: AuditCategory,
  score: number,
  maxScore: number,
): WebsiteAuditResult["categoryScores"][number] {
  const labels: Record<AuditCategory, string> = {
    technical: "Technical SEO",
    seo: "Search Optimization",
    content: "Content",
    cro: "Conversion",
    accessibility: "Accessibility",
    local: "Local SEO",
    performance: "Performance",
  };
  return {
    category,
    label: labels[category],
    score,
    maxScore,
    applicable: true,
  };
}

function baseAudit(overrides?: {
  findings?: AuditFinding[];
  categoryScores?: WebsiteAuditResult["categoryScores"];
  overallScore?: number;
}): WebsiteAuditResult {
  return {
    success: true,
    metadata: {
      requestedUrl: "https://example.com",
      finalUrl: "https://example.com",
      statusCode: 200,
      contentType: "text/html",
      fetchedAt: new Date().toISOString(),
    },
    pageData: {} as WebsiteAuditResult["pageData"],
    findings: overrides?.findings ?? [],
    categoryScores: overrides?.categoryScores ?? [
      categoryScore("technical", 16, 20),
      categoryScore("seo", 10, 20),
      categoryScore("content", 6, 15),
      categoryScore("cro", 8, 15),
      categoryScore("accessibility", 8, 10),
      categoryScore("local", 4, 10),
      categoryScore("performance", 9, 10),
    ],
    overallScore: overrides?.overallScore ?? 55,
    summary: {
      passed: 10,
      warnings: 2,
      failed: 5,
      criticalIssues: 1,
      quickWins: 1,
      highImpactFindings: 3,
      estimatedFixMinutes: 120,
    },
    opportunity: {
      score: 60,
      level: "high",
      trafficGainPercent: { minimum: 0, maximum: 0 },
      monthlyLeadGain: { minimum: 0, maximum: 0 },
      monthlyRevenueOpportunity: { minimum: 0, maximum: 0 },
      estimatedFixMinutes: 120,
      confidence: "medium",
      assumptions: [],
      insights: [],
    },
  } as WebsiteAuditResult;
}

function comparisonFixture(): CompetitiveComparison {
  return {
    comparisonVersion: 1,
    auditEngineVersion: 1,
    prospectId: "p1",
    campaignId: "c1",
    auditReportId: "audit-1",
    generatedAt: new Date().toISOString(),
    competitorsCompared: [
      {
        prospectCompetitorId: "comp-1",
        competitorAuditId: "ca-1",
        businessName: "Rival A",
        website: "https://rival-a.example",
        competitiveRelevanceScore: 80,
        distanceMiles: 2,
        websiteGrowthScore: 88,
        auditEngineVersion: 1,
        auditedAt: new Date().toISOString(),
      },
    ],
    overall: {
      targetScore: 55,
      competitorScores: [88],
      competitorAverage: 88,
      competitorMedian: 88,
      competitorBest: 88,
      competitorWorst: 88,
      gapVsAverage: -33,
      gapVsLeader: -33,
      targetRank: 2,
      participantCount: 2,
      competitorsOutperforming: 1,
      competitorsCompared: 1,
      position: "MAJOR_GAP",
    },
    categories: [
      {
        category: "content",
        label: "Content",
        targetScore: 53,
        competitorScores: [95.7],
        competitorAverage: 95.7,
        competitorMedian: 95.7,
        competitorBest: 95.7,
        competitorWorst: 95.7,
        gapVsAverage: -42.7,
        gapVsLeader: -42.7,
        targetRank: 2,
        participantCount: 2,
        competitorsOutperforming: 3,
        competitorsCompared: 3,
        position: "MAJOR_GAP",
        competitorBreakdown: [],
      },
      {
        category: "seo",
        label: "Search Optimization",
        targetScore: 50,
        competitorScores: [80],
        competitorAverage: 80,
        competitorMedian: 80,
        competitorBest: 80,
        competitorWorst: 80,
        gapVsAverage: -30,
        gapVsLeader: -30,
        targetRank: 2,
        participantCount: 2,
        competitorsOutperforming: 2,
        competitorsCompared: 2,
        position: "MAJOR_GAP",
        competitorBreakdown: [],
      },
      {
        category: "cro",
        label: "Conversion",
        targetScore: 55,
        competitorScores: [70],
        competitorAverage: 70,
        competitorMedian: 70,
        competitorBest: 70,
        competitorWorst: 70,
        gapVsAverage: -15,
        gapVsLeader: -15,
        targetRank: 2,
        participantCount: 2,
        competitorsOutperforming: 1,
        competitorsCompared: 1,
        position: "GAP",
        competitorBreakdown: [],
      },
      {
        category: "performance",
        label: "Performance",
        targetScore: 90,
        competitorScores: [73.3],
        competitorAverage: 73.3,
        competitorMedian: 73.3,
        competitorBest: 73.3,
        competitorWorst: 73.3,
        gapVsAverage: 16.7,
        gapVsLeader: 16.7,
        targetRank: 1,
        participantCount: 2,
        competitorsOutperforming: 0,
        competitorsCompared: 1,
        position: "MAJOR_ADVANTAGE",
        competitorBreakdown: [],
      },
    ],
    findingComparisons: [],
    advantages: [
      {
        id: "category-performance",
        kind: "CATEGORY",
        category: "performance",
        title: "Performance advantage",
        evidence: ["Target 90 vs avg 73.3"],
        gapVsAverage: 16.7,
        targetRank: 1,
        participantCount: 2,
      },
    ],
    opportunities: [],
    notes: [],
  };
}

// --- Capability taxonomy ---
assert(SERVICE_CAPABILITY_VERSION === 1, "capability version is 1");
assert(
  SERVICE_CAPABILITIES.some((c) => c.id === "CONTENT" && c.active),
  "CONTENT active",
);
assert(
  SERVICE_CAPABILITIES.some((c) => c.id === "AI_AUTOMATION" && !c.active),
  "AI_AUTOMATION inactive in V1",
);

// --- 1. Audit-only plan ---
const auditOnly = generateImplementationPlanFromEvidence({
  audit: baseAudit({
    findings: [
      finding({
        id: "thin-content",
        category: "content",
        title: "Thin content",
        priority: "high",
      }),
      finding({
        id: "missing-title",
        category: "seo",
        title: "Missing title",
        priority: "critical",
      }),
      finding({
        id: "local-nap-incomplete",
        category: "local",
        title: "NAP incomplete",
        priority: "medium",
      }),
      finding({
        id: "no-conversion-path",
        category: "cro",
        title: "No conversion path",
        priority: "high",
      }),
      finding({
        id: "robots-noindex",
        category: "technical",
        title: "Robots noindex",
        priority: "critical",
      }),
    ],
  }),
  auditReportId: "audit-1",
  comparison: null,
  comparisonSnapshotId: null,
  useCompetitiveEvidence: false,
});

assert(auditOnly.comparisonSnapshotId === null, "audit-only has no comparison id");
assert(auditOnly.competitiveEvidenceUsed === false, "audit-only competitive false");
assert(auditOnly.workstreams.length >= 3, "audit-only produces multiple workstreams");

const contentWs = auditOnly.workstreams.find(
  (w) => w.workstreamType === "CONTENT_FOUNDATION",
);
assert(contentWs, "content workstream exists");
assert(
  contentWs.capabilities.includes("CONTENT") &&
    contentWs.capabilities.includes("SEO"),
  "content maps to CONTENT+SEO",
);
assert(
  !contentWs.capabilities.includes("AI_AUTOMATION"),
  "AI_AUTOMATION not recommended",
);
assert(
  !contentWs.capabilities.includes("CUSTOM_SOFTWARE"),
  "CUSTOM_SOFTWARE not recommended",
);

const searchWs = auditOnly.workstreams.find(
  (w) => w.workstreamType === "SEARCH_OPTIMIZATION",
);
assert(searchWs, "search workstream exists");
assert(searchWs.capabilities.includes("SEO"), "search maps to SEO");

const localWs = auditOnly.workstreams.find(
  (w) => w.workstreamType === "LOCAL_SEARCH_FOUNDATION",
);
assert(localWs, "local workstream exists");
assert(localWs.capabilities.includes("LOCAL_SEO"), "local maps to LOCAL_SEO");

const croWs = auditOnly.workstreams.find(
  (w) => w.workstreamType === "CONVERSION_OPTIMIZATION",
);
assert(croWs, "conversion workstream exists");
assert(
  croWs.capabilities.includes("CONVERSION_OPTIMIZATION"),
  "cro maps to CONVERSION_OPTIMIZATION",
);

const techWs = auditOnly.workstreams.find(
  (w) => w.workstreamType === "TECHNICAL_SEO",
);
assert(techWs, "technical workstream exists");
assert(
  techWs.capabilities.includes("SEO") &&
    techWs.capabilities.includes("WEBSITE_DEVELOPMENT"),
  "technical maps to SEO+WEBSITE_DEVELOPMENT",
);

// Structured data action only when evidence exists
assert(
  !techWs.actions.some((a) => a.id === "structured-data"),
  "no structured-data action without evidence",
);

const withStructured = generateImplementationPlanFromEvidence({
  audit: baseAudit({
    findings: [
      finding({
        id: "structured-data-missing",
        category: "technical",
        title: "Missing structured data",
      }),
    ],
    categoryScores: [
      categoryScore("technical", 8, 20),
      categoryScore("seo", 18, 20),
      categoryScore("content", 14, 15),
      categoryScore("cro", 14, 15),
      categoryScore("accessibility", 9, 10),
      categoryScore("local", 9, 10),
      categoryScore("performance", 9, 10),
    ],
  }),
  auditReportId: "audit-sd",
  comparison: null,
  comparisonSnapshotId: null,
  useCompetitiveEvidence: false,
});
const techStructured = withStructured.workstreams.find(
  (w) => w.workstreamType === "TECHNICAL_SEO",
);
assert(techStructured, "structured technical ws");
assert(
  techStructured.actions.some((a) => a.id === "structured-data"),
  "structured-data action when evidenced",
);

// --- 2 + competitive gap priority ---
const withComp = generateImplementationPlanFromEvidence({
  audit: baseAudit({
    findings: [
      finding({
        id: "thin-content",
        category: "content",
        title: "Thin content",
        priority: "medium",
      }),
      finding({
        id: "missing-title",
        category: "seo",
        title: "Missing title",
        priority: "medium",
      }),
      finding({
        id: "no-conversion-path",
        category: "cro",
        title: "No conversion path",
        priority: "low",
      }),
    ],
  }),
  auditReportId: "audit-1",
  comparison: comparisonFixture(),
  comparisonSnapshotId: "snap-1",
  useCompetitiveEvidence: true,
});

assert(withComp.competitiveEvidenceUsed === true, "competitive used");
assert(withComp.comparisonSnapshotId === "snap-1", "snapshot id stored");

const contentComp = withComp.workstreams.find(
  (w) => w.workstreamType === "CONTENT_FOUNDATION",
);
assert(contentComp, "content with competitive");
assert(
  contentComp.evidence.some((e) => e.type === "COMPETITIVE_CATEGORY_GAP"),
  "content has competitive gap evidence",
);
assert(
  contentComp.evidence.some((e) => e.sourceKey === "category:content"),
  "provenance sourceKey retained",
);

const contentAuditOnlyScore = computeWorkstreamPriorityScore(
  contentWs?.evidence ?? [],
);
const contentCompScore = contentComp.priorityScore;
assert(
  contentCompScore > contentAuditOnlyScore,
  "large competitive gap increases priority score",
);

// Preservation from performance advantage
const preserved = withComp.workstreams.some((w) =>
  w.preservationConstraints.some((c) =>
    c.statement.toLowerCase().includes("performance"),
  ),
);
assert(preserved, "performance advantage creates preservation constraint");

// Not every workstream CRITICAL
const criticalCount = withComp.workstreams.filter(
  (w) => w.priority === "CRITICAL",
).length;
assert(criticalCount <= 2, "at most 2 CRITICAL workstreams");
assert(
  withComp.workstreams.some((w) => w.priority !== "CRITICAL"),
  "not every recommendation is CRITICAL",
);

// --- Stale competitive excluded ---
const staleExcluded = generateImplementationPlanFromEvidence({
  audit: baseAudit({
    findings: [
      finding({
        id: "thin-content",
        category: "content",
        title: "Thin content",
      }),
    ],
  }),
  auditReportId: "audit-1",
  comparison: comparisonFixture(),
  comparisonSnapshotId: "snap-stale",
  useCompetitiveEvidence: false,
});
assert(
  staleExcluded.competitiveEvidenceUsed === false,
  "stale competitive not used",
);
assert(
  !staleExcluded.workstreams
    .flatMap((w) => w.evidence)
    .some((e) => e.type === "COMPETITIVE_CATEGORY_GAP"),
  "no competitive gap evidence when excluded",
);

// --- Priority deterministic ---
const sampleEvidence: PlanEvidenceItem[] = [
  {
    type: "COMPETITIVE_CATEGORY_GAP",
    sourceKey: "category:content",
    category: "content",
    findingId: null,
    title: "Content gap",
    targetScorePercent: 53,
    competitorAverage: 95.7,
    gapVsAverage: -42.7,
    position: "MAJOR_GAP",
    competitorsOutperforming: 3,
    competitorsCompared: 3,
    auditPriority: null,
    auditStatus: null,
  },
  {
    type: "AUDIT_FINDING",
    sourceKey: "finding:thin-content",
    category: "content",
    findingId: "thin-content",
    title: "Thin content",
    targetScorePercent: null,
    competitorAverage: null,
    gapVsAverage: null,
    position: null,
    competitorsOutperforming: null,
    competitorsCompared: null,
    auditPriority: "high",
    auditStatus: "fail",
  },
];
const scoreA = computeWorkstreamPriorityScore(sampleEvidence);
const scoreB = computeWorkstreamPriorityScore(sampleEvidence);
assert(scoreA === scoreB, "priority score deterministic");
assert(priorityFromScore(80) === "CRITICAL", "80 → CRITICAL");
assert(priorityFromScore(55) === "HIGH", "55 → HIGH");
assert(priorityFromScore(30) === "MEDIUM", "30 → MEDIUM");
assert(priorityFromScore(10) === "LOW", "10 → LOW");

// --- Staleness fingerprint ---
const fp1 = computeCurrentPlanFingerprint({
  auditReportId: "audit-1",
  currentComparisonSnapshotId: "snap-1",
});
const fp2 = computeCurrentPlanFingerprint({
  auditReportId: "audit-2",
  currentComparisonSnapshotId: "snap-1",
});
const staleEval = evaluatePlanStaleness({ stored: fp1, current: fp2 });
assert(staleEval.stale, "audit change → stale");
assert(
  staleEval.reasons.some((r) => r.toLowerCase().includes("audit")),
  "stale reason mentions audit",
);

const fpSame = computeCurrentPlanFingerprint({
  auditReportId: "audit-1",
  currentComparisonSnapshotId: null,
});
const fpCompGone = evaluatePlanStaleness({
  stored: {
    ...fpSame,
    comparisonSnapshotId: "snap-old",
    planVersion: IMPLEMENTATION_PLAN_VERSION,
    mappingVersion: IMPLEMENTATION_MAPPING_VERSION,
    capabilityVersion: SERVICE_CAPABILITY_VERSION,
  },
  current: fpSame,
});
assert(fpCompGone.stale, "comparison removed → stale");

// --- Consolidation: multiple SEO findings → one workstream ---
const consolidated = generateImplementationPlanFromEvidence({
  audit: baseAudit({
    findings: [
      finding({ id: "missing-title", category: "seo", title: "Missing title" }),
      finding({
        id: "meta-description-missing",
        category: "seo",
        title: "Missing meta",
      }),
      finding({
        id: "title-too-long",
        category: "seo",
        title: "Title too long",
        priority: "low",
      }),
    ],
    categoryScores: [
      categoryScore("technical", 18, 20),
      categoryScore("seo", 6, 20),
      categoryScore("content", 14, 15),
      categoryScore("cro", 14, 15),
      categoryScore("accessibility", 9, 10),
      categoryScore("local", 9, 10),
      categoryScore("performance", 9, 10),
    ],
  }),
  auditReportId: "audit-seo",
  comparison: null,
  comparisonSnapshotId: null,
  useCompetitiveEvidence: false,
});
const seoStreams = consolidated.workstreams.filter(
  (w) => w.workstreamType === "SEARCH_OPTIMIZATION",
);
assert(seoStreams.length === 1, "SEO findings consolidate to one workstream");
assert(
  seoStreams[0].evidence.filter((e) => e.type === "AUDIT_FINDING").length >= 3,
  "all findings retained in evidence",
);

// --- No external call markers in commercialization module ---
const here = dirname(fileURLToPath(import.meta.url));
const commercializationRoot = join(here, "..");

function walk(dir: string, acc: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) {
      walk(p, acc);
    } else if (
      [".ts", ".tsx"].includes(extname(name)) &&
      !name.endsWith(".verify.ts")
    ) {
      acc.push(p);
    }
  }
  return acc;
}

const files = walk(commercializationRoot);
for (const file of files) {
  const source = readFileSync(file, "utf8");
  assert(!/openai|OpenAI|chat\.completions|responses\.create/i.test(source), `no OpenAI in ${file}`);
  assert(!/GOOGLE_PLACES|PlacesClient|places\.googleapis/i.test(source), `no Places in ${file}`);
  assert(!/resend|Resend\(/i.test(source), `no Resend in ${file}`);
  assert(
    !/runDeterministicWebsiteAudit|crawlSite|fetchHtml/i.test(source),
    `no crawl during plan module ${file}`,
  );
}

// Public report routes must not import implementation plan UI
const reportApp = join(here, "../../../app/report");
function walkSafe(dir: string): string[] {
  try {
    return walk(dir);
  } catch {
    return [];
  }
}
for (const file of walkSafe(reportApp)) {
  const source = readFileSync(file, "utf8");
  assert(
    !/implementation-plan|ImplementationPlan/i.test(source),
    `public report must not reference implementation plan: ${file}`,
  );
}

assert(IMPLEMENTATION_PLAN_VERSION === 1, "plan version 1");
assert(IMPLEMENTATION_MAPPING_VERSION === 1, "mapping version 1");

console.log("implementation-plan.verify.ts: PASS");
