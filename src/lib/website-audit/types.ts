export type ReportMode =
  | "public"
  | "consultation"
  | "client";

export type AuditStatus =
  | "pass"
  | "warning"
  | "fail";

export type AuditCategory =
  | "technical"
  | "seo"
  | "content"
  | "accessibility"
  | "local"
  | "performance";

export type AuditPriority =
  | "low"
  | "medium"
  | "high"
  | "critical";

export type BusinessImpact =
  | "low"
  | "medium"
  | "high";

export type FixDifficulty =
  | "easy"
  | "medium"
  | "hard";

export type OpportunityLevel =
  | "low"
  | "medium"
  | "high"
  | "very-high";

export type OpportunityConfidence =
  | "low"
  | "medium"
  | "high";

export interface OpportunityInsight {
  id: string;
  title: string;
  description: string;
  businessValue: string;

  priority:
    | "high"
    | "medium"
    | "low";

  category:
    | "seo"
    | "content"
    | "technical"
    | "local"
    | "performance";

  icon:
    | "search"
    | "map"
    | "speed"
    | "content"
    | "technical";
}

export interface AuditOpportunity {
  score: number;

  level: OpportunityLevel;

  trafficGainPercent: {
    minimum: number;
    maximum: number;
  };

  monthlyLeadGain: {
    minimum: number;
    maximum: number;
  };

  monthlyRevenueOpportunity: {
    minimum: number;
    maximum: number;
  };

  estimatedFixMinutes: number;

  confidence: OpportunityConfidence;

  assumptions: string[];

  insights: OpportunityInsight[];
}

export interface AuditFinding {
  id: string;
  title: string;
  description: string;
  recommendation?: string;

  status: AuditStatus;
  category: AuditCategory;
  scoreImpact: number;

  priority: AuditPriority;
  businessImpact: BusinessImpact;
  difficulty: FixDifficulty;

  estimatedFixMinutes: number;

  quickWin: boolean;
}

export interface AuditCategoryScore {
  category: AuditCategory;
  label: string;
  score: number;
  maxScore: number;
}

export interface AuditPageMetadata {
  requestedUrl: string;
  finalUrl: string;
  statusCode: number;
  contentType: string | null;
  fetchedAt: string;
}

export interface AuditRobotsDirectiveData {
  raw: string | null;

  directives: string[];

  noindex: boolean;

  nofollow: boolean;

  none: boolean;

  noarchive: boolean;

  nosnippet: boolean;

  maxSnippet: string | null;

  maxImagePreview: string | null;

  maxVideoPreview: string | null;
}

export interface AuditRobotsEffectiveData {
  noindex: boolean;

  nofollow: boolean;

  noarchive: boolean;

  nosnippet: boolean;
}

/**
 * Combined HTML meta robots + HTTP X-Robots-Tag data.
 *
 * Newly generated audits use this nested shape.
 * Older stored audits may still contain the previous flat
 * `AuditRobotsDirectiveData` object under `pageData.robots`.
 */
export interface AuditRobotsData {
  meta: AuditRobotsDirectiveData;

  header: AuditRobotsDirectiveData;

  effective: AuditRobotsEffectiveData;
}

export interface AuditRobotsTxtData {
  url: string;

  found: boolean;

  accessible: boolean;

  statusCode: number | null;

  contentType: string | null;

  sitemapUrls: string[];

  blocksAuditedPage: boolean;

  fetchError: string | null;
}

export interface AuditSitemapCheck {
  url: string;

  source: "robots.txt" | "conventional";

  found: boolean;

  accessible: boolean;

  statusCode: number | null;

  contentType: string | null;

  fetchError: string | null;
}

export interface AuditSiteDiscoveryData {
  robotsTxt: AuditRobotsTxtData;

  sitemaps: AuditSitemapCheck[];

  hasSitemap: boolean;

  hasAccessibleSitemap: boolean;
}

export interface AuditTitleData {
  value: string | null;

  count: number;

  length: number;

  isEmpty: boolean;
}

export interface AuditMetaDescriptionData {
  value: string | null;

  count: number;

  length: number;

  isEmpty: boolean;
}

export interface AuditContentData {
  totalVisibleWordCount: number;

  mainContentWordCount: number;

  paragraphCount: number;

  nonEmptyParagraphCount: number;

  substantialParagraphCount: number;

  usedMainElement: boolean;
}

export type AuditHeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

export interface AuditHeadingItem {
  level: AuditHeadingLevel;

  text: string;

  empty: boolean;
}

export interface AuditHeadingData {
  items: AuditHeadingItem[];

  h1Count: number;
  h2Count: number;
  h3Count: number;
  h4Count: number;
  h5Count: number;
  h6Count: number;

  h1Values: string[];

  emptyHeadingCount: number;
  skippedLevelCount: number;

  detailsTruncated: boolean;
}

export interface AuditInternalLink {
  href: string;

  resolvedUrl: string | null;

  anchorText: string;

  isSamePage: boolean;

  hasText: boolean;

  hasImage: boolean;

  imageAltText: string | null;
}

export interface AuditLinkData {
  totalLinks: number;

  internalLinks: AuditInternalLink[];

  internalLinkCount: number;

  uniqueInternalDestinationCount: number;

  genericAnchorCount: number;

  emptyAnchorCount: number;

  samePageLinkCount: number;

  detailsTruncated: boolean;
}

export interface AuditImageData {
  total: number;

  withAlt: number;

  missingAltAttribute: number;

  emptyAlt: number;

  meaningfulAlt: number;

  suspiciousAlt: number;
}

export interface AuditCanonicalData {
  rawValues: string[];

  count: number;

  value: string | null;

  resolvedUrl: string | null;

  valid: boolean;

  selfReferencing: boolean;

  sameOrigin: boolean;

  protocolMatches: boolean;
}

export interface AuditPageData {
  /**
   * Newly generated audits use structured title/description/canonical
   * objects. Older stored audits may still have string `title`,
   * `metaDescription`, and `canonicalUrl` fields and omit `h1Values`.
   */
  title: AuditTitleData;
  metaDescription: AuditMetaDescriptionData;
  canonical: AuditCanonicalData;
  viewport: string | null;

  robots: AuditRobotsData;

  /**
   * Content-intelligence measurements. Older stored audits omit these.
   */
  content?: AuditContentData;
  headings?: AuditHeadingData;
  links?: AuditLinkData;
  images?: AuditImageData;

  h1Count: number;
  h1Values: string[];
  h2Count: number;
  h3Count: number;

  imageCount: number;
  imagesWithoutAlt: number;

  internalLinkCount: number;
  externalLinkCount: number;

  hasOpenGraphTitle: boolean;
  hasOpenGraphDescription: boolean;
  hasOpenGraphImage: boolean;

  hasStructuredData: boolean;
  structuredDataTypes: string[];

  hasPhoneNumber: boolean;
  hasEmailAddress: boolean;
  hasPhysicalAddressSignals: boolean;
  hasLocalBusinessSignals: boolean;
}

/**
 * Pure audit data.
 *
 * This is what gets stored inside AuditReport.
 * It intentionally does NOT include the saved report ID.
 */
export interface WebsiteAuditResult {
  success: true;

  metadata: AuditPageMetadata;

  pageData: AuditPageData;

  /**
   * Site-level robots.txt and sitemap discovery.
   * Older stored audits may omit this field.
   */
  siteDiscovery?: AuditSiteDiscoveryData;

  findings: AuditFinding[];

  categoryScores: AuditCategoryScore[];

  overallScore: number;

  summary: {
    passed: number;
    warnings: number;
    failed: number;

    criticalIssues: number;
    quickWins: number;
    highImpactFindings: number;
    estimatedFixMinutes: number;
  };

  opportunity: AuditOpportunity;
}

/**
 * Response returned to the browser after an audit has
 * successfully been created and saved.
 */
export interface WebsiteAuditSuccessResponse
  extends WebsiteAuditResult {
  reportId: string;
}

export interface WebsiteAuditError {
  success: false;

  error: {
    code:
      | "INVALID_URL"
      | "UNSUPPORTED_PROTOCOL"
      | "PRIVATE_NETWORK"
      | "FETCH_FAILED"
      | "INVALID_CONTENT_TYPE"
      | "RESPONSE_TOO_LARGE"
      | "ANALYSIS_FAILED"
      | "REPORT_SAVE_FAILED";

    message: string;
  };
}

export type WebsiteAuditResponse =
  | WebsiteAuditSuccessResponse
  | WebsiteAuditError;