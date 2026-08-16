import { REPORT_CATEGORY_CONFIG } from "./report-categories";
import { isCompetitiveData } from "./competitive/visibility";
import type {
  AuditCategory,
  AuditCategoryScore,
  AuditFinding,
  AuditPriority,
  AuditStatus,
  BusinessImpact,
  FixDifficulty,
  WebsiteAuditResult,
} from "./types";

const CATEGORIES = new Set<AuditCategory>(
  Object.keys(REPORT_CATEGORY_CONFIG) as AuditCategory[],
);

const STATUSES = new Set<AuditStatus>(["pass", "warning", "fail"]);

const PRIORITIES = new Set<AuditPriority>([
  "low",
  "medium",
  "high",
  "critical",
]);

const IMPACTS = new Set<BusinessImpact>(["low", "medium", "high"]);

const DIFFICULTIES = new Set<FixDifficulty>(["easy", "medium", "hard"]);

function asFiniteNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : fallback;
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

export function normalizeFinding(
  finding: Partial<AuditFinding> &
    Pick<AuditFinding, "id" | "title" | "status" | "category">,
): AuditFinding {
  const status = STATUSES.has(finding.status) ? finding.status : "warning";
  const category = CATEGORIES.has(finding.category)
    ? finding.category
    : "technical";
  const scoreImpact = Math.max(0, asFiniteNumber(finding.scoreImpact, 1));

  return {
    id: asString(finding.id, "unknown-finding"),
    title: asString(finding.title, "Audit finding"),
    description: asString(finding.description, finding.title),
    recommendation: finding.recommendation,
    status,
    category,
    scoreImpact,
    priority: PRIORITIES.has(finding.priority ?? "medium")
      ? (finding.priority ?? "medium")
      : "medium",
    businessImpact: IMPACTS.has(finding.businessImpact ?? "medium")
      ? (finding.businessImpact ?? "medium")
      : "medium",
    difficulty: DIFFICULTIES.has(finding.difficulty ?? "medium")
      ? (finding.difficulty ?? "medium")
      : "medium",
    estimatedFixMinutes: Math.max(
      0,
      asFiniteNumber(finding.estimatedFixMinutes, 0),
    ),
    quickWin: Boolean(finding.quickWin),
  };
}

export function normalizeFindings(
  findings: Array<Partial<AuditFinding>> | undefined,
): AuditFinding[] {
  if (!Array.isArray(findings)) {
    return [];
  }

  return findings
    .filter(
      (finding): finding is Partial<AuditFinding> &
        Pick<AuditFinding, "id" | "title" | "status" | "category"> =>
        Boolean(finding) &&
        typeof finding.id === "string" &&
        typeof finding.title === "string" &&
        typeof finding.status === "string" &&
        typeof finding.category === "string",
    )
    .map(normalizeFinding);
}

export function normalizeCategoryScores(
  scores: AuditCategoryScore[] | undefined,
  findings: AuditFinding[],
): AuditCategoryScore[] {
  const byCategory = new Map<AuditCategory, AuditCategoryScore>();

  for (const score of scores ?? []) {
    if (!CATEGORIES.has(score.category)) {
      continue;
    }

    const maxScore = asFiniteNumber(score.maxScore, 0);
    const value = asFiniteNumber(score.score, 0);

    byCategory.set(score.category, {
      category: score.category,
      label:
        REPORT_CATEGORY_CONFIG[score.category]?.label ?? score.label,
      score: Number.isFinite(value) ? value : 0,
      maxScore: maxScore > 0 ? maxScore : 0,
    });
  }

  return [...byCategory.values()].filter((score) => {
    const hasFindings = findings.some(
      (finding) => finding.category === score.category,
    );

    return hasFindings && score.maxScore > 0;
  });
}

export function normalizeOverallScore(
  score: unknown,
  categoryScores: AuditCategoryScore[],
): number {
  if (typeof score === "number" && Number.isFinite(score)) {
    return Math.min(100, Math.max(0, Math.round(score)));
  }

  const earned = categoryScores.reduce((total, item) => total + item.score, 0);
  const maximum = categoryScores.reduce(
    (total, item) => total + item.maxScore,
    0,
  );

  if (maximum <= 0) {
    return 0;
  }

  return Math.min(100, Math.max(0, Math.round((earned / maximum) * 100)));
}

export function getCategoryPercent(score: AuditCategoryScore): number {
  if (!score.maxScore || score.maxScore <= 0) {
    return 0;
  }

  const percent = Math.round((score.score / score.maxScore) * 100);

  if (!Number.isFinite(percent)) {
    return 0;
  }

  return Math.min(100, Math.max(0, percent));
}

export interface NormalizedAuditReport {
  findings: AuditFinding[];
  categoryScores: AuditCategoryScore[];
  overallScore: number;
  summary: WebsiteAuditResult["summary"];
  metadata: WebsiteAuditResult["metadata"];
  pageData: WebsiteAuditResult["pageData"];
  siteData?: WebsiteAuditResult["siteData"];
  competitiveData?: WebsiteAuditResult["competitiveData"];
}

export function normalizeAuditReport(
  result: WebsiteAuditResult,
): NormalizedAuditReport {
  const findings = normalizeFindings(result.findings);
  const categoryScores = normalizeCategoryScores(
    result.categoryScores,
    findings,
  );
  const overallScore = normalizeOverallScore(
    result.overallScore,
    categoryScores,
  );
  const passed = findings.filter((finding) => finding.status === "pass").length;
  const warnings = findings.filter(
    (finding) => finding.status === "warning",
  ).length;
  const failed = findings.filter((finding) => finding.status === "fail").length;

  return {
    findings,
    categoryScores,
    overallScore,
    pageData: result.pageData,
    metadata: result.metadata,
    siteData: result.siteData,
    competitiveData: isCompetitiveData(result.competitiveData)
      ? result.competitiveData
      : undefined,
    summary: {
      passed: asFiniteNumber(result.summary?.passed, passed),
      warnings: asFiniteNumber(result.summary?.warnings, warnings),
      failed: asFiniteNumber(result.summary?.failed, failed),
      criticalIssues: asFiniteNumber(
        result.summary?.criticalIssues,
        findings.filter(
          (finding) =>
            finding.status !== "pass" && finding.priority === "critical",
        ).length,
      ),
      quickWins: asFiniteNumber(
        result.summary?.quickWins,
        findings.filter(
          (finding) => finding.status !== "pass" && finding.quickWin,
        ).length,
      ),
      highImpactFindings: asFiniteNumber(
        result.summary?.highImpactFindings,
        findings.filter(
          (finding) =>
            finding.status !== "pass" && finding.businessImpact === "high",
        ).length,
      ),
      estimatedFixMinutes: asFiniteNumber(
        result.summary?.estimatedFixMinutes,
        findings
          .filter((finding) => finding.status !== "pass")
          .reduce((total, finding) => total + finding.estimatedFixMinutes, 0),
      ),
    },
  };
}
