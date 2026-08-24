/**
 * Growth Sprint 5 — Search Intelligence V1 (SEARCH_INTELLIGENCE_VERSION = 1).
 *
 * Produces priorities and briefs for Sprint 6. Does not invent search volume,
 * ranking guarantees, or traffic forecasts. No Google Search Console API.
 */

import { GROWTH_BASELINE_V1 } from "@/lib/growth/baseline-v1";

export const SEARCH_INTELLIGENCE_VERSION = 1 as const;

export const SEARCH_INTENTS = [
  "INFORMATIONAL",
  "COMMERCIAL_INVESTIGATION",
  "SERVICE",
  "LOCAL_SERVICE",
  "TOOL",
  "COMPARISON",
  "PROBLEM_SOLUTION",
  "BRAND",
] as const;
export type SearchIntent = (typeof SEARCH_INTENTS)[number];

export const SEARCH_TOPICS = [
  "WEBSITE_GROWTH",
  "WEB_DEVELOPMENT",
  "SEO",
  "LOCAL_SEO",
  "GBP",
  "CONVERSION",
  "WEBSITE_AUDITS",
  "CONTENT_TRAFFIC",
  "AI_AUTOMATION",
  "BUSINESS_AUTOMATION",
  "CUSTOM_SOFTWARE",
  "ANALYTICS_GROWTH",
] as const;
export type SearchTopic = (typeof SEARCH_TOPICS)[number];

export const SEARCH_CAPABILITY_TIERS = [
  "CORE_COMMERCIAL",
  "SUPPORTING_AUTHORITY",
  "FUTURE_PRODUCT",
  "LOW_PRIORITY",
] as const;
export type SearchCapabilityTier = (typeof SEARCH_CAPABILITY_TIERS)[number];

/** Business category investment tiers for JS Solutions SEO. */
export const SEARCH_CAPABILITY_MAP = {
  WEBSITE_DEVELOPMENT: "CORE_COMMERCIAL",
  SEO: "CORE_COMMERCIAL",
  LOCAL_SEO: "CORE_COMMERCIAL",
  GBP_LOCAL_VISIBILITY: "CORE_COMMERCIAL",
  WEBSITE_GROWTH_AUDITS: "CORE_COMMERCIAL",
  CONVERSION_OPTIMIZATION: "SUPPORTING_AUTHORITY",
  AI_AUTOMATION: "SUPPORTING_AUTHORITY",
  BUSINESS_AUTOMATION: "SUPPORTING_AUTHORITY",
  CUSTOM_SOFTWARE: "FUTURE_PRODUCT",
  ANALYTICS_GROWTH: "SUPPORTING_AUTHORITY",
} as const satisfies Record<string, SearchCapabilityTier>;

export const SEARCH_OPPORTUNITY_SOURCES = [
  "GSC_QUERY",
  "GSC_PAGE",
  "SERVICE_GAP",
  "CONTENT_GAP",
  "CUSTOMER_QUESTION",
  "COMPETITOR_OBSERVATION",
  "LOCAL_INTENT",
  "AUDIT_INSIGHT",
  "MANUAL_RESEARCH",
] as const;
export type SearchOpportunitySource = (typeof SEARCH_OPPORTUNITY_SOURCES)[number];

export const SEARCH_OPPORTUNITY_STATUSES = [
  "IDEA",
  "VALIDATED",
  "PLANNED",
  "IN_PROGRESS",
  "PUBLISHED",
  "MONITORING",
  "REFRESH",
  "ARCHIVED",
] as const;
export type SearchOpportunityStatus =
  (typeof SEARCH_OPPORTUNITY_STATUSES)[number];

export const SEARCH_PRIORITY_BANDS = ["NOW", "NEXT", "LATER"] as const;
export type SearchPriorityBand = (typeof SEARCH_PRIORITY_BANDS)[number];

export const SEARCH_EVIDENCE_KINDS = [
  "FIRST_PARTY_DATA",
  "OFFICIAL_GUIDANCE",
  "MANUAL_RESEARCH",
  "INFERENCE",
  "HYPOTHESIS",
] as const;
export type SearchEvidenceKind = (typeof SEARCH_EVIDENCE_KINDS)[number];

export const SEARCH_PAGE_TYPES = [
  "SERVICE",
  "BLOG",
  "TOOL",
  "LANDING",
  "LOCAL",
  "RESOURCE",
  "ABOUT",
  "OTHER",
] as const;
export type SearchPageType = (typeof SEARCH_PAGE_TYPES)[number];

export function isSearchIntent(value: string): value is SearchIntent {
  return (SEARCH_INTENTS as readonly string[]).includes(value);
}
export function isSearchTopic(value: string): value is SearchTopic {
  return (SEARCH_TOPICS as readonly string[]).includes(value);
}
export function isSearchOpportunitySource(
  value: string,
): value is SearchOpportunitySource {
  return (SEARCH_OPPORTUNITY_SOURCES as readonly string[]).includes(value);
}
export function isSearchOpportunityStatus(
  value: string,
): value is SearchOpportunityStatus {
  return (SEARCH_OPPORTUNITY_STATUSES as readonly string[]).includes(value);
}
export function isSearchPriorityBand(value: string): value is SearchPriorityBand {
  return (SEARCH_PRIORITY_BANDS as readonly string[]).includes(value);
}
export function isSearchEvidenceKind(value: string): value is SearchEvidenceKind {
  return (SEARCH_EVIDENCE_KINDS as readonly string[]).includes(value);
}
export function isSearchPageType(value: string): value is SearchPageType {
  return (SEARCH_PAGE_TYPES as readonly string[]).includes(value);
}

/** GSC operating stages — conservative transitions at low volume. */
export const SEARCH_CONSOLE_STAGES = [
  {
    id: "STAGE_0",
    name: "INSUFFICIENT_DATA",
    enterWhen: "Query/page breakdown unavailable or impressions < 50 in 28d",
  },
  {
    id: "STAGE_1",
    name: "INITIAL_IMPRESSIONS",
    enterWhen: "Impressions ≥ 50 with still-thin query data",
  },
  {
    id: "STAGE_2",
    name: "QUERY_DISCOVERY",
    enterWhen: "Meaningful query rows appear (≥ ~20 distinct queries)",
  },
  {
    id: "STAGE_3",
    name: "CTR_OPTIMIZATION",
    enterWhen: "Queries/pages with ≥ ~100 impressions each",
  },
  {
    id: "STAGE_4",
    name: "POSITION_CONTENT_IMPROVEMENT",
    enterWhen: "Stable query set + enough clicks to diagnose landing quality",
  },
  {
    id: "STAGE_5",
    name: "COMPOUNDING_REFRESH",
    enterWhen: "Repeat winners exist; refresh/internal-link compounding",
  },
] as const;

export function resolveSearchConsoleStage(input: {
  impressions: number | null;
  queryDataStatus: string | null | undefined;
  distinctQueryCount?: number | null;
}): (typeof SEARCH_CONSOLE_STAGES)[number]["id"] {
  const impressions = input.impressions;
  const queriesInsufficient =
    input.queryDataStatus === "INSUFFICIENT_DATA" ||
    input.queryDataStatus == null;
  if (impressions == null || impressions < 50 || queriesInsufficient) {
    return "STAGE_0";
  }
  if ((input.distinctQueryCount ?? 0) < 20) {
    return "STAGE_1";
  }
  return "STAGE_2";
}

/**
 * Deterministic priority band — no fake search volume.
 * Higher commercial fit + gap + audit relevance → earlier band.
 */
export function computeSearchPriorityBand(input: {
  commercialRelevance: 1 | 2 | 3; // 3 = core commercial
  intentStrength: 1 | 2 | 3;
  contentGap: 1 | 2 | 3; // 3 = missing page
  auditFunnelRelevance: 1 | 2 | 3;
  gscEvidence: 0 | 1 | 2; // 0 = none/insufficient
  effort: 1 | 2 | 3; // 3 = hard
}): { band: SearchPriorityBand; score: number; rationale: string } {
  const score =
    input.commercialRelevance * 4 +
    input.intentStrength * 3 +
    input.contentGap * 3 +
    input.auditFunnelRelevance * 3 +
    input.gscEvidence * 2 -
    input.effort;

  let band: SearchPriorityBand = "LATER";
  if (score >= 28) {
    band = "NOW";
  } else if (score >= 20) {
    band = "NEXT";
  }

  return {
    band,
    score,
    rationale: `score=${score} (commercial=${input.commercialRelevance}, intent=${input.intentStrength}, gap=${input.contentGap}, audit=${input.auditFunnelRelevance}, gsc=${input.gscEvidence}, effort=${input.effort})`,
  };
}

export type SearchPageInventoryItem = {
  path: string;
  pageType: SearchPageType;
  primaryTopic: SearchTopic | "BRAND_SITE";
  intent: SearchIntent;
  title: string;
  notes: string;
  indexable: boolean;
  inSitemap: boolean;
};

/** Code-side inventory of important public pages (no external crawl). */
export const SEARCH_PAGE_INVENTORY: SearchPageInventoryItem[] = [
  {
    path: "/",
    pageType: "LANDING",
    primaryTopic: "WEBSITE_GROWTH",
    intent: "BRAND",
    title: "JS Solutions home",
    notes: "Brand + positioning hub",
    indexable: true,
    inSitemap: true,
  },
  {
    path: "/services",
    pageType: "SERVICE",
    primaryTopic: "WEBSITE_GROWTH",
    intent: "SERVICE",
    title: "Digital Growth Services",
    notes: "Services hub",
    indexable: true,
    inSitemap: true,
  },
  {
    path: "/websites",
    pageType: "SERVICE",
    primaryTopic: "WEB_DEVELOPMENT",
    intent: "SERVICE",
    title: "Website Development",
    notes: "Core commercial service page",
    indexable: true,
    inSitemap: true,
  },
  {
    path: "/local-seo",
    pageType: "SERVICE",
    primaryTopic: "LOCAL_SEO",
    intent: "SERVICE",
    title: "Local SEO",
    notes: "Core commercial; GBP section included",
    indexable: true,
    inSitemap: true,
  },
  {
    path: "/seo",
    pageType: "SERVICE",
    primaryTopic: "SEO",
    intent: "SERVICE",
    title: "SEO Services for Small Businesses",
    notes: "Sprint 7 published service page; measure before refresh",
    indexable: true,
    inSitemap: true,
  },
  {
    path: "/ai-automation",
    pageType: "SERVICE",
    primaryTopic: "AI_AUTOMATION",
    intent: "SERVICE",
    title: "AI Integration & Business Automation",
    notes: "Supporting authority / future commercial",
    indexable: true,
    inSitemap: true,
  },
  {
    path: "/ai-solutions",
    pageType: "SERVICE",
    primaryTopic: "AI_AUTOMATION",
    intent: "SERVICE",
    title: "AI Solutions (overlap risk)",
    notes: "Exists in app router but NOT in sitemap.ts — overlap with /ai-automation",
    indexable: true,
    inSitemap: false,
  },
  {
    path: "/growth-system",
    pageType: "RESOURCE",
    primaryTopic: "WEBSITE_GROWTH",
    intent: "COMMERCIAL_INVESTIGATION",
    title: "The JS Growth System",
    notes: "Methodology / authority",
    indexable: true,
    inSitemap: true,
  },
  {
    path: "/website-audit",
    pageType: "TOOL",
    primaryTopic: "WEBSITE_AUDITS",
    intent: "TOOL",
    title: "Website Growth Audit",
    notes: "Primary conversion tool",
    indexable: true,
    inSitemap: true,
  },
  {
    path: "/investment",
    pageType: "LANDING",
    primaryTopic: "WEBSITE_GROWTH",
    intent: "COMMERCIAL_INVESTIGATION",
    title: "Investment / pricing context",
    notes: "Commercial investigation support",
    indexable: true,
    inSitemap: true,
  },
  {
    path: "/projects",
    pageType: "RESOURCE",
    primaryTopic: "WEB_DEVELOPMENT",
    intent: "COMMERCIAL_INVESTIGATION",
    title: "Projects",
    notes: "Proof hub",
    indexable: true,
    inSitemap: true,
  },
  {
    path: "/about",
    pageType: "ABOUT",
    primaryTopic: "BRAND_SITE",
    intent: "BRAND",
    title: "About",
    notes: "Brand / trust",
    indexable: true,
    inSitemap: true,
  },
  {
    path: "/contact",
    pageType: "LANDING",
    primaryTopic: "BRAND_SITE",
    intent: "BRAND",
    title: "Contact",
    notes: "Conversion",
    indexable: true,
    inSitemap: true,
  },
  {
    path: "/blog",
    pageType: "RESOURCE",
    primaryTopic: "CONTENT_TRAFFIC",
    intent: "INFORMATIONAL",
    title: "Blog index",
    notes: "Content hub",
    indexable: true,
    inSitemap: true,
  },
];

export type SearchBlogInventoryItem = {
  slug: string;
  path: string;
  title: string;
  primaryTopic: SearchTopic;
  intent: SearchIntent;
  relatedServicePath: string | null;
  status: "CURRENT" | "REFRESH_CANDIDATE" | "THIN_RISK";
};

export const SEARCH_BLOG_INVENTORY: SearchBlogInventoryItem[] = [
  {
    slug: "small-business-not-showing-up-on-google",
    path: "/blog/small-business-not-showing-up-on-google",
    title:
      "Why Your Small Business Isn't Showing Up on Google — And What to Fix First",
    primaryTopic: "SEO",
    intent: "PROBLEM_SOLUTION",
    relatedServicePath: "/website-audit",
    status: "CURRENT",
  },
  {
    slug: "why-a-one-time-website-audit-isnt-enough",
    path: "/blog/why-a-one-time-website-audit-isnt-enough",
    title: "Why a one-time website audit isn't enough",
    primaryTopic: "WEBSITE_AUDITS",
    intent: "PROBLEM_SOLUTION",
    relatedServicePath: "/website-audit",
    status: "CURRENT",
  },
  {
    slug: "website-growth-audit-launch",
    path: "/blog/website-growth-audit-launch",
    title: "Website Growth Audit launch",
    primaryTopic: "WEBSITE_AUDITS",
    intent: "TOOL",
    relatedServicePath: "/website-audit",
    status: "CURRENT",
  },
  {
    slug: "why-most-small-business-websites-dont-generate-leads",
    path: "/blog/why-most-small-business-websites-dont-generate-leads",
    title: "Why most small-business websites don't generate leads",
    primaryTopic: "CONVERSION",
    intent: "PROBLEM_SOLUTION",
    relatedServicePath: "/website-audit",
    status: "CURRENT",
  },
  {
    slug: "how-much-does-a-small-business-website-cost",
    path: "/blog/how-much-does-a-small-business-website-cost",
    title: "How much does a small-business website cost",
    primaryTopic: "WEB_DEVELOPMENT",
    intent: "COMMERCIAL_INVESTIGATION",
    relatedServicePath: "/websites",
    status: "CURRENT",
  },
  {
    slug: "why-local-businesses-need-more-than-a-website",
    path: "/blog/why-local-businesses-need-more-than-a-website",
    title: "Why local businesses need more than a website",
    primaryTopic: "LOCAL_SEO",
    intent: "PROBLEM_SOLUTION",
    relatedServicePath: "/local-seo",
    status: "CURRENT",
  },
  {
    slug: "what-is-local-seo",
    path: "/blog/what-is-local-seo",
    title: "What is Local SEO",
    primaryTopic: "LOCAL_SEO",
    intent: "INFORMATIONAL",
    relatedServicePath: "/local-seo",
    status: "CURRENT",
  },
];

export type SearchContentGap = {
  id: string;
  kind:
    | "MISSING_SERVICE"
    | "MISSING_SUPPORT"
    | "MISSING_PROBLEM_SOLUTION"
    | "MISSING_LOCAL"
    | "WEAK_CONTENT"
    | "REFRESH"
    | "INTERNAL_LINK"
    | "INDEXABILITY";
  topic: SearchTopic;
  summary: string;
  evidence: SearchEvidenceKind;
};

export const SEARCH_CONTENT_GAPS: SearchContentGap[] = [
  {
    id: "gap-seo-service",
    kind: "REFRESH",
    topic: "SEO",
    summary:
      "/seo service page is published — awaiting Search/GA4 performance evidence before refresh decisions. Do not create another SEO service page.",
    evidence: "FIRST_PARTY_DATA",
  },
  {
    id: "gap-gbp-page",
    kind: "MISSING_SUPPORT",
    topic: "GBP",
    summary:
      "GBP is a section on /local-seo; no standalone GBP education/service URL for commercial investigation queries.",
    evidence: "INFERENCE",
  },
  {
    id: "gap-conversion-service",
    kind: "MISSING_SERVICE",
    topic: "CONVERSION",
    summary:
      "Conversion optimization is a capability without a dedicated service page (blog covers problem space).",
    evidence: "MANUAL_RESEARCH",
  },
  {
    id: "gap-ai-overlap",
    kind: "WEAK_CONTENT",
    topic: "AI_AUTOMATION",
    summary:
      "/ai-solutions overlaps /ai-automation and is omitted from sitemap — consolidate or differentiate.",
    evidence: "FIRST_PARTY_DATA",
  },
  {
    id: "gap-local-cities",
    kind: "MISSING_LOCAL",
    topic: "LOCAL_SEO",
    summary:
      "No Magnolia/Woodlands/Tomball/Spring/Conroe/Cypress city pages yet — do not mass-generate doorways; only create if distinct useful local content is justified.",
    evidence: "OFFICIAL_GUIDANCE",
  },
  {
    id: "gap-internal-links-audit",
    kind: "INTERNAL_LINK",
    topic: "WEBSITE_AUDITS",
    summary:
      "Ensure all commercial blogs and service pages clearly link to /website-audit with natural anchors.",
    evidence: "INFERENCE",
  },
];

export type SearchInternalLinkRec = {
  fromPath: string;
  toPath: string;
  reason: string;
  evidence: SearchEvidenceKind;
};

export const SEARCH_INTERNAL_LINK_RECS: SearchInternalLinkRec[] = [
  {
    fromPath: "/blog/small-business-not-showing-up-on-google",
    toPath: "/seo",
    reason: "Visibility problem article → SEO service page",
    evidence: "INFERENCE",
  },
  {
    fromPath: "/local-seo",
    toPath: "/seo",
    reason: "Local SEO vs site-wide SEO clarification",
    evidence: "INFERENCE",
  },
  {
    fromPath: "/services",
    toPath: "/seo",
    reason: "Services hub → SEO commercial page",
    evidence: "INFERENCE",
  },
  {
    fromPath: "/blog/small-business-not-showing-up-on-google",
    toPath: "/website-audit",
    reason: "Problem/solution visibility article → diagnostic audit tool",
    evidence: "INFERENCE",
  },
  {
    fromPath: "/blog/small-business-not-showing-up-on-google",
    toPath: "/local-seo",
    reason: "Visibility article → Local SEO / GBP commercial page",
    evidence: "INFERENCE",
  },
  {
    fromPath: "/blog/what-is-local-seo",
    toPath: "/local-seo",
    reason: "Informational blog → commercial Local SEO service",
    evidence: "INFERENCE",
  },
  {
    fromPath: "/blog/why-most-small-business-websites-dont-generate-leads",
    toPath: "/website-audit",
    reason: "Problem/solution → free audit tool",
    evidence: "INFERENCE",
  },
  {
    fromPath: "/websites",
    toPath: "/website-audit",
    reason: "Service → diagnostic tool for unqualified visitors",
    evidence: "INFERENCE",
  },
  {
    fromPath: "/local-seo",
    toPath: "/website-audit",
    reason: "Local SEO service → audit entry",
    evidence: "INFERENCE",
  },
  {
    fromPath: "/services",
    toPath: "/websites",
    reason: "Hub → primary commercial service",
    evidence: "INFERENCE",
  },
];

export type SeedSearchOpportunity = {
  slug: string;
  topic: SearchTopic;
  queryConcept: string;
  intent: SearchIntent;
  pageType: SearchPageType;
  source: SearchOpportunitySource;
  evidenceKind: SearchEvidenceKind;
  currentPagePath: string | null;
  recommendedPath: string | null;
  commercialRelevance: 1 | 2 | 3;
  intentStrength: 1 | 2 | 3;
  contentGap: 1 | 2 | 3;
  auditFunnelRelevance: 1 | 2 | 3;
  gscEvidence: 0 | 1 | 2;
  effort: 1 | 2 | 3;
  notes: string;
};

/** Initial ranked backlog seeds (no fabricated volumes). */
export const SEARCH_OPPORTUNITY_SEEDS: SeedSearchOpportunity[] = [
  {
    slug: "website-growth-audit-tool",
    topic: "WEBSITE_AUDITS",
    queryConcept: "small business website audit",
    intent: "TOOL",
    pageType: "TOOL",
    source: "SERVICE_GAP",
    evidenceKind: "MANUAL_RESEARCH",
    currentPagePath: "/website-audit",
    recommendedPath: "/website-audit",
    commercialRelevance: 3,
    intentStrength: 3,
    contentGap: 1,
    auditFunnelRelevance: 3,
    gscEvidence: 0,
    effort: 1,
    notes: "Strengthen existing tool page; do not duplicate.",
  },
  {
    slug: "website-no-leads-problem",
    topic: "CONVERSION",
    queryConcept: "why isn't my website getting leads",
    intent: "PROBLEM_SOLUTION",
    pageType: "BLOG",
    source: "CONTENT_GAP",
    evidenceKind: "MANUAL_RESEARCH",
    currentPagePath:
      "/blog/why-most-small-business-websites-dont-generate-leads",
    recommendedPath:
      "/blog/why-most-small-business-websites-dont-generate-leads",
    commercialRelevance: 3,
    intentStrength: 3,
    contentGap: 1,
    auditFunnelRelevance: 3,
    gscEvidence: 0,
    effort: 1,
    notes: "Refresh + deepen internal links to audit/websites.",
  },
  {
    slug: "small-business-google-visibility",
    topic: "SEO",
    queryConcept: "small business not showing up on Google",
    intent: "PROBLEM_SOLUTION",
    pageType: "BLOG",
    source: "CONTENT_GAP",
    evidenceKind: "MANUAL_RESEARCH",
    currentPagePath: "/blog/small-business-not-showing-up-on-google",
    recommendedPath: "/blog/small-business-not-showing-up-on-google",
    commercialRelevance: 3,
    intentStrength: 3,
    contentGap: 1,
    auditFunnelRelevance: 3,
    gscEvidence: 0,
    effort: 1,
    notes:
      "Published 2026-08-23. Status MONITORING — Stage 0 GSC; do not judge early. Watch impressions → queries → clicks → audit activity over weeks.",
  },
  {
    slug: "seo-service-page",
    topic: "SEO",
    queryConcept: "SEO for small businesses",
    intent: "SERVICE",
    pageType: "SERVICE",
    source: "SERVICE_GAP",
    evidenceKind: "MANUAL_RESEARCH",
    currentPagePath: null,
    recommendedPath: "/seo",
    commercialRelevance: 3,
    intentStrength: 3,
    contentGap: 3,
    auditFunnelRelevance: 2,
    gscEvidence: 0,
    effort: 2,
    notes: "Create dedicated SEO service page distinct from Local SEO.",
  },
  {
    slug: "local-seo-magnolia-support",
    topic: "LOCAL_SEO",
    queryConcept: "SEO company Magnolia TX",
    intent: "LOCAL_SERVICE",
    pageType: "LOCAL",
    source: "LOCAL_INTENT",
    evidenceKind: "HYPOTHESIS",
    currentPagePath: "/local-seo",
    recommendedPath: null,
    commercialRelevance: 3,
    intentStrength: 2,
    contentGap: 2,
    auditFunnelRelevance: 2,
    gscEvidence: 0,
    effort: 3,
    notes:
      "Do not auto-create city doorways. Evaluate one useful Magnolia-area page only if distinct local proof/content exists.",
  },
  {
    slug: "gbp-optimization-support",
    topic: "GBP",
    queryConcept: "Google Business Profile optimization",
    intent: "COMMERCIAL_INVESTIGATION",
    pageType: "BLOG",
    source: "CONTENT_GAP",
    evidenceKind: "MANUAL_RESEARCH",
    currentPagePath: null,
    recommendedPath: "/blog/google-business-profile-optimization",
    commercialRelevance: 3,
    intentStrength: 3,
    contentGap: 3,
    auditFunnelRelevance: 2,
    gscEvidence: 0,
    effort: 2,
    notes: "Support content linking to /local-seo.",
  },
  {
    slug: "website-development-service",
    topic: "WEB_DEVELOPMENT",
    queryConcept: "small business website development",
    intent: "SERVICE",
    pageType: "SERVICE",
    source: "MANUAL_RESEARCH",
    evidenceKind: "MANUAL_RESEARCH",
    currentPagePath: "/websites",
    recommendedPath: "/websites",
    commercialRelevance: 3,
    intentStrength: 3,
    contentGap: 1,
    auditFunnelRelevance: 2,
    gscEvidence: 0,
    effort: 2,
    notes: "Strengthen existing /websites; link cost blog + audit.",
  },
  {
    slug: "website-cost-investigation",
    topic: "WEB_DEVELOPMENT",
    queryConcept: "how much does a small business website cost",
    intent: "COMMERCIAL_INVESTIGATION",
    pageType: "BLOG",
    source: "MANUAL_RESEARCH",
    evidenceKind: "FIRST_PARTY_DATA",
    currentPagePath: "/blog/how-much-does-a-small-business-website-cost",
    recommendedPath: "/blog/how-much-does-a-small-business-website-cost",
    commercialRelevance: 2,
    intentStrength: 3,
    contentGap: 1,
    auditFunnelRelevance: 1,
    gscEvidence: 0,
    effort: 1,
    notes: "Existing post — refresh + CTA to /websites and /contact.",
  },
  {
    slug: "consolidate-ai-urls",
    topic: "AI_AUTOMATION",
    queryConcept: "AI automation for small business",
    intent: "SERVICE",
    pageType: "SERVICE",
    source: "SERVICE_GAP",
    evidenceKind: "FIRST_PARTY_DATA",
    currentPagePath: "/ai-automation",
    recommendedPath: "/ai-automation",
    commercialRelevance: 2,
    intentStrength: 2,
    contentGap: 2,
    auditFunnelRelevance: 1,
    gscEvidence: 0,
    effort: 2,
    notes: "Resolve /ai-solutions vs /ai-automation overlap before new AI content.",
  },
];

export function rankSeedOpportunities() {
  return SEARCH_OPPORTUNITY_SEEDS.map((seed) => {
    const priority = computeSearchPriorityBand(seed);
    return { ...seed, priority };
  }).sort((a, b) => b.priority.score - a.priority.score);
}

export type ContentBriefContract = {
  topic: SearchTopic;
  primaryIntent: SearchIntent;
  audience: string;
  businessObjective: string;
  targetServicePath: string | null;
  recommendedFormat: string;
  recommendedPageType: SearchPageType;
  primaryQuestion: string;
  supportingQuestions: string[];
  internalLinkTargets: string[];
  cta: string;
  evidence: SearchEvidenceKind;
  researchRequirements: string[];
  localContext: string | null;
  avoidClaimConstraints: string[];
};

export function buildContentBriefFromSeed(
  seed: SeedSearchOpportunity,
): ContentBriefContract {
  return {
    topic: seed.topic,
    primaryIntent: seed.intent,
    audience: "Local / small-business decision makers evaluating web growth",
    businessObjective:
      "Qualified search visibility → audit/contact → opportunity (no ranking guarantees)",
    targetServicePath: seed.recommendedPath?.startsWith("/blog")
      ? seed.currentPagePath && !seed.currentPagePath.startsWith("/blog")
        ? seed.currentPagePath
        : "/website-audit"
      : seed.recommendedPath,
    recommendedFormat:
      seed.pageType === "BLOG"
        ? "long-form educational article"
        : seed.pageType === "SERVICE"
          ? "service page"
          : seed.pageType === "TOOL"
            ? "tool landing"
            : "focused landing/resource",
    recommendedPageType: seed.pageType,
    primaryQuestion: seed.queryConcept,
    supportingQuestions: [
      "What problem is the searcher trying to solve?",
      "What proof or process should JS Solutions show?",
      "What is the next honest CTA?",
    ],
    internalLinkTargets: [
      seed.recommendedPath,
      "/website-audit",
      "/contact",
    ].filter((v): v is string => Boolean(v)),
    cta:
      seed.auditFunnelRelevance >= 2
        ? "Start free Website Growth Audit"
        : "Contact JS Solutions",
    evidence: seed.evidenceKind,
    researchRequirements: [
      "Confirm no duplicate existing URL intent",
      "People-first outline (Google helpful content)",
      "No fabricated search volumes or rank promises",
    ],
    localContext:
      seed.intent === "LOCAL_SERVICE"
        ? "Magnolia / northwest Houston suburbs — only if content is genuinely local and useful"
        : null,
    avoidClaimConstraints: [
      "No guaranteed rankings, traffic, or leads",
      "No doorway-page city spam",
      "No scaled AI content for ranking manipulation",
      "Average position is diagnostic only",
    ],
  };
}

export const SEARCH_BASELINE_SUMMARY = {
  property: GROWTH_BASELINE_V1.searchConsole.property,
  period: GROWTH_BASELINE_V1.period,
  clicks: GROWTH_BASELINE_V1.searchConsole.clicks,
  impressions: GROWTH_BASELINE_V1.searchConsole.impressions,
  averageCtr: GROWTH_BASELINE_V1.searchConsole.averageCtr,
  averagePosition: GROWTH_BASELINE_V1.searchConsole.averagePosition,
  queryDataStatus: GROWTH_BASELINE_V1.searchConsole.queryDataStatus,
} as const;

export const PREFERRED_SOURCES_DECISION = {
  status: "FUTURE_EXPERIMENT" as const,
  reason:
    "Preferred Sources helps audiences badge a site in Top Stories / AI experiences when selected. JS Growth is early-stage (2 impressions) — document for later; do not implement button/deeplink until brand demand exists.",
};

export const AI_SEARCH_GUIDANCE_SUMMARY = {
  official:
    "Google states SEO best practices remain relevant for generative AI features on Search; people-first content; scaled AI content for ranking manipulation is spam.",
  industry:
    "GEO/AEO guarantee claims are unsupported — treat as hypothesis only.",
  weWillTest:
    "After query discovery (Stage 2+), compare classic SERP vs AI Overview presence manually in GSC performance notes — no separate ranking score.",
};

export const SOCIAL_VIDEO_SEARCH_DECISION = {
  status: "FUTURE_CROSS_CHANNEL" as const,
  reason:
    "GSC platform properties (IG/TikTok/X/YouTube) are separate from website organic. Do not blend Facebook Insights with GSC website metrics. Consider YouTube/platform property later if video publishing begins.",
};
