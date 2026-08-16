export type AuditSitePageType =
  | "home"
  | "service"
  | "services-index"
  | "location"
  | "service-area"
  | "contact"
  | "about"
  | "blog"
  | "article"
  | "other";

export type AuditSiteSelectionReason =
  | "seed"
  | "homepage"
  | "navigation"
  | "sitemap"
  | "service-path"
  | "location-path"
  | "contact"
  | "about"
  | "content";

export type AuditSiteSkipReason =
  | "off-site"
  | "robots-disallow"
  | "utility-path"
  | "file-type"
  | "query-explosion"
  | "pagination"
  | "session-or-facet"
  | "blog-cap"
  | "non-html"
  | "duplicate-final"
  | "max-discovered"
  | "max-depth"
  | "language-alternate"
  | "unsupported-protocol";

export type AuditSiteLinkLocation =
  | "header"
  | "nav"
  | "main"
  | "footer"
  | "other";

export type AuditSiteTruncationReason =
  | "page-cap"
  | "time-budget"
  | "discovery-cap";

export interface AuditSkippedUrl {
  url: string;
  reason: AuditSiteSkipReason;
}

export interface AuditSiteCrawlSummary {
  seedUrl: string;
  discoveredCount: number;
  crawledCount: number;
  failedCount: number;
  skippedCount: number;
  truncated: boolean;
  truncationReasons: AuditSiteTruncationReason[];
  maxPages: number;
  maxDepth: number;
  runtimeMs: number;
}

export interface AuditSitePageSnapshot {
  identity: string;
  url: string;
  finalUrl: string;
  path: string;
  depth: number;
  pageType: AuditSitePageType;
  selectionReason: AuditSiteSelectionReason;
  fetchStatus: "success" | "failed";
  statusCode: number | null;
  errorCode: string | null;
  inPrimaryNav: boolean;
  title: string | null;
  metaDescription: string | null;
  h1: string | null;
  wordCount: number;
  canonicalUrl: string | null;
  canonicalSelfReferencing: boolean | null;
  canonicalSameOrigin: boolean | null;
  indexable: boolean | null;
  hasConversionPath: boolean;
  hasTelLink: boolean;
  hasClickToCall: boolean;
  hasLeadForm: boolean;
  trustCategoryCount: number;
  likelyLocalBusiness: boolean;
  hasAddressSignal: boolean;
  hasPhoneSignal: boolean;
  hasServiceAreaLanguage: boolean;
  locationPage: boolean;
  localPageType: string | null;
  serviceAreaMentions: string[];
  outgoingInternalCount: number;
  incomingInternalCount: number;
  outgoingInternalPaths: string[];
  contentTokens: string[];
}

export interface AuditSiteDuplicateGroup {
  value: string;
  count: number;
  paths: string[];
}

export interface AuditSiteMetadataSummary {
  uniqueTitleCount: number;
  uniqueDescriptionCount: number;
  duplicateTitleGroups: AuditSiteDuplicateGroup[];
  duplicateDescriptionGroups: AuditSiteDuplicateGroup[];
}

export interface AuditSiteHeadingSummary {
  uniqueH1Count: number;
  missingH1Count: number;
  duplicateH1Groups: AuditSiteDuplicateGroup[];
}

export interface AuditSiteBrokenLinkExample {
  sourcePath: string;
  destinationPath: string;
  destinationUrl: string;
  statusCode: number | null;
  errorCode: string | null;
}

export interface AuditSiteLinkSummary {
  verifiedBrokenCount: number;
  brokenExamples: AuditSiteBrokenLinkExample[];
  weaklyLinkedImportantPaths: string[];
  crawledEdgeCount: number;
}

export interface AuditSiteSimilarPagePair {
  pathA: string;
  pathB: string;
  similarity: number;
}

export interface AuditSiteContentSummary {
  servicePageCount: number;
  thinServicePageCount: number;
  thinServicePaths: string[];
  locationPageCount: number;
  thinLocationPageCount: number;
  thinLocationPaths: string[];
  similarPagePairs: AuditSiteSimilarPagePair[];
}

export interface AuditSiteConversionSummary {
  keyPageCount: number;
  keyPagesWithConversionPath: number;
  keyPagesMissingConversionPath: string[];
  clickToCallOnHome: boolean;
  keyPagesMissingTel: string[];
  trustOnKeyPages: number;
}

export interface AuditSiteLocalSummary {
  contactPageFound: boolean;
  aboutPageFound: boolean;
  servicesIndexFound: boolean;
  locationPageCount: number;
  serviceAreaPageCount: number;
  mentionedServiceAreaCount: number;
  localBusinessLikely: boolean;
  inconsistentContact: boolean;
}

export interface AuditSiteIndexabilitySummary {
  importantNoindexPaths: string[];
  canonicalToHomePaths: string[];
  offsiteCanonicalPaths: string[];
  missingSelfCanonicalCount: number;
}

/**
 * Factual site-level intelligence produced by the bounded crawl.
 * Rules interpret this; reports render it. Optional on stored audits.
 */
export interface AuditSiteData {
  crawl: AuditSiteCrawlSummary;
  discoveredUrls: string[];
  skippedUrls: AuditSkippedUrl[];
  pages: AuditSitePageSnapshot[];
  metadata: AuditSiteMetadataSummary;
  headings: AuditSiteHeadingSummary;
  links: AuditSiteLinkSummary;
  content: AuditSiteContentSummary;
  conversion: AuditSiteConversionSummary;
  local: AuditSiteLocalSummary;
  indexability: AuditSiteIndexabilitySummary;
}

export const SITE_KEY_PAGE_TYPES: AuditSitePageType[] = [
  "home",
  "service",
  "services-index",
  "location",
  "service-area",
  "contact",
];

export const SITE_IMPORTANT_INDEXABLE_TYPES: AuditSitePageType[] = [
  "home",
  "service",
  "services-index",
  "location",
  "service-area",
  "contact",
];

export const SITE_PAGE_TYPE_LABELS: Record<AuditSitePageType, string> = {
  home: "Home",
  service: "Service",
  "services-index": "Services",
  location: "Location",
  "service-area": "Service area",
  contact: "Contact",
  about: "About",
  blog: "Blog",
  article: "Article",
  other: "Other",
};
