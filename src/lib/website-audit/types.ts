export type AuditStatus = "pass" | "warning" | "fail";

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
      | "ANALYSIS_FAILED";
    message: string;
  };
}

export type WebsiteAuditResponse =
  | WebsiteAuditResult
  | WebsiteAuditError;