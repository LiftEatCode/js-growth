export type ReportMode =
  | "public"
  | "consultation"
  | "client";

export type ReportTier =
  | "free"
  | "professional";

export type AuditStatus =
  | "pass"
  | "warning"
  | "fail";

export type AuditCategory =
  | "technical"
  | "seo"
  | "content"
  | "cro"
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
    | "cro"
    | "technical"
    | "local"
    | "performance";

  icon:
    | "search"
    | "map"
    | "speed"
    | "content"
    | "conversion"
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

  /**
   * Prefix rules from `User-agent: *` groups.
   * Used by the bounded site crawl. Older stored audits omit this.
   */
  wildcardRules?: Array<{
    type: "allow" | "disallow";
    path: string;
  }>;

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

export type AuditCtaElementType = "link" | "button" | "submit";

export type AuditCtaType =
  | "phone"
  | "email"
  | "contact"
  | "quote"
  | "estimate"
  | "booking"
  | "consultation"
  | "service"
  | "generic-conversion";

export type AuditCtaLocation =
  | "header"
  | "navigation"
  | "main"
  | "footer"
  | "other";

export interface AuditCta {
  text: string;

  elementType: AuditCtaElementType;

  href: string | null;

  type: AuditCtaType;

  location: AuditCtaLocation;

  isInternal: boolean | null;
}

export interface AuditCtaData {
  count: number;

  uniqueTypes: AuditCtaType[];

  phoneCtaCount: number;

  contactCtaCount: number;

  quoteCtaCount: number;

  bookingCtaCount: number;

  details: AuditCta[];

  detailsTruncated: boolean;
}

export type AuditFormPurposeGuess =
  | "lead"
  | "search"
  | "login"
  | "newsletter"
  | "job"
  | "checkout"
  | "other";

export interface AuditFormDetail {
  purposeGuess: AuditFormPurposeGuess;

  fieldCount: number;

  hasSubmitControl: boolean;

  location: AuditCtaLocation;
}

export interface AuditFormData {
  totalForms: number;

  contactLikeForms: number;

  formsWithSubmitControl: number;

  formsWithoutSubmitControl: number;

  totalInputFields: number;

  maxFieldsInSingleForm: number;

  likelyLeadFormCount: number;

  maxLeadFormFields: number;

  details: AuditFormDetail[];

  detailsTruncated: boolean;
}

export interface AuditPhoneConversionData {
  visiblePhonePresent: boolean;

  visiblePhoneCount: number;

  telLinkCount: number;

  phoneCtaCount: number;
}

export interface AuditEmailConversionData {
  visibleEmailPresent: boolean;

  mailtoLinkCount: number;
}

export type AuditTrustCategory =
  | "testimonials"
  | "reviews"
  | "guarantee"
  | "warranty"
  | "certification"
  | "license"
  | "insured"
  | "experience"
  | "about"
  | "team"
  | "case-study"
  | "portfolio";

export interface AuditTrustData {
  testimonialSignals: number;
  reviewSignals: number;

  guaranteeSignals: number;
  warrantySignals: number;

  certificationSignals: number;
  licenseSignals: number;
  insuredSignals: number;

  experienceSignals: number;

  aboutSignals: number;
  teamSignals: number;

  caseStudySignals: number;
  portfolioSignals: number;

  trustCategoryCount: number;
  presentCategories: AuditTrustCategory[];

  evidence: string[];
  detailsTruncated: boolean;
}

export type AuditConversionIntentType =
  | "contact"
  | "quote"
  | "estimate"
  | "booking"
  | "consultation"
  | "service";

export interface AuditConversionIntentData {
  types: AuditConversionIntentType[];

  phraseCount: number;

  evidence: string[];

  detailsTruncated: boolean;
}

export interface AuditOfferClarityData {
  hasMeaningfulTitle: boolean;

  hasMeaningfulH1: boolean;

  titleH1Aligned: boolean | null;

  hasSubstantialContent: boolean;

  hasConversionIntent: boolean;
}

export interface AuditConversionPathData {
  hasClickToCall: boolean;

  hasLeadForm: boolean;

  hasMailto: boolean;

  hasQuoteCta: boolean;

  hasBookingCta: boolean;

  hasConsultationCta: boolean;

  hasContactCta: boolean;

  pathTypes: string[];

  locations: AuditCtaLocation[];
}

export interface AuditConversionData {
  ctas: AuditCtaData;

  forms: AuditFormData;

  phone: AuditPhoneConversionData;

  email: AuditEmailConversionData;

  trust: AuditTrustData;

  intent: AuditConversionIntentData;

  offerClarity: AuditOfferClarityData;

  path: AuditConversionPathData;
}

export type AuditLocalSignalSource =
  | "visible-text"
  | "heading"
  | "title"
  | "schema"
  | "link";

export interface AuditLocalitySignal {
  value: string;

  source: AuditLocalSignalSource;
}

export interface AuditNapData {
  hasBusinessNameSignal: boolean;

  hasAddressSignal: boolean;

  hasPhoneSignal: boolean;

  completenessCount: number;

  schemaNamePresent: boolean;
  schemaAddressPresent: boolean;
  schemaPhonePresent: boolean;

  addressEvidenceCount: number;
  addressEvidence: string[];
  detailsTruncated: boolean;
}

export interface AuditLocationSignals {
  items: AuditLocalitySignal[];

  uniqueValues: string[];

  detailsTruncated: boolean;
}

export interface AuditHoursData {
  hasHoursSignal: boolean;

  hasSchemaHours: boolean;

  visibleHoursSignal: boolean;

  hasTwentyFourSevenSignal: boolean;
}

export interface AuditLocalSchemaData {
  hasLocalBusinessSchema: boolean;

  detectedTypes: string[];

  hasName: boolean;
  hasTelephone: boolean;
  hasAddress: boolean;

  hasPostalCode: boolean;
  hasAddressLocality: boolean;
  hasAddressRegion: boolean;

  hasOpeningHours: boolean;

  hasGeo: boolean;

  hasUrl: boolean;

  hasSameAs: boolean;

  hasAggregateRating: boolean;

  hasAreaServed: boolean;

  completenessCount: number;
}

export interface AuditServiceAreaData {
  hasServiceAreaLanguage: boolean;

  hasSchemaAreaServed: boolean;

  mentionedLocations: string[];

  evidenceCount: number;

  evidence: string[];

  detailsTruncated: boolean;
}

export interface AuditDirectionsData {
  hasDirectionsLink: boolean;

  hasMapLink: boolean;

  hasEmbeddedMap: boolean;
}

export interface AuditLocalIntentData {
  locationInTitle: boolean;

  locationInH1: boolean;

  locationInHeadings: boolean;

  locationInMainContent: boolean;

  serviceAreaLanguagePresent: boolean;

  geographicSignalCount: number;
}

export interface AuditLocationPageData {
  likelyLocationPage: boolean;

  locationPathSignal: boolean;

  locationHeadingSignal: boolean;
}

export interface AuditLocalReputationData {
  hasReviewSignal: boolean;

  hasAggregateRatingSchema: boolean;

  hasTestimonialSignal: boolean;
}

export interface AuditLocalBusinessLikelihood {
  likelyLocalBusiness: boolean;

  evidenceCount: number;

  evidence: string[];
}

export type AuditLocalPageType =
  | "local-business-homepage"
  | "location-page"
  | "service-area-page"
  | "other";

export interface AuditLocalData {
  nap: AuditNapData;

  location: AuditLocationSignals;

  hours: AuditHoursData;

  schema: AuditLocalSchemaData;

  serviceArea: AuditServiceAreaData;

  directions: AuditDirectionsData;

  localIntent: AuditLocalIntentData;

  locationPage: AuditLocationPageData;

  reputation: AuditLocalReputationData;

  likelihood: AuditLocalBusinessLikelihood;

  pageType: AuditLocalPageType;
}

export type AuditPerformanceRiskLevel = "low" | "moderate" | "high";

export type AuditResourceOriginKind =
  | "same-origin"
  | "related-host"
  | "external";

export type AuditImageFormat =
  | "avif"
  | "webp"
  | "jpeg"
  | "png"
  | "gif"
  | "svg"
  | "other";

export type AuditKnownEmbedKind =
  | "google-maps"
  | "youtube"
  | "vimeo"
  | "other";

export type AuditKnownScriptKind =
  | "google-analytics"
  | "google-tag-manager"
  | "meta"
  | "hotjar"
  | "hubspot"
  | "intercom"
  | "google-fonts"
  | "advertising"
  | "chat"
  | "other";

export interface AuditPerformanceDocumentContext {
  advertisedContentLength: number | null;
  contentEncoding: string | null;
  cacheControl: string | null;
  expires: string | null;
  etag: string | null;
  lastModified: string | null;
  documentFetchDurationMs: number | null;
}

export interface AuditPerformanceScriptSummary {
  total: number;
  external: number;
  inline: number;
  async: number;
  defer: number;
  module: number;
  jsonLd: number;
  blockingHeadCandidates: number;
  duplicateExternalSources: number;
  inlineBytes: number;
  thirdPartyScriptCount: number;
  thirdPartyScriptOriginCount: number;
  thirdPartyScriptOrigins: string[];
  knownScriptKinds: AuditKnownScriptKind[];
  truncated: boolean;
}

export interface AuditPerformanceStylesheetSummary {
  total: number;
  external: number;
  inlineStyleTags: number;
  blockingCandidates: number;
  duplicateExternalSources: number;
  inlineBytes: number;
  truncated: boolean;
}

export interface AuditPerformanceImageSummary {
  total: number;
  lazy: number;
  eager: number;
  unspecifiedLoading: number;
  missingDimensions: number;
  modernRaster: number;
  legacyRaster: number;
  svg: number;
  truncated: boolean;
}

export interface AuditPerformanceIframeSummary {
  total: number;
  uniqueOrigins: number;
  youtube: number;
  maps: number;
  vimeo: number;
  exampleOrigins: string[];
  truncated: boolean;
}

export interface AuditPerformanceVideoSummary {
  total: number;
  autoplay: number;
  preloadAuto: number;
  preloadNone: number;
  withPoster: number;
  truncated: boolean;
}

export interface AuditPerformanceHintSummary {
  preconnectOrigins: string[];
  dnsPrefetchOrigins: string[];
  preloadCount: number;
  preloadFontCount: number;
  preloadImageCount: number;
  preloadStyleCount: number;
  preloadScriptCount: number;
  modulepreloadCount: number;
  truncated: boolean;
}

export interface AuditPerformanceFontSummary {
  googleFontsStylesheet: boolean;
  fileCount: number;
  woff2Count: number;
  legacyFormatCount: number;
  preloadFontCount: number;
  truncated: boolean;
}

export interface AuditPerformanceOriginSummary {
  uniqueExternalOriginCount: number;
  uniqueExternalOrigins: string[];
  referencedResourceCount: number;
}

/**
 * Static performance intelligence from the fetched HTML document.
 * This is not a Lighthouse / Core Web Vitals measurement.
 * Older stored audits omit this object.
 */
export interface AuditPerformanceData {
  htmlBytes: number;
  htmlByteSource: "utf8-body";
  advertisedContentLength: number | null;
  compressed: boolean | null;
  contentEncoding: string | null;
  cacheControl: string | null;
  documentFetchDurationMs: number | null;
  optimizationRisk: AuditPerformanceRiskLevel;
  scripts: AuditPerformanceScriptSummary;
  stylesheets: AuditPerformanceStylesheetSummary;
  images: AuditPerformanceImageSummary;
  iframes: AuditPerformanceIframeSummary;
  videos: AuditPerformanceVideoSummary;
  hints: AuditPerformanceHintSummary;
  fonts: AuditPerformanceFontSummary;
  origins: AuditPerformanceOriginSummary;
  truncated: boolean;
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
   * Content-intelligence and conversion measurements.
   * Older stored audits omit these.
   */
  content?: AuditContentData;
  headings?: AuditHeadingData;
  links?: AuditLinkData;
  images?: AuditImageData;
  conversion?: AuditConversionData;
  local?: AuditLocalData;
  performance?: AuditPerformanceData;

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

  /**
   * Bounded multi-page site intelligence.
   * Older stored audits omit this field and must still render.
   */
  siteData?: import("./site/types").AuditSiteData;

  /**
   * Optional Competitive Intelligence V1 snapshot.
   * Older stored audits omit this field and must still render.
   * Competitive findings do not change the Website Growth Score.
   */
  competitiveData?: import("./competitive/types").CompetitiveData;

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