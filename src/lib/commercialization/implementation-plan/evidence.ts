import { categoryScorePercent } from "@/lib/competitive-intelligence/comparison/math";
import type { CompetitiveComparison } from "@/lib/competitive-intelligence/comparison/types";
import { isCategoryScoreApplicable } from "@/lib/website-audit/scoring";
import type {
  AuditCategory,
  AuditFinding,
  WebsiteAuditResult,
} from "@/lib/website-audit/types";

import { WEAK_CATEGORY_PERCENT_THRESHOLD } from "./constants";
import { dedupeEvidenceItems } from "./dedupe";
import type { PlanEvidenceItem } from "./types";

function findingSourceKey(findingId: string): string {
  return `finding:${findingId}`;
}

function categorySourceKey(category: AuditCategory): string {
  return `category:${category}`;
}

export function buildAuditEvidence(
  audit: WebsiteAuditResult,
): PlanEvidenceItem[] {
  const items: PlanEvidenceItem[] = [];

  for (const row of audit.categoryScores) {
    if (!isCategoryScoreApplicable(row)) {
      continue;
    }

    const percent = categoryScorePercent(row.score, row.maxScore);
    if (percent >= WEAK_CATEGORY_PERCENT_THRESHOLD) {
      continue;
    }

    items.push({
      type: "AUDIT_CATEGORY",
      sourceKey: categorySourceKey(row.category),
      category: row.category,
      findingId: null,
      title: `${row.label} score ${percent}/100`,
      targetScorePercent: percent,
      competitorAverage: null,
      gapVsAverage: null,
      position: null,
      competitorsOutperforming: null,
      competitorsCompared: null,
      auditPriority: null,
      auditStatus: null,
    });
  }

  for (const finding of audit.findings) {
    if (finding.status === "pass") {
      continue;
    }

    items.push({
      type: "AUDIT_FINDING",
      sourceKey: findingSourceKey(finding.id),
      category: finding.category,
      findingId: finding.id,
      title: finding.title,
      targetScorePercent: null,
      competitorAverage: null,
      gapVsAverage: null,
      position: null,
      competitorsOutperforming: null,
      competitorsCompared: null,
      auditPriority: finding.priority,
      auditStatus: finding.status,
    });
  }

  return items;
}

export function buildCompetitiveEvidence(
  comparison: CompetitiveComparison,
): PlanEvidenceItem[] {
  const items: PlanEvidenceItem[] = [];

  for (const row of comparison.categories) {
    if (row.position !== "GAP" && row.position !== "MAJOR_GAP") {
      continue;
    }

    items.push({
      type: "COMPETITIVE_CATEGORY_GAP",
      sourceKey: categorySourceKey(row.category),
      category: row.category,
      findingId: null,
      title: `${row.label} competitive ${row.position.toLowerCase().replace("_", " ")}`,
      targetScorePercent: row.targetScore,
      competitorAverage: row.competitorAverage,
      gapVsAverage: row.gapVsAverage,
      position: row.position,
      competitorsOutperforming: row.competitorsOutperforming,
      competitorsCompared: row.competitorsCompared,
      auditPriority: null,
      auditStatus: null,
    });
  }

  for (const finding of comparison.findingComparisons) {
    if (
      finding.pattern !== "TARGET_ONLY_WEAKNESS" &&
      finding.pattern !== "COMMON_MARKET_WEAKNESS"
    ) {
      continue;
    }

    if (!finding.targetHasIssue) {
      continue;
    }

    items.push({
      type: "COMPETITIVE_FINDING",
      sourceKey: findingSourceKey(finding.findingId),
      category: finding.category,
      findingId: finding.findingId,
      title: finding.title,
      targetScorePercent: null,
      competitorAverage: null,
      gapVsAverage: null,
      position: null,
      competitorsOutperforming: null,
      competitorsCompared: finding.competitorsCompared,
      auditPriority: finding.priority,
      auditStatus: "fail",
    });
  }

  for (const advantage of comparison.advantages) {
    if (advantage.kind !== "CATEGORY" || !advantage.category) {
      continue;
    }

    items.push({
      type: "COMPETITIVE_ADVANTAGE",
      sourceKey: `advantage:category-${advantage.category}`,
      category: advantage.category,
      findingId: null,
      title: advantage.title,
      targetScorePercent: null,
      competitorAverage: null,
      gapVsAverage: advantage.gapVsAverage,
      position:
        advantage.gapVsAverage != null && advantage.gapVsAverage >= 15
          ? "MAJOR_ADVANTAGE"
          : "ADVANTAGE",
      competitorsOutperforming: null,
      competitorsCompared: advantage.participantCount,
      auditPriority: null,
      auditStatus: "pass",
    });
  }

  return items;
}

export function mergeEvidence(
  auditItems: PlanEvidenceItem[],
  competitiveItems: PlanEvidenceItem[],
): PlanEvidenceItem[] {
  return dedupeEvidenceItems([...auditItems, ...competitiveItems]);
}

export function collectIssueFindings(
  audit: WebsiteAuditResult,
): AuditFinding[] {
  return audit.findings.filter((finding) => finding.status !== "pass");
}
