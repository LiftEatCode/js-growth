import type { AuditCategory, AuditPriority } from "@/lib/website-audit/types";

import type {
  ComparisonCompetitorInput,
  ComparisonInputAudit,
  FindingComparison,
  FindingPattern,
} from "./types";

function isIssue(status: "pass" | "warning" | "fail"): boolean {
  return status === "fail" || status === "warning";
}

function classifyFindingPattern(options: {
  targetHasIssue: boolean;
  competitorIssueCount: number;
  competitorsCompared: number;
}): FindingPattern {
  const { targetHasIssue, competitorIssueCount, competitorsCompared } = options;

  if (competitorsCompared === 0) {
    return "MIXED";
  }

  const prevalence = competitorIssueCount / competitorsCompared;

  if (targetHasIssue && competitorIssueCount === 0) {
    return "TARGET_ONLY_WEAKNESS";
  }

  if (targetHasIssue && prevalence >= 2 / 3) {
    return "COMMON_MARKET_WEAKNESS";
  }

  if (!targetHasIssue && prevalence >= 2 / 3) {
    return "COMPETITIVE_ADVANTAGE";
  }

  if (!targetHasIssue && prevalence <= 1 / 3) {
    return "MARKET_STANDARD";
  }

  return "MIXED";
}

export function compareFindings(options: {
  target: ComparisonInputAudit;
  competitors: ComparisonCompetitorInput[];
}): FindingComparison[] {
  const findingMeta = new Map<
    string,
    { title: string; category: AuditCategory; priority: AuditPriority }
  >();

  for (const finding of options.target.findings) {
    findingMeta.set(finding.id, {
      title: finding.title,
      category: finding.category,
      priority: finding.priority,
    });
  }

  for (const competitor of options.competitors) {
    for (const finding of competitor.audit.findings) {
      if (!findingMeta.has(finding.id)) {
        findingMeta.set(finding.id, {
          title: finding.title,
          category: finding.category,
          priority: finding.priority,
        });
      }
    }
  }

  const comparisons: FindingComparison[] = [];

  for (const [findingId, meta] of findingMeta) {
    const targetFinding = options.target.findings.find((row) => row.id === findingId);
    const targetHasIssue = targetFinding ? isIssue(targetFinding.status) : false;

    let competitorIssueCount = 0;
    let competitorPassCount = 0;
    let competitorsCompared = 0;

    for (const competitor of options.competitors) {
      const row = competitor.audit.findings.find((finding) => finding.id === findingId);

      if (!row) {
        continue;
      }

      competitorsCompared += 1;

      if (isIssue(row.status)) {
        competitorIssueCount += 1;
      } else {
        competitorPassCount += 1;
      }
    }

    if (competitorsCompared === 0 && !targetFinding) {
      continue;
    }

    const prevalencePercent =
      competitorsCompared === 0
        ? 0
        : Math.round((competitorIssueCount / competitorsCompared) * 100);

    comparisons.push({
      findingId,
      title: meta.title,
      category: meta.category,
      priority: meta.priority,
      targetHasIssue,
      competitorIssueCount,
      competitorPassCount,
      competitorsCompared,
      prevalencePercent,
      pattern: classifyFindingPattern({
        targetHasIssue,
        competitorIssueCount,
        competitorsCompared,
      }),
    });
  }

  return comparisons.sort((left, right) => {
    const patternRank = (pattern: FindingPattern) => {
      switch (pattern) {
        case "TARGET_ONLY_WEAKNESS":
          return 0;
        case "COMMON_MARKET_WEAKNESS":
          return 1;
        case "COMPETITIVE_ADVANTAGE":
          return 2;
        case "MIXED":
          return 3;
        default:
          return 4;
      }
    };

    const byPattern = patternRank(left.pattern) - patternRank(right.pattern);

    if (byPattern !== 0) {
      return byPattern;
    }

    return left.findingId.localeCompare(right.findingId);
  });
}
