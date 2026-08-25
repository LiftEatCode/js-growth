/**
 * Growth Sprint 1 — GrowthSnapshot metrics validation.
 *
 * Snapshots are immutable historical baselines. Validate JSON shape;
 * do not create a generic analytics dump.
 *
 * Status semantics (optional fields):
 * - AVAILABLE — metric was captured
 * - INSUFFICIENT_DATA — source could not expose the breakdown (≠ zero)
 * - NOT_CAPTURED — value was not recorded; do not invent or estimate
 */

import { z } from "zod";

export const GROWTH_SNAPSHOT_SOURCES = [
  "GA4",
  "SEARCH_CONSOLE",
  "FACEBOOK",
  "INTERNAL",
  "GOOGLE_BUSINESS_PROFILE",
] as const;

export type GrowthSnapshotSource = (typeof GROWTH_SNAPSHOT_SOURCES)[number];

const optionalNonNegInt = z.number().int().nonnegative().optional();
const optionalNonNegNumber = z.number().nonnegative().optional();
/** Change rates may be negative (e.g. visits −78.6%). */
const optionalNumber = z.number().optional();

const dataStatusSchema = z.enum([
  "AVAILABLE",
  "INSUFFICIENT_DATA",
  "NOT_CAPTURED",
  "NOT_APPLICABLE",
]);

const baselineMetaSchema = {
  baselineVersion: z.number().int().positive().optional(),
  baselineLabel: z.string().max(120).optional(),
};

export const ga4SnapshotMetricsSchema = z
  .object({
    ...baselineMetaSchema,
    users: optionalNonNegInt,
    newUsers: optionalNonNegInt,
    sessions: optionalNonNegInt,
    engagedSessions: optionalNonNegInt,
    engagementRate: optionalNonNegNumber,
    organicSearchSessions: optionalNonNegInt,
    organicSocialSessions: optionalNonNegInt,
    referralSessions: optionalNonNegInt,
    directSessions: optionalNonNegInt,
    auditStarts: optionalNonNegInt,
    auditSubmissions: optionalNonNegInt,
    contactSubmissions: optionalNonNegInt,
    instrumentationStatus: z
      .enum(["VERIFIED_WORKING", "UNVERIFIED", "UNKNOWN"])
      .optional(),
    historicalTrafficTotalsStatus: dataStatusSchema.optional(),
    keyEventCandidates: z.array(z.string().max(80)).max(20).optional(),
    notes: z.string().max(2000).optional(),
  })
  .strict();

export const searchConsoleSnapshotMetricsSchema = z
  .object({
    ...baselineMetaSchema,
    clicks: optionalNonNegInt,
    impressions: optionalNonNegInt,
    averageCtr: optionalNonNegNumber,
    averagePosition: optionalNonNegNumber,
    topQueries: z
      .array(
        z
          .object({
            query: z.string().max(200),
            clicks: optionalNonNegInt,
            impressions: optionalNonNegInt,
          })
          .strict(),
      )
      .max(50)
      .optional(),
    topPages: z
      .array(
        z
          .object({
            page: z.string().max(500),
            clicks: optionalNonNegInt,
            impressions: optionalNonNegInt,
          })
          .strict(),
      )
      .max(50)
      .optional(),
    brandClicks: optionalNonNegInt,
    nonBrandClicks: optionalNonNegInt,
    localIntentClicks: optionalNonNegInt,
    serviceIntentClicks: optionalNonNegInt,
    auditToolIntentClicks: optionalNonNegInt,
    queryDataStatus: dataStatusSchema.optional(),
    propertyVerification: z.enum(["VERIFIED", "UNVERIFIED"]).optional(),
    notes: z.string().max(2000).optional(),
  })
  .strict();

export const facebookSnapshotMetricsSchema = z
  .object({
    ...baselineMetaSchema,
    property: z.enum(["js_solutions_page", "founder_personal"]),
    followers: optionalNonNegInt,
    reach: optionalNonNegInt,
    contentViews: optionalNonNegInt,
    impressions: optionalNonNegInt,
    engagement: optionalNonNegInt,
    linkClicks: optionalNonNegInt,
    pageVisits: optionalNonNegInt,
    followerChangePercent: optionalNumber,
    visitChangePercent: optionalNumber,
    engagementChangePercent: optionalNumber,
    nonFollowerViewPercent: optionalNonNegNumber,
    followerViewPercent: optionalNonNegNumber,
    photoViewPercent: optionalNonNegNumber,
    textViewPercent: optionalNonNegNumber,
    linkViewPercent: optionalNonNegNumber,
    reelViewPercent: optionalNonNegNumber,
    videoViewPercent: optionalNonNegNumber,
    engagementNonFollowerPercent: optionalNonNegNumber,
    engagementFollowerPercent: optionalNonNegNumber,
    engagementReactionsPercent: optionalNonNegNumber,
    netFollows: optionalNumber,
    reactions: optionalNonNegInt,
    comments: optionalNonNegInt,
    shares: optionalNonNegInt,
    totalViewsStatus: dataStatusSchema.optional(),
    topFansStatus: dataStatusSchema.optional(),
    audienceDemographicsStatus: dataStatusSchema.optional(),
    howPeopleFindContentStatus: dataStatusSchema.optional(),
    topPosts: z
      .array(
        z
          .object({
            label: z.string().max(200),
            reach: optionalNonNegInt,
            engagement: optionalNonNegInt,
            linkClicks: optionalNonNegInt,
          })
          .strict(),
      )
      .max(20)
      .optional(),
    notes: z.string().max(2000).optional(),
  })
  .strict();

export const internalSnapshotMetricsSchema = z
  .object({
    ...baselineMetaSchema,
    auditsCreated: optionalNonNegInt,
    freeReportsCompleted: optionalNonNegInt,
    professionalPurchases: optionalNonNegInt,
    prospectsCreated: optionalNonNegInt,
    opportunitiesCreated: optionalNonNegInt,
    proposalsCreated: optionalNonNegInt,
    agreementsAccepted: optionalNonNegInt,
    clientsCreated: optionalNonNegInt,
    notes: z.string().max(2000).optional(),
    inboundLeadsCreated: optionalNonNegInt,
    outboundProspectsCreated: optionalNonNegInt,
    attributedAuditCount: optionalNonNegInt,
    unknownAttributionCount: optionalNonNegInt,
    conversionIntelligenceVersion: z.number().int().positive().optional(),
  })
  .strict();

/**
 * Google Business Profile Insights — manual V1 capture.
 * Field names align with Google Help (Views, Calls, Website clicks, Directions,
 * Messages, Bookings) and Performance API DailyMetric readiness (FUTURE_GBP_API).
 * Optional ints: omitted/undefined = NOT_CAPTURED; 0 = observed zero.
 * Do not coerce blank form fields to 0.
 */
export const gbpSnapshotMetricsSchema = z
  .object({
    ...baselineMetaSchema,
    localGrowthVersion: z.number().int().positive().optional(),
    /** MANUAL now; API later — interpretation ignores capture path. */
    provenance: z.enum(["MANUAL", "API"]).optional(),
    /** Aggregate unique profile views (Search + Maps) when only total is available. */
    profileViews: optionalNonNegInt,
    searchViews: optionalNonNegInt,
    mapsViews: optionalNonNegInt,
    websiteClicks: optionalNonNegInt,
    callClicks: optionalNonNegInt,
    directionRequests: optionalNonNegInt,
    messages: optionalNonNegInt,
    bookings: optionalNonNegInt,
    /** Searches metric updates monthly per Google Help — may be INSUFFICIENT mid-month. */
    searchesStatus: dataStatusSchema.optional(),
    reviewCount: optionalNonNegInt,
    /** Average star rating 0–5 when captured from Insights. */
    averageRating: z.number().nonnegative().max(5).optional(),
    newReviews: optionalNonNegInt,
    unansweredReviews: optionalNonNegInt,
    photoCount: optionalNonNegInt,
    notes: z.string().max(2000).optional(),
    /** Operator correction of a prior snapshot id — never silent overwrite. */
    correctsSnapshotId: z.string().max(40).optional(),
    /** Sprint 12.1 API sync window identity (idempotency). */
    apiWindowKey: z.string().max(160).optional(),
    /** Selected GBP location resource — not sent to GA4. */
    locationResourceName: z.string().max(120).optional(),
  })
  .strict();

export type Ga4SnapshotMetrics = z.infer<typeof ga4SnapshotMetricsSchema>;
export type SearchConsoleSnapshotMetrics = z.infer<
  typeof searchConsoleSnapshotMetricsSchema
>;
export type FacebookSnapshotMetrics = z.infer<
  typeof facebookSnapshotMetricsSchema
>;
export type InternalSnapshotMetrics = z.infer<
  typeof internalSnapshotMetricsSchema
>;
export type GbpSnapshotMetrics = z.infer<typeof gbpSnapshotMetricsSchema>;

export function validateGrowthSnapshotMetrics(
  source: GrowthSnapshotSource,
  metrics: unknown,
):
  | { ok: true; metrics: Record<string, unknown> }
  | { ok: false; error: string } {
  const schema =
    source === "GA4"
      ? ga4SnapshotMetricsSchema
      : source === "SEARCH_CONSOLE"
        ? searchConsoleSnapshotMetricsSchema
        : source === "FACEBOOK"
          ? facebookSnapshotMetricsSchema
          : source === "GOOGLE_BUSINESS_PROFILE"
            ? gbpSnapshotMetricsSchema
            : internalSnapshotMetricsSchema;

  const parsed = schema.safeParse(metrics);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues.map((i) => i.message).join("; "),
    };
  }

  return { ok: true, metrics: parsed.data as Record<string, unknown> };
}

/**
 * Reject treating insufficient/not-captured statuses as numeric zeros
 * when interpreting snapshot metrics for comparisons.
 */
export function snapshotMetricIsExplicitlyUnavailable(
  metrics: Record<string, unknown>,
  statusKey: string,
): boolean {
  const status = metrics[statusKey];
  return status === "INSUFFICIENT_DATA" || status === "NOT_CAPTURED";
}
