/**
 * Commercial Sprint 6.1 — client presentation taxonomy (presentation version 2).
 * Presentation only. Does not change Scope or Pricing authority.
 */

export const PROPOSAL_INVESTMENT_INTRO =
  "Investment below reflects the approved implementation scope described in this proposal. Each area is tied directly to the website improvements identified during our analysis.";

export const PROPOSAL_METHODOLOGY_FOOTER =
  "This proposal describes recommended website improvements based on our analysis. It does not guarantee rankings, traffic, leads, or revenue outcomes.";

export const DEFAULT_APPROACH_INTRO =
  "The recommended approach below focuses on the highest-value website improvements identified for this engagement.";

export const DEFAULT_TIMELINE_NOTE =
  "Implementation sequencing and project milestones will be finalized with you before work begins, based on the approved scope and site requirements.";

export const DEFAULT_NEXT_STEP_TEXT =
  "Review the recommended scope and investment with JS Solutions. Once you're comfortable with the plan, we'll confirm the final project details, implementation schedule, and formal agreement before work begins.";

/** Normalized Scope section title → client-value explanation. */
const SECTION_CLIENT_VALUE: Record<string, string> = {
  "content foundation":
    "Build a clearer, better-organized content foundation so visitors can understand services more easily and search engines can better interpret the site's page structure.",
  "search optimization":
    "Strengthen the on-page signals and connections that help search engines understand important pages and help visitors move naturally through the website.",
  "performance optimization":
    "Reduce unnecessary page-delivery overhead while protecting the site's existing performance strengths.",
  "performance / website experience":
    "Reduce unnecessary page-delivery overhead while protecting the site's existing performance strengths.",
  "technical seo":
    "Strengthen technical signals that help search engines understand the preferred structure and meaning of the website.",
  "local search foundation":
    "Improve the consistency and structured local-business information that supports the website's local search foundation.",
  "conversion optimization":
    "Review how effectively the website guides visitors toward contacting the business and identify the highest-value conversion improvements.",
};

const CONVERSION_ASSESSMENT_VALUE =
  "Review key contact paths, calls to action, trust signals, and visitor next steps to identify prioritized conversion improvements.";

/** Brief context labels for business-context composition. */
const SECTION_CONTEXT_LABELS: Record<string, string> = {
  "content foundation": "content structure",
  "search optimization": "search optimization",
  "performance optimization": "page delivery",
  "performance / website experience": "page delivery",
  "technical seo": "technical SEO",
  "local search foundation": "local search foundations",
  "conversion optimization": "conversion support",
};

export interface FinancialGroupDefinition {
  key: string;
  title: string;
  sortOrder: number;
}

/**
 * Financial presentation groups (may differ from Scope section titles).
 * Work-unit ownership is primary; unknown work falls back to Scope section mapping.
 */
export const FINANCIAL_GROUPS: FinancialGroupDefinition[] = [
  { key: "content-search", title: "Content & Search Foundation", sortOrder: 0 },
  { key: "performance", title: "Performance Optimization", sortOrder: 1 },
  { key: "technical", title: "Technical SEO", sortOrder: 2 },
  { key: "local", title: "Local Search Foundation", sortOrder: 3 },
  { key: "conversion", title: "Conversion Path Assessment", sortOrder: 4 },
  { key: "other", title: "Additional Implementation Work", sortOrder: 90 },
];

const FINANCIAL_GROUP_BY_KEY = new Map(
  FINANCIAL_GROUPS.map((g) => [g.key, g] as const),
);

/** Known work-unit keys → financial group key. */
const WORK_UNIT_FINANCIAL_GROUP: Record<string, string> = {
  "heading-architecture": "content-search",
  "internal-linking": "content-search",
  scanability: "content-search",
  "improve-meta": "content-search",
  "open-graph": "content-search",
  "content-depth": "content-search",
  "inline-css": "performance",
  "script-weight": "performance",
  "css-delivery": "performance",
  canonical: "technical",
  "structured-data": "technical",
  "local-schema": "local",
  nap: "local",
  "conversion-assessment": "conversion",
  "trust-signals": "conversion",
  "cta-clarity": "conversion",
};

/** Scope section title → financial group when work unit is unknown. */
const SECTION_FINANCIAL_GROUP: Record<string, string> = {
  "content foundation": "content-search",
  "search optimization": "content-search",
  "performance optimization": "performance",
  "performance / website experience": "performance",
  "technical seo": "technical",
  "local search foundation": "local",
  "conversion optimization": "conversion",
};

/** Exact Scope deliverable titles → polished client presentation labels. */
const DELIVERABLE_PRESENTATION_LABELS: Array<{
  match: RegExp | string;
  label: string;
}> = [
  {
    match: /correct heading hierarchy/i,
    label: "Improve page heading structure and hierarchy",
  },
  {
    match: /contextual internal linking/i,
    label: "Strengthen contextual internal linking between key pages",
  },
  {
    match: /scanability/i,
    label: "Improve content structure for easier scanning and understanding",
  },
  {
    match: /excessive inline css/i,
    label:
      "Review and optimize CSS delivery where excessive inline styles were found",
  },
  {
    match: /blocking script|third-party weight|third party weight/i,
    label:
      "Reduce unnecessary script and third-party page weight where identified",
  },
  {
    match: /canonical/i,
    label: "Implement or correct canonical page signals",
  },
  {
    match: /localbusiness schema|local business schema/i,
    label: "Implement or correct LocalBusiness structured data",
  },
  {
    match: /\bnap\b|name, address, phone/i,
    label: "Improve on-site business name, address, and phone consistency",
  },
  {
    match: /conversion optimization assessment|^conversion optimization$/i,
    label: "Conversion Path Assessment",
  },
];

/** Brief include labels for investment groups (shorter than full deliverable labels). */
const INVESTMENT_INCLUDE_LABELS: Array<{
  match: RegExp | string;
  label: string;
}> = [
  { match: /heading hierarchy|heading structure/i, label: "Page heading structure" },
  {
    match: /internal linking/i,
    label: "Contextual internal linking",
  },
  {
    match: /scanability|scanning/i,
    label: "Content scanability improvements",
  },
  {
    match: /inline css|css delivery/i,
    label: "CSS delivery optimization",
  },
  {
    match: /script|third-party|third party/i,
    label: "Script and third-party weight reduction",
  },
  { match: /canonical/i, label: "Canonical page signals" },
  {
    match: /localbusiness|structured data/i,
    label: "LocalBusiness structured data",
  },
  {
    match: /\bnap\b|name, address, phone|business name, address/i,
    label: "On-site NAP consistency",
  },
  {
    match: /conversion/i,
    label: "Conversion path assessment",
  },
];

const CONSIDERATION_POLISH: Array<{ match: RegExp; replacement: string }> = [
  {
    match:
      /preserve(?:\s+the\s+site'?s)?\s+current\s+accessibility\s+strength/i,
    replacement:
      "Protect the site's existing accessibility strengths while implementing the recommended improvements.",
  },
  {
    match:
      /preserve(?:\s+the\s+site'?s)?\s+current\s+performance\s+advantage/i,
    replacement:
      "Protect the site's existing performance strengths while implementing the recommended improvements.",
  },
  {
    match: /preserve\s+current\s+accessibility\s+strength/i,
    replacement:
      "Protect the site's existing accessibility strengths while implementing the recommended improvements.",
  },
];

const AUDIT_FINDING_COUNT_PATTERN =
  /\d+\s+supporting\s+audit\s+findings?/i;

function normalizeKey(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function isInternalAuditFindingLanguage(text: string): boolean {
  return AUDIT_FINDING_COUNT_PATTERN.test(text);
}

export function stripInternalAuditLanguage(text: string): string | null {
  const cleaned = text
    .replace(AUDIT_FINDING_COUNT_PATTERN, "")
    .replace(/\s{2,}/g, " ")
    .replace(/^[\s.,;:—-]+|[\s.,;:—-]+$/g, "")
    .trim();
  if (!cleaned || isInternalAuditFindingLanguage(cleaned)) {
    return null;
  }
  // Drop leftover mechanical plan summaries
  if (/recommended from deterministic audit evidence/i.test(cleaned)) {
    return null;
  }
  if (/^audit category weakness:/i.test(cleaned)) {
    return null;
  }
  if (/^competitive gap on /i.test(cleaned)) {
    return null;
  }
  return cleaned;
}

export function getSectionClientValueExplanation(
  sectionTitle: string,
  options?: { assessmentSection?: boolean },
): string | null {
  const key = normalizeKey(sectionTitle);
  if (options?.assessmentSection && key.includes("conversion")) {
    return CONVERSION_ASSESSMENT_VALUE;
  }
  return SECTION_CLIENT_VALUE[key] ?? null;
}

export function getSectionContextLabel(sectionTitle: string): string {
  return SECTION_CONTEXT_LABELS[normalizeKey(sectionTitle)] ?? sectionTitle;
}

export function polishDeliverableLabel(sourceTitle: string): string {
  const title = sourceTitle.trim();
  for (const entry of DELIVERABLE_PRESENTATION_LABELS) {
    if (typeof entry.match === "string") {
      if (normalizeKey(title) === normalizeKey(entry.match)) {
        return entry.label;
      }
    } else if (entry.match.test(title)) {
      return entry.label;
    }
  }
  return title;
}

export function investmentIncludeLabel(sourceOrPolishedTitle: string): string {
  const title = sourceOrPolishedTitle.trim();
  for (const entry of INVESTMENT_INCLUDE_LABELS) {
    if (typeof entry.match === "string") {
      if (normalizeKey(title) === normalizeKey(entry.match)) {
        return entry.label;
      }
    } else if (entry.match.test(title)) {
      return entry.label;
    }
  }
  return polishDeliverableLabel(title);
}

export function polishConsiderationText(text: string): string {
  const trimmed = text.trim();
  for (const rule of CONSIDERATION_POLISH) {
    if (rule.match.test(trimmed)) {
      return rule.replacement;
    }
  }
  // Generic preserve → protect polish when possible
  if (/^preserve\b/i.test(trimmed)) {
    return trimmed
      .replace(/^Preserve\b/, "Protect")
      .replace(/^preserve\b/, "protect")
      .replace(/\bwhile implementing changes\.?$/i, "while implementing the recommended improvements.");
  }
  return trimmed;
}

/**
 * Resolve financial presentation group from known work-unit key and/or
 * Scope section provenance. Does not recalculate prices.
 */
export function resolveFinancialGroup(options: {
  lineTitle: string;
  sourceSectionTitles: string[];
  workUnitKey?: string | null;
}): FinancialGroupDefinition {
  if (options.workUnitKey) {
    const mapped = WORK_UNIT_FINANCIAL_GROUP[options.workUnitKey];
    if (mapped) {
      return FINANCIAL_GROUP_BY_KEY.get(mapped)!;
    }
  }

  // Title-based work-unit inference for snapshots that lack keys
  const titleLower = options.lineTitle.toLowerCase();
  for (const [unitKey, groupKey] of Object.entries(WORK_UNIT_FINANCIAL_GROUP)) {
    const fragments: Record<string, string[]> = {
      "heading-architecture": ["heading hierarchy", "heading architecture"],
      "internal-linking": ["internal linking"],
      scanability: ["scanability"],
      "inline-css": ["inline css"],
      "script-weight": ["blocking script", "third-party weight", "third party"],
      canonical: ["canonical"],
      "local-schema": ["localbusiness", "local business schema"],
      nap: ["nap (", "nap consistency", "name, address, phone"],
      "conversion-assessment": [
        "conversion optimization assessment",
        "conversion optimization",
        "conversion path assessment",
      ],
    };
    const frags = fragments[unitKey] ?? [];
    if (frags.some((f) => titleLower.includes(f))) {
      return FINANCIAL_GROUP_BY_KEY.get(groupKey)!;
    }
  }

  for (const sectionTitle of options.sourceSectionTitles) {
    const mapped = SECTION_FINANCIAL_GROUP[normalizeKey(sectionTitle)];
    if (mapped) {
      return FINANCIAL_GROUP_BY_KEY.get(mapped)!;
    }
  }

  return FINANCIAL_GROUP_BY_KEY.get("other")!;
}

export function looksLikeConversionAssessmentTitle(title: string): boolean {
  const t = title.toLowerCase();
  return (
    t.includes("assessment") ||
    t === "conversion optimization" ||
    t.includes("conversion path assessment")
  );
}

export function sectionLooksLikeAssessment(
  deliverableTitles: string[],
): boolean {
  if (deliverableTitles.length === 0) {
    return false;
  }
  return deliverableTitles.every((t) => looksLikeConversionAssessmentTitle(t));
}

export function joinReadableList(items: string[]): string {
  if (items.length === 0) {
    return "the highest-priority website growth opportunities identified";
  }
  if (items.length === 1) {
    return items[0]!;
  }
  if (items.length === 2) {
    return `${items[0]} and ${items[1]}`;
  }
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}
