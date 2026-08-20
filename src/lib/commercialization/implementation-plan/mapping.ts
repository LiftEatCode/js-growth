import type { AuditCategory } from "@/lib/website-audit/types";

import type { WorkstreamType } from "./constants";
import type { PlanEvidenceItem } from "./types";

/**
 * Map an audit category to its primary workstream.
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

function isHeadingFinding(findingId: string): boolean {
  const id = findingId.toLowerCase();
  return (
    id === "missing-h1" ||
    id === "multiple-h1" ||
    id === "skipped-heading-levels" ||
    id.includes("duplicate-h1")
  );
}

/**
 * Findings may map to one or more workstreams (cross-workstream evidence).
 * Local bags still dedupe by identity.
 */
export function workstreamsForFinding(
  category: AuditCategory,
  findingId: string,
): WorkstreamType[] {
  const id = findingId.toLowerCase();

  if (
    id.startsWith("robots-") ||
    id.startsWith("sitemap-") ||
    id.startsWith("canonical-") ||
    id === "missing-canonical" ||
    id.startsWith("structured-data") ||
    id === "missing-structured-data" ||
    id.startsWith("viewport-") ||
    id.includes("indexability") ||
    id.includes("broken-internal")
  ) {
    return ["TECHNICAL_SEO"];
  }

  if (isHeadingFinding(id)) {
    return ["CONTENT_FOUNDATION", "SEARCH_OPTIMIZATION"];
  }

  if (
    id.startsWith("missing-title") ||
    id.startsWith("title-") ||
    id.includes("meta-description") ||
    id.startsWith("open-graph") ||
    id.includes("duplicate-title") ||
    id.includes("duplicate-description") ||
    id.includes("nosnippet")
  ) {
    return ["SEARCH_OPTIMIZATION"];
  }

  if (
    id.includes("internal-links") ||
    id.includes("weak-internal-link")
  ) {
    return ["SEARCH_OPTIMIZATION", "CONTENT_FOUNDATION"];
  }

  if (
    id.startsWith("thin-content") ||
    id.startsWith("content-") ||
    id.includes("similar-pages") ||
    id.includes("thin-service") ||
    id === "no-images"
  ) {
    return ["CONTENT_FOUNDATION"];
  }

  return [workstreamForCategory(category)];
}

/** @deprecated use workstreamsForFinding — kept for single-target helpers */
export function workstreamForFinding(
  category: AuditCategory,
  findingId: string,
): WorkstreamType {
  return workstreamsForFinding(category, findingId)[0] ?? workstreamForCategory(category);
}

export function assignEvidenceToWorkstreams(
  item: PlanEvidenceItem,
): WorkstreamType[] {
  if (item.type === "COMPETITIVE_ADVANTAGE") {
    return [];
  }

  if (item.findingId) {
    return workstreamsForFinding(item.category ?? "seo", item.findingId);
  }

  if (item.category) {
    return [workstreamForCategory(item.category)];
  }

  return [];
}

export function evidenceSupportsStructuredData(
  evidence: PlanEvidenceItem[],
): boolean {
  return evidence.some(
    (item) =>
      item.findingId != null &&
      item.findingId.toLowerCase().includes("structured-data"),
  );
}
