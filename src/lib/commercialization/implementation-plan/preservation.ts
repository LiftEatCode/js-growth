import { categoryScorePercent } from "@/lib/competitive-intelligence/comparison/math";
import { isCategoryScoreApplicable } from "@/lib/website-audit/scoring";
import type { AuditCategory, WebsiteAuditResult } from "@/lib/website-audit/types";

import {
  MAX_PRESERVATION_CONSTRAINTS,
  STRONG_CATEGORY_PERCENT_THRESHOLD,
  WORKSTREAM_DEFAULT_CAPABILITIES,
  type WorkstreamType,
} from "./constants";
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
  switch (type) {
    case "CONTENT_FOUNDATION":
      return ["content"];
    case "SEARCH_OPTIMIZATION":
      return ["seo"];
    case "TECHNICAL_SEO":
      return ["technical"];
    case "LOCAL_SEARCH_FOUNDATION":
      return ["local"];
    case "CONVERSION_OPTIMIZATION":
      return ["cro"];
    case "WEBSITE_EXPERIENCE":
      return ["accessibility"];
    case "PERFORMANCE_OPTIMIZATION":
      return ["performance"];
    default:
      return [];
  }
}

/**
 * Preservation constraints come from competitive advantages or very strong
 * audit categories that should not be sacrificed during remediation.
 * Never attach meaningless constraints to every workstream.
 */
export function buildPreservationConstraints(options: {
  workstreamType: WorkstreamType;
  audit: WebsiteAuditResult;
  evidence: PlanEvidenceItem[];
  allEvidence: PlanEvidenceItem[];
}): PreservationConstraint[] {
  const constraints: PreservationConstraint[] = [];
  const ownCategories = new Set(categoriesForWorkstream(options.workstreamType));

  // Prefer preserving strengths OUTSIDE the weak workstream (e.g. keep performance
  // while fixing content), or strengths that compete with implementation risk.
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

    // Attach to workstreams that are NOT the advantage category itself,
    // or to WEBSITE_DEVELOPMENT-heavy streams that risk regressions.
    const attachesToDevHeavy =
      WORKSTREAM_DEFAULT_CAPABILITIES[options.workstreamType].includes(
        "WEBSITE_DEVELOPMENT",
      ) ||
      options.workstreamType === "CONTENT_FOUNDATION" ||
      options.workstreamType === "SEARCH_OPTIMIZATION" ||
      options.workstreamType === "CONVERSION_OPTIMIZATION";

    if (!attachesToDevHeavy) {
      continue;
    }

    if (ownCategories.has(advantage.category)) {
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

  // Strong audit-only categories (no competitive data) — only attach to
  // development-heavy workstreams and only for performance/accessibility.
  if (advantages.length === 0) {
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
