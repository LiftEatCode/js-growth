import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { isForbiddenAnalyticsParamKey } from "@/lib/analytics/commercial-events";

import { buildCompetitiveComparison } from "./compare";
import {
  ADVANTAGE_GAP,
  COMPETITIVE_COMPARISON_VERSION,
  MAJOR_ADVANTAGE_GAP,
  MAJOR_GAP_THRESHOLD,
  MAX_COMPETITORS_COMPARED,
  PARITY_GAP,
} from "./constants";
import { compareFindings } from "./findings";
import {
  average,
  buildScoreDistribution,
  classifyPosition,
  competitionRank,
  median,
  round1,
} from "./math";
import { fingerprintsMatch, buildComparisonFingerprint } from "./fingerprint";
import type { ComparisonCompetitorInput, ComparisonInputAudit } from "./types";

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

assert(COMPETITIVE_COMPARISON_VERSION === 1, "comparison version is 1");
assert(MAX_COMPETITORS_COMPARED === 3, "max 3 competitors compared");
assert(MAJOR_ADVANTAGE_GAP === 15, "major advantage threshold");
assert(ADVANTAGE_GAP === 5, "advantage threshold");
assert(PARITY_GAP === 5, "parity threshold");
assert(MAJOR_GAP_THRESHOLD === 15, "major gap threshold");

assert(round1(87.333333) === 87.3, "round1 production average display");
assert(average([77, 90, 95]) !== null, "average exists");
assert(round1(average([77, 90, 95])!) === 87.3, "production competitor average");
assert(median([77, 90, 95]) === 90, "median of three");
assert(median([77, 90]) === 83.5, "median of even count");

assert(classifyPosition(15) === "MAJOR_ADVANTAGE", "major advantage");
assert(classifyPosition(5) === "ADVANTAGE", "advantage");
assert(classifyPosition(0) === "PARITY", "parity");
assert(classifyPosition(-5) === "GAP", "gap");
assert(classifyPosition(-15) === "MAJOR_GAP", "major gap");

const ranking = competitionRank(
  [
    { id: "a", label: "A", score: 90, kind: "competitor" },
    { id: "b", label: "B", score: 90, kind: "competitor" },
    { id: "c", label: "C", score: 80, kind: "competitor" },
    { id: "target", label: "Target", score: 70, kind: "target" },
  ],
  "target",
);
assert(ranking.rank === 4, "competition ranking places target 4th");
assert(ranking.participantCount === 4, "participant count includes all");

const tiedFirst = competitionRank(
  [
    { id: "target", label: "Target", score: 90, kind: "target" },
    { id: "a", label: "A", score: 90, kind: "competitor" },
    { id: "b", label: "B", score: 80, kind: "competitor" },
  ],
  "target",
);
assert(tiedFirst.rank === 1, "target shares first on tie");

const overall = buildScoreDistribution({
  targetId: "target",
  targetLabel: "Target HVAC",
  targetScore: 68,
  competitors: [
    { id: "c1", label: "Bradbury", score: 77 },
    { id: "c2", label: "Cover", score: 90 },
    { id: "c3", label: "Prestige", score: 95 },
  ],
});
assert(overall.competitorAverage === 87.3, "overall average 87.3");
assert(overall.competitorBest === 95, "overall best");
assert(overall.competitorWorst === 77, "overall worst");
assert(overall.gapVsAverage === -19.3, "gap vs average");
assert(overall.gapVsLeader === -27, "gap vs leader");
assert(overall.targetRank === 4, "overall rank 4 of 4");
assert(overall.participantCount === 4, "overall participants");
assert(overall.competitorsOutperforming === 3, "all three outperform");

const targetAudit: ComparisonInputAudit = {
  overallScore: 68,
  auditEngineVersion: 1,
  categoryScores: [
    {
      category: "seo",
      label: "Search Optimization",
      score: 12.4,
      maxScore: 20,
      applicable: true,
    },
    {
      category: "cro",
      label: "Conversion",
      score: 13.65,
      maxScore: 15,
      applicable: true,
    },
    {
      category: "content",
      label: "Content",
      score: 8,
      maxScore: 15,
      applicable: true,
    },
  ],
  findings: [
    {
      id: "local-schema-missing",
      title: "Missing LocalBusiness schema",
      category: "local",
      status: "fail",
      priority: "high",
    },
    {
      id: "internal-linking-weak",
      title: "Weak internal linking",
      category: "content",
      status: "fail",
      priority: "medium",
    },
    {
      id: "cta-strong",
      title: "Clear primary CTA",
      category: "cro",
      status: "pass",
      priority: "low",
    },
  ],
};

function competitor(
  overrides: Partial<ComparisonCompetitorInput> &
    Pick<ComparisonCompetitorInput, "prospectCompetitorId" | "businessName"> & {
      overallScore: number;
      findings?: ComparisonInputAudit["findings"];
      categoryScores?: ComparisonInputAudit["categoryScores"];
    },
): ComparisonCompetitorInput {
  return {
    prospectCompetitorId: overrides.prospectCompetitorId,
    competitorAuditId: overrides.competitorAuditId ?? `audit-${overrides.prospectCompetitorId}`,
    businessName: overrides.businessName,
    website: overrides.website ?? "https://example.com",
    competitiveRelevanceScore: overrides.competitiveRelevanceScore ?? 100,
    distanceMiles: overrides.distanceMiles ?? 8,
    auditedAt: overrides.auditedAt ?? "2026-08-20T12:00:00.000Z",
    audit: {
      overallScore: overrides.overallScore,
      auditEngineVersion: 1,
      categoryScores: overrides.categoryScores ?? [
        {
          category: "seo",
          label: "Search Optimization",
          score: 15.6,
          maxScore: 20,
          applicable: true,
        },
        {
          category: "cro",
          label: "Conversion",
          score: 11.1,
          maxScore: 15,
          applicable: true,
        },
        {
          category: "content",
          label: "Content",
          score: 12.6,
          maxScore: 15,
          applicable: true,
        },
      ],
      findings: overrides.findings ?? [
        {
          id: "local-schema-missing",
          title: "Missing LocalBusiness schema",
          category: "local",
          status: "pass",
          priority: "high",
        },
        {
          id: "internal-linking-weak",
          title: "Weak internal linking",
          category: "content",
          status: "fail",
          priority: "medium",
        },
        {
          id: "cta-strong",
          title: "Clear primary CTA",
          category: "cro",
          status: "fail",
          priority: "low",
        },
      ],
    },
  };
}

const competitors = [
  competitor({
    prospectCompetitorId: "c1",
    businessName: "Bradbury",
    overallScore: 77,
    findings: [
      {
        id: "local-schema-missing",
        title: "Missing LocalBusiness schema",
        category: "local",
        status: "pass",
        priority: "high",
      },
      {
        id: "internal-linking-weak",
        title: "Weak internal linking",
        category: "content",
        status: "fail",
        priority: "medium",
      },
      {
        id: "cta-strong",
        title: "Clear primary CTA",
        category: "cro",
        status: "fail",
        priority: "low",
      },
    ],
  }),
  competitor({
    prospectCompetitorId: "c2",
    businessName: "Cover",
    overallScore: 90,
    findings: [
      {
        id: "local-schema-missing",
        title: "Missing LocalBusiness schema",
        category: "local",
        status: "pass",
        priority: "high",
      },
      {
        id: "internal-linking-weak",
        title: "Weak internal linking",
        category: "content",
        status: "pass",
        priority: "medium",
      },
      {
        id: "cta-strong",
        title: "Clear primary CTA",
        category: "cro",
        status: "fail",
        priority: "low",
      },
    ],
  }),
  competitor({
    prospectCompetitorId: "c3",
    businessName: "Prestige",
    overallScore: 95,
    findings: [
      {
        id: "local-schema-missing",
        title: "Missing LocalBusiness schema",
        category: "local",
        status: "pass",
        priority: "high",
      },
      {
        id: "internal-linking-weak",
        title: "Weak internal linking",
        category: "content",
        status: "fail",
        priority: "medium",
      },
      {
        id: "cta-strong",
        title: "Clear primary CTA",
        category: "cro",
        status: "fail",
        priority: "low",
      },
    ],
  }),
];

const findingComparisons = compareFindings({
  target: targetAudit,
  competitors,
});

const targetOnly = findingComparisons.find(
  (row) => row.findingId === "local-schema-missing",
);
assert(targetOnly?.pattern === "TARGET_ONLY_WEAKNESS", "target-only weakness");
assert(targetOnly?.competitorIssueCount === 0, "0 competitors fail schema");

const common = findingComparisons.find(
  (row) => row.findingId === "internal-linking-weak",
);
assert(common?.pattern === "COMMON_MARKET_WEAKNESS", "common market weakness");
assert(common?.competitorIssueCount === 2, "2 of 3 competitors fail linking");

const advantageFinding = findingComparisons.find(
  (row) => row.findingId === "cta-strong",
);
assert(
  advantageFinding?.pattern === "COMPETITIVE_ADVANTAGE",
  "competitive advantage finding",
);

const comparison = buildCompetitiveComparison({
  prospectId: "p1",
  campaignId: "camp1",
  auditReportId: "report1",
  targetLabel: "Target HVAC",
  target: targetAudit,
  competitors,
});

assert(comparison.overall.competitorAverage === 87.3, "built average 87.3");
assert(comparison.categories.length >= 2, "categories compared");
assert(comparison.opportunities.length > 0, "opportunities produced");
assert(comparison.advantages.length > 0, "advantages produced");
assert(
  comparison.opportunities[0]!.priorityScore >=
    comparison.opportunities[comparison.opportunities.length - 1]!.priorityScore,
  "opportunities ordered by priority score",
);

const oneCompetitor = buildCompetitiveComparison({
  prospectId: "p1",
  campaignId: "camp1",
  auditReportId: "report1",
  targetLabel: "Target HVAC",
  target: targetAudit,
  competitors: [competitors[0]!],
});
assert(
  oneCompetitor.overall.competitorsCompared === 1,
  "one competitor comparison works",
);
assert(
  oneCompetitor.notes.some((note) => note.includes("1 audited")),
  "notes mention one competitor",
);

const fpCurrent = buildComparisonFingerprint({
  auditReportId: "report1",
  auditEngineVersion: 1,
  selectedCompetitorIds: ["c2", "c1", "c3"],
  competitorAuditIds: ["a3", "a1", "a2"],
});
const fpSame = buildComparisonFingerprint({
  auditReportId: "report1",
  auditEngineVersion: 1,
  selectedCompetitorIds: ["c1", "c2", "c3"],
  competitorAuditIds: ["a1", "a2", "a3"],
});
assert(fingerprintsMatch(fpCurrent, fpSame), "fingerprint sort-stable match");

const fpTargetChanged = buildComparisonFingerprint({
  auditReportId: "report2",
  auditEngineVersion: 1,
  selectedCompetitorIds: ["c1", "c2", "c3"],
  competitorAuditIds: ["a1", "a2", "a3"],
});
assert(
  !fingerprintsMatch(fpCurrent, fpTargetChanged),
  "stale when target audit changes",
);

const fpCompetitorAuditChanged = buildComparisonFingerprint({
  auditReportId: "report1",
  auditEngineVersion: 1,
  selectedCompetitorIds: ["c1", "c2", "c3"],
  competitorAuditIds: ["a1", "a2", "a9"],
});
assert(
  !fingerprintsMatch(fpCurrent, fpCompetitorAuditChanged),
  "stale when competitor audit changes",
);

const fpSelectionChanged = buildComparisonFingerprint({
  auditReportId: "report1",
  auditEngineVersion: 1,
  selectedCompetitorIds: ["c1", "c2"],
  competitorAuditIds: ["a1", "a2"],
});
assert(
  !fingerprintsMatch(fpCurrent, fpSelectionChanged),
  "stale when selected competitors change",
);

assert(
  COMPETITIVE_COMPARISON_VERSION === 1,
  "comparison version constant for staleness",
);

assert(
  isForbiddenAnalyticsParamKey("competitive_comparison_id"),
  "comparison ids blocked in analytics",
);
assert(
  isForbiddenAnalyticsParamKey("competitor_audit_ids"),
  "competitor audit ids blocked",
);
assert(
  isForbiddenAnalyticsParamKey("comparison_json"),
  "comparison json blocked",
);
assert(
  isForbiddenAnalyticsParamKey("competitive_gap"),
  "competitive gap blocked",
);
assert(
  isForbiddenAnalyticsParamKey("competitor_scores"),
  "competitor scores blocked",
);

const schema = readFileSync(join(repoRoot, "prisma/schema.prisma"), "utf8");
assert(
  schema.includes("model CompetitiveComparisonSnapshot"),
  "snapshot model exists",
);

const actions = readFileSync(
  join(repoRoot, "src/app/reports/prospecting/competitive-comparison-actions.ts"),
  "utf8",
);
assert(actions.includes("getInternalSession"), "mutations require session");
assert(!actions.includes("openai"), "no OpenAI in comparison actions");
assert(!actions.includes("resend"), "no Resend in comparison actions");
assert(
  !actions.includes("runDeterministicWebsiteAudit"),
  "comparison does not crawl websites",
);
assert(
  !actions.includes("createGooglePlaces"),
  "comparison does not call Places",
);

const publicReport = readFileSync(
  join(repoRoot, "src/app/report/[id]/page.tsx"),
  "utf8",
);
assert(
  !publicReport.includes("CompetitiveComparison"),
  "public report ignores comparison",
);

const moduleFiles = collectTsFiles(here).filter(
  (file) => !file.endsWith(".verify.ts"),
);
for (const file of moduleFiles) {
  const source = readFileSync(file, "utf8");
  assert(!/from ["']openai["']/.test(source), `${file} must not import openai`);
  assert(!/\bresend\b/i.test(source), `${file} must not reference resend`);
  assert(
    !source.includes("GOOGLE_PLACES_API_KEY"),
    `${file} must not use Google Places`,
  );
  assert(
    !source.includes("runDeterministicWebsiteAudit"),
    `${file} must not run website audits`,
  );
}

console.log("comparison.verify.ts passed");
