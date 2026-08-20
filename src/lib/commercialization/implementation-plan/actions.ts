import type { WorkstreamType } from "./constants";
import { evidenceSupportsStructuredData } from "./mapping";
import type { PlanEvidenceItem, RecommendedAction } from "./types";
import { MAX_ACTIONS_PER_WORKSTREAM } from "./constants";

type ActionRule = {
  id: string;
  label: string;
  /** Return true when this action should appear for the evidence bag. */
  when: (evidence: PlanEvidenceItem[]) => boolean;
};

function hasFindingPrefix(evidence: PlanEvidenceItem[], prefixes: string[]): boolean {
  return evidence.some((item) => {
    if (!item.findingId) {
      return false;
    }
    const id = item.findingId.toLowerCase();
    return prefixes.some((prefix) => id.startsWith(prefix) || id.includes(prefix));
  });
}

function hasCategoryEvidence(
  evidence: PlanEvidenceItem[],
  categories: string[],
): boolean {
  return evidence.some(
    (item) =>
      item.category != null &&
      categories.includes(item.category) &&
      item.type !== "COMPETITIVE_ADVANTAGE",
  );
}

const RULES: Record<WorkstreamType, ActionRule[]> = {
  SEARCH_OPTIMIZATION: [
    {
      id: "review-titles",
      label: "Review page titles for page-specific search intent",
      when: (e) =>
        hasFindingPrefix(e, ["missing-title", "title-", "duplicate-title"]) ||
        hasCategoryEvidence(e, ["seo"]),
    },
    {
      id: "improve-meta",
      label: "Improve meta descriptions for clarity and uniqueness",
      when: (e) =>
        hasFindingPrefix(e, ["meta-description", "duplicate-description"]) ||
        hasCategoryEvidence(e, ["seo"]),
    },
    {
      id: "heading-architecture",
      label: "Correct heading hierarchy (H1 and supporting headings)",
      when: (e) =>
        hasFindingPrefix(e, ["missing-h1", "duplicate-h1", "content-hard"]) ||
        hasCategoryEvidence(e, ["seo", "content"]),
    },
    {
      id: "open-graph",
      label: "Complete Open Graph metadata for shared pages",
      when: (e) => hasFindingPrefix(e, ["open-graph"]),
    },
  ],
  CONTENT_FOUNDATION: [
    {
      id: "content-depth",
      label: "Strengthen thin or underdeveloped page content",
      when: (e) =>
        hasFindingPrefix(e, ["thin-content", "site-thin", "content-"]) ||
        hasCategoryEvidence(e, ["content"]),
    },
    {
      id: "service-pages",
      label: "Differentiate and deepen key service or location pages",
      when: (e) =>
        hasFindingPrefix(e, ["thin-service", "similar-pages"]) ||
        hasCategoryEvidence(e, ["content"]),
    },
    {
      id: "internal-linking",
      label: "Strengthen contextual internal linking between key pages",
      when: (e) =>
        hasFindingPrefix(e, ["internal-links", "weak-internal-link"]) ||
        hasCategoryEvidence(e, ["content", "seo"]),
    },
    {
      id: "scanability",
      label: "Improve content structure for scanability (headings, sections)",
      when: (e) => hasFindingPrefix(e, ["content-hard", "missing-h1"]),
    },
  ],
  TECHNICAL_SEO: [
    {
      id: "indexability",
      label: "Review robots and indexability directives",
      when: (e) =>
        hasFindingPrefix(e, ["robots-", "indexability", "nosnippet"]) ||
        hasCategoryEvidence(e, ["technical"]),
    },
    {
      id: "sitemap",
      label: "Validate sitemap presence and coverage signals",
      when: (e) => hasFindingPrefix(e, ["sitemap-"]),
    },
    {
      id: "canonical",
      label: "Correct canonical URL consistency",
      when: (e) => hasFindingPrefix(e, ["canonical-", "site-canonical"]),
    },
    {
      id: "structured-data",
      label: "Implement or repair structured data markup",
      when: (e) => evidenceSupportsStructuredData(e),
    },
    {
      id: "broken-links",
      label: "Fix broken internal links affecting crawl paths",
      when: (e) => hasFindingPrefix(e, ["broken-internal"]),
    },
  ],
  LOCAL_SEARCH_FOUNDATION: [
    {
      id: "local-schema",
      label: "Implement or correct LocalBusiness schema",
      when: (e) =>
        hasFindingPrefix(e, ["local-schema"]) ||
        hasCategoryEvidence(e, ["local"]),
    },
    {
      id: "nap",
      label: "Align NAP (name, address, phone) consistency on-site",
      when: (e) =>
        hasFindingPrefix(e, ["local-nap", "site-local"]) ||
        hasCategoryEvidence(e, ["local"]),
    },
    {
      id: "location-pages",
      label: "Strengthen location or service-area page detail",
      when: (e) =>
        hasFindingPrefix(e, ["location-page", "geographic"]) ||
        hasCategoryEvidence(e, ["local"]),
    },
    {
      id: "hours",
      label: "Publish clear business hours where applicable",
      when: (e) => hasFindingPrefix(e, ["local-hours"]),
    },
  ],
  CONVERSION_OPTIMIZATION: [
    {
      id: "conversion-path",
      label: "Clarify primary conversion path and contact CTAs",
      when: (e) =>
        hasFindingPrefix(e, ["no-conversion", "site-conversion"]) ||
        hasCategoryEvidence(e, ["cro"]),
    },
    {
      id: "lead-forms",
      label: "Improve lead form presence and usability",
      when: (e) => hasFindingPrefix(e, ["lead-form"]),
    },
    {
      id: "click-to-call",
      label: "Enable click-to-call phone links on key pages",
      when: (e) => hasFindingPrefix(e, ["phone-not-click"]),
    },
    {
      id: "trust-signals",
      label: "Add or strengthen trust signals near conversion points",
      when: (e) =>
        hasFindingPrefix(e, ["trust", "few-trust"]) ||
        hasCategoryEvidence(e, ["cro"]),
    },
  ],
  WEBSITE_EXPERIENCE: [
    {
      id: "image-alt",
      label: "Improve image alternative text coverage and quality",
      when: (e) =>
        hasFindingPrefix(e, ["images-missing-alt", "images-suspicious", "image-alt"]) ||
        hasCategoryEvidence(e, ["accessibility"]),
    },
  ],
  PERFORMANCE_OPTIMIZATION: [
    {
      id: "script-weight",
      label: "Reduce blocking script and third-party weight where evidenced",
      when: (e) =>
        hasFindingPrefix(e, ["performance-blocking", "performance-"]) ||
        hasCategoryEvidence(e, ["performance"]),
    },
    {
      id: "image-perf",
      label: "Improve image loading strategy (lazy-loading / weight)",
      when: (e) => hasFindingPrefix(e, ["performance-image", "lazy-loading"]),
    },
    {
      id: "html-size",
      label: "Reduce oversized HTML document weight where evidenced",
      when: (e) => hasFindingPrefix(e, ["html-size"]),
    },
  ],
};

export function buildRecommendedActions(
  workstreamType: WorkstreamType,
  evidence: PlanEvidenceItem[],
): RecommendedAction[] {
  const rules = RULES[workstreamType] ?? [];
  const actions: RecommendedAction[] = [];

  for (const rule of rules) {
    if (!rule.when(evidence)) {
      continue;
    }

    const evidenceSourceKeys = evidence
      .filter((item) => item.type !== "COMPETITIVE_ADVANTAGE")
      .map((item) => item.sourceKey)
      .slice(0, 8);

    actions.push({
      id: rule.id,
      label: rule.label,
      evidenceSourceKeys,
    });

    if (actions.length >= MAX_ACTIONS_PER_WORKSTREAM) {
      break;
    }
  }

  return actions;
}
