import {
  getCategoryPercent,
  normalizeAuditReport,
  type NormalizedAuditReport,
} from "./report-compat";
import {
  REPORT_CATEGORY_CONFIG,
  REPORT_CATEGORY_DISPLAY_ORDER,
  getReportCategoryLabel,
} from "./report-categories";
import { resolveReportTier } from "./report-access";
import {
  getReportCapabilities,
  getReportCapabilitiesForMode,
  getReportTier,
  type ReportCapabilities,
} from "./report-config";
import type {
  AuditCategory,
  AuditCategoryScore,
  AuditFinding,
  AuditPriority,
  BusinessImpact,
  FixDifficulty,
  ReportMode,
  ReportTier,
  WebsiteAuditResult,
} from "./types";

export const PRIORITY_RANK: Record<AuditPriority, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

export const IMPACT_RANK: Record<BusinessImpact, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

export const DIFFICULTY_RANK: Record<FixDifficulty, number> = {
  easy: 1,
  medium: 2,
  hard: 3,
};

export interface ScoreBand {
  id:
    | "excellent"
    | "strong"
    | "good-foundation"
    | "needs-improvement"
    | "significant-opportunities"
    | "high-priority";
  label: string;
  description: string;
  min: number;
  max: number;
}

export const SCORE_BANDS: ScoreBand[] = [
  {
    id: "excellent",
    label: "Excellent",
    description: "The website has a strong foundation across the areas we checked.",
    min: 90,
    max: 100,
  },
  {
    id: "strong",
    label: "Strong",
    description: "The website is in solid shape, with a focused set of remaining improvements.",
    min: 80,
    max: 89,
  },
  {
    id: "good-foundation",
    label: "Good foundation",
    description: "The website has a usable foundation, with clear opportunities still ahead.",
    min: 70,
    max: 79,
  },
  {
    id: "needs-improvement",
    label: "Needs improvement",
    description: "Several areas can be strengthened to make the website more effective.",
    min: 60,
    max: 69,
  },
  {
    id: "significant-opportunities",
    label: "Significant opportunities",
    description: "The website has meaningful gaps that are likely affecting visitors and search visibility.",
    min: 40,
    max: 59,
  },
  {
    id: "high-priority",
    label: "High priority",
    description: "The scan found important issues that should be reviewed soon.",
    min: 0,
    max: 39,
  },
];

export function getScoreBand(score: number): ScoreBand {
  const normalized = Number.isFinite(score)
    ? Math.min(100, Math.max(0, Math.round(score)))
    : 0;

  return (
    SCORE_BANDS.find(
      (band) => normalized >= band.min && normalized <= band.max,
    ) ?? SCORE_BANDS[SCORE_BANDS.length - 1]
  );
}

export function formatEstimatedEffort(minutes: number): string {
  const total = Number.isFinite(minutes) ? Math.max(0, minutes) : 0;

  if (total < 60) {
    return "< 1 hour";
  }

  if (total < 180) {
    return "1–3 hours";
  }

  if (total < 360) {
    return "3–6 hours";
  }

  if (total < 720) {
    return "6–12 hours";
  }

  if (total < 1440) {
    return "1–2 days";
  }

  return "Several days";
}

export function formatFindingEffort(minutes: number): string {
  const total = Number.isFinite(minutes) ? Math.max(0, minutes) : 0;

  if (total <= 0) {
    return "No estimated work";
  }

  if (total < 60) {
    return `About ${total} min`;
  }

  const hours = Math.round(total / 30) / 2;

  if (hours <= 1) {
    return "About 1 hour";
  }

  return `About ${hours} hours`;
}

export function formatDifficulty(difficulty: FixDifficulty): string {
  if (difficulty === "easy") {
    return "Easy";
  }

  if (difficulty === "hard") {
    return "Hard";
  }

  return "Medium";
}

export function isActionableFinding(finding: AuditFinding): boolean {
  return finding.status !== "pass";
}

export function compareActionableFindings(
  left: AuditFinding,
  right: AuditFinding,
): number {
  const priority =
    PRIORITY_RANK[right.priority] - PRIORITY_RANK[left.priority];

  if (priority !== 0) {
    return priority;
  }

  const impact =
    IMPACT_RANK[right.businessImpact] - IMPACT_RANK[left.businessImpact];

  if (impact !== 0) {
    return impact;
  }

  const score = right.scoreImpact - left.scoreImpact;

  if (score !== 0) {
    return score;
  }

  const difficulty =
    DIFFICULTY_RANK[left.difficulty] - DIFFICULTY_RANK[right.difficulty];

  if (difficulty !== 0) {
    return difficulty;
  }

  return left.id.localeCompare(right.id);
}

function sortActionable(findings: AuditFinding[]): AuditFinding[] {
  return findings.filter(isActionableFinding).sort(compareActionableFindings);
}

export function getTopPriorities(
  findings: AuditFinding[],
  limit = 5,
): AuditFinding[] {
  return sortActionable(findings).slice(0, Math.max(0, limit));
}

export function getQuickWins(
  findings: AuditFinding[],
  limit = 5,
): AuditFinding[] {
  return findings
    .filter((finding) => isActionableFinding(finding) && finding.quickWin)
    .sort((left, right) => {
      const easyFirst =
        DIFFICULTY_RANK[left.difficulty] - DIFFICULTY_RANK[right.difficulty];

      if (easyFirst !== 0) {
        return easyFirst;
      }

      const impact =
        IMPACT_RANK[right.businessImpact] - IMPACT_RANK[left.businessImpact];

      if (impact !== 0) {
        return impact;
      }

      const minutes = left.estimatedFixMinutes - right.estimatedFixMinutes;

      if (minutes !== 0) {
        return minutes;
      }

      return compareActionableFindings(left, right);
    })
    .slice(0, Math.max(0, limit));
}

export interface ReportActionPhase {
  id: "immediate" | "short-term" | "strategic";
  title: string;
  timeframe: string;
  description: string;
  findings: AuditFinding[];
}

export interface ReportActionPlan {
  phases: ReportActionPhase[];
}

function isImmediateFinding(finding: AuditFinding): boolean {
  if (finding.priority === "critical") {
    return true;
  }

  if (finding.status === "fail" && finding.priority === "high") {
    return true;
  }

  if (
    finding.quickWin &&
    finding.priority === "high" &&
    IMPACT_RANK[finding.businessImpact] >= IMPACT_RANK.medium
  ) {
    return true;
  }

  if (
    finding.category === "technical" &&
    finding.status === "fail" &&
    IMPACT_RANK[finding.businessImpact] >= IMPACT_RANK.medium
  ) {
    return true;
  }

  if (
    finding.category === "cro" &&
    (finding.status === "fail" || finding.priority === "high")
  ) {
    return true;
  }

  return (
    finding.category === "local" &&
    finding.status === "fail" &&
    finding.priority === "high"
  );
}

function isShortTermFinding(finding: AuditFinding): boolean {
  if (finding.difficulty === "hard" && finding.category === "performance") {
    return false;
  }

  return (
    finding.category === "seo" ||
    finding.category === "content" ||
    finding.category === "cro" ||
    finding.category === "local" ||
    finding.category === "performance" ||
    finding.difficulty === "easy" ||
    finding.quickWin
  );
}

function takeUnused(
  findings: AuditFinding[],
  used: Set<string>,
  predicate: (finding: AuditFinding) => boolean,
  limit: number,
): AuditFinding[] {
  const selected: AuditFinding[] = [];

  for (const finding of findings) {
    if (selected.length >= limit) {
      break;
    }

    if (used.has(finding.id) || !predicate(finding)) {
      continue;
    }

    selected.push(finding);
    used.add(finding.id);
  }

  return selected;
}

export function getActionPlan(findings: AuditFinding[]): ReportActionPlan {
  const ranked = sortActionable(findings);
  const used = new Set<string>();

  const immediate = takeUnused(ranked, used, isImmediateFinding, 5);
  const shortTerm = takeUnused(ranked, used, isShortTermFinding, 5);
  const strategic = takeUnused(ranked, used, () => true, 5);

  const phases: ReportActionPhase[] = [];

  if (immediate.length > 0) {
    phases.push({
      id: "immediate",
      title: "Phase 1 — First 7 days",
      timeframe: "First 7 days",
      description:
        "Start with issues that block search access, make it harder to contact the business, or create the most immediate local-visibility gaps.",
      findings: immediate,
    });
  }

  if (shortTerm.length > 0) {
    phases.push({
      id: "short-term",
      title: "Phase 2 — Next 30 days",
      timeframe: "Next 30 days",
      description:
        "Improve search messaging, conversion paths, trust, and local details once the most urgent issues are in motion.",
      findings: shortTerm,
    });
  }

  if (strategic.length > 0) {
    phases.push({
      id: "strategic",
      title: "Phase 3 — Next 60–90 days",
      timeframe: "Next 60–90 days",
      description:
        "Take on larger content, performance, or structural work that usually needs more planning.",
      findings: strategic,
    });
  }

  return { phases };
}

export interface ReportIssueCounts {
  highPriority: number;
  mediumPriority: number;
  lowPriority: number;
  passed: number;
  warnings: number;
  failed: number;
}

export function getIssueCounts(findings: AuditFinding[]): ReportIssueCounts {
  const actionable = findings.filter(isActionableFinding);

  return {
    highPriority: actionable.filter(
      (finding) =>
        finding.priority === "critical" || finding.priority === "high",
    ).length,
    mediumPriority: actionable.filter(
      (finding) => finding.priority === "medium",
    ).length,
    lowPriority: actionable.filter((finding) => finding.priority === "low")
      .length,
    passed: findings.filter((finding) => finding.status === "pass").length,
    warnings: findings.filter((finding) => finding.status === "warning")
      .length,
    failed: findings.filter((finding) => finding.status === "fail").length,
  };
}

export interface CategoryScorecardItem {
  category: AuditCategory;
  label: string;
  shortLabel: string;
  score: number;
  percent: number;
  band: ScoreBand;
  issueCount: number;
  passCount: number;
  summary: string;
  topFinding: AuditFinding | null;
  positiveFindings: AuditFinding[];
}

function getCategorySummary(options: {
  label: string;
  percent: number;
  issueCount: number;
  passCount: number;
  topFinding: AuditFinding | null;
}): string {
  if (options.issueCount === 0) {
    return `${options.label} looks healthy. ${options.passCount} ${
      options.passCount === 1 ? "check passed" : "checks passed"
    }.`;
  }

  const issueWord = options.issueCount === 1 ? "issue" : "issues";

  if (options.percent >= 80) {
    return `${options.label} is a relative strength, with ${options.issueCount} remaining ${issueWord}.`;
  }

  if (options.topFinding) {
    return `${options.label} needs attention. Highest-priority item: ${options.topFinding.title}.`;
  }

  return `${options.label} has ${options.issueCount} ${issueWord} and ${options.passCount} passing checks.`;
}

export function getCategoryScorecard(
  categoryScores: AuditCategoryScore[],
  findings: AuditFinding[],
): CategoryScorecardItem[] {
  const byId = new Map(
    categoryScores.map((score) => [score.category, score]),
  );

  return REPORT_CATEGORY_DISPLAY_ORDER.flatMap((category) => {
    const score = byId.get(category);

    if (!score) {
      return [];
    }

    const categoryFindings = findings.filter(
      (finding) => finding.category === category,
    );

    if (categoryFindings.length === 0) {
      return [];
    }

    const percent = getCategoryPercent(score);
    const issues = sortActionable(categoryFindings);
    const passes = categoryFindings
      .filter((finding) => finding.status === "pass")
      .sort((left, right) => right.scoreImpact - left.scoreImpact);
    const topFinding = issues[0] ?? null;

    return [
      {
        category,
        label: getReportCategoryLabel(category),
        shortLabel: REPORT_CATEGORY_CONFIG[category].shortLabel,
        score: percent,
        percent,
        band: getScoreBand(percent),
        issueCount: issues.length,
        passCount: passes.length,
        topFinding,
        positiveFindings: passes.slice(0, 3),
        summary: getCategorySummary({
          label: getReportCategoryLabel(category),
          percent,
          issueCount: issues.length,
          passCount: passes.length,
          topFinding,
        }),
      },
    ];
  });
}

export function getStrongestCategory(
  scorecard: CategoryScorecardItem[],
): CategoryScorecardItem | null {
  if (scorecard.length === 0) {
    return null;
  }

  return [...scorecard].sort((left, right) => {
    if (right.percent !== left.percent) {
      return right.percent - left.percent;
    }

    return left.category.localeCompare(right.category);
  })[0] ?? null;
}

export function getWeakestCategory(
  scorecard: CategoryScorecardItem[],
): CategoryScorecardItem | null {
  if (scorecard.length === 0) {
    return null;
  }

  return [...scorecard].sort((left, right) => {
    if (left.percent !== right.percent) {
      return left.percent - right.percent;
    }

    return left.category.localeCompare(right.category);
  })[0] ?? null;
}

export interface ReportExecutiveSummary {
  heading: string;
  overview: string;
  overallScore: number;
  scoreBand: ScoreBand;
  strongest: CategoryScorecardItem | null;
  weakest: CategoryScorecardItem | null;
  highPriorityCount: number;
  quickWinCount: number;
  estimatedEffortLabel: string;
  estimatedFixMinutes: number;
}

export function getExecutiveSummary(options: {
  findings: AuditFinding[];
  categoryScores: AuditCategoryScore[];
  overallScore: number;
  estimatedFixMinutes: number;
}): ReportExecutiveSummary {
  const scorecard = getCategoryScorecard(
    options.categoryScores,
    options.findings,
  );
  const counts = getIssueCounts(options.findings);
  const strongest = getStrongestCategory(scorecard);
  const weakest = getWeakestCategory(scorecard);
  const scoreBand = getScoreBand(options.overallScore);
  const quickWinCount = getQuickWins(options.findings, 20).length;

  let heading = `${scoreBand.label} website foundation`;

  if (counts.highPriority >= 5) {
    heading = "Immediate attention recommended";
  } else if (counts.highPriority >= 2) {
    heading = "Several high-priority improvements";
  } else if (options.overallScore >= 90 && counts.highPriority === 0) {
    heading = "The website is in strong shape";
  }

  const parts = [
    `Website Growth Score: ${options.overallScore}/100 (${scoreBand.label}).`,
  ];

  if (strongest) {
    parts.push(`Strongest area: ${strongest.label} — ${strongest.percent}/100.`);
  }

  if (weakest && weakest.category !== strongest?.category) {
    parts.push(
      `Biggest opportunity: ${weakest.label} — ${weakest.percent}/100.`,
    );
  }

  parts.push(
    "The audit identified several opportunities that may improve search visibility, usability, local relevance, and the path from visitor to lead.",
  );

  return {
    heading,
    overview: parts.join(" "),
    overallScore: options.overallScore,
    scoreBand,
    strongest,
    weakest,
    highPriorityCount: counts.highPriority,
    quickWinCount,
    estimatedEffortLabel: formatEstimatedEffort(options.estimatedFixMinutes),
    estimatedFixMinutes: options.estimatedFixMinutes,
  };
}

export interface GrowthReportViewModel {
  report: NormalizedAuditReport;
  tier: ReportTier;
  capabilities: ReportCapabilities;
  scoreBand: ScoreBand;
  summary: ReportExecutiveSummary;
  scorecard: CategoryScorecardItem[];
  strongest: CategoryScorecardItem | null;
  weakest: CategoryScorecardItem | null;
  counts: ReportIssueCounts;
  topPriorities: AuditFinding[];
  quickWins: AuditFinding[];
  actionPlan: ReportActionPlan;
  estimatedEffortLabel: string;
}

export function buildGrowthReportViewModel(
  result: WebsiteAuditResult,
  mode: ReportMode = "public",
  options: { professionallyUnlocked?: boolean } = {},
): GrowthReportViewModel {
  const report = normalizeAuditReport(result);
  const tier = resolveReportTier({
    mode,
    professionallyUnlocked: options.professionallyUnlocked,
  });
  const capabilities = getReportCapabilities(tier);
  const scorecard = getCategoryScorecard(
    report.categoryScores,
    report.findings,
  );
  const summary = getExecutiveSummary({
    findings: report.findings,
    categoryScores: report.categoryScores,
    overallScore: report.overallScore,
    estimatedFixMinutes: report.summary.estimatedFixMinutes,
  });
  const priorityLimit = capabilities.maxPriorityFindings ?? 5;
  const quickWinLimit = capabilities.maxQuickWins ?? 5;

  return {
    report,
    tier,
    capabilities,
    scoreBand: summary.scoreBand,
    summary,
    scorecard,
    strongest: summary.strongest,
    weakest: summary.weakest,
    counts: getIssueCounts(report.findings),
    topPriorities: getTopPriorities(report.findings, priorityLimit),
    quickWins: getQuickWins(report.findings, quickWinLimit),
    actionPlan: capabilities.showActionPlan
      ? getActionPlan(report.findings)
      : { phases: [] },
    estimatedEffortLabel: summary.estimatedEffortLabel,
  };
}

export {
  getReportCapabilities,
  getReportCapabilitiesForMode,
  getReportTier,
};
export { resolveReportTier } from "./report-access";
