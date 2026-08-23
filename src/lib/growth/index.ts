export {
  GROWTH_EVENT_VERSION,
  GROWTH_EVENTS,
  GROWTH_EVENT_NAMES,
  GROWTH_KEY_EVENT_CANDIDATES,
  GROWTH_CTA_PLACEMENTS,
  GROWTH_CTA_KINDS,
  isGrowthEventName,
  isAllowedGrowthEventParamKey,
  sanitizeGrowthEventParams,
  trackGrowthEvent,
  type GrowthEventName,
  type GrowthEventParams,
  type GrowthCtaPlacement,
  type GrowthCtaKind,
} from "./events";

export {
  ATTRIBUTION_VERSION,
  UTM_STANDARD_VERSION,
  UTM_SOURCES,
  UTM_MEDIUMS,
  UTM_PARAM_KEYS,
  FACEBOOK_PAGE_UTM,
  FACEBOOK_FOUNDER_UTM,
  GBP_UTM,
  normalizeUtmValue,
  isValidUtmValue,
  isKnownUtmSource,
  isKnownUtmMedium,
  buildUtmUrl,
  type UtmSource,
  type UtmMedium,
  type UtmBuilderInput,
  type UtmBuilderResult,
} from "./utm";

export {
  FIRST_PARTY_ATTRIBUTION_VERSION,
  ATTRIBUTION_STORAGE_KEY,
  parseCampaignAttribution,
  parseCampaignAttributionFromSearchParams,
  parseCampaignAttributionFromUnknown,
  parseCampaignAttributionFromFormData,
  captureCampaignAttributionInBrowser,
  readCampaignAttributionFromBrowser,
  serializeCampaignAttributionForForm,
  type CampaignAttribution,
  type CampaignAttributionInput,
} from "./attribution";

export {
  QUALIFIED_TRAFFIC_VERSION,
  QUALIFIED_TRAFFIC_INDICATORS,
  describeQualifiedTraffic,
} from "./qualified-traffic";

export {
  KPI_HIERARCHY_VERSION,
  KPI_HIERARCHY,
  type KpiLevel,
} from "./kpi-hierarchy";

export {
  GROWTH_SNAPSHOT_SOURCES,
  validateGrowthSnapshotMetrics,
  snapshotMetricIsExplicitlyUnavailable,
  ga4SnapshotMetricsSchema,
  searchConsoleSnapshotMetricsSchema,
  facebookSnapshotMetricsSchema,
  internalSnapshotMetricsSchema,
  type GrowthSnapshotSource,
  type Ga4SnapshotMetrics,
  type SearchConsoleSnapshotMetrics,
  type FacebookSnapshotMetrics,
  type InternalSnapshotMetrics,
} from "./snapshot";

export {
  GROWTH_BASELINE_VERSION,
  GROWTH_BASELINE_LABEL,
  GROWTH_BASELINE_DATE,
  GROWTH_BASELINE_PERIOD,
  DATA_STATUS,
  GA4_PRODUCTION_MEASUREMENT_ID,
  GROWTH_BASELINE_V1,
  buildGrowthBaselineV1SnapshotPayloads,
  isInsufficientData,
  isNotCaptured,
  type GrowthBaselineV1,
  type DataStatus,
} from "./baseline-v1";

export {
  AUDIT_FUNNEL_VERSION,
  AUDIT_FUNNEL_STEPS,
  FUNNEL_STORAGE_KEY,
  REPORT_CONTEXTS,
  CTA_LOCATIONS,
  CTA_TYPES,
  recordFunnelMilestone,
  readAuditFunnelContext,
  serializeAuditFunnelContextForForm,
  parseAuditFunnelContextFromUnknown,
  parseAuditFunnelContextFromFormData,
  mergeAttributionWithFunnelContext,
  hasFunnelEventFired,
  trackAuditFunnelEvent,
  trackGa4GenerateLead,
  isAuditFunnelStep,
  type AuditFunnelStep,
  type AuditFunnelMilestone,
  type ReportContext,
  type CtaLocation,
  type CtaType,
} from "./audit-funnel";
