export const PROFESSIONAL_AUDIT_PRODUCT_NAME =
  "Professional Website Growth Audit";

export const PROFESSIONAL_AUDIT_PRODUCT_KEY =
  "professional-website-growth-audit";

export function getProfessionalAuditPriceLabel(): string | null {
  const value =
    process.env.NEXT_PUBLIC_PROFESSIONAL_AUDIT_PRICE_LABEL?.trim() ?? "";

  return value || null;
}

export function formatCentsAsUsd(cents: number, currency = "usd"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    maximumFractionDigits: 0,
  }).format(cents / 100);
}
