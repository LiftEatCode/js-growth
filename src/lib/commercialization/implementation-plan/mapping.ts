import type { AuditCategory } from "@/lib/website-audit/types";

import type { WorkstreamType } from "./constants";
import type { PlanEvidenceItem } from "./types";

/**
 * Map an audit category to its primary workstream.
 * Accessibility maps to website experience (implementation), not SEO.
 */
export function workstreamForCategory(
  category: AuditCategory,
): WorkstreamType {
  switch (category) {
    case "content":
      return "CONTENT_FOUNDATION";
    case "seo":
      return "SEARCH_OPTIMIZATION";
    case "technical":
      return "TECHNICAL_SEO";
    case "local":
      return "LOCAL_SEARCH_FOUNDATION";
    case "cro":
      return "CONVERSION_OPTIMIZATION";
    case "accessibility":
      return "WEBSITE_EXPERIENCE";
    case "performance":
      return "PERFORMANCE_OPTIMIZATION";
    default: {
      const _exhaustive: never = category;
      return _exhaustive;
    }
  }
}

/**
 * Finding-id aware workstream routing for cross-cutting technical SEO
 * signals that live under seo/technical categories.
 */
export function workstreamForFinding(
  category: AuditCategory,
  findingId: string,
): WorkstreamType {
  const id = findingId.toLowerCase();

  if (
    id.startsWith("robots-") ||
    id.startsWith("sitemap-") ||
    id.startsWith("canonical-") ||
    id.startsWith("structured-data-") ||
    id.startsWith("viewport-") ||
    id.includes("indexability") ||
    id.includes("broken-internal")
  ) {
    return "TECHNICAL_SEO";
  }

  if (
    id.startsWith("missing-title") ||
    id.startsWith("title-") ||
    id.startsWith("meta-description") ||
    id.startsWith("open-graph") ||
    id.includes("duplicate-title") ||
    id.includes("duplicate-h1") ||
    id.includes("duplicate-description") ||
    id.includes("nosnippet")
  ) {
    return "SEARCH_OPTIMIZATION";
  }

  if (
    id.startsWith("missing-h1") ||
    id.startsWith("thin-content") ||
    id.startsWith("content-") ||
    id.startsWith("internal-links") ||
    id.includes("similar-pages") ||
    id.includes("thin-service") ||
    id.includes("weak-internal-link")
  ) {
    return "CONTENT_FOUNDATION";
  }

  return workstreamForCategory(category);
}

export function assignEvidenceToWorkstream(
  item: PlanEvidenceItem,
): WorkstreamType | null {
  // Advantages are for preservation, not workstream creation
  if (item.type === "COMPETITIVE_ADVANTAGE") {
    return null;
  }

  if (item.findingId) {
    return workstreamForFinding(
      item.category ?? "seo",
      item.findingId,
    );
  }

  if (item.category) {
    return workstreamForCategory(item.category);
  }

  return null;
}

/**
 * Whether technical structured-data actions are justified.
 */
export function evidenceSupportsStructuredData(
  evidence: PlanEvidenceItem[],
): boolean {
  return evidence.some(
    (item) =>
      item.findingId != null &&
      item.findingId.toLowerCase().includes("structured-data"),
  );
}
