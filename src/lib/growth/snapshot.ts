/**
 * Growth Sprint 1 — GrowthSnapshot metrics validation.
 *
 * Snapshots are immutable historical baselines. Validate JSON shape;
 * do not create a generic analytics dump.
 */

import { z } from "zod";

export const GROWTH_SNAPSHOT_SOURCES = [
  "GA4",
  "SEARCH_CONSOLE",
  "FACEBOOK",
  "INTERNAL",
] as const;

export type GrowthSnapshotSource = (typeof GROWTH_SNAPSHOT_SOURCES)[number];

const optionalNonNegInt = z.number().int().nonnegative().optional();
const optionalNonNegNumber = z.number().nonnegative().optional();

export const ga4SnapshotMetricsSchema = z
  .object({
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
    notes: z.string().max(2000).optional(),
  })
  .strict();

export const searchConsoleSnapshotMetricsSchema = z
  .object({
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
    notes: z.string().max(2000).optional(),
  })
  .strict();

export const facebookSnapshotMetricsSchema = z
  .object({
    property: z.enum(["js_solutions_page", "founder_personal"]),
    followers: optionalNonNegInt,
    reach: optionalNonNegInt,
    contentViews: optionalNonNegInt,
    impressions: optionalNonNegInt,
    engagement: optionalNonNegInt,
    linkClicks: optionalNonNegInt,
    pageVisits: optionalNonNegInt,
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
    auditsCreated: optionalNonNegInt,
    freeReportsCompleted: optionalNonNegInt,
    professionalPurchases: optionalNonNegInt,
    prospectsCreated: optionalNonNegInt,
    opportunitiesCreated: optionalNonNegInt,
    proposalsCreated: optionalNonNegInt,
    agreementsAccepted: optionalNonNegInt,
    clientsCreated: optionalNonNegInt,
    notes: z.string().max(2000).optional(),
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
