import type {
  AuditPerformanceRiskLevel,
  BusinessImpact,
} from "../types";

export type CompetitiveComparisonStatus =
  | "compared"
  | "partial"
  | "unavailable";

export type CompetitiveCompetitorStatus =
  | "analyzed"
  | "failed"
  | "skipped"
  | "duplicate"
  | "blocked"
  | "timeout";

export type CompetitiveSkipReason =
  | "invalid-url"
  | "blocked"
  | "same-site-as-customer"
  | "duplicate"
  | "fetch-failed"
  | "timeout"
  | "time-budget"
  | "redirect-duplicate";

export type CompetitiveMetric =
  | "service_pages"
  | "location_pages"
  | "service_content_depth"
  | "thin_commercial_rate"
  | "unique_titles"
  | "unique_descriptions"
  | "unique_h1s"
  | "internal_link_support"
  | "cta_coverage"
  | "click_to_call_coverage"
  | "trust_coverage"
  | "local_relevance"
  | "schema_presence"
  | "indexability_issues"
  | "broken_internal_links"
  | "performance_risk";

export type CompetitiveGapDirection = "ahead" | "behind" | "similar";

export type CompetitiveGapMagnitude = "small" | "moderate" | "large";

export type CompetitiveMetricUnit = "count" | "percent" | "words" | "risk";

export type CompetitiveFindingFamily =
  | "COMP_SERVICE_COVERAGE_GAP"
  | "COMP_LOCATION_COVERAGE_GAP"
  | "COMP_CONTENT_DEPTH_GAP"
  | "COMP_THIN_CONTENT_GAP"
  | "COMP_METADATA_GAP"
  | "COMP_INTERNAL_LINKING_GAP"
  | "COMP_CONVERSION_GAP"
  | "COMP_TRUST_GAP"
  | "COMP_LOCAL_RELEVANCE_GAP"
  | "COMP_SCHEMA_GAP"
  | "COMP_TECHNICAL_GAP"
  | "COMP_PERFORMANCE_RISK_GAP";

export interface CompetitorInput {
  submittedUrl: string;
}

export interface CompetitiveSkip {
  submittedUrl: string;
  reason: CompetitiveSkipReason;
  message: string;
}

export interface CompetitivePageCounts {
  total: number;
  service: number;
  serviceIndex: number;
  location: number;
  contact: number;
  about: number;
  blog: number;
  other: number;
}

export interface CompetitiveSiteProfile {
  status: CompetitiveCompetitorStatus;
  submittedUrl: string;
  finalUrl: string | null;
  hostname: string;
  displayName: string;
  crawl: {
    discoveredCount: number;
    scannedCount: number;
    failedCount: number;
    truncated: boolean;
  };
  pages: CompetitivePageCounts;
  search: {
    uniqueTitlePercent: number | null;
    uniqueDescriptionPercent: number | null;
    uniqueH1Percent: number | null;
    indexabilityIssuePercent: number | null;
  };
  content: {
    medianServiceWordCount: number | null;
    thinCommercialPercent: number | null;
    similarCommercialPairCount: number;
  };
  conversion: {
    keyPageCount: number;
    ctaCoveragePercent: number | null;
    clickToCallCoveragePercent: number | null;
    formOrContactPathPercent: number | null;
  };
  local: {
    substantiveLocationPages: number;
    localRelevancePercent: number | null;
    contactPageFound: boolean;
    localSchemaPresent: boolean;
    inconsistentContact: boolean;
  };
  technical: {
    weaklyLinkedServicePercent: number | null;
    verifiedBrokenLinkCount: number;
    brokenLinkRatePercent: number | null;
    usefulSchemaFamilyCount: number;
  };
  performance: {
    optimizationRisk: AuditPerformanceRiskLevel | null;
    blockingScriptCandidates: number | null;
    uniqueExternalOriginCount: number | null;
    htmlBytes: number | null;
  };
  trust: {
    keyPageTrustPercent: number | null;
    aboutPageFound: boolean;
  };
}

export interface CompetitiveGap {
  metric: CompetitiveMetric;
  unit: CompetitiveMetricUnit;
  customerValue: number;
  competitorValues: number[];
  benchmarkValue: number;
  gapDirection: CompetitiveGapDirection;
  magnitude: CompetitiveGapMagnitude;
  higherIsBetter: boolean;
  sampleNote: string;
}

export interface CompetitiveFindingView {
  id: CompetitiveFindingFamily;
  metric: CompetitiveMetric;
  direction: CompetitiveGapDirection;
  magnitude: CompetitiveGapMagnitude;
  priority: "high" | "medium" | "low";
  businessImpact: BusinessImpact;
  title: string;
  description: string;
  recommendation: string;
  customerValue: number;
  benchmarkValue: number;
  competitorValues: number[];
  unit: CompetitiveMetricUnit;
}

export interface CompetitiveOpportunity {
  id: string;
  metric: CompetitiveMetric;
  title: string;
  description: string;
  magnitude: CompetitiveGapMagnitude;
  businessImpact: BusinessImpact;
  priority: "high" | "medium" | "low";
  effort: "easy" | "medium" | "hard";
}

export interface CompetitiveData {
  status: CompetitiveComparisonStatus;
  submittedCount: number;
  suppliedCount: number;
  analyzedCount: number;
  customer: CompetitiveSiteProfile;
  competitors: CompetitiveSiteProfile[];
  skipped: CompetitiveSkip[];
  gaps: CompetitiveGap[];
  findings: CompetitiveFindingView[];
  strengths: CompetitiveFindingView[];
  opportunities: CompetitiveOpportunity[];
  disclosure: string;
  runtimeMs: number;
}
