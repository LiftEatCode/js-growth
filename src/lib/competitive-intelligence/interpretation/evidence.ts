import type { CompetitiveComparison } from "@/lib/competitive-intelligence/comparison/types";

export interface CompetitiveSourceEvidence {
  sourceKey: string;
  title: string;
  kind: "overall" | "category" | "opportunity" | "advantage" | "finding" | "unknown";
  lines: string[];
}

export function resolveCompetitiveSourceEvidence(
  comparison: CompetitiveComparison,
  sourceKey: string,
): CompetitiveSourceEvidence {
  if (sourceKey === "overall") {
    const overall = comparison.overall;
    return {
      sourceKey,
      title: "Overall Website Growth Score",
      kind: "overall",
      lines: [
        `Target: ${overall.targetScore}`,
        `Competitor average: ${overall.competitorAverage}`,
        `Gap vs average: ${overall.gapVsAverage >= 0 ? "+" : ""}${overall.gapVsAverage}`,
        `Rank: ${overall.targetRank}/${overall.participantCount}`,
        `Gap vs leader: ${overall.gapVsLeader >= 0 ? "+" : ""}${overall.gapVsLeader}`,
      ],
    };
  }

  if (sourceKey.startsWith("category:")) {
    const category = sourceKey.slice("category:".length);
    const row = comparison.categories.find((item) => item.category === category);
    if (!row) {
      return {
        sourceKey,
        title: category,
        kind: "unknown",
        lines: [],
      };
    }

    return {
      sourceKey,
      title: row.label,
      kind: "category",
      lines: [
        `Target: ${row.targetScore}`,
        `Competitor average: ${row.competitorAverage}`,
        `Gap: ${row.gapVsAverage >= 0 ? "+" : ""}${row.gapVsAverage}`,
        `Rank: ${row.targetRank}/${row.participantCount}`,
        `Position: ${row.position}`,
      ],
    };
  }

  if (sourceKey.startsWith("opportunity:")) {
    const id = sourceKey.slice("opportunity:".length);
    const row = comparison.opportunities.find((item) => item.id === id);
    if (!row) {
      return { sourceKey, title: id, kind: "unknown", lines: [] };
    }

    const lines = [
      `Priority: ${row.priority}`,
      `Type: ${row.type}`,
    ];

    if (row.targetScore != null && row.competitorAverage != null) {
      lines.push(`Target: ${row.targetScore}`);
      lines.push(`Competitor average: ${row.competitorAverage}`);
    }

    if (row.gap != null) {
      lines.push(`Gap: ${row.gap >= 0 ? "+" : ""}${row.gap}`);
    }

    if (row.competitorsOutperforming != null) {
      lines.push(
        `${row.competitorsOutperforming}/${row.competitorsCompared} competitors outperform target`,
      );
    }

    return {
      sourceKey,
      title: row.title,
      kind: "opportunity",
      lines,
    };
  }

  if (sourceKey.startsWith("advantage:")) {
    const id = sourceKey.slice("advantage:".length);
    const row = comparison.advantages.find((item) => item.id === id);
    if (!row) {
      return { sourceKey, title: id, kind: "unknown", lines: [] };
    }

    const lines: string[] = [];
    if (row.gapVsAverage != null) {
      lines.push(`Gap vs average: ${row.gapVsAverage >= 0 ? "+" : ""}${row.gapVsAverage}`);
    }
    if (row.targetRank != null && row.participantCount != null) {
      lines.push(`Rank: ${row.targetRank}/${row.participantCount}`);
    }

    return {
      sourceKey,
      title: row.title,
      kind: "advantage",
      lines,
    };
  }

  if (sourceKey.startsWith("finding:")) {
    const id = sourceKey.slice("finding:".length);
    const row = comparison.findingComparisons.find((item) => item.findingId === id);
    if (!row) {
      return { sourceKey, title: id, kind: "unknown", lines: [] };
    }

    return {
      sourceKey,
      title: row.title,
      kind: "finding",
      lines: [
        `Pattern: ${row.pattern}`,
        `Target has issue: ${row.targetHasIssue ? "yes" : "no"}`,
        `Competitor issues: ${row.competitorIssueCount}/${row.competitorsCompared}`,
      ],
    };
  }

  return {
    sourceKey,
    title: sourceKey,
    kind: "unknown",
    lines: [],
  };
}
