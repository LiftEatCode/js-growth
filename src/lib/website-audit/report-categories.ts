import type { AuditCategory } from "./types";

export interface ReportCategoryDisplay {
  id: AuditCategory;
  label: string;
  shortLabel: string;
  description: string;
  displayOrder: number;
}

export const REPORT_CATEGORY_CONFIG: Record<
  AuditCategory,
  ReportCategoryDisplay
> = {
  technical: {
    id: "technical",
    label: "Technical",
    shortLabel: "Technical",
    description:
      "Crawlability, indexability, structured data, and other technical health signals.",
    displayOrder: 1,
  },
  seo: {
    id: "seo",
    label: "Search",
    shortLabel: "Search",
    description:
      "Titles, descriptions, canonical setup, and other search-visibility signals.",
    displayOrder: 2,
  },
  content: {
    id: "content",
    label: "Content",
    shortLabel: "Content",
    description:
      "Heading structure, content depth, internal links, and on-page usefulness.",
    displayOrder: 3,
  },
  cro: {
    id: "cro",
    label: "Conversion",
    shortLabel: "Conversion",
    description:
      "Calls to action, contact paths, forms, and trust signals that help visitors take the next step.",
    displayOrder: 4,
  },
  local: {
    id: "local",
    label: "Local SEO",
    shortLabel: "Local",
    description:
      "Location, contact, service-area, and LocalBusiness signals for local customers.",
    displayOrder: 5,
  },
  performance: {
    id: "performance",
    label: "Performance",
    shortLabel: "Performance",
    description:
      "Observable page-weight, script, image, and resource-reference signals from the HTML scan — not measured Core Web Vitals.",
    displayOrder: 6,
  },
  accessibility: {
    id: "accessibility",
    label: "Accessibility",
    shortLabel: "Access",
    description:
      "Image text and other accessibility signals that affect usability.",
    displayOrder: 7,
  },
};

export const REPORT_CATEGORY_DISPLAY_ORDER: AuditCategory[] = (
  Object.values(REPORT_CATEGORY_CONFIG) as ReportCategoryDisplay[]
)
  .sort((left, right) => left.displayOrder - right.displayOrder)
  .map((item) => item.id);

export function getReportCategoryDisplay(
  category: AuditCategory,
): ReportCategoryDisplay {
  return (
    REPORT_CATEGORY_CONFIG[category] ?? REPORT_CATEGORY_CONFIG.technical
  );
}

export function getReportCategoryLabel(category: AuditCategory): string {
  return getReportCategoryDisplay(category).label;
}
