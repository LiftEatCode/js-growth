import type { CompetitiveComparison } from "@/lib/competitive-intelligence/comparison/types";

import {
  COMPETITIVE_INTERPRETATION_PROMPT_VERSION,
  COMPETITIVE_INTERPRETATION_VERSION,
  MAX_AI_ADVANTAGES,
  MAX_AI_COMPETITORS,
  MAX_AI_FINDING_EVIDENCE_PER_ITEM,
  MAX_AI_OPPORTUNITIES,
} from "./constants";
import type { CompetitiveAiInput } from "./types";

export function buildSourceKeyCatalog(comparison: CompetitiveComparison): string[] {
  const keys = new Set<string>(["overall"]);

  for (const category of comparison.categories) {
    keys.add(`category:${category.category}`);
  }

  for (const opportunity of comparison.opportunities) {
    keys.add(`opportunity:${opportunity.id}`);
  }

  for (const advantage of comparison.advantages) {
    keys.add(`advantage:${advantage.id}`);
  }

  for (const finding of comparison.findingComparisons) {
    keys.add(`finding:${finding.findingId}`);
  }

  return [...keys].sort();
}

export function buildCompetitiveAiInput(options: {
  comparison: CompetitiveComparison;
  comparisonSnapshotId: string;
  targetBusinessName: string;
}): CompetitiveAiInput {
  const { comparison } = options;
  const allowedSourceKeys = buildSourceKeyCatalog(comparison);

  return {
    meta: {
      interpretationVersion: COMPETITIVE_INTERPRETATION_VERSION,
      promptVersion: COMPETITIVE_INTERPRETATION_PROMPT_VERSION,
      comparisonVersion: comparison.comparisonVersion,
      auditEngineVersion: comparison.auditEngineVersion,
      comparisonSnapshotId: options.comparisonSnapshotId,
    },
    target: {
      businessName: options.targetBusinessName,
      websiteGrowthScore: comparison.overall.targetScore,
    },
    comparison: {
      competitorCount: comparison.overall.competitorsCompared,
      competitorAverage: comparison.overall.competitorAverage,
      competitorBest: comparison.overall.competitorBest,
      competitorWorst: comparison.overall.competitorWorst,
      gapVsAverage: comparison.overall.gapVsAverage,
      gapVsLeader: comparison.overall.gapVsLeader,
      targetRank: comparison.overall.targetRank,
      participantCount: comparison.overall.participantCount,
      position: comparison.overall.position,
    },
    categories: comparison.categories.map((row) => ({
      sourceKey: `category:${row.category}`,
      category: row.category,
      label: row.label,
      targetScore: row.targetScore,
      competitorAverage: row.competitorAverage,
      competitorBest: row.competitorBest,
      gap: row.gapVsAverage,
      targetRank: row.targetRank,
      participantCount: row.participantCount,
      position: row.position,
    })),
    topOpportunities: comparison.opportunities
      .slice(0, MAX_AI_OPPORTUNITIES)
      .map((row) => ({
        sourceKey: `opportunity:${row.id}`,
        category: row.category,
        type: row.type,
        priority: row.priority,
        title: row.title,
        facts: {
          targetScore: row.targetScore,
          competitorAverage: row.competitorAverage,
          gap: row.gap,
          competitorsOutperforming: row.competitorsOutperforming,
          competitorsCompared: row.competitorsCompared,
        },
        evidence: row.evidence.slice(0, MAX_AI_FINDING_EVIDENCE_PER_ITEM),
      })),
    topAdvantages: comparison.advantages.slice(0, MAX_AI_ADVANTAGES).map((row) => ({
      sourceKey: `advantage:${row.id}`,
      category: row.category,
      kind: row.kind,
      title: row.title,
      facts: {
        gapVsAverage: row.gapVsAverage,
        targetRank: row.targetRank,
        participantCount: row.participantCount,
      },
      evidence: row.evidence.slice(0, MAX_AI_FINDING_EVIDENCE_PER_ITEM),
    })),
    competitors: comparison.competitorsCompared
      .slice(0, MAX_AI_COMPETITORS)
      .map((row) => ({
        businessName: row.businessName,
        websiteGrowthScore: row.websiteGrowthScore,
        competitiveRelevance: row.competitiveRelevanceScore,
        distanceMiles: row.distanceMiles,
      })),
    allowedSourceKeys,
  };
}
