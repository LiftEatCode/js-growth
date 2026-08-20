import type { ServiceCapability, ServiceCapabilityId } from "./types";

export const SERVICE_CAPABILITIES: readonly ServiceCapability[] = [
  {
    id: "WEBSITE_DEVELOPMENT",
    displayName: "Website Development",
    description:
      "Build or improve website structure, templates, UX, and technical implementation.",
    applicableAuditCategories: [
      "technical",
      "cro",
      "accessibility",
      "performance",
      "content",
    ],
    supportedEvidenceTypes: [
      "AUDIT_CATEGORY",
      "AUDIT_FINDING",
      "COMPETITIVE_CATEGORY_GAP",
      "COMPETITIVE_FINDING",
    ],
    defaultWorkTypes: ["technical_implementation", "conversion_ux"],
    active: true,
  },
  {
    id: "SEO",
    displayName: "SEO",
    description:
      "Search visibility work: metadata, structure, indexability, and on-page search optimization.",
    applicableAuditCategories: ["seo", "technical", "content"],
    supportedEvidenceTypes: [
      "AUDIT_CATEGORY",
      "AUDIT_FINDING",
      "COMPETITIVE_CATEGORY_GAP",
      "COMPETITIVE_FINDING",
    ],
    defaultWorkTypes: ["on_page_seo", "audit_remediation"],
    active: true,
  },
  {
    id: "LOCAL_SEO",
    displayName: "Local SEO",
    description:
      "Local presence signals on the website: NAP, local schema, location pages, geographic relevance.",
    applicableAuditCategories: ["local"],
    supportedEvidenceTypes: [
      "AUDIT_CATEGORY",
      "AUDIT_FINDING",
      "COMPETITIVE_CATEGORY_GAP",
      "COMPETITIVE_FINDING",
    ],
    defaultWorkTypes: ["local_presence", "on_page_seo"],
    active: true,
  },
  {
    id: "CONTENT",
    displayName: "Content",
    description:
      "Content strategy and production: depth, structure, service pages, and supporting copy.",
    applicableAuditCategories: ["content", "seo", "local"],
    supportedEvidenceTypes: [
      "AUDIT_CATEGORY",
      "AUDIT_FINDING",
      "COMPETITIVE_CATEGORY_GAP",
      "COMPETITIVE_FINDING",
    ],
    defaultWorkTypes: ["content_production"],
    active: true,
  },
  {
    id: "CONVERSION_OPTIMIZATION",
    displayName: "Conversion Optimization",
    description:
      "Improve paths to contact, forms, CTAs, trust signals, and lead conversion UX.",
    applicableAuditCategories: ["cro"],
    supportedEvidenceTypes: [
      "AUDIT_CATEGORY",
      "AUDIT_FINDING",
      "COMPETITIVE_CATEGORY_GAP",
      "COMPETITIVE_FINDING",
    ],
    defaultWorkTypes: ["conversion_ux"],
    active: true,
  },
  {
    id: "AI_AUTOMATION",
    displayName: "AI Automation",
    description:
      "AI-assisted workflows and integrations. Not auto-recommended from website audit evidence in V1.",
    applicableAuditCategories: [],
    supportedEvidenceTypes: [],
    defaultWorkTypes: ["automation"],
    active: false,
  },
  {
    id: "MARKETING_AUTOMATION",
    displayName: "Marketing Automation",
    description:
      "Campaign and nurture automation. Not auto-recommended from website audit evidence in V1.",
    applicableAuditCategories: [],
    supportedEvidenceTypes: [],
    defaultWorkTypes: ["automation"],
    active: false,
  },
  {
    id: "CUSTOM_SOFTWARE",
    displayName: "Custom Software",
    description:
      "Bespoke software builds. Not auto-recommended from website audit evidence in V1.",
    applicableAuditCategories: [],
    supportedEvidenceTypes: [],
    defaultWorkTypes: ["custom_build"],
    active: false,
  },
] as const;

const BY_ID = new Map(
  SERVICE_CAPABILITIES.map((capability) => [capability.id, capability]),
);

export function getServiceCapability(
  id: ServiceCapabilityId,
): ServiceCapability | undefined {
  return BY_ID.get(id);
}

export function listActiveServiceCapabilities(): ServiceCapability[] {
  return SERVICE_CAPABILITIES.filter((capability) => capability.active);
}

export function getServiceCapabilityDisplayName(id: ServiceCapabilityId): string {
  return BY_ID.get(id)?.displayName ?? id;
}
