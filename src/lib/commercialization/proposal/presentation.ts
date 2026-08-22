/**
 * Commercial Sprint 6.2 — client presentation taxonomy (presentation version 3).
 * Presentation only. Does not change Scope or Pricing authority.
 * Known work-unit identity is keyed from authoritative provenance — not fuzzy titles.
 */

import { resolveWorkUnitFromDeliverable } from "@/lib/commercialization/pricing/work-units";

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
    "Improve how effectively the website guides visitors toward contacting the business through clearer paths, stronger trust signals, and prioritized conversion improvements.",
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
 * Work-unit ownership is primary; manual/custom work falls back to Scope section mapping.
 */
export const FINANCIAL_GROUPS: FinancialGroupDefinition[] = [
  { key: "content-search", title: "Content & Search Foundation", sortOrder: 0 },
  { key: "performance", title: "Performance Optimization", sortOrder: 1 },
  { key: "technical", title: "Technical SEO", sortOrder: 2 },
  { key: "local", title: "Local Search Foundation", sortOrder: 3 },
  {
    key: "conversion-optimization",
    title: "Conversion Optimization",
    sortOrder: 4,
  },
  {
    key: "conversion-assessment",
    title: "Conversion Path Assessment",
    sortOrder: 5,
  },
  { key: "other", title: "Additional Implementation Work", sortOrder: 90 },
];

const FINANCIAL_GROUP_BY_KEY = new Map(
  FINANCIAL_GROUPS.map((g) => [g.key, g] as const),
);

/** Known work-unit keys → financial group key. */
const WORK_UNIT_FINANCIAL_GROUP: Record<string, string> = {
  "improve-meta": "content-search",
  "heading-architecture": "content-search",
  "internal-linking": "content-search",
  scanability: "content-search",
  "open-graph": "content-search",
  "content-depth": "content-search",
  "inline-css": "performance",
  "script-weight": "performance",
  "css-delivery": "performance",
  canonical: "technical",
  "structured-data": "technical",
  "local-schema": "local",
  nap: "local",
  "trust-signals": "conversion-optimization",
  "cta-clarity": "conversion-optimization",
  "conversion-assessment": "conversion-assessment",
};

/** Scope section title → financial group when work unit is unknown (manual/custom). */
const SECTION_FINANCIAL_GROUP: Record<string, string> = {
  "content foundation": "content-search",
  "search optimization": "content-search",
  "performance optimization": "performance",
  "performance / website experience": "performance",
  "technical seo": "technical",
  "local search foundation": "local",
  "conversion optimization": "conversion-optimization",
};

/** Authoritative work-unit keys with deterministic client presentation labels. */
export const WORK_UNIT_PRESENTATION_LABELS: Record<string, string> = {
  "improve-meta": "Improve meta descriptions",
  "heading-architecture": "Improve page heading structure and hierarchy",
  "open-graph": "Complete Open Graph metadata",
  "internal-linking": "Strengthen contextual internal linking",
  scanability:
    "Improve content structure for easier scanning and understanding",
  "content-depth": "Expand service page content depth",
  "inline-css": "Optimize excessive inline CSS delivery",
  "script-weight":
    "Reduce unnecessary script and third-party page weight",
  "css-delivery": "Review CSS delivery for maintainability",
  canonical: "Implement or correct canonical page signals",
  "structured-data": "Implement or repair structured data markup",
  "local-schema": "Implement or correct LocalBusiness structured data",
  nap: "Improve business name, address, and phone consistency",
  "trust-signals": "Strengthen trust signals near conversion points",
  "cta-clarity": "Clarify primary calls to action",
  "conversion-assessment": "Conversion Path Assessment",
};

/** Shorter include labels for grouped investment lists. */
export const WORK_UNIT_INVESTMENT_INCLUDE_LABELS: Record<string, string> = {
  "improve-meta": "Improve meta descriptions",
  "heading-architecture": "Page heading structure",
  "open-graph": "Complete Open Graph metadata",
  "internal-linking": "Contextual internal linking",
  scanability: "Content scanability improvements",
  "content-depth": "Service page content depth",
  "inline-css": "CSS delivery optimization",
  "script-weight": "Script and third-party weight reduction",
  "css-delivery": "CSS delivery review",
  canonical: "Canonical page signals",
  "structured-data": "Structured data markup",
  "local-schema": "LocalBusiness structured data",
  nap: "On-site NAP consistency",
  "trust-signals": "Trust signals near conversion points",
  "cta-clarity": "Primary call-to-action clarity",
  "conversion-assessment": "Conversion path assessment",
};

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

export interface DeliverableProvenance {
  workUnitKey?: string | null;
  sourceActionKey?: string | null;
  sourceTitle: string;
  isCustom?: boolean;
}

/**
 * Resolve canonical work-unit key from stored provenance.
 * Title inference is only used for manual/custom deliverables without action keys.
 */
export function resolveAuthoritativeWorkUnitKey(
  options: DeliverableProvenance,
): string | null {
  if (options.workUnitKey?.trim()) {
    return options.workUnitKey.trim();
  }
  if (options.isCustom) {
    return null;
  }
  const resolved = resolveWorkUnitFromDeliverable({
    sourceActionKey: options.sourceActionKey ?? null,
    title: options.sourceTitle,
    source: options.isCustom ? "MANUAL" : "PLAN",
  });
  return resolved.isCustom ? null : resolved.key;
}

export function isKnownWorkUnitKey(key: string | null | undefined): boolean {
  return Boolean(key && key in WORK_UNIT_PRESENTATION_LABELS);
}

/** Client presentation label keyed from authoritative work-unit identity. */
export function deliverablePresentationLabel(
  options: DeliverableProvenance,
): string {
  const key = resolveAuthoritativeWorkUnitKey(options);
  if (key && WORK_UNIT_PRESENTATION_LABELS[key]) {
    return WORK_UNIT_PRESENTATION_LABELS[key]!;
  }
  return options.sourceTitle.trim();
}

/** Back-compat wrapper — prefer deliverablePresentationLabel with provenance. */
export function polishDeliverableLabel(
  sourceTitle: string,
  provenance?: Omit<DeliverableProvenance, "sourceTitle">,
): string {
  return deliverablePresentationLabel({
    sourceTitle,
    ...provenance,
  });
}

/** Brief investment include label keyed from authoritative work-unit identity. */
export function investmentIncludeLabelForLine(
  options: DeliverableProvenance,
): string {
  const key = resolveAuthoritativeWorkUnitKey(options);
  if (key && WORK_UNIT_INVESTMENT_INCLUDE_LABELS[key]) {
    return WORK_UNIT_INVESTMENT_INCLUDE_LABELS[key]!;
  }
  return deliverablePresentationLabel(options);
}

/** Back-compat wrapper — prefer investmentIncludeLabelForLine with provenance. */
export function investmentIncludeLabel(
  sourceOrPolishedTitle: string,
  provenance?: Omit<DeliverableProvenance, "sourceTitle">,
): string {
  return investmentIncludeLabelForLine({
    sourceTitle: sourceOrPolishedTitle,
    ...provenance,
  });
}

export function polishConsiderationText(text: string): string {
  const trimmed = text.trim();
  for (const rule of CONSIDERATION_POLISH) {
    if (rule.match.test(trimmed)) {
      return rule.replacement;
    }
  }
  if (/^preserve\b/i.test(trimmed)) {
    return trimmed
      .replace(/^Preserve\b/, "Protect")
      .replace(/^preserve\b/, "protect")
      .replace(
        /\bwhile implementing changes\.?$/i,
        "while implementing the recommended improvements.",
      );
  }
  return trimmed;
}

/**
 * Resolve financial presentation group from known work-unit key and/or
 * Scope section provenance. Does not recalculate prices.
 */
export function resolveFinancialGroup(options: {
  sourceSectionTitles: string[];
  workUnitKey?: string | null;
  isCustom?: boolean;
}): FinancialGroupDefinition {
  if (options.workUnitKey) {
    const mapped = WORK_UNIT_FINANCIAL_GROUP[options.workUnitKey];
    if (mapped) {
      return FINANCIAL_GROUP_BY_KEY.get(mapped)!;
    }
  }

  if (!options.isCustom) {
    return FINANCIAL_GROUP_BY_KEY.get("other")!;
  }

  for (const sectionTitle of options.sourceSectionTitles) {
    const mapped = SECTION_FINANCIAL_GROUP[normalizeKey(sectionTitle)];
    if (mapped) {
      return FINANCIAL_GROUP_BY_KEY.get(mapped)!;
    }
  }

  return FINANCIAL_GROUP_BY_KEY.get("other")!;
}

export function financialGroupSortOrder(groupTitle: string): number {
  const group = FINANCIAL_GROUPS.find((g) => g.title === groupTitle);
  return group?.sortOrder ?? 50;
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
  deliverableKeys?: Array<string | null | undefined>,
): boolean {
  if (deliverableKeys?.some((k) => k === "conversion-assessment")) {
    return true;
  }
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
