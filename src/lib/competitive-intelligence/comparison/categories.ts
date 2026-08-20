import type { AuditCategory } from "@/lib/website-audit/types";

import { classifyPosition, categoryScorePercent, buildScoreDistribution } from "./math";
import type {
  CategoryComparison,
  ComparisonCompetitorInput,
  ComparisonInputAudit,
} from "./types";

const CATEGORY_ORDER: AuditCategory[] = [
  "technical",
  "seo",
  "content",
  "cro",
  "accessibility",
  "local",
  "performance",
];

export function compareCategories(options: {
  targetId: string;
  targetLabel: string;
  target: ComparisonInputAudit;
  competitors: ComparisonCompetitorInput[];
}): CategoryComparison[] {
  const labelByCategory = new Map(
    options.target.categoryScores.map((row) => [row.category, row.label]),
  );

  for (const competitor of options.competitors) {
    for (const row of competitor.audit.categoryScores) {
      if (!labelByCategory.has(row.category)) {
        labelByCategory.set(row.category, row.label);
      }
    }
  }

  const results: CategoryComparison[] = [];

  for (const category of CATEGORY_ORDER) {
    const targetRow = options.target.categoryScores.find(
      (row) => row.category === category && row.applicable && row.maxScore > 0,
    );

    if (!targetRow) {
      continue;
    }

    const targetScore = categoryScorePercent(targetRow.score, targetRow.maxScore);
    const competitorBreakdown: CategoryComparison["competitorBreakdown"] = [];

    for (const competitor of options.competitors) {
      const row = competitor.audit.categoryScores.find(
        (entry) =>
          entry.category === category && entry.applicable && entry.maxScore > 0,
      );

      if (!row) {
        continue;
      }

      competitorBreakdown.push({
        prospectCompetitorId: competitor.prospectCompetitorId,
        businessName: competitor.businessName,
        score: categoryScorePercent(row.score, row.maxScore),
      });
    }

    if (competitorBreakdown.length === 0) {
      continue;
    }

    const distribution = buildScoreDistribution({
      targetId: options.targetId,
      targetLabel: options.targetLabel,
      targetScore,
      competitors: competitorBreakdown.map((row) => ({
        id: row.prospectCompetitorId,
        label: row.businessName,
        score: row.score,
      })),
    });

    results.push({
      category,
      label: labelByCategory.get(category) ?? category,
      ...distribution,
      position: classifyPosition(distribution.gapVsAverage),
      competitorBreakdown,
    });
  }

  return results;
}
