"use server";

import { revalidatePath } from "next/cache";

import { requireInternalSession } from "@/lib/internal-auth";
import {
  createGbpSnapshot,
  parseOptionalMetricFloat,
  parseOptionalMetricInt,
  upsertChecklistItem,
} from "@/lib/growth/local-growth-store";
import {
  createContentPlanFromSeed,
  isValidContentPlanSlug,
} from "@/lib/growth/content-plan-store";
import {
  CONTENT_PLANNER_PROMPT_VERSION,
  INITIAL_CONTENT_PLAN_SEEDS,
  buildDeterministicBrief,
  type SeedContentPlan,
} from "@/lib/growth/content-intelligence";
import { GBP_SUPPORT_CONTENT_SEED } from "@/lib/growth/local-growth";
import type { GbpSnapshotMetrics } from "@/lib/growth/snapshot";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

export type GbpSnapshotFormState = {
  success: boolean;
  message: string;
};

export type GbpChecklistFormState = {
  success: boolean;
  message: string;
};

export type GbpContentPlanFormState = {
  success: boolean;
  message: string;
  planId?: string;
};

export async function createGbpSnapshotAction(
  _previous: GbpSnapshotFormState,
  formData: FormData,
): Promise<GbpSnapshotFormState> {
  const session = await requireInternalSession();

  try {
    const periodStartRaw = String(formData.get("periodStart") ?? "");
    const periodEndRaw = String(formData.get("periodEnd") ?? "");
    const periodStart = new Date(`${periodStartRaw}T00:00:00.000Z`);
    const periodEnd = new Date(`${periodEndRaw}T23:59:59.999Z`);
    if (Number.isNaN(periodStart.getTime()) || Number.isNaN(periodEnd.getTime())) {
      return { success: false, message: "Invalid period dates" };
    }

    const metrics: GbpSnapshotMetrics = {
      provenance: "MANUAL",
      profileViews: parseOptionalMetricInt(formData.get("profileViews")),
      searchViews: parseOptionalMetricInt(formData.get("searchViews")),
      mapsViews: parseOptionalMetricInt(formData.get("mapsViews")),
      websiteClicks: parseOptionalMetricInt(formData.get("websiteClicks")),
      callClicks: parseOptionalMetricInt(formData.get("callClicks")),
      directionRequests: parseOptionalMetricInt(
        formData.get("directionRequests"),
      ),
      messages: parseOptionalMetricInt(formData.get("messages")),
      bookings: parseOptionalMetricInt(formData.get("bookings")),
      reviewCount: parseOptionalMetricInt(formData.get("reviewCount")),
      averageRating: parseOptionalMetricFloat(formData.get("averageRating")),
      newReviews: parseOptionalMetricInt(formData.get("newReviews")),
      unansweredReviews: parseOptionalMetricInt(
        formData.get("unansweredReviews"),
      ),
      photoCount: parseOptionalMetricInt(formData.get("photoCount")),
    };

    const notes = String(formData.get("notes") ?? "").trim();
    if (notes) {
      metrics.notes = notes.slice(0, 2000);
    }
    const corrects = String(formData.get("correctsSnapshotId") ?? "").trim();
    if (corrects) {
      metrics.correctsSnapshotId = corrects.slice(0, 40);
    }

    // Strip undefined so Zod optional fields stay omitted (NOT_CAPTURED).
    const cleaned = Object.fromEntries(
      Object.entries(metrics).filter(([, v]) => v !== undefined),
    ) as GbpSnapshotMetrics;

    const result = await createGbpSnapshot({
      periodStart,
      periodEnd,
      metrics: cleaned,
      createdByEmail: session.email,
      idempotencyKey: String(formData.get("idempotencyKey") ?? "") || null,
    });

    if (!result.ok) {
      return { success: false, message: result.error };
    }

    revalidatePath("/reports/growth/local");
    revalidatePath("/reports/growth");
    return {
      success: true,
      message: result.deduplicated
        ? `Snapshot already recorded (duplicate submit ignored): ${result.id}`
        : `Snapshot saved: ${result.id}`,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to save snapshot",
    };
  }
}

export async function upsertGbpChecklistAction(
  _previous: GbpChecklistFormState,
  formData: FormData,
): Promise<GbpChecklistFormState> {
  const session = await requireInternalSession();

  const result = await upsertChecklistItem({
    itemKey: String(formData.get("itemKey") ?? ""),
    status: String(formData.get("status") ?? ""),
    factMatch: String(formData.get("factMatch") ?? "") || null,
    observation: String(formData.get("observation") ?? "") || null,
    observedValue: String(formData.get("observedValue") ?? "") || null,
    reviewedByEmail: session.email,
  });

  if (!result.ok) {
    return { success: false, message: result.error };
  }

  revalidatePath("/reports/growth/local");
  revalidatePath("/reports/growth");
  return { success: true, message: "Checklist item saved" };
}

/**
 * Operator-triggered ContentPlan for GBP support content.
 * Reuses Sprint 6 seed gbp-support-content-v1 — no auto-publish.
 * No GrowthContentRecord until publish semantics require it.
 */
export async function createGbpSupportContentPlanAction(
  _previous: GbpContentPlanFormState,
  formData: FormData,
): Promise<GbpContentPlanFormState> {
  const session = await requireInternalSession();
  void formData;

  const seed = INITIAL_CONTENT_PLAN_SEEDS.find(
    (s) => s.slug === GBP_SUPPORT_CONTENT_SEED.id,
  );
  if (!seed) {
    return { success: false, message: "GBP support content seed missing" };
  }

  const result = await createContentPlanFromSeed(seed, session.email);
  if (!result.ok) {
    return { success: false, message: result.error };
  }

  revalidatePath("/reports/growth/local");
  revalidatePath("/reports/growth/content");
  return {
    success: true,
    message: result.created
      ? "GBP support content plan created — no automatic publish"
      : "GBP support content plan already exists — no automatic publish",
    planId: result.id,
  };
}

/**
 * Create a GBP_POST plan from a published site asset slug (repurposing).
 * Manual publish only — no GrowthContentRecord until operator publishes.
 */
export async function createGbpPostPlanAction(
  _previous: GbpContentPlanFormState,
  formData: FormData,
): Promise<GbpContentPlanFormState> {
  const session = await requireInternalSession();
  const sourceAssetSlug = String(formData.get("sourceAssetSlug") ?? "")
    .trim()
    .slice(0, 80);
  if (!sourceAssetSlug) {
    return { success: false, message: "sourceAssetSlug required" };
  }

  const slug = `gbp-post-${sourceAssetSlug}`.slice(0, 80).replace(/[^a-z0-9-]/gi, "-").toLowerCase();
  if (!isValidContentPlanSlug(slug)) {
    return { success: false, message: "Invalid derived slug" };
  }

  const existing = await prisma.growthContentPlan.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (existing) {
    return {
      success: true,
      message: "GBP_POST plan already exists — no automatic publish",
      planId: existing.id,
    };
  }

  const seed: SeedContentPlan = {
    slug,
    contentType: "GBP_POST",
    sourceType: "REPURPOSE",
    sourceOpportunitySlug: null,
    topic: "GBP",
    workingTitle: `GBP post from ${sourceAssetSlug}`,
    audience: "Local customers discovering JS Solutions on Google",
    primaryObjective: "EDUCATION",
    searchIntent: null,
    pageType: null,
    targetServicePath: "/local-seo",
    publisher: "NONE",
    priorityBand: "NEXT",
    whyRecommended: [
      `Repurpose published asset ${sourceAssetSlug}`,
      "Manual GBP publish only",
      "Use canonical post_<slug> UTM when linking",
    ],
  };

  const brief = buildDeterministicBrief(seed);
  const row = await prisma.growthContentPlan.create({
    data: {
      slug: seed.slug,
      contentType: seed.contentType,
      sourceType: seed.sourceType,
      status: "BRIEF_READY",
      priorityBand: seed.priorityBand,
      publisher: seed.publisher,
      topic: seed.topic,
      workingTitle: seed.workingTitle,
      audience: seed.audience,
      primaryObjective: seed.primaryObjective,
      searchIntent: seed.searchIntent,
      pageType: seed.pageType,
      targetServicePath: seed.targetServicePath,
      sourceAssetSlug,
      whyRecommendedJson: seed.whyRecommended,
      briefJson: brief as unknown as Prisma.InputJsonValue,
      plannerPromptVersion: CONTENT_PLANNER_PROMPT_VERSION,
      createdByEmail: session.email,
    },
    select: { id: true },
  });

  revalidatePath("/reports/growth/local");
  revalidatePath("/reports/growth/content");
  return {
    success: true,
    message: "GBP_POST plan created — no automatic publish",
    planId: row.id,
  };
}

export type GbpSyncActionState = {
  success: boolean;
  message: string;
};

export async function syncGbpProfileAction(
  _previous: GbpSyncActionState,
  formData: FormData,
): Promise<GbpSyncActionState> {
  const session = await requireInternalSession();
  void formData;
  const { syncGbpProfile } = await import("@/lib/gbp/sync-profile");
  const result = await syncGbpProfile({
    operatorEmail: session.email,
    websiteWithoutUtm: process.env.GROWTH_TEST_GBP_WEBSITE_NO_UTM === "1",
  });
  revalidatePath("/reports/growth/local");
  revalidatePath("/reports/growth");
  if (!result.ok) {
    return { success: false, message: result.error };
  }
  return {
    success: true,
    message: `Profile synced (${result.itemsUpdated} checklist items). Mismatches: ${
      result.mismatches.length ? result.mismatches.join(", ") : "none"
    }. No Google writes performed.`,
  };
}

export async function syncGbpPerformanceAction(
  _previous: GbpSyncActionState,
  formData: FormData,
): Promise<GbpSyncActionState> {
  const session = await requireInternalSession();
  void formData;
  const { syncGbpPerformance } = await import("@/lib/gbp/sync-performance");
  const result = await syncGbpPerformance({
    operatorEmail: session.email,
  });
  revalidatePath("/reports/growth/local");
  revalidatePath("/reports/growth");
  if (!result.ok) {
    return { success: false, message: result.error };
  }
  return {
    success: true,
    message: result.deduplicated
      ? `Performance snapshot already present for window (${result.snapshotId})`
      : `API performance snapshot saved (${result.snapshotId}). Manual baseline preserved.`,
  };
}

export async function syncGbpAllAction(
  _previous: GbpSyncActionState,
  formData: FormData,
): Promise<GbpSyncActionState> {
  const session = await requireInternalSession();
  void formData;
  const { syncGbpProfile } = await import("@/lib/gbp/sync-profile");
  const { syncGbpPerformance } = await import("@/lib/gbp/sync-performance");
  const profile = await syncGbpProfile({ operatorEmail: session.email });
  if (!profile.ok) {
    revalidatePath("/reports/growth/local");
    return { success: false, message: `Profile: ${profile.error}` };
  }
  const perf = await syncGbpPerformance({ operatorEmail: session.email });
  revalidatePath("/reports/growth/local");
  revalidatePath("/reports/growth");
  if (!perf.ok) {
    return {
      success: false,
      message: `Profile OK; Performance: ${perf.error}`,
    };
  }
  return {
    success: true,
    message: `Sync All complete. Profile items=${profile.itemsUpdated}. Snapshot=${perf.snapshotId}.`,
  };
}

export async function disconnectGbpAction(
  _previous: GbpSyncActionState,
  _formData: FormData,
): Promise<GbpSyncActionState> {
  await requireInternalSession();
  const {
    getActiveGbpConnection,
    disconnectGbpConnection,
  } = await import("@/lib/gbp/connection-store");
  const row = await getActiveGbpConnection();
  if (!row) {
    return { success: false, message: "No active GBP connection" };
  }
  await disconnectGbpConnection(row.id);
  revalidatePath("/reports/growth/local");
  return {
    success: true,
    message:
      "Disconnected. Refresh token removed. Historical snapshots and checklist preserved.",
  };
}

export async function selectGbpLocationAction(
  _previous: GbpSyncActionState,
  formData: FormData,
): Promise<GbpSyncActionState> {
  await requireInternalSession();
  const {
    getActiveGbpConnection,
    selectGbpLocation,
  } = await import("@/lib/gbp/connection-store");
  const row = await getActiveGbpConnection();
  if (!row) {
    return { success: false, message: "Connect Google first" };
  }
  await selectGbpLocation({
    connectionId: row.id,
    accountResourceName: String(formData.get("accountResourceName") ?? ""),
    accountDisplayName: String(formData.get("accountDisplayName") ?? ""),
    accountId: String(formData.get("accountId") ?? ""),
    locationResourceName: String(formData.get("locationResourceName") ?? ""),
    locationTitle: String(formData.get("locationTitle") ?? ""),
    locationId: String(formData.get("locationId") ?? ""),
  });
  revalidatePath("/reports/growth/local");
  return { success: true, message: "GBP location selected" };
}

export async function loadGbpLocationsAction(): Promise<{
  success: boolean;
  message: string;
  accounts?: Array<{
    resourceName: string;
    accountName: string;
    accountId: string;
  }>;
  locations?: Array<{
    resourceName: string;
    locationId: string;
    title: string;
    accountId: string;
  }>;
}> {
  const session = await requireInternalSession();
  void session;
  const {
    getActiveGbpConnection,
    getDecryptedRefreshToken,
  } = await import("@/lib/gbp/connection-store");
  const { refreshGbpAccessToken } = await import("@/lib/gbp/oauth");
  const { getGbpProvider } = await import("@/lib/gbp/google-provider");

  const row = await getActiveGbpConnection();
  if (!row) {
    return { success: false, message: "Not connected" };
  }
  const refresh = getDecryptedRefreshToken(row);
  if (!refresh) {
    return { success: false, message: "Reconnect required" };
  }
  try {
    const tokens = await refreshGbpAccessToken(refresh);
    const provider = getGbpProvider();
    const accounts = await provider.listAccounts(tokens.access_token);
    const locations = [];
    for (const account of accounts) {
      const locs = await provider.listLocations(
        tokens.access_token,
        account.accountId,
      );
      locations.push(...locs);
    }
    return { success: true, message: "OK", accounts, locations };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to list locations",
    };
  }
}
