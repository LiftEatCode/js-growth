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
import { isValidUtmValue, normalizeUtmValue } from "@/lib/growth/utm";
import { prisma } from "@/lib/prisma";

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
): Promise<{ ok: true; id: string; utmContent: string } | { ok: false; error: string }> {
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

  try {
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
    return { ok: true, id: created.id, utmContent };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to save content record",
    };
  }
}

export async function listGrowthContentRecords(limit = 40) {
  return prisma.growthContentRecord.findMany({
    orderBy: { publishedAt: "desc" },
    take: limit,
  });
}

export async function summarizeGrowthContentRecords(limit = 200) {
  const rows = await listGrowthContentRecords(limit);
  const byPublisher = { COMPANY: 0, FOUNDER: 0 };
  const byJob: Record<string, number> = {};
  const byPillar: Record<string, number> = {};
  const byFormat: Record<string, number> = {};

  for (const row of rows) {
    byPublisher[row.publisherType] += 1;
    byJob[row.contentJob] = (byJob[row.contentJob] ?? 0) + 1;
    byPillar[row.contentPillar] = (byPillar[row.contentPillar] ?? 0) + 1;
    byFormat[row.contentFormat] = (byFormat[row.contentFormat] ?? 0) + 1;
  }

  return { total: rows.length, byPublisher, byJob, byPillar, byFormat, rows };
}

export function parseOptionalIntField(raw: FormDataEntryValue | null): number | null {
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
