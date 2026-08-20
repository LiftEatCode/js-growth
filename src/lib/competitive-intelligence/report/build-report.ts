import type { CompetitiveComparison } from "@/lib/competitive-intelligence/comparison/types";
import { resolveCompetitiveSourceEvidence } from "@/lib/competitive-intelligence/interpretation/evidence";
import type { CompetitiveInterpretationContent } from "@/lib/competitive-intelligence/interpretation/types";
import { siteConfig } from "@/config/site";

import {
  COMPETITIVE_REPORT_VERSION,
  MAX_CLIENT_CATEGORY_ADVANTAGES,
  MAX_CLIENT_FINDING_ADVANTAGES,
  MAX_CLIENT_OPPORTUNITIES,
  MAX_CLIENT_PRIORITIES,
} from "./constants";
import {
  buildSampleDisclosure,
  formatClientPositionLabel,
  methodologyNote,
  ninetyDayDisclaimer,
} from "./format";
import type {
  CompetitiveGrowthReportViewModel,
  CompetitiveReportAdvantageCard,
  CompetitiveReportCategoryRow,
  CompetitiveReportOpportunityCard,
  CompetitiveReportPriorityCard,
} from "./types";

const POSITION_SORT_ORDER: Record<string, number> = {
  MAJOR_GAP: 0,
  GAP: 1,
  PARITY: 2,
  ADVANTAGE: 3,
  MAJOR_ADVANTAGE: 4,
};

function categorySourceKey(category: string): string {
  return `category:${category}`;
}

function findInterpretationForCategory(
  content: CompetitiveInterpretationContent,
  category: string,
): { explanation: string; actions: string[] } | null {
  const key = categorySourceKey(category);
  const priority = content.priorities.find((row) => row.sourceKey === key);
  if (priority) {
    return {
      explanation: priority.rationale,
      actions: priority.recommendedActions.slice(0, 4),
    };
  }

  const risk = content.risks.find((row) => row.sourceKey === key);
  if (risk) {
    return {
      explanation: risk.explanation,
      actions: [],
    };
  }

  return null;
}

function findAdvantageExplanation(
  content: CompetitiveInterpretationContent,
  options: { category: string | null; advantageId: string },
): string | null {
  const categoryKey = options.category
    ? categorySourceKey(options.category)
    : null;
  const advantageKey = `advantage:${options.advantageId}`;

  const match = content.advantages.find(
    (row) =>
      row.sourceKey === advantageKey ||
      (categoryKey != null && row.sourceKey === categoryKey),
  );

  return match?.explanation ?? null;
}

function sortCategories(
  categories: CompetitiveReportCategoryRow[],
): CompetitiveReportCategoryRow[] {
  return [...categories].sort((left, right) => {
    const leftOrder = POSITION_SORT_ORDER[left.position] ?? 50;
    const rightOrder = POSITION_SORT_ORDER[right.position] ?? 50;

    if (leftOrder !== rightOrder) {
      return leftOrder - rightOrder;
    }

    return left.gap - right.gap;
  });
}

function buildOpportunities(
  comparison: CompetitiveComparison,
  content: CompetitiveInterpretationContent,
): CompetitiveReportOpportunityCard[] {
  const gapCategories = comparison.categories
    .filter(
      (row) => row.position === "MAJOR_GAP" || row.position === "GAP",
    )
    .sort((left, right) => left.gapVsAverage - right.gapVsAverage);

  const cards: CompetitiveReportOpportunityCard[] = [];

  for (const category of gapCategories) {
    if (cards.length >= MAX_CLIENT_OPPORTUNITIES) {
      break;
    }

    const interpreted = findInterpretationForCategory(content, category.category);
    cards.push({
      title: category.label,
      explanation:
        interpreted?.explanation ??
        `${category.label} is a measured gap in the current selected comparison.`,
      targetScore: category.targetScore,
      competitorAverage: category.competitorAverage,
      gap: category.gapVsAverage,
      positionLabel: formatClientPositionLabel(category.position),
      recommendedActions: interpreted?.actions ?? [],
    });
  }

  return cards;
}

function buildAdvantages(
  comparison: CompetitiveComparison,
  content: CompetitiveInterpretationContent,
): CompetitiveReportAdvantageCard[] {
  const cards: CompetitiveReportAdvantageCard[] = [];

  const strengthCategories = comparison.categories
    .filter(
      (row) =>
        row.position === "MAJOR_ADVANTAGE" || row.position === "ADVANTAGE",
    )
    .sort((left, right) => right.gapVsAverage - left.gapVsAverage);

  for (const category of strengthCategories) {
    if (cards.length >= MAX_CLIENT_CATEGORY_ADVANTAGES) {
      break;
    }

    const explanation =
      findAdvantageExplanation(content, {
        category: category.category,
        advantageId: `category-${category.category}`,
      }) ??
      `${category.label} is a measured strength in the current selected comparison.`;

    cards.push({
      title: category.label,
      explanation,
      targetScore: category.targetScore,
      competitorAverage: category.competitorAverage,
      gap: category.gapVsAverage,
      positionLabel: formatClientPositionLabel(category.position),
      kind: "category",
    });
  }

  let findingCount = 0;
  for (const advantage of comparison.advantages) {
    if (advantage.kind !== "FINDING") {
      continue;
    }
    if (findingCount >= MAX_CLIENT_FINDING_ADVANTAGES) {
      break;
    }

    // Skip low-signal titles that are common but not decision-useful.
    const titleLower = advantage.title.toLowerCase();
    if (
      titleLower.includes("email address") ||
      titleLower.includes("canonical url")
    ) {
      continue;
    }

    const explanation =
      findAdvantageExplanation(content, {
        category: advantage.category,
        advantageId: advantage.id,
      }) ?? advantage.title;

    cards.push({
      title: advantage.title,
      explanation,
      targetScore: null,
      competitorAverage: null,
      gap: advantage.gapVsAverage,
      positionLabel: "Advantage",
      kind: "finding",
    });
    findingCount += 1;
  }

  return cards;
}

function buildPriorities(
  comparison: CompetitiveComparison,
  content: CompetitiveInterpretationContent,
): CompetitiveReportPriorityCard[] {
  return content.priorities.slice(0, MAX_CLIENT_PRIORITIES).map((priority, index) => {
    const evidence = resolveCompetitiveSourceEvidence(
      comparison,
      priority.sourceKey,
    );

    return {
      number: index + 1,
      title: priority.title,
      explanation: priority.rationale,
      actions: priority.recommendedActions.slice(0, 4),
      evidenceLabel: evidence.kind === "unknown" ? null : evidence.title,
      evidenceLines: evidence.lines.slice(0, 4),
    };
  });
}

export function buildCompetitiveGrowthReport(options: {
  businessName: string;
  locationLabel?: string | null;
  analysisDate: Date;
  comparison: CompetitiveComparison;
  interpretation: CompetitiveInterpretationContent;
}): CompetitiveGrowthReportViewModel {
  const { comparison, interpretation } = options;
  const competitorCount = comparison.competitorsCompared.length;

  const categories = sortCategories(
    comparison.categories.map((row) => ({
      category: row.category,
      label: row.label,
      targetScore: row.targetScore,
      competitorAverage: row.competitorAverage,
      gap: row.gapVsAverage,
      position: row.position,
      positionLabel: formatClientPositionLabel(row.position),
      targetRank: row.targetRank,
      participantCount: row.participantCount,
    })),
  );

  const competitiveSet = [
    {
      businessName: options.businessName,
      websiteGrowthScore: comparison.overall.targetScore,
      distanceMiles: null as number | null,
      competitiveRelevance: null as number | null,
      isTarget: true,
    },
    ...comparison.competitorsCompared.map((row) => ({
      businessName: row.businessName,
      websiteGrowthScore: row.websiteGrowthScore,
      distanceMiles: row.distanceMiles,
      competitiveRelevance: row.competitiveRelevanceScore,
      isTarget: false,
    })),
  ].sort((left, right) => right.websiteGrowthScore - left.websiteGrowthScore);

  return {
    reportVersion: COMPETITIVE_REPORT_VERSION,
    preparedBy: siteConfig.name,
    businessName: options.businessName,
    locationLabel: options.locationLabel?.trim() || null,
    analysisDateLabel: new Intl.DateTimeFormat("en-US", {
      dateStyle: "long",
    }).format(options.analysisDate),
    competitorCount,
    sampleDisclosure: buildSampleDisclosure(competitorCount),
    methodologyNote: methodologyNote(),
    metrics: {
      websiteGrowthScore: comparison.overall.targetScore,
      selectedCompetitorAverage: comparison.overall.competitorAverage,
      competitivePosition: `#${comparison.overall.targetRank} of ${comparison.overall.participantCount}`,
      competitiveGap: comparison.overall.gapVsAverage,
    },
    executiveSummary: {
      headline: interpretation.executiveSummary.headline,
      summary: interpretation.executiveSummary.summary,
      positionAssessment: interpretation.competitivePosition.assessment,
      positionExplanation: interpretation.competitivePosition.explanation,
    },
    categories,
    opportunities: buildOpportunities(comparison, interpretation),
    advantages: buildAdvantages(comparison, interpretation),
    competitiveSet,
    priorities: buildPriorities(comparison, interpretation),
    ninetyDayPlan: interpretation.ninetyDayPlan.map((phase) => ({
      phase: phase.phase,
      objective: phase.objective,
      actions: phase.actions.slice(0, 5),
    })),
    ninetyDayDisclaimer: ninetyDayDisclaimer(),
    cta: {
      headline: "Ready to Close the Gap?",
      body: "JS Solutions can help turn these findings into an implementation plan across website development, SEO, Local SEO, content, and conversion optimization.",
      services: [
        "Website Development",
        "SEO",
        "Local SEO",
        "Content",
        "Conversion Optimization",
      ],
      primaryLabel: "Request an Implementation Plan",
      primaryHref: "/contact",
    },
  };
}
