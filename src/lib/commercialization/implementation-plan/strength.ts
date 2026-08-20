import type { AuditCategory } from "@/lib/website-audit/types";

import type { PlanEvidenceItem } from "./types";

/**
 * Material-risk exception (Sprint 1.1):
 * A competitively strong category may still get an improvement workstream when:
 * 1. Any CRITICAL audit finding is present in the workstream evidence, OR
 * 2. At least two HIGH findings are present, OR
 * 3. A fail/high robots/indexability finding that can block search visibility
 *    (robots-noindex, robots-none, *indexability* fail/high).
 *
 * Uses existing AuditPriority + finding id patterns only — no new severity system.
 */
export function isMaterialRiskEvidence(evidence: PlanEvidenceItem[]): boolean {
  const findings = evidence.filter(
    (item) =>
      item.type === "AUDIT_FINDING" || item.type === "COMPETITIVE_FINDING",
  );

  if (findings.some((item) => item.auditPriority === "critical")) {
    return true;
  }

  const highCount = findings.filter(
    (item) => item.auditPriority === "high",
  ).length;
  if (highCount >= 2) {
    return true;
  }

  return findings.some((item) => {
    const id = (item.findingId ?? "").toLowerCase();
    if (!id) {
      return false;
    }

    const indexabilityThreat =
      id.includes("robots-noindex") ||
      id.includes("robots-none") ||
      (id.includes("indexability") &&
        (item.auditStatus === "fail" || item.auditPriority === "high")) ||
      (id.startsWith("robots-") &&
        (item.auditStatus === "fail" ||
          item.auditPriority === "high" ||
          item.auditPriority === "critical"));

    return indexabilityThreat;
  });
}

export function getCompetitiveCategoryStrength(
  allEvidence: PlanEvidenceItem[],
  category: AuditCategory,
): "MAJOR_ADVANTAGE" | "ADVANTAGE" | null {
  const advantage = allEvidence.find(
    (item) =>
      item.type === "COMPETITIVE_ADVANTAGE" &&
      item.category === category &&
      (item.position === "MAJOR_ADVANTAGE" || item.position === "ADVANTAGE"),
  );

  if (!advantage?.position) {
    return null;
  }

  if (advantage.position === "MAJOR_ADVANTAGE") {
    return "MAJOR_ADVANTAGE";
  }
  if (advantage.position === "ADVANTAGE") {
    return "ADVANTAGE";
  }
  return null;
}

/**
 * Strength-aware suppression:
 * ADVANTAGE / MAJOR_ADVANTAGE + only minor isolated weaknesses
 * → suppress improvement workstream (use preservation/maintenance instead).
 *
 * Material risk → allow workstream despite strength.
 */
export function shouldSuppressStrengthWorkstream(options: {
  primaryCategory: AuditCategory;
  workstreamEvidence: PlanEvidenceItem[];
  allEvidence: PlanEvidenceItem[];
}): boolean {
  const strength = getCompetitiveCategoryStrength(
    options.allEvidence,
    options.primaryCategory,
  );

  if (!strength) {
    return false;
  }

  if (isMaterialRiskEvidence(options.workstreamEvidence)) {
    return false;
  }

  return true;
}

export function primaryCategoryForWorkstream(
  workstreamType: string,
): AuditCategory | null {
  switch (workstreamType) {
    case "CONTENT_FOUNDATION":
      return "content";
    case "SEARCH_OPTIMIZATION":
      return "seo";
    case "TECHNICAL_SEO":
      return "technical";
    case "LOCAL_SEARCH_FOUNDATION":
      return "local";
    case "CONVERSION_OPTIMIZATION":
      return "cro";
    case "WEBSITE_EXPERIENCE":
      return "accessibility";
    case "PERFORMANCE_OPTIMIZATION":
      return "performance";
    default:
      return null;
  }
}
