import { categoryScorePercent } from "@/lib/competitive-intelligence/comparison/math";
import { isCategoryScoreApplicable } from "@/lib/website-audit/scoring";
import type { AuditCategory, WebsiteAuditResult } from "@/lib/website-audit/types";

import { buildMaintenanceActionsForEvidence } from "./actions";
import {
  MAX_PRESERVATION_CONSTRAINTS,
  STRONG_CATEGORY_PERCENT_THRESHOLD,
  WORKSTREAM_DEFAULT_CAPABILITIES,
  WORKSTREAM_TITLES,
  type WorkstreamType,
} from "./constants";
import { primaryCategoryForWorkstream } from "./strength";
import type { PlanEvidenceItem, PreservationConstraint } from "./types";

const CATEGORY_LABELS: Record<AuditCategory, string> = {
  technical: "Technical SEO",
  seo: "Search Optimization",
  content: "Content",
  cro: "Conversion",
  accessibility: "Accessibility",
  local: "Local SEO",
  performance: "Performance",
};

function categoriesForWorkstream(type: WorkstreamType): AuditCategory[] {
  const primary = primaryCategoryForWorkstream(type);
  return primary ? [primary] : [];
}

/**
 * Build preservation for a competitive advantage category, optionally with
 * maintenance actions from suppressed minor findings.
 */
export function buildStrengthPreservationConstraint(options: {
  category: AuditCategory;
  advantageSourceKey: string;
  minorFindings: PlanEvidenceItem[];
}): PreservationConstraint {
  const label = CATEGORY_LABELS[options.category];
  const workstreamType = (() => {
    switch (options.category) {
      case "performance":
        return "PERFORMANCE_OPTIMIZATION" as const;
      case "accessibility":
        return "WEBSITE_EXPERIENCE" as const;
      case "content":
        return "CONTENT_FOUNDATION" as const;
      case "seo":
        return "SEARCH_OPTIMIZATION" as const;
      case "technical":
        return "TECHNICAL_SEO" as const;
      case "local":
        return "LOCAL_SEARCH_FOUNDATION" as const;
      case "cro":
        return "CONVERSION_OPTIMIZATION" as const;
      default:
        return "PERFORMANCE_OPTIMIZATION" as const;
    }
  })();

  const maintenanceActions = buildMaintenanceActionsForEvidence(
    workstreamType,
    options.minorFindings,
  );

  const sourceKeys = Array.from(
    new Set([
      options.advantageSourceKey,
      ...options.minorFindings.map((item) => item.sourceKey),
    ]),
  );

  let statement = `Preserve current ${label} strength while implementing changes.`;
  if (options.minorFindings.length > 0) {
    statement = `Preserve the site's current ${label} advantage while reviewing the identified maintenance issue${options.minorFindings.length === 1 ? "" : "s"} without introducing heavier page delivery or regressions.`;
  }

  return {
    id: `preserve-${options.category}`,
    category: options.category,
    statement,
    evidenceSourceKeys: sourceKeys,
    maintenanceActions:
      maintenanceActions.length > 0 ? maintenanceActions : undefined,
  };
}

/**
 * Preservation constraints for improvement workstreams (cross-category strengths).
 */
export function buildPreservationConstraints(options: {
  workstreamType: WorkstreamType;
  audit: WebsiteAuditResult;
  evidence: PlanEvidenceItem[];
  allEvidence: PlanEvidenceItem[];
  /** Plan-level suppressed strengths with maintenance already built. */
  suppressedPreservations?: PreservationConstraint[];
}): PreservationConstraint[] {
  const constraints: PreservationConstraint[] = [];
  const ownCategories = new Set(categoriesForWorkstream(options.workstreamType));

  const attachesToDevHeavy =
    WORKSTREAM_DEFAULT_CAPABILITIES[options.workstreamType].includes(
      "WEBSITE_DEVELOPMENT",
    ) ||
    options.workstreamType === "CONTENT_FOUNDATION" ||
    options.workstreamType === "SEARCH_OPTIMIZATION" ||
    options.workstreamType === "CONVERSION_OPTIMIZATION" ||
    options.workstreamType === "TECHNICAL_SEO";

  if (attachesToDevHeavy && options.suppressedPreservations) {
    for (const suppressed of options.suppressedPreservations) {
      if (ownCategories.has(suppressed.category)) {
        continue;
      }
      constraints.push(suppressed);
      if (constraints.length >= MAX_PRESERVATION_CONSTRAINTS) {
        return constraints;
      }
    }
  }

  const advantages = options.allEvidence.filter(
    (item) =>
      item.type === "COMPETITIVE_ADVANTAGE" &&
      item.category != null &&
      (item.position === "MAJOR_ADVANTAGE" || item.position === "ADVANTAGE"),
  );

  for (const advantage of advantages) {
    if (!advantage.category) {
      continue;
    }
    if (!attachesToDevHeavy) {
      continue;
    }
    if (ownCategories.has(advantage.category)) {
      continue;
    }
    // Already covered via suppressedPreservations
    if (
      options.suppressedPreservations?.some(
        (row) => row.category === advantage.category,
      )
    ) {
      continue;
    }

    const label = CATEGORY_LABELS[advantage.category];
    constraints.push({
      id: `preserve-${advantage.category}`,
      category: advantage.category,
      statement: `Preserve current ${label} strength while implementing changes.`,
      evidenceSourceKeys: [advantage.sourceKey],
    });

    if (constraints.length >= MAX_PRESERVATION_CONSTRAINTS) {
      return constraints;
    }
  }

  if (advantages.length === 0 && !options.suppressedPreservations?.length) {
    for (const row of options.audit.categoryScores) {
      if (!isCategoryScoreApplicable(row)) {
        continue;
      }
      if (row.category !== "performance" && row.category !== "accessibility") {
        continue;
      }
      const percent = categoryScorePercent(row.score, row.maxScore);
      if (percent < STRONG_CATEGORY_PERCENT_THRESHOLD) {
        continue;
      }
      if (ownCategories.has(row.category)) {
        continue;
      }
      if (
        !WORKSTREAM_DEFAULT_CAPABILITIES[options.workstreamType].includes(
          "WEBSITE_DEVELOPMENT",
        )
      ) {
        continue;
      }

      constraints.push({
        id: `preserve-audit-${row.category}`,
        category: row.category,
        statement: `Preserve current ${CATEGORY_LABELS[row.category]} strength while implementing changes.`,
        evidenceSourceKeys: [`category:${row.category}`],
      });

      if (constraints.length >= MAX_PRESERVATION_CONSTRAINTS) {
        break;
      }
    }
  }

  return constraints;
}

export function preservationLabelForWorkstream(type: WorkstreamType): string {
  return WORKSTREAM_TITLES[type];
}
