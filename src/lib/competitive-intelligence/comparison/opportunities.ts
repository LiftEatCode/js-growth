import { MAX_ADVANTAGES_SHOWN, MAX_OPPORTUNITIES_SHOWN } from "./constants";
import type {
  CategoryComparison,
  CompetitiveAdvantage,
  CompetitiveOpportunity,
  FindingComparison,
  OpportunityPriority,
  OverallComparison,
} from "./types";

function priorityFromScore(score: number): OpportunityPriority {
  if (score >= 80) {
    return "CRITICAL";
  }

  if (score >= 55) {
    return "HIGH";
  }

  if (score >= 30) {
    return "MEDIUM";
  }

  return "LOW";
}

function findingSeverityBoost(priority: FindingComparison["priority"]): number {
  switch (priority) {
    case "critical":
      return 25;
    case "high":
      return 18;
    case "medium":
      return 10;
    default:
      return 4;
  }
}

export function buildOpportunities(options: {
  overall: OverallComparison;
  categories: CategoryComparison[];
  findings: FindingComparison[];
}): CompetitiveOpportunity[] {
  const opportunities: CompetitiveOpportunity[] = [];

  for (const category of options.categories) {
    if (category.gapVsAverage >= -5) {
      continue;
    }

    const magnitude = Math.abs(category.gapVsAverage);
    const outperformBoost = category.competitorsOutperforming * 8;
    const priorityScore = Math.min(
      100,
      Math.round(magnitude * 1.5 + outperformBoost),
    );

    opportunities.push({
      id: `category-${category.category}`,
      type: "COMPETITIVE_GAP",
      priority: priorityFromScore(priorityScore),
      priorityScore,
      category: category.category,
      title: `${category.label} is below competitor average`,
      targetScore: category.targetScore,
      competitorAverage: category.competitorAverage,
      gap: category.gapVsAverage,
      competitorsOutperforming: category.competitorsOutperforming,
      competitorsCompared: category.competitorsCompared,
      findingId: null,
      evidence: [
        `Target ${category.targetScore} vs competitor average ${category.competitorAverage} (gap ${category.gapVsAverage}).`,
        `${category.competitorsOutperforming} of ${category.competitorsCompared} competitors outperform target.`,
        `Target rank ${category.targetRank} of ${category.participantCount}.`,
      ],
    });
  }

  for (const finding of options.findings) {
    if (finding.pattern === "TARGET_ONLY_WEAKNESS") {
      const priorityScore = Math.min(
        100,
        40 + findingSeverityBoost(finding.priority) + finding.competitorsCompared * 5,
      );

      opportunities.push({
        id: `finding-${finding.findingId}`,
        type: "TARGET_ONLY_WEAKNESS",
        priority: priorityFromScore(priorityScore),
        priorityScore,
        category: finding.category,
        title: finding.title,
        targetScore: null,
        competitorAverage: null,
        gap: null,
        competitorsOutperforming: finding.competitorPassCount,
        competitorsCompared: finding.competitorsCompared,
        findingId: finding.findingId,
        evidence: [
          `Target has this issue; ${finding.competitorIssueCount} of ${finding.competitorsCompared} competitors have it.`,
          `Finding priority: ${finding.priority}.`,
        ],
      });
      continue;
    }

    if (finding.pattern === "COMMON_MARKET_WEAKNESS") {
      const priorityScore = Math.min(
        100,
        20 + findingSeverityBoost(finding.priority),
      );

      opportunities.push({
        id: `finding-${finding.findingId}`,
        type: "COMMON_MARKET_WEAKNESS",
        priority: priorityFromScore(priorityScore),
        priorityScore,
        category: finding.category,
        title: finding.title,
        targetScore: null,
        competitorAverage: null,
        gap: null,
        competitorsOutperforming: finding.competitorPassCount,
        competitorsCompared: finding.competitorsCompared,
        findingId: finding.findingId,
        evidence: [
          `Target and ${finding.competitorIssueCount} of ${finding.competitorsCompared} competitors have this issue (${finding.prevalencePercent}% competitor prevalence).`,
          `Finding priority: ${finding.priority}.`,
        ],
      });
    }
  }

  if (options.overall.gapVsAverage <= -5) {
    const priorityScore = Math.min(
      100,
      Math.round(Math.abs(options.overall.gapVsAverage) * 1.8) +
        options.overall.competitorsOutperforming * 6,
    );

    opportunities.push({
      id: "overall-gap",
      type: "COMPETITIVE_GAP",
      priority: priorityFromScore(priorityScore),
      priorityScore,
      category: null,
      title: "Overall Website Growth Score trails competitors",
      targetScore: options.overall.targetScore,
      competitorAverage: options.overall.competitorAverage,
      gap: options.overall.gapVsAverage,
      competitorsOutperforming: options.overall.competitorsOutperforming,
      competitorsCompared: options.overall.competitorsCompared,
      findingId: null,
      evidence: [
        `Target ${options.overall.targetScore} vs competitor average ${options.overall.competitorAverage}.`,
        `Rank ${options.overall.targetRank} of ${options.overall.participantCount}.`,
      ],
    });
  }

  return opportunities
    .sort((left, right) => {
      if (right.priorityScore !== left.priorityScore) {
        return right.priorityScore - left.priorityScore;
      }

      return left.id.localeCompare(right.id);
    })
    .slice(0, MAX_OPPORTUNITIES_SHOWN);
}

export function buildAdvantages(options: {
  overall: OverallComparison;
  categories: CategoryComparison[];
  findings: FindingComparison[];
}): CompetitiveAdvantage[] {
  const advantages: CompetitiveAdvantage[] = [];

  if (
    options.overall.gapVsAverage >= 5 ||
    options.overall.targetRank === 1
  ) {
    advantages.push({
      id: "overall-strength",
      kind: "OVERALL",
      category: null,
      title: "Overall Website Growth Score is competitive",
      evidence: [
        `Target ${options.overall.targetScore} vs competitor average ${options.overall.competitorAverage} (gap ${options.overall.gapVsAverage}).`,
        `Rank ${options.overall.targetRank} of ${options.overall.participantCount}.`,
      ],
      gapVsAverage: options.overall.gapVsAverage,
      targetRank: options.overall.targetRank,
      participantCount: options.overall.participantCount,
    });
  }

  for (const category of options.categories) {
    if (category.gapVsAverage < 5 && category.targetRank !== 1) {
      continue;
    }

    advantages.push({
      id: `category-${category.category}`,
      kind: "CATEGORY",
      category: category.category,
      title: `${category.label} outperforms competitors`,
      evidence: [
        `Target ${category.targetScore} vs competitor average ${category.competitorAverage} (gap ${category.gapVsAverage}).`,
        `Rank ${category.targetRank} of ${category.participantCount}.`,
      ],
      gapVsAverage: category.gapVsAverage,
      targetRank: category.targetRank,
      participantCount: category.participantCount,
    });
  }

  for (const finding of options.findings) {
    if (finding.pattern !== "COMPETITIVE_ADVANTAGE") {
      continue;
    }

    advantages.push({
      id: `finding-${finding.findingId}`,
      kind: "FINDING",
      category: finding.category,
      title: finding.title,
      evidence: [
        `Target passes; ${finding.competitorIssueCount} of ${finding.competitorsCompared} competitors have this issue.`,
      ],
      gapVsAverage: null,
      targetRank: null,
      participantCount: finding.competitorsCompared + 1,
    });
  }

  return advantages
    .sort((left, right) => {
      const leftGap = left.gapVsAverage ?? -999;
      const rightGap = right.gapVsAverage ?? -999;

      if (rightGap !== leftGap) {
        return rightGap - leftGap;
      }

      return left.id.localeCompare(right.id);
    })
    .slice(0, MAX_ADVANTAGES_SHOWN);
}
