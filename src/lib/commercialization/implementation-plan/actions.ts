import type { WorkstreamType } from "./constants";
import { MAX_ACTIONS_PER_WORKSTREAM } from "./constants";
import type { PlanEvidenceItem, RecommendedAction } from "./types";

type ActionRule = {
  id: string;
  label: string;
  /**
   * Return supporting sourceKeys from the workstream evidence bag.
   * Empty → action is not generated.
   */
  supportingKeys: (evidence: PlanEvidenceItem[]) => string[];
};

function findingKeysMatching(
  evidence: PlanEvidenceItem[],
  predicate: (findingId: string) => boolean,
): string[] {
  const keys: string[] = [];
  for (const item of evidence) {
    if (!item.findingId) {
      continue;
    }
    if (predicate(item.findingId.toLowerCase())) {
      keys.push(item.sourceKey);
    }
  }
  return keys;
}

function competitiveGapKeys(
  evidence: PlanEvidenceItem[],
  category: string,
): string[] {
  return evidence
    .filter(
      (item) =>
        item.type === "COMPETITIVE_CATEGORY_GAP" &&
        item.category === category,
    )
    .map((item) => item.sourceKey);
}

function auditCategoryKeys(
  evidence: PlanEvidenceItem[],
  category: string,
): string[] {
  return evidence
    .filter(
      (item) =>
        item.type === "AUDIT_CATEGORY" && item.category === category,
    )
    .map((item) => item.sourceKey);
}

const RULES: Record<WorkstreamType, ActionRule[]> = {
  SEARCH_OPTIMIZATION: [
    {
      id: "review-titles",
      label: "Review page titles for page-specific search intent",
      supportingKeys: (e) =>
        findingKeysMatching(
          e,
          (id) =>
            id.startsWith("missing-title") ||
            id.startsWith("title-") ||
            id.includes("duplicate-title"),
        ),
    },
    {
      id: "improve-meta",
      label: "Improve meta descriptions for clarity and uniqueness",
      supportingKeys: (e) =>
        findingKeysMatching(
          e,
          (id) =>
            id.includes("meta-description") ||
            id.includes("duplicate-description"),
        ),
    },
    {
      id: "heading-architecture",
      label: "Correct heading hierarchy (H1 and supporting headings)",
      supportingKeys: (e) =>
        findingKeysMatching(
          e,
          (id) =>
            id === "missing-h1" ||
            id === "multiple-h1" ||
            id === "skipped-heading-levels" ||
            id.includes("duplicate-h1"),
        ),
    },
    {
      id: "open-graph",
      label: "Complete Open Graph metadata for shared pages",
      supportingKeys: (e) =>
        findingKeysMatching(e, (id) => id.includes("open-graph")),
    },
    {
      id: "internal-linking",
      label: "Strengthen contextual internal linking between key pages",
      supportingKeys: (e) =>
        findingKeysMatching(
          e,
          (id) =>
            id.includes("internal-links") ||
            id.includes("weak-internal-link"),
        ),
    },
    {
      id: "address-competitive-seo-gap",
      label:
        "Address competitive Search Optimization gap relative to selected peers",
      supportingKeys: (e) => competitiveGapKeys(e, "seo"),
    },
  ],
  CONTENT_FOUNDATION: [
    {
      id: "content-depth",
      label: "Strengthen thin or underdeveloped page content",
      supportingKeys: (e) =>
        findingKeysMatching(
          e,
          (id) =>
            id.startsWith("thin-content") ||
            id.startsWith("site-thin") ||
            (id.startsWith("content-") && id !== "content-hard-to-scan"),
        ),
    },
    {
      id: "heading-architecture",
      label: "Correct heading hierarchy (H1 and supporting headings)",
      supportingKeys: (e) =>
        findingKeysMatching(
          e,
          (id) =>
            id === "missing-h1" ||
            id === "multiple-h1" ||
            id === "skipped-heading-levels" ||
            id.includes("duplicate-h1"),
        ),
    },
    {
      id: "service-pages",
      label: "Differentiate and deepen key service or location pages",
      supportingKeys: (e) =>
        findingKeysMatching(
          e,
          (id) => id.includes("thin-service") || id.includes("similar-pages"),
        ),
    },
    {
      id: "internal-linking",
      label: "Strengthen contextual internal linking between key pages",
      supportingKeys: (e) =>
        findingKeysMatching(
          e,
          (id) =>
            id.includes("internal-links") ||
            id.includes("weak-internal-link"),
        ),
    },
    {
      id: "scanability",
      label: "Improve content structure for scanability (headings, sections)",
      supportingKeys: (e) =>
        findingKeysMatching(
          e,
          (id) => id.includes("content-hard") || id === "missing-h1",
        ),
    },
    {
      id: "address-competitive-content-gap",
      label: "Address competitive Content gap relative to selected peers",
      supportingKeys: (e) => competitiveGapKeys(e, "content"),
    },
    {
      id: "review-content-category",
      label: "Review Content category weaknesses on the audited site",
      supportingKeys: (e) => {
        // Only when category score evidence exists and no richer finding actions fired later —
        // still must cite category evidence only.
        const keys = auditCategoryKeys(e, "content");
        if (keys.length === 0) {
          return [];
        }
        // Prefer specific finding actions; category action is fallback when only category evidence
        const hasFinding = e.some(
          (item) =>
            item.type === "AUDIT_FINDING" &&
            item.findingId &&
            item.findingId !== "no-images",
        );
        return hasFinding ? [] : keys;
      },
    },
  ],
  TECHNICAL_SEO: [
    {
      id: "indexability",
      label: "Review robots and indexability directives",
      supportingKeys: (e) =>
        findingKeysMatching(
          e,
          (id) =>
            id.startsWith("robots-") ||
            id.includes("indexability") ||
            id.includes("nosnippet"),
        ),
    },
    {
      id: "sitemap",
      label: "Validate sitemap presence and coverage signals",
      supportingKeys: (e) =>
        findingKeysMatching(e, (id) => id.startsWith("sitemap-")),
    },
    {
      id: "canonical",
      label: "Implement or review canonical URL markup",
      supportingKeys: (e) =>
        findingKeysMatching(
          e,
          (id) => id.includes("canonical"),
        ),
    },
    {
      id: "structured-data",
      label: "Implement or repair structured data markup",
      supportingKeys: (e) =>
        findingKeysMatching(e, (id) => id.includes("structured-data")),
    },
    {
      id: "broken-links",
      label: "Fix broken internal links affecting crawl paths",
      supportingKeys: (e) =>
        findingKeysMatching(e, (id) => id.includes("broken-internal")),
    },
    {
      id: "address-competitive-technical-gap",
      label: "Address competitive Technical SEO gap relative to selected peers",
      supportingKeys: (e) => competitiveGapKeys(e, "technical"),
    },
  ],
  LOCAL_SEARCH_FOUNDATION: [
    {
      id: "local-schema",
      label: "Implement or correct LocalBusiness schema",
      supportingKeys: (e) =>
        findingKeysMatching(e, (id) => id.includes("local-schema")),
    },
    {
      id: "nap",
      label: "Align NAP (name, address, phone) consistency on-site",
      supportingKeys: (e) =>
        findingKeysMatching(
          e,
          (id) => id.includes("local-nap") || id.includes("site-local"),
        ),
    },
    {
      id: "location-pages",
      label: "Strengthen location or service-area page detail",
      supportingKeys: (e) =>
        findingKeysMatching(
          e,
          (id) => id.includes("location-page") || id.includes("geographic"),
        ),
    },
    {
      id: "hours",
      label: "Publish clear business hours where applicable",
      supportingKeys: (e) =>
        findingKeysMatching(e, (id) => id.includes("local-hours")),
    },
    {
      id: "address-competitive-local-gap",
      label: "Address competitive Local SEO gap relative to selected peers",
      supportingKeys: (e) => competitiveGapKeys(e, "local"),
    },
  ],
  CONVERSION_OPTIMIZATION: [
    {
      id: "conversion-path",
      label: "Clarify primary conversion path and contact CTAs",
      supportingKeys: (e) =>
        findingKeysMatching(
          e,
          (id) =>
            id.includes("no-conversion") || id.includes("site-conversion"),
        ),
    },
    {
      id: "lead-forms",
      label: "Improve lead form presence and usability",
      supportingKeys: (e) =>
        findingKeysMatching(e, (id) => id.includes("lead-form")),
    },
    {
      id: "click-to-call",
      label: "Enable click-to-call phone links on key pages",
      supportingKeys: (e) =>
        findingKeysMatching(e, (id) => id.includes("phone-not-click")),
    },
    {
      id: "trust-signals",
      label: "Add or strengthen trust signals near conversion points",
      supportingKeys: (e) =>
        findingKeysMatching(
          e,
          (id) => id.includes("trust") || id.includes("few-trust"),
        ),
    },
    {
      id: "address-competitive-cro-gap",
      label: "Address competitive Conversion gap relative to selected peers",
      supportingKeys: (e) => competitiveGapKeys(e, "cro"),
    },
  ],
  WEBSITE_EXPERIENCE: [
    {
      id: "image-alt",
      label: "Improve image alternative text coverage and quality",
      supportingKeys: (e) =>
        findingKeysMatching(
          e,
          (id) =>
            id.includes("images-missing-alt") ||
            id.includes("images-suspicious") ||
            id.includes("image-alt"),
        ),
    },
  ],
  PERFORMANCE_OPTIMIZATION: [
    {
      id: "inline-css",
      label: "Review and reduce excessive inline CSS in the document",
      supportingKeys: (e) =>
        findingKeysMatching(e, (id) => id.includes("inline-css")),
    },
    {
      id: "script-weight",
      label: "Reduce blocking script and third-party weight where evidenced",
      supportingKeys: (e) =>
        findingKeysMatching(
          e,
          (id) =>
            id.includes("blocking") ||
            id.includes("inline-js") ||
            id.includes("third-party"),
        ),
    },
    {
      id: "image-perf",
      label: "Improve image loading strategy (lazy-loading / weight)",
      supportingKeys: (e) =>
        findingKeysMatching(
          e,
          (id) => id.includes("lazy-loading") || id.includes("image-lazy"),
        ),
    },
    {
      id: "html-size",
      label: "Reduce oversized HTML document weight where evidenced",
      supportingKeys: (e) =>
        findingKeysMatching(e, (id) => id.includes("html-size")),
    },
  ],
};

/**
 * Build actions with strict provenance: every evidenceSourceKey must be in the bag.
 */
export function buildRecommendedActions(
  workstreamType: WorkstreamType,
  evidence: PlanEvidenceItem[],
): RecommendedAction[] {
  const allowed = new Set(evidence.map((item) => item.sourceKey));
  const rules = RULES[workstreamType] ?? [];
  const actions: RecommendedAction[] = [];

  for (const rule of rules) {
    const keys = Array.from(new Set(rule.supportingKeys(evidence))).filter(
      (key) => allowed.has(key),
    );

    if (keys.length === 0) {
      continue;
    }

    actions.push({
      id: rule.id,
      label: rule.label,
      evidenceSourceKeys: keys,
    });

    if (actions.length >= MAX_ACTIONS_PER_WORKSTREAM) {
      break;
    }
  }

  return actions;
}

/** Maintenance actions for suppressed strength categories (same provenance rules). */
export function buildMaintenanceActionsForEvidence(
  workstreamType: WorkstreamType,
  evidence: PlanEvidenceItem[],
): RecommendedAction[] {
  return buildRecommendedActions(workstreamType, evidence);
}

export function assertActionsHaveProvenance(
  actions: RecommendedAction[],
  evidence: PlanEvidenceItem[],
): void {
  const allowed = new Set(evidence.map((item) => item.sourceKey));
  for (const action of actions) {
    if (action.evidenceSourceKeys.length < 1) {
      throw new Error(`Action ${action.id} missing supporting evidence`);
    }
    for (const key of action.evidenceSourceKeys) {
      if (!allowed.has(key)) {
        throw new Error(
          `Action ${action.id} references missing sourceKey ${key}`,
        );
      }
    }
  }
}
