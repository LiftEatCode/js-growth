import { runAuditRules } from "./engine/run-audit-rules";
import { calculateAuditOpportunity } from "./opportunity";
import { coreAuditRules } from "./rules";
import type {
  AuditCategory,
  AuditCategoryScore,
  AuditFinding,
  AuditPageData,
  AuditSiteDiscoveryData,
  AuditStatus,
  WebsiteAuditResult,
} from "./types";

interface ScoringResult {
  findings: AuditFinding[];
  categoryScores: AuditCategoryScore[];
  overallScore: number;
  summary: WebsiteAuditResult["summary"];
  opportunity: WebsiteAuditResult["opportunity"];
}

const CATEGORY_LABELS: Record<
  AuditCategory,
  string
> = {
  technical: "Technical SEO",
  seo: "Search Optimization",
  content: "Content",
  accessibility: "Accessibility",
  local: "Local SEO",
  performance: "Performance",
};

const CATEGORY_MAX_SCORES: Record<
  AuditCategory,
  number
> = {
  technical: 25,
  seo: 25,
  content: 15,
  accessibility: 10,
  local: 15,
  performance: 10,
};

const STATUS_MULTIPLIERS: Record<
  AuditStatus,
  number
> = {
  pass: 1,
  warning: 0.5,
  fail: 0,
};

function clampScore(
  value: number,
  minimum = 0,
  maximum = 100,
): number {
  return Math.min(
    Math.max(value, minimum),
    maximum,
  );
}

function calculateCategoryScores(
  findings: AuditFinding[],
): AuditCategoryScore[] {
  const categories = Object.keys(
    CATEGORY_MAX_SCORES,
  ) as AuditCategory[];

  return categories.map((category) => {
    const categoryFindings = findings.filter(
      (finding) =>
        finding.category === category,
    );

    const possiblePoints =
      categoryFindings.reduce(
        (total, finding) =>
          total + finding.scoreImpact,
        0,
      );

    const earnedPoints =
      categoryFindings.reduce(
        (total, finding) =>
          total +
          finding.scoreImpact *
            STATUS_MULTIPLIERS[
              finding.status
            ],
        0,
      );

    const maxScore =
      CATEGORY_MAX_SCORES[category];

    const normalizedScore =
      possiblePoints === 0
        ? 0
        : (earnedPoints /
            possiblePoints) *
          maxScore;

    return {
      category,
      label: CATEGORY_LABELS[category],
      score: Math.round(
        clampScore(
          normalizedScore,
          0,
          maxScore,
        ),
      ),
      maxScore,
    };
  });
}

function calculateOverallScore(
  categoryScores: AuditCategoryScore[],
): number {
  const earnedScore =
    categoryScores.reduce(
      (total, category) =>
        total + category.score,
      0,
    );

  const maximumScore =
    categoryScores.reduce(
      (total, category) =>
        total + category.maxScore,
      0,
    );

  if (maximumScore === 0) {
    return 0;
  }

  return Math.round(
    clampScore(
      (earnedScore / maximumScore) *
        100,
    ),
  );
}

function calculateSummary(
  findings: AuditFinding[],
): WebsiteAuditResult["summary"] {
  return findings.reduce(
    (summary, finding) => {
      if (finding.status === "pass") {
        summary.passed += 1;
      }

      if (finding.status === "warning") {
        summary.warnings += 1;
      }

      if (finding.status === "fail") {
        summary.failed += 1;
      }

      const isActionable =
        finding.status !== "pass";

      if (
        isActionable &&
        finding.priority === "critical"
      ) {
        summary.criticalIssues += 1;
      }

      if (
        isActionable &&
        finding.quickWin
      ) {
        summary.quickWins += 1;
      }

      if (
        isActionable &&
        finding.businessImpact === "high"
      ) {
        summary.highImpactFindings += 1;
      }

      if (isActionable) {
        summary.estimatedFixMinutes +=
          finding.estimatedFixMinutes;
      }

      return summary;
    },
    {
      passed: 0,
      warnings: 0,
      failed: 0,
      criticalIssues: 0,
      quickWins: 0,
      highImpactFindings: 0,
      estimatedFixMinutes: 0,
    },
  );
}

export function scoreWebsiteAudit(
  pageData: AuditPageData,
  finalUrl: string,
  siteDiscovery?: AuditSiteDiscoveryData,
): ScoringResult {
  const findings = runAuditRules(
    coreAuditRules,
    {
      pageData,
      siteDiscovery,
      finalUrl,
    },
  );

  const categoryScores =
    calculateCategoryScores(findings);

  const overallScore =
    calculateOverallScore(
      categoryScores,
    );

  const summary =
    calculateSummary(findings);

  const opportunity =
    calculateAuditOpportunity({
      findings,
      overallScore,
      summary,
    });

  return {
    findings,
    categoryScores,
    overallScore,
    summary,
    opportunity,
  };
}