/**
 * GBP Audit Engine v0.2 — domain types.
 *
 * The audit engine consumes only this normalized model. It must never
 * import Google API response objects. A future adapter maps Google (or
 * other sources) into BusinessProfileData.
 *
 * Field presence convention:
 * - `null` = unknown / not observed by the adapter → rules return
 *   `insufficient_data` unless the rule is specifically about absence.
 * - `""`, `[]`, `0`, or `false` = known empty/absent → rules may fail
 *   or warn when that absence is what they evaluate.
 * - External blocks (`localSeoContext`) are omitted (`null`) when another
 *   JS Growth system has not supplied them.
 */

export const GBP_AUDIT_VERSION = "0.2" as const;

export const GBP_AUDIT_CATEGORIES = [
  "profile_optimization",
  "reviews_reputation",
  "activity_freshness",
  "local_seo",
  "trust_authority",
  "conversion_readiness",
] as const;

export type GbpAuditCategory = (typeof GBP_AUDIT_CATEGORIES)[number];

export const GBP_FINDING_STATUSES = [
  "pass",
  "warning",
  "fail",
  "not_applicable",
  "insufficient_data",
] as const;

export type GbpFindingStatus = (typeof GBP_FINDING_STATUSES)[number];

export const GBP_SEVERITIES = ["high", "medium", "low", "info"] as const;

export type GbpSeverity = (typeof GBP_SEVERITIES)[number];

export const GBP_LOCATION_TYPES = [
  "STOREFRONT",
  "SERVICE_AREA",
  "HYBRID",
] as const;

export type GbpLocationType = (typeof GBP_LOCATION_TYPES)[number];

export const GBP_DAYS_OF_WEEK = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
] as const;

export type GbpDayOfWeek = (typeof GBP_DAYS_OF_WEEK)[number];

export type GbpEvidence = Record<
  string,
  string | number | boolean | null
>;

export interface GbpRegularHoursDay {
  day: GbpDayOfWeek;
  openTime: string | null;
  closeTime: string | null;
  closed: boolean;
}

export interface GbpSpecialHoursDay {
  date: string;
  openTime: string | null;
  closeTime: string | null;
  closed: boolean;
}

export interface GbpServiceItem {
  name: string;
  description: string | null;
}

export interface GbpProductItem {
  name: string;
}

export interface GbpProfilePost {
  publishedAt: string;
  type: string | null;
}

export interface GbpProfileReview {
  rating: number;
  publishedAt: string | null;
  hasOwnerResponse: boolean;
  ownerResponseAt: string | null;
}

/**
 * Core identity fields typically present on a Google Business Profile.
 * Source: expected from GBP once an adapter exists.
 */
export interface BusinessProfileIdentity {
  /** GBP-expected */
  name: string;
  /** GBP-expected. `null` = unknown; `""` = no primary category set. */
  primaryCategory: string | null;
  /** GBP-expected. Empty array = none configured (known). */
  additionalCategories: string[];
  /** GBP-expected */
  description: string | null;
  /** GBP-expected */
  phone: string | null;
  /** GBP-expected */
  websiteUrl: string | null;
  /**
   * GBP-expected when the profile exposes a booking place-action.
   * `null` = unknown / not returned; `""` = none configured.
   */
  appointmentUrl: string | null;
}

/**
 * Location, hours, and opening-date configuration.
 * Source: expected from GBP (opening date may be absent).
 */
export interface BusinessProfileConfiguration {
  /** GBP-expected (derived from service-area + storefront fields). */
  locationType: GbpLocationType;
  /** GBP-expected. Empty = none configured. */
  serviceAreas: string[];
  /**
   * GBP-expected. Whether a customer-facing street address is published.
   * Service-area businesses often have this false; that is not a defect.
   */
  hasPublicAddress: boolean | null;
  /** GBP-expected. `null` = hours unknown; `[]` = explicitly no hours. */
  regularHours: GbpRegularHoursDay[] | null;
  /** GBP-expected, optional. Missing special hours is not a v0.1 failure. */
  specialHours: GbpSpecialHoursDay[] | null;
  /** GBP-expected when Google returns it. ISO date `YYYY-MM-DD`. */
  openingDate: string | null;
}

/**
 * Media inventory.
 * Photos/logo/cover are not always available from current GBP read APIs;
 * adapters should leave counts `null` until observed.
 */
export interface BusinessProfileMedia {
  /** GBP-expected when media APIs are wired. `null` = unknown. */
  photoCount: number | null;
  /** GBP-expected when media APIs are wired. */
  logoPresent: boolean | null;
  /** GBP-expected when media APIs are wired. */
  coverPhotoPresent: boolean | null;
  /** GBP-expected when owner vs customer split is available. */
  ownerUploadedPhotoCount: number | null;
  /** GBP-expected when the split is available. */
  customerUploadedPhotoCount: number | null;
  /** Derived or GBP-expected. */
  mostRecentOwnerPhotoAt: string | null;
  /** Derived or GBP-expected. */
  mostRecentPhotoAt: string | null;
}

/**
 * Posts / GBP updates.
 * Current JS Growth GBP read integration does not sync posts; leave unknown
 * until an adapter can populate them.
 */
export interface BusinessProfileActivity {
  /** GBP-expected when posts are synced. */
  posts: GbpProfilePost[];
  /**
   * GBP-expected or derived from `posts`.
   * `null` = unknown; `0` = known none.
   */
  postCount: number | null;
  /** Derived from `posts` when not supplied. */
  mostRecentPostAt: string | null;
}

export interface BusinessProfileReviews {
  /** GBP-expected aggregate. */
  averageRating: number | null;
  /** GBP-expected aggregate. `null` = unknown; `0` = no reviews. */
  totalCount: number | null;
  /**
   * GBP-expected when review list is available.
   * Empty with a positive `totalCount` means aggregates only.
   */
  reviews: GbpProfileReview[];
  /**
   * GBP-expected or derived from `reviews`.
   * `null` = unknown.
   */
  ownerResponseCount: number | null;
  /** Derived from `reviews` when not supplied. */
  mostRecentReviewAt: string | null;
}

/**
 * Conversion / place-action URLs.
 * Source: expected from GBP when the location has those features enabled.
 */
export interface BusinessProfileConversion {
  websiteUrl: string | null;
  phone: string | null;
  appointmentUrl: string | null;
  /** GBP-expected when messaging status is available. */
  messagingEnabled: boolean | null;
  orderingUrl: string | null;
  menuUrl: string | null;
  reservationUrl: string | null;
}

/**
 * Operator-supplied hints so conversion rules do not assume a business model.
 * Source: optional / external (not a Google ranking factor).
 */
export interface BusinessProfileModel {
  expectsAppointments: boolean | null;
  expectsOnlineOrdering: boolean | null;
  expectsReservations: boolean | null;
  expectsMenu: boolean | null;
}

/**
 * NAP / landing-page context from a website audit or operator input.
 * Source: external. Never invented from GBP alone.
 */
export interface BusinessProfileLocalSeoContext {
  websiteDomain: string | null;
  websiteName: string | null;
  websitePhone: string | null;
  websiteAddress: string | null;
  localLandingPageUrl: string | null;
  /** Operator or website-audit judgement; not a Google ranking claim. */
  localLandingPageRelevant: boolean | null;
}

export interface BusinessProfileData {
  /** ISO timestamp used as "now" for recency math (deterministic). */
  capturedAt: string;
  identity: BusinessProfileIdentity;
  configuration: BusinessProfileConfiguration;
  /** GBP-expected */
  services: GbpServiceItem[];
  /** GBP-expected when products are used */
  products: GbpProductItem[];
  /** GBP-expected when attributes are synced */
  attributes: string[];
  media: BusinessProfileMedia;
  activity: BusinessProfileActivity;
  reviews: BusinessProfileReviews;
  conversion: BusinessProfileConversion;
  businessModel: BusinessProfileModel;
  /** External. `null` when no website/NAP context was supplied. */
  localSeoContext: BusinessProfileLocalSeoContext | null;
}

export interface GbpAuditFinding {
  id: string;
  category: GbpAuditCategory;
  title: string;
  status: GbpFindingStatus;
  severity: GbpSeverity;
  score: number;
  maxScore: number;
  evidence: GbpEvidence;
  summary: string;
  whyItMatters: string;
  recommendation: string;
}

export interface GbpCategoryScore {
  category: GbpAuditCategory;
  label: string;
  score: number;
  applicable: boolean;
  weight: number;
  earnedPoints: number;
  possiblePoints: number;
  applicableRuleCount: number;
  notApplicableCount: number;
  insufficientDataCount: number;
}

export interface GbpRecommendation {
  ruleId: string;
  category: GbpAuditCategory;
  title: string;
  found: string;
  whyItMatters: string;
  whatToDo: string;
  severity: GbpSeverity;
  scoreImpact: number;
}

export interface GbpStrength {
  ruleId: string;
  category: GbpAuditCategory;
  title: string;
  summary: string;
}

export interface GbpFindingCounts {
  pass: number;
  warning: number;
  fail: number;
  not_applicable: number;
  insufficient_data: number;
}

export interface GbpAuditMetadata {
  version: typeof GBP_AUDIT_VERSION;
  profileName: string;
  locationType: GbpLocationType;
  isNewBusiness: boolean;
  asOf: string;
  applicableRuleCount: number;
  findingCounts: GbpFindingCounts;
}

export const GBP_CONFIDENCE_LEVELS = ["high", "medium", "low"] as const;

export type GbpConfidenceLevel = (typeof GBP_CONFIDENCE_LEVELS)[number];

export interface GbpAuditConfidence {
  level: GbpConfidenceLevel;
  coveragePercent: number;
  evaluatedRules: number;
  insufficientDataRules: number;
  applicableRules: number;
}

export const GBP_PROFILE_MATURITY_LEVELS = [
  "new",
  "developing",
  "established",
  "mature",
  "unknown",
] as const;

export type GbpProfileMaturityLevel =
  (typeof GBP_PROFILE_MATURITY_LEVELS)[number];

export interface GbpProfileMaturity {
  level: GbpProfileMaturityLevel;
  evidence: string[];
}

export interface GbpAuditResult {
  overallScore: number;
  /** Same as `gradeOrLabel`; preferred name for consumers. */
  scoreLabel: string;
  gradeOrLabel: string;
  scoreBandId: string;
  confidence: GbpAuditConfidence;
  maturity: GbpProfileMaturity;
  categoryScores: GbpCategoryScore[];
  findings: GbpAuditFinding[];
  priorities: GbpRecommendation[];
  strengths: GbpStrength[];
  metadata: GbpAuditMetadata;
}

export interface GbpRuleContext {
  profile: BusinessProfileData;
  asOf: string;
  isNewBusiness: boolean;
}

export interface GbpAuditRule {
  id: string;
  category: GbpAuditCategory;
  title: string;
  evaluate: (context: GbpRuleContext) => GbpAuditFinding;
}
