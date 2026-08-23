"use server";

import { revalidatePath } from "next/cache";

import { requireInternalSession } from "@/lib/internal-auth";
import {
  createGrowthContentRecord,
  parseOptionalIntField,
  updateGrowthContentManualMetrics,
} from "@/lib/growth/content-store";
import { createGrowthExperimentDecision } from "@/lib/growth/experiment-decisions";
import {
  isFacebookContentMetricCheckpoint,
} from "@/lib/growth/facebook-execution";
import {
  isFacebookContentFormat,
  isFacebookContentJob,
  isFacebookContentPillar,
  isFacebookPublisherType,
} from "@/lib/growth/facebook-growth";
import {
  isGrowthExperimentDecisionKind,
} from "@/lib/growth/facebook-execution";
import {
  GROWTH_SNAPSHOT_SOURCES,
  type GrowthSnapshotSource,
} from "@/lib/growth/snapshot";
import { createGrowthSnapshot } from "@/lib/growth/snapshot-store";

export type CreateSnapshotState = {
  success: boolean;
  message: string;
};

export type CreateContentState = {
  success: boolean;
  message: string;
};

export type UpdateContentMetricsState = {
  success: boolean;
  message: string;
};

export type CreateExperimentDecisionState = {
  success: boolean;
  message: string;
};

function isGrowthSnapshotSource(value: string): value is GrowthSnapshotSource {
  return (GROWTH_SNAPSHOT_SOURCES as readonly string[]).includes(value);
}

export async function createGrowthSnapshotAction(
  _previous: CreateSnapshotState,
  formData: FormData,
): Promise<CreateSnapshotState> {
  const session = await requireInternalSession();

  const sourceRaw = String(formData.get("source") ?? "");
  const periodStartRaw = String(formData.get("periodStart") ?? "");
  const periodEndRaw = String(formData.get("periodEnd") ?? "");
  const metricsRaw = String(formData.get("metricsJson") ?? "");

  if (!isGrowthSnapshotSource(sourceRaw)) {
    return { success: false, message: "Invalid snapshot source." };
  }

  const periodStart = new Date(periodStartRaw);
  const periodEnd = new Date(periodEndRaw);
  if (Number.isNaN(periodStart.getTime()) || Number.isNaN(periodEnd.getTime())) {
    return { success: false, message: "Invalid period dates." };
  }

  let metrics: unknown;
  try {
    metrics = JSON.parse(metricsRaw);
  } catch {
    return { success: false, message: "metricsJson must be valid JSON." };
  }

  const result = await createGrowthSnapshot({
    periodStart,
    periodEnd,
    source: sourceRaw,
    metrics,
    createdByEmail: session.email,
  });

  if (!result.ok) {
    return { success: false, message: result.error };
  }

  revalidatePath("/reports/growth");
  return { success: true, message: `Snapshot ${result.id} saved.` };
}

export async function createGrowthContentAction(
  _previous: CreateContentState,
  formData: FormData,
): Promise<CreateContentState> {
  const session = await requireInternalSession();

  const publisherType = String(formData.get("publisherType") ?? "");
  const contentJob = String(formData.get("contentJob") ?? "");
  const contentPillar = String(formData.get("contentPillar") ?? "");
  const contentFormat = String(formData.get("contentFormat") ?? "");
  const publishedAtRaw = String(formData.get("publishedAt") ?? "");
  const contentSlug = String(formData.get("contentSlug") ?? "");
  const title = String(formData.get("title") ?? "");
  const campaign = String(formData.get("campaign") ?? "").trim() || undefined;
  const postUrl = String(formData.get("postUrl") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!isFacebookPublisherType(publisherType)) {
    return { success: false, message: "Invalid publisher type." };
  }
  if (!isFacebookContentJob(contentJob)) {
    return { success: false, message: "Invalid content job." };
  }
  if (!isFacebookContentPillar(contentPillar)) {
    return { success: false, message: "Invalid content pillar." };
  }
  if (!isFacebookContentFormat(contentFormat)) {
    return { success: false, message: "Invalid content format." };
  }

  const publishedAt = new Date(publishedAtRaw);
  if (Number.isNaN(publishedAt.getTime())) {
    return { success: false, message: "Invalid published date." };
  }

  let metrics: {
    fbViews: number | null;
    fbReach: number | null;
    fbEngagements: number | null;
    fbReactions: number | null;
    fbComments: number | null;
    fbShares: number | null;
    fbPageVisits: number | null;
    fbFollowersGained: number | null;
    fbLinkClicks: number | null;
  };

  try {
    metrics = {
      fbViews: parseOptionalIntField(formData.get("fbViews")),
      fbReach: parseOptionalIntField(formData.get("fbReach")),
      fbEngagements: parseOptionalIntField(formData.get("fbEngagements")),
      fbReactions: parseOptionalIntField(formData.get("fbReactions")),
      fbComments: parseOptionalIntField(formData.get("fbComments")),
      fbShares: parseOptionalIntField(formData.get("fbShares")),
      fbPageVisits: parseOptionalIntField(formData.get("fbPageVisits")),
      fbFollowersGained: parseOptionalIntField(
        formData.get("fbFollowersGained"),
      ),
      fbLinkClicks: parseOptionalIntField(formData.get("fbLinkClicks")),
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Invalid Facebook metrics.",
    };
  }

  const result = await createGrowthContentRecord({
    publisherType,
    publishedAt,
    contentJob,
    contentPillar,
    contentFormat,
    campaign,
    contentSlug,
    title,
    postUrl,
    notes,
    ...metrics,
    createdByEmail: session.email,
  });

  if (!result.ok) {
    return { success: false, message: result.error };
  }

  revalidatePath("/reports/growth");
  return {
    success: true,
    message: result.deduplicated
      ? `Already saved (${result.utmContent}) — duplicate click ignored. One post = one record.`
      : `Content saved (${result.utmContent}). Use UTM builder with matching utm_content.`,
  };
}

export async function updateGrowthContentMetricsAction(
  _previous: UpdateContentMetricsState,
  formData: FormData,
): Promise<UpdateContentMetricsState> {
  const session = await requireInternalSession();
  const id = String(formData.get("contentRecordId") ?? "").trim();
  const checkpointRaw = String(formData.get("checkpoint") ?? "").trim();
  const notesRaw = String(formData.get("notes") ?? "");
  const notes = notesRaw.trim() === "" ? undefined : notesRaw.trim();

  if (!id) {
    return { success: false, message: "Missing content record." };
  }

  const checkpoint =
    checkpointRaw === ""
      ? undefined
      : isFacebookContentMetricCheckpoint(checkpointRaw)
        ? checkpointRaw
        : null;
  if (checkpoint === null) {
    return { success: false, message: "Invalid checkpoint." };
  }

  let metrics: {
    fbViews: number | null;
    fbReach: number | null;
    fbEngagements: number | null;
    fbReactions: number | null;
    fbComments: number | null;
    fbShares: number | null;
    fbPageVisits: number | null;
    fbFollowersGained: number | null;
    fbLinkClicks: number | null;
  };

  try {
    metrics = {
      fbViews: parseOptionalIntField(formData.get("fbViews")),
      fbReach: parseOptionalIntField(formData.get("fbReach")),
      fbEngagements: parseOptionalIntField(formData.get("fbEngagements")),
      fbReactions: parseOptionalIntField(formData.get("fbReactions")),
      fbComments: parseOptionalIntField(formData.get("fbComments")),
      fbShares: parseOptionalIntField(formData.get("fbShares")),
      fbPageVisits: parseOptionalIntField(formData.get("fbPageVisits")),
      fbFollowersGained: parseOptionalIntField(
        formData.get("fbFollowersGained"),
      ),
      fbLinkClicks: parseOptionalIntField(formData.get("fbLinkClicks")),
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Invalid Facebook metrics.",
    };
  }

  const result = await updateGrowthContentManualMetrics({
    id,
    checkpoint,
    ...metrics,
    ...(notes !== undefined ? { notes } : {}),
    capturedByEmail: session.email,
  });

  if (!result.ok) {
    return { success: false, message: result.error };
  }

  revalidatePath("/reports/growth");
  return {
    success: true,
    message: result.checkpoint
      ? `Metrics updated + ${result.checkpoint} checkpoint saved.`
      : "Latest metrics updated on the same content record.",
  };
}

export async function createGrowthExperimentDecisionAction(
  _previous: CreateExperimentDecisionState,
  formData: FormData,
): Promise<CreateExperimentDecisionState> {
  const session = await requireInternalSession();
  const experimentId = String(formData.get("experimentId") ?? "");
  const decisionRaw = String(formData.get("decision") ?? "");
  const observations = String(formData.get("observations") ?? "");
  const sampleSizeRaw = String(formData.get("sampleSize") ?? "").trim();

  if (!isGrowthExperimentDecisionKind(decisionRaw)) {
    return { success: false, message: "Invalid decision." };
  }

  let sampleSize: number | null = null;
  if (sampleSizeRaw !== "") {
    const parsed = Number(sampleSizeRaw);
    if (!Number.isInteger(parsed) || parsed < 0) {
      return { success: false, message: "sampleSize must be a non-negative integer." };
    }
    sampleSize = parsed;
  }

  const result = await createGrowthExperimentDecision({
    experimentId,
    hypothesis: String(formData.get("hypothesis") ?? "") || undefined,
    primaryMetric: String(formData.get("primaryMetric") ?? "") || undefined,
    secondaryMetrics:
      String(formData.get("secondaryMetrics") ?? "") || undefined,
    observations,
    sampleSize,
    result: String(formData.get("result") ?? "") || undefined,
    confidence: String(formData.get("confidence") ?? "") || undefined,
    decision: decisionRaw,
    createdByEmail: session.email,
  });

  if (!result.ok) {
    return { success: false, message: result.error };
  }

  revalidatePath("/reports/growth");
  return { success: true, message: `Experiment decision saved for ${experimentId}.` };
}
