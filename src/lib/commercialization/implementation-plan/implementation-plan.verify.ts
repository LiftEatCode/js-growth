/**
 * Commercial Sprint 1.1 — Implementation Plan quality hardening verification.
 * Pure deterministic tests. No OpenAI, Places, crawl, Resend, or DB.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, extname, join, sep } from "node:path";
import { fileURLToPath } from "node:url";

import type { CompetitiveComparison } from "@/lib/competitive-intelligence/comparison/types";
import type {
  AuditCategory,
  AuditFinding,
  WebsiteAuditResult,
} from "@/lib/website-audit/types";

import { SERVICE_CAPABILITY_VERSION } from "../capabilities";
import { assertActionsHaveProvenance } from "./actions";
import {
  IMPLEMENTATION_MAPPING_VERSION,
  IMPLEMENTATION_PLAN_VERSION,
} from "./constants";
import { dedupeEvidenceItems, evidenceIdentity } from "./dedupe";
import { generateImplementationPlanFromEvidence } from "./generate";
import {
  isMaterialRiskEvidence,
  shouldSuppressStrengthWorkstream,
} from "./strength";
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
      categoryScore("technical", 17, 20),
      categoryScore("seo", 13, 20),
      categoryScore("content", 8, 15),
      categoryScore("cro", 12, 15),
      categoryScore("accessibility", 8, 10),
      categoryScore("local", 7, 10),
      categoryScore("performance", 9, 10),
    ],
    overallScore: overrides?.overallScore ?? 74,
    summary: {
      passed: 10,
      warnings: 2,
      failed: 5,
      criticalIssues: 0,
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

/** Rooftop Solutions–like competitive fixture (percent scale). */
function rooftopComparison(): CompetitiveComparison {
  return {
    comparisonVersion: 1,
    auditEngineVersion: 1,
    prospectId: "rooftop",
    campaignId: "c1",
    auditReportId: "audit-rooftop",
    generatedAt: new Date().toISOString(),
    competitorsCompared: [],
    overall: {
      targetScore: 74,
      competitorScores: [90],
      competitorAverage: 90,
      competitorMedian: 90,
      competitorBest: 90,
      competitorWorst: 90,
      gapVsAverage: -16,
      gapVsLeader: -16,
      targetRank: 2,
      participantCount: 4,
      competitorsOutperforming: 3,
      competitorsCompared: 3,
      position: "GAP",
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
        targetRank: 4,
        participantCount: 4,
        competitorsOutperforming: 3,
        competitorsCompared: 3,
        position: "MAJOR_GAP",
        competitorBreakdown: [],
      },
      {
        category: "seo",
        label: "Search Optimization",
        targetScore: 65,
        competitorScores: [90],
        competitorAverage: 90,
        competitorMedian: 90,
        competitorBest: 90,
        competitorWorst: 90,
        gapVsAverage: -25,
        gapVsLeader: -25,
        targetRank: 4,
        participantCount: 4,
        competitorsOutperforming: 3,
        competitorsCompared: 3,
        position: "MAJOR_GAP",
        competitorBreakdown: [],
      },
      {
        category: "cro",
        label: "Conversion",
        targetScore: 80,
        competitorScores: [93],
        competitorAverage: 93,
        competitorMedian: 93,
        competitorBest: 93,
        competitorWorst: 93,
        gapVsAverage: -13,
        gapVsLeader: -13,
        targetRank: 4,
        participantCount: 4,
        competitorsOutperforming: 3,
        competitorsCompared: 3,
        position: "GAP",
        competitorBreakdown: [],
      },
      {
        category: "technical",
        label: "Technical SEO",
        targetScore: 85,
        competitorScores: [96.7],
        competitorAverage: 96.7,
        competitorMedian: 96.7,
        competitorBest: 96.7,
        competitorWorst: 96.7,
        gapVsAverage: -11.7,
        gapVsLeader: -11.7,
        targetRank: 4,
        participantCount: 4,
        competitorsOutperforming: 3,
        competitorsCompared: 3,
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
        participantCount: 4,
        competitorsOutperforming: 0,
        competitorsCompared: 3,
        position: "MAJOR_ADVANTAGE",
        competitorBreakdown: [],
      },
    ],
    findingComparisons: [
      {
        findingId: "skipped-heading-levels",
        title: "Skipped heading levels",
        category: "content",
        priority: "medium",
        targetHasIssue: true,
        competitorIssueCount: 0,
        competitorPassCount: 3,
        competitorsCompared: 3,
        prevalencePercent: 0,
        pattern: "TARGET_ONLY_WEAKNESS",
      },
      {
        findingId: "performance-large-inline-css",
        title: "Large inline CSS",
        category: "performance",
        priority: "low",
        targetHasIssue: true,
        competitorIssueCount: 1,
        competitorPassCount: 2,
        competitorsCompared: 3,
        prevalencePercent: 33,
        pattern: "TARGET_ONLY_WEAKNESS",
      },
    ],
    advantages: [
      {
        id: "category-performance",
        kind: "CATEGORY",
        category: "performance",
        title: "Performance advantage",
        evidence: ["Target 90 vs avg 73.3"],
        gapVsAverage: 16.7,
        targetRank: 1,
        participantCount: 4,
      },
    ],
    opportunities: [],
    notes: [],
  };
}

function rooftopAudit(): WebsiteAuditResult {
  return baseAudit({
    overallScore: 74,
    findings: [
      finding({
        id: "multiple-h1",
        category: "content",
        title: "Multiple H1",
        status: "warning",
        priority: "medium",
      }),
      finding({
        id: "skipped-heading-levels",
        category: "content",
        title: "Skipped heading levels",
        status: "warning",
        priority: "medium",
      }),
      finding({
        id: "no-images",
        category: "content",
        title: "No images",
        status: "warning",
        priority: "low",
      }),
      finding({
        id: "missing-meta-description",
        category: "seo",
        title: "Missing meta description",
        status: "fail",
        priority: "high",
      }),
      finding({
        id: "missing-internal-links",
        category: "seo",
        title: "Missing internal links",
        status: "warning",
        priority: "medium",
      }),
      finding({
        id: "open-graph-incomplete",
        category: "seo",
        title: "Open Graph incomplete",
        status: "warning",
        priority: "low",
      }),
      finding({
        id: "missing-canonical",
        category: "technical",
        title: "Missing canonical",
        status: "fail",
        priority: "medium",
      }),
      finding({
        id: "missing-structured-data",
        category: "technical",
        title: "Missing structured data",
        status: "fail",
        priority: "medium",
      }),
      finding({
        id: "few-trust-signals",
        category: "cro",
        title: "Few trust signals",
        status: "warning",
        priority: "medium",
      }),
      finding({
        id: "performance-large-inline-css",
        category: "performance",
        title: "Large inline CSS",
        status: "warning",
        priority: "low",
      }),
    ],
  });
}

assert(IMPLEMENTATION_MAPPING_VERSION === 2, "mapping version is 2 (Sprint 1.1)");
assert(IMPLEMENTATION_PLAN_VERSION === 1, "plan version remains 1");
assert(SERVICE_CAPABILITY_VERSION === 1, "capability version unchanged");

// --- Deduplication ---
const dupes: PlanEvidenceItem[] = [
  {
    type: "AUDIT_FINDING",
    sourceKey: "finding:skipped-heading-levels",
    category: "content",
    findingId: "skipped-heading-levels",
    title: "Skipped",
    targetScorePercent: null,
    competitorAverage: null,
    gapVsAverage: null,
    position: null,
    competitorsOutperforming: null,
    competitorsCompared: null,
    auditPriority: "medium",
    auditStatus: "warning",
  },
  {
    type: "COMPETITIVE_FINDING",
    sourceKey: "finding:skipped-heading-levels",
    category: "content",
    findingId: "skipped-heading-levels",
    title: "Skipped competitive",
    targetScorePercent: null,
    competitorAverage: null,
    gapVsAverage: null,
    position: null,
    competitorsOutperforming: null,
    competitorsCompared: 3,
    auditPriority: "medium",
    auditStatus: "fail",
  },
];
const deduped = dedupeEvidenceItems(dupes);
assert(deduped.length === 1, "duplicate findings dedupe to one");
assert(
  evidenceIdentity(deduped[0]) === "finding:skipped-heading-levels",
  "identity is finding id",
);
assert(deduped[0].type === "AUDIT_FINDING", "prefer audit finding row");

const catDupes: PlanEvidenceItem[] = [
  {
    type: "AUDIT_CATEGORY",
    sourceKey: "category:content",
    category: "content",
    findingId: null,
    title: "Content 53",
    targetScorePercent: 53,
    competitorAverage: null,
    gapVsAverage: null,
    position: null,
    competitorsOutperforming: null,
    competitorsCompared: null,
    auditPriority: null,
    auditStatus: null,
  },
  {
    type: "AUDIT_CATEGORY",
    sourceKey: "category:content",
    category: "content",
    findingId: null,
    title: "Content 53 again",
    targetScorePercent: 53,
    competitorAverage: null,
    gapVsAverage: null,
    position: null,
    competitorsOutperforming: null,
    competitorsCompared: null,
    auditPriority: null,
    auditStatus: null,
  },
];
assert(dedupeEvidenceItems(catDupes).length === 1, "duplicate category evidence deduped");

// --- Rooftop fixture ---
const rooftop = generateImplementationPlanFromEvidence({
  audit: rooftopAudit(),
  auditReportId: "audit-rooftop",
  comparison: rooftopComparison(),
  comparisonSnapshotId: "snap-rooftop",
  useCompetitiveEvidence: true,
});

assert(rooftop.mappingVersion === 2, "rooftop plan uses mapping v2");
assert(
  !rooftop.workstreams.some((w) => w.workstreamType === "PERFORMANCE_OPTIMIZATION"),
  "MAJOR_ADVANTAGE performance + minor finding does not create Performance workstream",
);

const content = rooftop.workstreams.find((w) => w.workstreamType === "CONTENT_FOUNDATION");
const search = rooftop.workstreams.find((w) => w.workstreamType === "SEARCH_OPTIMIZATION");
const technical = rooftop.workstreams.find((w) => w.workstreamType === "TECHNICAL_SEO");
const conversion = rooftop.workstreams.find((w) => w.workstreamType === "CONVERSION_OPTIMIZATION");

assert(content, "content workstream");
assert(search, "search workstream");
assert(technical, "technical workstream");
assert(conversion, "conversion workstream");
assert(content.priority === "CRITICAL", "content MAJOR_GAP → CRITICAL");
assert(search.priority === "CRITICAL", "search MAJOR_GAP → CRITICAL");
assert(
  technical.priority === "HIGH" || technical.priority === "MEDIUM",
  "technical gap in HIGH/MEDIUM band",
);
assert(
  conversion.priority === "MEDIUM" || conversion.priority === "HIGH",
  "conversion gap in MEDIUM/HIGH band",
);

// Performance maintenance on other workstreams
const perfPreserve = rooftop.workstreams.some((w) =>
  w.preservationConstraints.some(
    (c) =>
      c.category === "performance" &&
      c.evidenceSourceKeys.includes("advantage:category-performance") &&
      (c.maintenanceActions?.some((a) => a.id === "inline-css") ?? false),
  ),
);
assert(perfPreserve, "performance preservation includes inline-css maintenance");

// Deduped evidence in workstreams
for (const ws of rooftop.workstreams) {
  const keys = ws.evidence.map((e) => evidenceIdentity(e));
  assert(new Set(keys).size === keys.length, `${ws.workstreamType} evidence unique`);
  assertActionsHaveProvenance(ws.actions, ws.evidence);
  for (const action of ws.actions) {
    assert(action.evidenceSourceKeys.length >= 1, `${action.id} has provenance`);
  }
}

assert(
  !technical.actions.some((a) => a.id === "indexability"),
  "no robots/indexability action without robots evidence",
);
assert(
  technical.actions.some((a) => a.id === "canonical"),
  "missing-canonical → canonical action",
);
assert(
  technical.actions.some((a) => a.id === "structured-data"),
  "missing-structured-data → structured-data action",
);
assert(
  search.actions.some((a) => a.id === "improve-meta"),
  "missing-meta-description → meta action",
);
assert(
  search.actions.some((a) => a.id === "internal-linking"),
  "missing-internal-links → internal linking",
);
assert(
  search.actions.some((a) => a.id === "heading-architecture"),
  "heading action only when heading evidence attached to search",
);
assert(
  search.evidence.some((e) => e.findingId === "skipped-heading-levels"),
  "heading evidence on search workstream",
);
assert(
  conversion.actions.some((a) => a.id === "trust-signals"),
  "few-trust-signals → trust action",
);

// Cross-workstream heading allowed, locally unique
assert(
  content.evidence.some((e) => e.findingId === "skipped-heading-levels"),
  "heading also on content",
);
assert(
  content.evidence.filter((e) => e.findingId === "skipped-heading-levels").length === 1,
  "heading not duplicated within content",
);

// no-images alone cannot create strong content
const imagesOnly = generateImplementationPlanFromEvidence({
  audit: baseAudit({
    findings: [
      finding({
        id: "no-images",
        category: "content",
        title: "No images",
        priority: "low",
        status: "warning",
      }),
    ],
    categoryScores: [
      categoryScore("technical", 18, 20),
      categoryScore("seo", 18, 20),
      categoryScore("content", 14, 15),
      categoryScore("cro", 14, 15),
      categoryScore("accessibility", 9, 10),
      categoryScore("local", 9, 10),
      categoryScore("performance", 9, 10),
    ],
  }),
  auditReportId: "audit-images",
  comparison: null,
  comparisonSnapshotId: null,
  useCompetitiveEvidence: false,
});
assert(
  !imagesOnly.workstreams.some((w) => w.workstreamType === "CONTENT_FOUNDATION"),
  "no-images alone does not create Content Foundation",
);

// Material risk exception: strength + CRITICAL finding → workstream allowed
const materialEvidence: PlanEvidenceItem[] = [
  {
    type: "AUDIT_FINDING",
    sourceKey: "finding:performance-critical-block",
    category: "performance",
    findingId: "performance-blocking-scripts",
    title: "Blocking",
    targetScorePercent: null,
    competitorAverage: null,
    gapVsAverage: null,
    position: null,
    competitorsOutperforming: null,
    competitorsCompared: null,
    auditPriority: "critical",
    auditStatus: "fail",
  },
];
assert(isMaterialRiskEvidence(materialEvidence), "critical finding is material risk");

const materialPlan = generateImplementationPlanFromEvidence({
  audit: baseAudit({
    findings: [
      finding({
        id: "performance-blocking-scripts",
        category: "performance",
        title: "Blocking scripts",
        priority: "critical",
        status: "fail",
      }),
    ],
    categoryScores: [
      categoryScore("technical", 18, 20),
      categoryScore("seo", 18, 20),
      categoryScore("content", 14, 15),
      categoryScore("cro", 14, 15),
      categoryScore("accessibility", 9, 10),
      categoryScore("local", 9, 10),
      categoryScore("performance", 9, 10),
    ],
  }),
  auditReportId: "audit-mat",
  comparison: rooftopComparison(),
  comparisonSnapshotId: "snap-mat",
  useCompetitiveEvidence: true,
});
assert(
  materialPlan.workstreams.some((w) => w.workstreamType === "PERFORMANCE_OPTIMIZATION"),
  "material-risk exception allows Performance workstream despite MAJOR_ADVANTAGE",
);

assert(
  shouldSuppressStrengthWorkstream({
    primaryCategory: "performance",
    workstreamEvidence: [
      {
        type: "AUDIT_FINDING",
        sourceKey: "finding:performance-large-inline-css",
        category: "performance",
        findingId: "performance-large-inline-css",
        title: "Inline CSS",
        targetScorePercent: null,
        competitorAverage: null,
        gapVsAverage: null,
        position: null,
        competitorsOutperforming: null,
        competitorsCompared: null,
        auditPriority: "low",
        auditStatus: "warning",
      },
    ],
    allEvidence: [
      {
        type: "COMPETITIVE_ADVANTAGE",
        sourceKey: "advantage:category-performance",
        category: "performance",
        findingId: null,
        title: "Perf advantage",
        targetScorePercent: null,
        competitorAverage: null,
        gapVsAverage: 16.7,
        position: "MAJOR_ADVANTAGE",
        competitorsOutperforming: null,
        competitorsCompared: 4,
        auditPriority: null,
        auditStatus: "pass",
      },
    ],
  }),
  "minor finding + MAJOR_ADVANTAGE suppresses workstream",
);

// Priority ordering: Content/Search before Performance maintenance distortion
const order = rooftop.workstreams.map((w) => w.workstreamType);
assert(order.indexOf("CONTENT_FOUNDATION") < 2, "content near top");
assert(order.indexOf("SEARCH_OPTIMIZATION") < 2, "search near top");

// --- No external calls in commercialization ---
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

for (const file of walk(commercializationRoot)) {
  // Commercial Sprint 2 AI strategy lives under implementation-interpretation/
  // and is allowed OpenAI. Sprint 1 deterministic engine remains OpenAI-free.
  if (file.includes(`${sep}implementation-interpretation${sep}`)) {
    continue;
  }
  if (file.includes(`${sep}proposal-delivery${sep}`)) {
    continue;
  }
  if (file.includes(`${sep}agreement-delivery${sep}`)) {
    continue;
  }
  if (file.includes(`${sep}payments${sep}`)) {
    continue;
  }
  if (file.includes(`${sep}onboarding${sep}`)) {
    continue;
  }
  const source = readFileSync(file, "utf8");
  assert(!/openai|OpenAI|chat\.completions|responses\.create/i.test(source), `no OpenAI in ${file}`);
  assert(!/GOOGLE_PLACES|PlacesClient|places\.googleapis/i.test(source), `no Places in ${file}`);
  assert(!/resend|Resend\(/i.test(source), `no Resend in ${file}`);
  assert(
    !/runDeterministicWebsiteAudit|crawlSite|fetchHtml/i.test(source),
    `no crawl in ${file}`,
  );
}

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

console.log("implementation-plan.verify.ts: PASS");
