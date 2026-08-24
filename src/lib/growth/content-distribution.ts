/**
 * Growth Sprint 7 — deterministic distribution recommendations.
 * OpenAI = 0 for plan generation. Derivative AI draft = explicit later call.
 */

import {
  SEO_SERVICE_PAGE_PUBLIC_SLUG,
  type EvidenceKind,
} from "@/lib/growth/content-performance";

export const CONTENT_DISTRIBUTION_VERSION = 1 as const;

export type DistributionChannel =
  | "FACEBOOK_COMPANY"
  | "FACEBOOK_FOUNDER"
  | "GBP"
  | "BLOG_INTERNAL_LINK"
  | "EMAIL_LATER";

export type DistributionPlanItem = {
  channel: DistributionChannel;
  job: string;
  why: string;
  includeLink: boolean;
  recommendedTiming: string;
  utmStrategy: string;
  measurement: string;
  evidenceKind: EvidenceKind;
  founderInputRequired: boolean;
  autoPost: false;
};

export type ContentDistributionPlanV1 = {
  version: typeof CONTENT_DISTRIBUTION_VERSION;
  sourcePublicSlug: string;
  sourcePublishedUrl: string;
  items: DistributionPlanItem[];
  notes: string[];
};

export function buildSeoServiceDistributionPlan(input: {
  publishedUrl?: string;
}): ContentDistributionPlanV1 {
  const url = input.publishedUrl ?? "/seo";
  return {
    version: CONTENT_DISTRIBUTION_VERSION,
    sourcePublicSlug: SEO_SERVICE_PAGE_PUBLIC_SLUG,
    sourcePublishedUrl: url,
    items: [
      {
        channel: "FACEBOOK_COMPANY",
        job: "AUTHORITY / EDUCATION",
        why: "Explain diagnose-first SEO without ranking guarantees; soft path to audit.",
        includeLink: true,
        recommendedTiming: "Within 7 days of publish; native education first.",
        utmStrategy: `utm_source=facebook&utm_medium=page_organic&utm_campaign=company_seo&utm_content=company_${SEO_SERVICE_PAGE_PUBLIC_SLUG}`,
        measurement:
          "Facebook ledger after real post (GrowthContentRecord). First-party via utm_content.",
        evidenceKind: "HYPOTHESIS",
        founderInputRequired: false,
        autoPost: false,
      },
      {
        channel: "FACEBOOK_FOUNDER",
        job: "TRUST",
        why: "Optional first-person perspective on why SEO should not run in a silo.",
        includeLink: false,
        recommendedTiming: "Only after founder supplies real experience notes.",
        utmStrategy:
          "If linking later: founder_* utm_content; never invent client stories.",
        measurement: "Manual Insights + optional UTM if link used.",
        evidenceKind: "HYPOTHESIS",
        founderInputRequired: true,
        autoPost: false,
      },
      {
        channel: "GBP",
        job: "LOCAL AWARENESS",
        why: "Short GBP post clarifying SEO vs Maps/GBP when relevant to local clients.",
        includeLink: true,
        recommendedTiming: "After indexing check; keep local and useful.",
        utmStrategy: "Optional short link with public-safe slug; no private IDs.",
        measurement: "GBP insights manual; do not invent.",
        evidenceKind: "INFERRED",
        founderInputRequired: false,
        autoPost: false,
      },
      {
        channel: "BLOG_INTERNAL_LINK",
        job: "DISCOVERY",
        why: "Visibility/problem blogs should contextualize /seo as service path.",
        includeLink: true,
        recommendedTiming: "With /seo launch (code links).",
        utmStrategy: "Internal links: no UTM (use events on CTAs).",
        measurement: "GA4 path + service_cta_clicked.",
        evidenceKind: "INFERRED",
        founderInputRequired: false,
        autoPost: false,
      },
    ],
    notes: [
      "Distribution plan is recommendation only — no auto-posting.",
      "GrowthContentRecord is created only after an actual Facebook publish.",
      "Experiment 018 (Website→Facebook follow) is ACTIVE — soft CTA on audit completion / contact success only; click ≠ follower acquired.",
    ],
  };
}

export function facebookCompanyDerivativeSeed(input: {
  sourcePlanSlug: string;
  sourcePublishedUrl: string;
}) {
  return {
    slug: `fb-company-from-${input.sourcePlanSlug}`.slice(0, 80),
    contentType: "FACEBOOK_COMPANY" as const,
    sourceType: "CONTENT_REFRESH" as const,
    sourceOpportunitySlug: null as string | null,
    sourceAssetSlug: input.sourcePlanSlug,
    topic: "SEO" as const,
    workingTitle: "Company post: SEO without ranking guarantees",
    audience: "Small-business owners evaluating SEO help",
    primaryObjective: "TRAFFIC" as const,
    searchIntent: null,
    pageType: null,
    targetServicePath: input.sourcePublishedUrl,
    publisher: "COMPANY" as const,
    priorityBand: "NEXT" as const,
    whyRecommended: [
      "Derivative of published /seo service page",
      "Supports AUTHORITY + EDUCATION without inventing results",
      "Does not create GrowthContentRecord until actually posted",
    ],
  };
}

export function facebookFounderDerivativeSeed(input: {
  sourcePlanSlug: string;
  sourcePublishedUrl: string;
}) {
  return {
    ...facebookCompanyDerivativeSeed(input),
    slug: `fb-founder-from-${input.sourcePlanSlug}`.slice(0, 80),
    contentType: "FACEBOOK_FOUNDER" as const,
    publisher: "FOUNDER" as const,
    primaryObjective: "TRUST" as const,
    workingTitle: "Founder note: SEO should not operate in a silo",
    whyRecommended: [
      "Optional founder derivative of /seo",
      "FOUNDER_INPUT_REQUIRED — do not invent client anecdotes",
    ],
  };
}
