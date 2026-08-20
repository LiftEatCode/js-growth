import type { AuditCategory } from "@/lib/website-audit/types";

export type ServiceCapabilityId =
  | "WEBSITE_DEVELOPMENT"
  | "SEO"
  | "LOCAL_SEO"
  | "CONTENT"
  | "CONVERSION_OPTIMIZATION"
  | "AI_AUTOMATION"
  | "MARKETING_AUTOMATION"
  | "CUSTOM_SOFTWARE";

export type CapabilityEvidenceType =
  | "AUDIT_CATEGORY"
  | "AUDIT_FINDING"
  | "COMPETITIVE_CATEGORY_GAP"
  | "COMPETITIVE_FINDING"
  | "COMPETITIVE_ADVANTAGE";

export type CapabilityWorkType =
  | "audit_remediation"
  | "content_production"
  | "on_page_seo"
  | "technical_implementation"
  | "local_presence"
  | "conversion_ux"
  | "automation"
  | "custom_build";

export interface ServiceCapability {
  id: ServiceCapabilityId;
  displayName: string;
  description: string;
  /** Audit categories this capability commonly addresses. */
  applicableAuditCategories: AuditCategory[];
  supportedEvidenceTypes: CapabilityEvidenceType[];
  defaultWorkTypes: CapabilityWorkType[];
  /** Inactive capabilities stay in the taxonomy but are never auto-mapped in V1. */
  active: boolean;
}

/** Bump when capability metadata or active flags change in a material way. */
export const SERVICE_CAPABILITY_VERSION = 1;
