import type {
  PricingEffortBand,
  PricingWorkType,
} from "./constants";

export interface WorkUnitCatalogEntry {
  key: string;
  title: string;
  workType: PricingWorkType;
  effortBand: PricingEffortBand;
  /** Exact Implementation Plan / Scope sourceActionKey matches. */
  actionKeys: string[];
  /** Normalized title substrings used when action key is missing/manual. */
  titleIncludes: string[];
}

/**
 * Canonical commercial work-unit catalog (Sprint 5 V1).
 * Overlapping Scope deliverables with the same key collapse to one priced unit.
 */
export const WORK_UNIT_CATALOG: WorkUnitCatalogEntry[] = [
  {
    key: "improve-meta",
    title: "Improve meta descriptions for clarity and uniqueness",
    workType: "CONFIGURATION",
    effortBand: "SMALL",
    actionKeys: ["improve-meta"],
    titleIncludes: ["meta description"],
  },
  {
    key: "heading-architecture",
    title: "Correct heading hierarchy (H1 and supporting headings)",
    workType: "CONFIGURATION",
    effortBand: "MEDIUM",
    actionKeys: ["heading-architecture", "heading-hierarchy"],
    titleIncludes: ["heading hierarchy", "heading architecture", "h1 and supporting"],
  },
  {
    key: "open-graph",
    title: "Complete Open Graph metadata for shared pages",
    workType: "CONFIGURATION",
    effortBand: "SMALL",
    actionKeys: ["open-graph"],
    titleIncludes: ["open graph"],
  },
  {
    key: "internal-linking",
    title: "Strengthen contextual internal linking between key pages",
    workType: "CONFIGURATION",
    effortBand: "MEDIUM",
    actionKeys: ["internal-linking"],
    titleIncludes: ["internal linking"],
  },
  {
    key: "content-depth",
    title: "Expand service page content depth",
    workType: "CONTENT",
    effortBand: "LARGE",
    actionKeys: ["content-depth", "expand-content"],
    titleIncludes: ["content depth", "expand service page content"],
  },
  {
    key: "canonical",
    title: "Implement or review canonical URL markup",
    workType: "TECHNICAL",
    effortBand: "MEDIUM",
    actionKeys: ["canonical"],
    titleIncludes: ["canonical"],
  },
  {
    key: "structured-data",
    title: "Implement or repair structured data markup",
    workType: "TECHNICAL",
    effortBand: "MEDIUM",
    actionKeys: ["structured-data", "schema"],
    titleIncludes: ["structured data", "schema markup"],
  },
  {
    key: "trust-signals",
    title: "Add or strengthen trust signals near conversion points",
    workType: "OPTIMIZATION",
    effortBand: "MEDIUM",
    actionKeys: ["trust-signals"],
    titleIncludes: ["trust signal"],
  },
  {
    key: "cta-clarity",
    title: "Clarify primary calls to action",
    workType: "OPTIMIZATION",
    effortBand: "SMALL",
    actionKeys: ["cta-clarity", "cta"],
    titleIncludes: ["call to action", "calls to action"],
  },
  {
    key: "css-delivery",
    title: "Review CSS delivery / unused styles for maintainability",
    workType: "REVIEW",
    effortBand: "SMALL",
    actionKeys: ["css-delivery"],
    titleIncludes: ["css delivery", "unused styles"],
  },
  {
    key: "conversion-assessment",
    title: "Conversion Optimization assessment",
    workType: "ASSESSMENT",
    effortBand: "ASSESSMENT",
    actionKeys: ["conversion-assessment", "conversion-review"],
    titleIncludes: [
      "conversion optimization assessment",
      "assess conversion",
      "review conversion",
    ],
  },
];

const BY_ACTION_KEY = new Map<string, WorkUnitCatalogEntry>();
for (const entry of WORK_UNIT_CATALOG) {
  for (const key of entry.actionKeys) {
    BY_ACTION_KEY.set(key.toLowerCase(), entry);
  }
}

/**
 * Vague conversion-only wording without a concrete implementation action
 * maps to ASSESSMENT rather than full conversion build-out.
 */
export function looksLikeVagueConversionAssessment(title: string): boolean {
  const t = title.toLowerCase().trim();
  if (t.includes("trust signal") || t.includes("call to action")) {
    return false;
  }
  if (
    t === "conversion optimization" ||
    t === "improve conversion" ||
    t === "improve conversions" ||
    t === "conversion improvements" ||
    t.startsWith("conversion optimization —") ||
    t.startsWith("conversion optimization -")
  ) {
    return true;
  }
  if (
    t.includes("conversion") &&
    (t.includes("assess") || t.includes("review") || t.includes("evaluate"))
  ) {
    return true;
  }
  return (
    t.includes("conversion optimization") &&
    !t.includes("trust") &&
    !t.includes("cta") &&
    !t.includes("form") &&
    t.split(/\s+/).length <= 4
  );
}

export function resolveWorkUnitFromDeliverable(options: {
  sourceActionKey: string | null;
  title: string;
  source: string;
}): {
  key: string;
  title: string;
  workType: PricingWorkType;
  effortBand: PricingEffortBand;
  isCustom: boolean;
} {
  const actionKey = options.sourceActionKey?.toLowerCase().trim() ?? "";
  if (actionKey) {
    const byKey = BY_ACTION_KEY.get(actionKey);
    if (byKey) {
      return {
        key: byKey.key,
        title: byKey.title,
        workType: byKey.workType,
        effortBand: byKey.effortBand,
        isCustom: false,
      };
    }
  }

  const titleLower = options.title.toLowerCase();
  for (const entry of WORK_UNIT_CATALOG) {
    if (entry.titleIncludes.some((fragment) => titleLower.includes(fragment))) {
      return {
        key: entry.key,
        title: entry.title,
        workType: entry.workType,
        effortBand: entry.effortBand,
        isCustom: false,
      };
    }
  }

  if (looksLikeVagueConversionAssessment(options.title)) {
    const assessment = BY_ACTION_KEY.get("conversion-assessment")!;
    return {
      key: assessment.key,
      title: assessment.title,
      workType: assessment.workType,
      effortBand: assessment.effortBand,
      isCustom: false,
    };
  }

  // Manual / unrecognized → CUSTOM commercial work
  const customKey = `custom:${slugify(options.title)}`;
  return {
    key: customKey,
    title: options.title.trim(),
    workType: "CUSTOM",
    effortBand: "CUSTOM",
    isCustom: true,
  };
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80) || "work";
}
