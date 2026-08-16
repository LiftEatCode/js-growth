export const FREE_AUDIT_PRODUCT_NAME = "Free Website Growth Audit";

export const PROFESSIONAL_AUDIT_PRODUCT_NAME =
  "Professional Website Growth Audit";

export const PROFESSIONAL_AUDIT_PRODUCT_KEY =
  "professional-website-growth-audit";

export const PROFESSIONAL_AUDIT_BILLING_TYPE = "one-time" as const;

export const PROFESSIONAL_AUDIT_BILLING_LABEL = "one-time";

const DEFAULT_DISPLAY_PRICE_LABEL = "$99";

export function getProfessionalAuditPriceLabel(): string {
  return (
    process.env.NEXT_PUBLIC_PROFESSIONAL_AUDIT_PRICE_LABEL?.trim() ||
    DEFAULT_DISPLAY_PRICE_LABEL
  );
}

export function getProfessionalAuditPricePresentation(): string {
  return `${getProfessionalAuditPriceLabel()} ${PROFESSIONAL_AUDIT_BILLING_LABEL}`;
}

export function formatCentsAsUsd(cents: number, currency = "usd"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export const AUDIT_CATEGORY_OVERVIEW = [
  {
    title: "Search Visibility",
    description:
      "Checks whether the page is set up so customers can find it in search — titles, descriptions, and related signals.",
  },
  {
    title: "Technical Health",
    description:
      "Looks for technical issues that can affect crawling, indexing, usability, and overall site quality.",
  },
  {
    title: "Content",
    description:
      "Reviews whether the page clearly explains what you do and gives visitors enough useful information.",
  },
  {
    title: "Conversion",
    description:
      "Checks whether visitors have a clear path to call, contact, request a quote, or take the next step.",
  },
  {
    title: "Local SEO",
    description:
      "Looks for signals that help customers and search engines understand where your business operates.",
  },
  {
    title: "Performance",
    description:
      "Reviews observable page-weight, script, image, and loading signals from the HTML scan. It does not measure Lighthouse or Core Web Vitals.",
  },
] as const;
