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

export interface AuditPageData {
  title: string | null;
  metaDescription: string | null;
  canonicalUrl: string | null;
  viewport: string | null;

  h1Count: number;
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