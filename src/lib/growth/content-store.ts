import "server-only";

import {
  FACEBOOK_FOUNDER_CAMPAIGN,
  FACEBOOK_PAGE_CAMPAIGN,
  buildFacebookCompanyUtmContent,
  buildFacebookFounderUtmContent,
  isFacebookContentFormat,
  isFacebookContentJob,
  isFacebookContentPillar,
  isFacebookPublisherType,
  isValidFacebookContentSlug,
  normalizeFacebookContentSlug,
  validateFacebookManualMetrics,
  type FacebookContentFormat,
  type FacebookContentJob,
  type FacebookContentPillar,
  type FacebookPublisherType,
} from "@/lib/growth/facebook-growth";
import {
  GROWTH_CONTENT_RAPID_DUPLICATE_WINDOW_MS,
  buildGrowthContentIdentityFingerprint,
  isWithinRapidDuplicateWindow,
  matchesGrowthContentIdentityFingerprint,
} from "@/lib/growth/content-dedupe";
import {
  getMeasurementDueStatus,
  isFacebookContentMetricCheckpoint,
  type FacebookContentMetricCheckpoint,
  type MeasurementDueStatus,
} from "@/lib/growth/facebook-execution";
import { isValidUtmValue, normalizeUtmValue } from "@/lib/growth/utm";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

export {
  GROWTH_CONTENT_RAPID_DUPLICATE_WINDOW_MS,
  buildGrowthContentIdentityFingerprint,
  isWithinRapidDuplicateWindow,
  matchesGrowthContentIdentityFingerprint,
  type GrowthContentIdentityFingerprint,
} from "@/lib/growth/content-dedupe";

export type CreateGrowthContentInput = {
  publisherType: FacebookPublisherType;
  publishedAt: Date;
  contentJob: FacebookContentJob;
  contentPillar: FacebookContentPillar;
  contentFormat: FacebookContentFormat;
  campaign?: string;
  contentSlug: string;
  title: string;
  postUrl?: string | null;
  notes?: string | null;
  fbViews?: number | null;
  fbReach?: number | null;
  fbEngagements?: number | null;
  fbReactions?: number | null;
  fbComments?: number | null;
  fbShares?: number | null;
  fbPageVisits?: number | null;
  fbFollowersGained?: number | null;
  fbLinkClicks?: number | null;
  createdByEmail: string;
};

function optionalNonNegInt(value: number | null | undefined): number | null {
  if (value == null) {
    return null;
  }
  if (!Number.isInteger(value) || value < 0) {
    throw new Error("Metric must be a non-negative integer or empty");
  }
  return value;
}

export async function createGrowthContentRecord(
  input: CreateGrowthContentInput,
): Promise<
  | { ok: true; id: string; utmContent: string; deduplicated: boolean }
  | { ok: false; error: string }
> {
  if (!isFacebookPublisherType(input.publisherType)) {
    return { ok: false, error: "Invalid publisherType" };
  }
  if (!isFacebookContentJob(input.contentJob)) {
    return { ok: false, error: "Invalid contentJob" };
  }
  if (!isFacebookContentPillar(input.contentPillar)) {
    return { ok: false, error: "Invalid contentPillar" };
  }
  if (!isFacebookContentFormat(input.contentFormat)) {
    return { ok: false, error: "Invalid contentFormat" };
  }
  if (!input.title.trim() || input.title.trim().length > 200) {
    return { ok: false, error: "Title required (max 200)" };
  }
  if (!isValidFacebookContentSlug(input.contentSlug)) {
    return {
      ok: false,
      error: "contentSlug must be lowercase letters/numbers/_/- (max 61)",
    };
  }

  const utmContent =
    input.publisherType === "COMPANY"
      ? buildFacebookCompanyUtmContent(input.contentSlug)
      : buildFacebookFounderUtmContent(input.contentSlug);

  if (!utmContent) {
    return { ok: false, error: "Could not build utm_content" };
  }

  const campaignDefault =
    input.publisherType === "COMPANY"
      ? FACEBOOK_PAGE_CAMPAIGN
      : FACEBOOK_FOUNDER_CAMPAIGN;
  const campaign = normalizeUtmValue(input.campaign?.trim() || campaignDefault);
  if (!isValidUtmValue(campaign)) {
    return { ok: false, error: "Invalid campaign" };
  }

  if (input.postUrl) {
    try {
      const parsed = new URL(input.postUrl);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        return { ok: false, error: "postUrl must be http(s)" };
      }
    } catch {
      return { ok: false, error: "Invalid postUrl" };
    }
  }

  const manual = validateFacebookManualMetrics({
    views: input.fbViews ?? null,
    reach: input.fbReach ?? null,
    engagements: input.fbEngagements ?? null,
    reactions: input.fbReactions ?? null,
    comments: input.fbComments ?? null,
    shares: input.fbShares ?? null,
    pageVisits: input.fbPageVisits ?? null,
    followersGained: input.fbFollowersGained ?? null,
    linkClicks: input.fbLinkClicks ?? null,
  });
  if (!manual.ok) {
    return manual;
  }

  const incomingFingerprint = buildGrowthContentIdentityFingerprint({
    publisherType: input.publisherType,
    utmContent,
    publishedAt: input.publishedAt,
    title: input.title,
    contentJob: input.contentJob,
    contentPillar: input.contentPillar,
    contentFormat: input.contentFormat,
    createdByEmail: input.createdByEmail,
  });

  try {
    const existingSameUtm = await prisma.growthContentRecord.findMany({
      where: { utmContent },
      orderBy: { createdAt: "asc" },
      take: 5,
    });

    if (existingSameUtm.length > 0) {
      const now = new Date();
      const rapidMatch = existingSameUtm.find((row) => {
        if (!isWithinRapidDuplicateWindow(row.createdAt, now)) {
          return false;
        }
        return matchesGrowthContentIdentityFingerprint(
          buildGrowthContentIdentityFingerprint({
            publisherType: row.publisherType,
            utmContent: row.utmContent,
            publishedAt: row.publishedAt,
            title: row.title,
            contentJob: row.contentJob,
            contentPillar: row.contentPillar,
            contentFormat: row.contentFormat,
            createdByEmail: row.createdByEmail,
          }),
          incomingFingerprint,
        );
      });

      if (rapidMatch) {
        return {
          ok: true,
          id: rapidMatch.id,
          utmContent,
          deduplicated: true,
        };
      }

      return {
        ok: false,
        error: `A content record with utm_content=${utmContent} already exists (id=${existingSameUtm[0]?.id}). One Facebook post = one canonical record — update metrics on that row instead of creating another.`,
      };
    }

    const created = await prisma.growthContentRecord.create({
      data: {
        publisherType: input.publisherType,
        publishedAt: input.publishedAt,
        contentJob: input.contentJob,
        contentPillar: input.contentPillar,
        contentFormat: input.contentFormat,
        campaign,
        utmContent,
        postUrl: input.postUrl?.trim() || null,
        title: input.title.trim(),
        notes: input.notes?.trim() ? input.notes.trim().slice(0, 2000) : null,
        fbViews: optionalNonNegInt(input.fbViews),
        fbReach: optionalNonNegInt(input.fbReach),
        fbEngagements: optionalNonNegInt(input.fbEngagements),
        fbReactions: optionalNonNegInt(input.fbReactions),
        fbComments: optionalNonNegInt(input.fbComments),
        fbShares: optionalNonNegInt(input.fbShares),
        fbPageVisits: optionalNonNegInt(input.fbPageVisits),
        fbFollowersGained: optionalNonNegInt(input.fbFollowersGained),
        fbLinkClicks: optionalNonNegInt(input.fbLinkClicks),
        createdByEmail: input.createdByEmail,
      },
    });

    const hasAnyMetric =
      input.fbViews != null ||
      input.fbReach != null ||
      input.fbEngagements != null ||
      input.fbReactions != null ||
      input.fbComments != null ||
      input.fbShares != null ||
      input.fbPageVisits != null ||
      input.fbFollowersGained != null ||
      input.fbLinkClicks != null;

    if (hasAnyMetric) {
      await prisma.growthContentMetricSnapshot.create({
        data: {
          contentRecordId: created.id,
          checkpoint: "INITIAL",
          fbViews: optionalNonNegInt(input.fbViews),
          fbReach: optionalNonNegInt(input.fbReach),
          fbEngagements: optionalNonNegInt(input.fbEngagements),
          fbReactions: optionalNonNegInt(input.fbReactions),
          fbComments: optionalNonNegInt(input.fbComments),
          fbShares: optionalNonNegInt(input.fbShares),
          fbPageVisits: optionalNonNegInt(input.fbPageVisits),
          fbFollowersGained: optionalNonNegInt(input.fbFollowersGained),
          fbLinkClicks: optionalNonNegInt(input.fbLinkClicks),
          notes: input.notes?.trim() ? input.notes.trim().slice(0, 2000) : null,
          capturedByEmail: input.createdByEmail,
        },
      });
    }

    return { ok: true, id: created.id, utmContent, deduplicated: false };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : "Failed to save content record",
    };
  }
}

/**
 * Update manual Facebook Insights on an existing canonical content record.
 * Optionally upsert a measurement checkpoint snapshot (INITIAL / HOURS_72 / DAYS_7).
 * Do not create a second GrowthContentRecord.
 */
export async function updateGrowthContentManualMetrics(input: {
  id: string;
  checkpoint?: FacebookContentMetricCheckpoint;
  fbViews?: number | null;
  fbReach?: number | null;
  fbEngagements?: number | null;
  fbReactions?: number | null;
  fbComments?: number | null;
  fbShares?: number | null;
  fbPageVisits?: number | null;
  fbFollowersGained?: number | null;
  fbLinkClicks?: number | null;
  notes?: string | null;
  capturedByEmail: string;
}): Promise<{ ok: true; id: string; checkpoint: string | null } | { ok: false; error: string }> {
  if (
    input.checkpoint !== undefined &&
    !isFacebookContentMetricCheckpoint(input.checkpoint)
  ) {
    return { ok: false, error: "Invalid checkpoint" };
  }

  const manual = validateFacebookManualMetrics({
    views: input.fbViews ?? null,
    reach: input.fbReach ?? null,
    engagements: input.fbEngagements ?? null,
    reactions: input.fbReactions ?? null,
    comments: input.fbComments ?? null,
    shares: input.fbShares ?? null,
    pageVisits: input.fbPageVisits ?? null,
    followersGained: input.fbFollowersGained ?? null,
    linkClicks: input.fbLinkClicks ?? null,
  });
  if (!manual.ok) {
    return manual;
  }

  try {
    const existing = await prisma.growthContentRecord.findUnique({
      where: { id: input.id },
      select: { id: true },
    });
    if (!existing) {
      return { ok: false, error: "Content record not found" };
    }

    const metricData: Prisma.GrowthContentRecordUpdateInput = {};
    const metricKeys = [
      "fbViews",
      "fbReach",
      "fbEngagements",
      "fbReactions",
      "fbComments",
      "fbShares",
      "fbPageVisits",
      "fbFollowersGained",
      "fbLinkClicks",
    ] as const;

    for (const key of metricKeys) {
      if (key in input) {
        (metricData as Record<string, number | null>)[key] = optionalNonNegInt(
          input[key],
        );
      }
    }
    if ("notes" in input) {
      metricData.notes = input.notes?.trim()
        ? input.notes.trim().slice(0, 2000)
        : null;
    }

    await prisma.$transaction(async (tx) => {
      await tx.growthContentRecord.update({
        where: { id: input.id },
        data: metricData,
      });

      if (input.checkpoint) {
        const snapshotData = {
          fbViews: optionalNonNegInt(input.fbViews),
          fbReach: optionalNonNegInt(input.fbReach),
          fbEngagements: optionalNonNegInt(input.fbEngagements),
          fbReactions: optionalNonNegInt(input.fbReactions),
          fbComments: optionalNonNegInt(input.fbComments),
          fbShares: optionalNonNegInt(input.fbShares),
          fbPageVisits: optionalNonNegInt(input.fbPageVisits),
          fbFollowersGained: optionalNonNegInt(input.fbFollowersGained),
          fbLinkClicks: optionalNonNegInt(input.fbLinkClicks),
          notes: input.notes?.trim()
            ? input.notes.trim().slice(0, 2000)
            : null,
          capturedByEmail: input.capturedByEmail,
          capturedAt: new Date(),
        };

        await tx.growthContentMetricSnapshot.upsert({
          where: {
            contentRecordId_checkpoint: {
              contentRecordId: input.id,
              checkpoint: input.checkpoint,
            },
          },
          create: {
            contentRecordId: input.id,
            checkpoint: input.checkpoint,
            ...snapshotData,
          },
          update: snapshotData,
        });
      }
    });

    return {
      ok: true,
      id: input.id,
      checkpoint: input.checkpoint ?? null,
    };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to update content metrics",
    };
  }
}

export async function listGrowthContentRecords(limit = 40) {
  return prisma.growthContentRecord.findMany({
    orderBy: { publishedAt: "desc" },
    take: limit,
    include: {
      metricSnapshots: {
        select: {
          checkpoint: true,
          capturedAt: true,
          fbViews: true,
          fbReach: true,
          fbEngagements: true,
        },
      },
    },
  });
}

export type GrowthContentRecordSummaryRow = Awaited<
  ReturnType<typeof listGrowthContentRecords>
>[number] & {
  measurementStatus: MeasurementDueStatus;
  has72h: boolean;
  has7d: boolean;
  hasInitial: boolean;
};

export async function summarizeGrowthContentRecords(limit = 200) {
  const rows = await listGrowthContentRecords(limit);
  const byPublisher = { COMPANY: 0, FOUNDER: 0 };
  const byJob: Record<string, number> = {};
  const byPillar: Record<string, number> = {};
  const byFormat: Record<string, number> = {};
  const due72h: GrowthContentRecordSummaryRow[] = [];
  const due7d: GrowthContentRecordSummaryRow[] = [];
  const enriched: GrowthContentRecordSummaryRow[] = [];

  for (const row of rows) {
    byPublisher[row.publisherType] += 1;
    byJob[row.contentJob] = (byJob[row.contentJob] ?? 0) + 1;
    byPillar[row.contentPillar] = (byPillar[row.contentPillar] ?? 0) + 1;
    byFormat[row.contentFormat] = (byFormat[row.contentFormat] ?? 0) + 1;

    const checkpoints = new Set(row.metricSnapshots.map((s) => s.checkpoint));
    const hasInitial = checkpoints.has("INITIAL");
    const has72h = checkpoints.has("HOURS_72");
    const has7d = checkpoints.has("DAYS_7");
    const measurementStatus = getMeasurementDueStatus({
      publishedAt: row.publishedAt,
      hasInitial,
      has72h,
      has7d,
    });

    const enrichedRow: GrowthContentRecordSummaryRow = {
      ...row,
      measurementStatus,
      has72h,
      has7d,
      hasInitial,
    };
    enriched.push(enrichedRow);
    if (measurementStatus === "DUE_72H") {
      due72h.push(enrichedRow);
    }
    if (measurementStatus === "DUE_7D") {
      due7d.push(enrichedRow);
    }
  }

  const companyRows = enriched.filter((r) => r.publisherType === "COMPANY");
  const founderRows = enriched.filter((r) => r.publisherType === "FOUNDER");

  function sumMetric(
    list: GrowthContentRecordSummaryRow[],
    key:
      | "fbViews"
      | "fbReach"
      | "fbEngagements"
      | "fbFollowersGained"
      | "fbLinkClicks"
      | "fbPageVisits",
  ): number | null {
    let total = 0;
    let any = false;
    for (const row of list) {
      const value = row[key];
      if (value != null) {
        total += value;
        any = true;
      }
    }
    return any ? total : null;
  }

  return {
    total: rows.length,
    byPublisher,
    byJob,
    byPillar,
    byFormat,
    rows: enriched,
    due72h,
    due7d,
    publisherScorecard: {
      COMPANY: {
        posts: companyRows.length,
        views: sumMetric(companyRows, "fbViews"),
        reach: sumMetric(companyRows, "fbReach"),
        engagements: sumMetric(companyRows, "fbEngagements"),
        followersGained: sumMetric(companyRows, "fbFollowersGained"),
        linkClicks: sumMetric(companyRows, "fbLinkClicks"),
        pageVisits: sumMetric(companyRows, "fbPageVisits"),
      },
      FOUNDER: {
        posts: founderRows.length,
        views: sumMetric(founderRows, "fbViews"),
        reach: sumMetric(founderRows, "fbReach"),
        engagements: sumMetric(founderRows, "fbEngagements"),
        followersGained: sumMetric(founderRows, "fbFollowersGained"),
        linkClicks: sumMetric(founderRows, "fbLinkClicks"),
        pageVisits: sumMetric(founderRows, "fbPageVisits"),
      },
    },
  };
}

export function parseOptionalIntField(
  raw: FormDataEntryValue | null,
): number | null {
  if (raw == null || String(raw).trim() === "") {
    return null;
  }
  const value = Number(String(raw).trim());
  if (!Number.isInteger(value) || value < 0) {
    throw new Error("Metrics must be blank or non-negative integers");
  }
  return value;
}

export { normalizeFacebookContentSlug };
