import { COMPETITIVE_COMPARISON_VERSION } from "./constants";
import { compareCategories } from "./categories";
import { compareFindings } from "./findings";
import { buildScoreDistribution, classifyPosition } from "./math";
import { buildAdvantages, buildOpportunities } from "./opportunities";
import type {
  ComparedCompetitorSummary,
  ComparisonCompetitorInput,
  ComparisonInputAudit,
  CompetitiveComparison,
} from "./types";

export function buildCompetitiveComparison(options: {
  prospectId: string;
  campaignId: string;
  auditReportId: string;
  targetLabel: string;
  target: ComparisonInputAudit;
  competitors: ComparisonCompetitorInput[];
  generatedAt?: Date;
}): CompetitiveComparison {
  const generatedAt = (options.generatedAt ?? new Date()).toISOString();
  const notes: string[] = [];

  if (options.competitors.length === 1) {
    notes.push("Comparison is based on 1 audited competitor.");
  } else {
    notes.push(
      `Comparison is based on ${options.competitors.length} audited competitors.`,
    );
  }

  const overallDistribution = buildScoreDistribution({
    targetId: "target",
    targetLabel: options.targetLabel,
    targetScore: options.target.overallScore,
    competitors: options.competitors.map((row) => ({
      id: row.prospectCompetitorId,
      label: row.businessName,
      score: row.audit.overallScore,
    })),
  });

  const overall = {
    ...overallDistribution,
    position: classifyPosition(overallDistribution.gapVsAverage),
  };

  const categories = compareCategories({
    targetId: "target",
    targetLabel: options.targetLabel,
    target: options.target,
    competitors: options.competitors,
  });

  const findingComparisons = compareFindings({
    target: options.target,
    competitors: options.competitors,
  });

  const opportunities = buildOpportunities({
    overall,
    categories,
    findings: findingComparisons,
  });

  const advantages = buildAdvantages({
    overall,
    categories,
    findings: findingComparisons,
  });

  const competitorsCompared: ComparedCompetitorSummary[] = options.competitors.map(
    (row) => ({
      prospectCompetitorId: row.prospectCompetitorId,
      competitorAuditId: row.competitorAuditId,
      businessName: row.businessName,
      website: row.website,
      competitiveRelevanceScore: row.competitiveRelevanceScore,
      distanceMiles: row.distanceMiles,
      websiteGrowthScore: row.audit.overallScore,
      auditEngineVersion: row.audit.auditEngineVersion,
      auditedAt: row.auditedAt,
    }),
  );

  return {
    comparisonVersion: COMPETITIVE_COMPARISON_VERSION,
    auditEngineVersion: options.target.auditEngineVersion,
    prospectId: options.prospectId,
    campaignId: options.campaignId,
    auditReportId: options.auditReportId,
    generatedAt,
    competitorsCompared,
    overall,
    categories,
    findingComparisons,
    advantages,
    opportunities,
    notes,
  };
}
