import {
  competitivePositionLabel,
  findingPatternLabel,
  opportunityPriorityLabel,
} from "@/lib/competitive-intelligence/comparison/labels";
import type { CompetitiveComparison } from "@/lib/competitive-intelligence/comparison/types";
import type { OpportunityType } from "@/lib/competitive-intelligence/comparison/types";

function opportunityTypeLabel(type: OpportunityType): string {
  switch (type) {
    case "COMPETITIVE_GAP":
      return "Competitive gap";
    case "TARGET_ONLY_WEAKNESS":
      return "Target-only weakness";
    case "COMMON_MARKET_WEAKNESS":
      return "Common market weakness";
    default:
      return type;
  }
}

/**
 * Client-facing evidence lines for the Competitive Growth Analysis.
 * Uses polished labels — never raw enum constants.
 */
export function resolveClientCompetitiveSourceEvidence(
  comparison: CompetitiveComparison,
  sourceKey: string,
): {
  title: string;
  lines: string[];
} {
  if (sourceKey === "overall") {
    const overall = comparison.overall;
    return {
      title: "Overall Website Growth Score",
      lines: [
        `Your score: ${overall.targetScore}`,
        `Selected competitor average: ${overall.competitorAverage}`,
        `Gap: ${overall.gapVsAverage >= 0 ? "+" : ""}${overall.gapVsAverage}`,
        `Position: ${overall.targetRank} of ${overall.participantCount}`,
      ],
    };
  }

  if (sourceKey.startsWith("category:")) {
    const category = sourceKey.slice("category:".length);
    const row = comparison.categories.find((item) => item.category === category);
    if (!row) {
      return { title: "Category comparison", lines: [] };
    }

    return {
      title: row.label,
      lines: [
        `Your score: ${row.targetScore}`,
        `Selected competitor average: ${row.competitorAverage}`,
        `Gap: ${row.gapVsAverage >= 0 ? "+" : ""}${row.gapVsAverage}`,
        `Position: ${competitivePositionLabel(row.position)}`,
      ],
    };
  }

  if (sourceKey.startsWith("opportunity:")) {
    const id = sourceKey.slice("opportunity:".length);
    const row = comparison.opportunities.find((item) => item.id === id);
    if (!row) {
      return { title: "Opportunity", lines: [] };
    }

    const lines = [
      `Priority: ${opportunityPriorityLabel(row.priority)}`,
      `Type: ${opportunityTypeLabel(row.type)}`,
    ];

    if (row.targetScore != null && row.competitorAverage != null) {
      lines.push(`Your score: ${row.targetScore}`);
      lines.push(`Selected competitor average: ${row.competitorAverage}`);
    }

    if (row.gap != null) {
      lines.push(`Gap: ${row.gap >= 0 ? "+" : ""}${row.gap}`);
    }

    return {
      title: row.title,
      lines,
    };
  }

  if (sourceKey.startsWith("advantage:")) {
    const id = sourceKey.slice("advantage:".length);
    const row = comparison.advantages.find((item) => item.id === id);
    if (!row) {
      return { title: "Advantage", lines: [] };
    }

    const lines: string[] = [];
    if (row.gapVsAverage != null) {
      lines.push(
        `Gap vs selected competitor average: ${row.gapVsAverage >= 0 ? "+" : ""}${row.gapVsAverage}`,
      );
    }
    if (row.targetRank != null && row.participantCount != null) {
      lines.push(`Position: ${row.targetRank} of ${row.participantCount}`);
    }

    return {
      title: row.title,
      lines,
    };
  }

  if (sourceKey.startsWith("finding:")) {
    const id = sourceKey.slice("finding:".length);
    const row = comparison.findingComparisons.find((item) => item.findingId === id);
    if (!row) {
      return { title: "Finding", lines: [] };
    }

    return {
      title: row.title,
      lines: [
        `Pattern: ${findingPatternLabel(row.pattern)}`,
        `Your website has this issue: ${row.targetHasIssue ? "yes" : "no"}`,
        `Competitor issues: ${row.competitorIssueCount} of ${row.competitorsCompared}`,
      ],
    };
  }

  return { title: "Evidence", lines: [] };
}
