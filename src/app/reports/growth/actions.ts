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
  isSearchEvidenceKind,
  isSearchIntent,
  isSearchOpportunitySource,
  isSearchOpportunityStatus,
  isSearchPageType,
  isSearchPriorityBand,
  isSearchTopic,
} from "@/lib/growth/search-intelligence";
import {
  createSearchOpportunity,
  updateSearchOpportunity,
} from "@/lib/growth/search-opportunity-store";
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

export type CreateSearchOpportunityState = {
  success: boolean;
  message: string;
};

export type UpdateSearchOpportunityState = {
  success: boolean;
  message: string;
};

function parseBoundedInt(
  raw: FormDataEntryValue | null,
  min: number,
  max: number,
  label: string,
): { ok: true; value: number } | { ok: false; error: string } {
  const parsed = Number(String(raw ?? "").trim());
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    return { ok: false, error: `${label} must be an integer ${min}–${max}.` };
  }
  return { ok: true, value: parsed };
}

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

export async function createSearchOpportunityAction(
  _previous: CreateSearchOpportunityState,
  formData: FormData,
): Promise<CreateSearchOpportunityState> {
  const session = await requireInternalSession();

  const slug = String(formData.get("slug") ?? "").trim();
  const topic = String(formData.get("topic") ?? "");
  const intent = String(formData.get("intent") ?? "");
  const pageType = String(formData.get("pageType") ?? "");
  const source = String(formData.get("source") ?? "");
  const evidenceKind = String(formData.get("evidenceKind") ?? "");
  const queryConcept = String(formData.get("queryConcept") ?? "");

  if (!isSearchTopic(topic)) {
    return { success: false, message: "Invalid topic." };
  }
  if (!isSearchIntent(intent)) {
    return { success: false, message: "Invalid intent." };
  }
  if (!isSearchPageType(pageType)) {
    return { success: false, message: "Invalid page type." };
  }
  if (!isSearchOpportunitySource(source)) {
    return { success: false, message: "Invalid source." };
  }
  if (!isSearchEvidenceKind(evidenceKind)) {
    return { success: false, message: "Invalid evidence kind." };
  }

  const commercialRelevance = parseBoundedInt(
    formData.get("commercialRelevance"),
    1,
    3,
    "commercialRelevance",
  );
  if (!commercialRelevance.ok) {
    return { success: false, message: commercialRelevance.error };
  }
  const intentStrength = parseBoundedInt(
    formData.get("intentStrength"),
    1,
    3,
    "intentStrength",
  );
  if (!intentStrength.ok) {
    return { success: false, message: intentStrength.error };
  }
  const contentGap = parseBoundedInt(formData.get("contentGap"), 1, 3, "contentGap");
  if (!contentGap.ok) {
    return { success: false, message: contentGap.error };
  }
  const auditFunnelRelevance = parseBoundedInt(
    formData.get("auditFunnelRelevance"),
    1,
    3,
    "auditFunnelRelevance",
  );
  if (!auditFunnelRelevance.ok) {
    return { success: false, message: auditFunnelRelevance.error };
  }
  const gscEvidence = parseBoundedInt(formData.get("gscEvidence"), 0, 2, "gscEvidence");
  if (!gscEvidence.ok) {
    return { success: false, message: gscEvidence.error };
  }
  const effort = parseBoundedInt(formData.get("effort"), 1, 3, "effort");
  if (!effort.ok) {
    return { success: false, message: effort.error };
  }

  const result = await createSearchOpportunity({
    slug,
    topic,
    queryConcept,
    intent,
    pageType,
    source,
    evidenceKind,
    currentPagePath: String(formData.get("currentPagePath") ?? "").trim() || null,
    recommendedPath: String(formData.get("recommendedPath") ?? "").trim() || null,
    notes: String(formData.get("notes") ?? "").trim() || null,
    commercialRelevance: commercialRelevance.value as 1 | 2 | 3,
    intentStrength: intentStrength.value as 1 | 2 | 3,
    contentGap: contentGap.value as 1 | 2 | 3,
    auditFunnelRelevance: auditFunnelRelevance.value as 1 | 2 | 3,
    gscEvidence: gscEvidence.value as 0 | 1 | 2,
    effort: effort.value as 1 | 2 | 3,
    createdByEmail: session.email,
  });

  if (!result.ok) {
    return { success: false, message: result.error };
  }

  revalidatePath("/reports/growth");
  return { success: true, message: `Opportunity saved (${slug}).` };
}

export async function updateSearchOpportunityAction(
  _previous: UpdateSearchOpportunityState,
  formData: FormData,
): Promise<UpdateSearchOpportunityState> {
  const session = await requireInternalSession();
  const id = String(formData.get("id") ?? "").trim();
  const statusRaw = String(formData.get("status") ?? "");
  const bandRaw = String(formData.get("priorityBand") ?? "");
  const notesRaw = String(formData.get("notes") ?? "");

  if (!id) {
    return { success: false, message: "Missing opportunity id." };
  }
  if (!isSearchOpportunityStatus(statusRaw)) {
    return { success: false, message: "Invalid status." };
  }
  if (!isSearchPriorityBand(bandRaw)) {
    return { success: false, message: "Invalid priority band." };
  }

  const result = await updateSearchOpportunity({
    id,
    status: statusRaw,
    priorityBand: bandRaw,
    notes: notesRaw.trim() === "" ? null : notesRaw.trim(),
    updatedByEmail: session.email,
  });

  if (!result.ok) {
    return { success: false, message: result.error };
  }

  revalidatePath("/reports/growth");
  return { success: true, message: "Opportunity updated." };
}

export type ContentPlanActionState = {
  success: boolean;
  message: string;
};

export async function seedInitialContentPlansAction(
  _previous: ContentPlanActionState,
  _formData: FormData,
): Promise<ContentPlanActionState> {
  const session = await requireInternalSession();
  const { ensureInitialContentPlans } = await import(
    "@/lib/growth/content-plan-store"
  );
  const result = await ensureInitialContentPlans(session.email);
  revalidatePath("/reports/growth");
  revalidatePath("/reports/growth/content");
  return {
    success: true,
    message: `Content plans seeded (created ${result.created}, skipped ${result.skipped}).`,
  };
}

export async function generateContentDraftAction(
  _previous: ContentPlanActionState,
  formData: FormData,
): Promise<ContentPlanActionState> {
  const session = await requireInternalSession();
  const planId = String(formData.get("planId") ?? "").trim();
  const mode = String(formData.get("mode") ?? "openai").trim();
  const notes = String(formData.get("operatorNotes") ?? "").trim() || null;
  const revisionInstruction =
    String(formData.get("revisionInstruction") ?? "").trim() || null;

  if (!planId) {
    return { success: false, message: "Missing plan id." };
  }

  if (mode === "skeleton" || mode === "skeleton_regenerate") {
    const { applySkeletonDraftWithoutOpenAi } = await import(
      "@/lib/growth/content-plan-store"
    );
    const result = await applySkeletonDraftWithoutOpenAi({
      id: planId,
      updatedByEmail: session.email,
      asRegenerateCandidate: mode === "skeleton_regenerate",
    });
    if (!result.ok) {
      return { success: false, message: result.error };
    }
    revalidatePath("/reports/growth/content");
    return {
      success: true,
      message:
        mode === "skeleton_regenerate"
          ? "Skeleton candidate saved (0 OpenAI). Human draft unchanged."
          : "Deterministic skeleton draft saved (0 OpenAI calls).",
    };
  }

  const { runContentAiDraft } = await import(
    "@/lib/growth/content-ai/generate"
  );

  const operation =
    mode === "regenerate"
      ? ("REGENERATE_FROM_BRIEF" as const)
      : mode === "revise"
        ? ("REVISE_CURRENT_DRAFT" as const)
        : ("INITIAL_GENERATE" as const);

  const result = await runContentAiDraft({
    planId,
    updatedByEmail: session.email,
    operatorNotes: notes,
    revisionInstruction,
    operation,
  });

  if (!result.ok) {
    return { success: false, message: result.error };
  }

  revalidatePath("/reports/growth/content");
  const where =
    result.target === "candidateDraftJson"
      ? "AI candidate (human draft unchanged)"
      : "initial AI draft";
  return {
    success: true,
    message: `${where} via ${result.model} (1 OpenAI call). Not published.`,
  };
}

export async function applyContentCandidateAction(
  _previous: ContentPlanActionState,
  formData: FormData,
): Promise<ContentPlanActionState> {
  const session = await requireInternalSession();
  const planId = String(formData.get("planId") ?? "").trim();
  if (!planId) {
    return { success: false, message: "Missing plan id." };
  }

  const { applyCandidateDraft } = await import(
    "@/lib/growth/content-plan-store"
  );
  const result = await applyCandidateDraft({
    id: planId,
    updatedByEmail: session.email,
  });
  if (!result.ok) {
    return { success: false, message: result.error };
  }

  revalidatePath("/reports/growth/content");
  return {
    success: true,
    message:
      "AI candidate applied to canonical human draft (0 OpenAI). Not approved/published.",
  };
}

export async function discardContentCandidateAction(
  _previous: ContentPlanActionState,
  formData: FormData,
): Promise<ContentPlanActionState> {
  const session = await requireInternalSession();
  const planId = String(formData.get("planId") ?? "").trim();
  if (!planId) {
    return { success: false, message: "Missing plan id." };
  }

  const { discardCandidateDraft } = await import(
    "@/lib/growth/content-plan-store"
  );
  const result = await discardCandidateDraft({
    id: planId,
    updatedByEmail: session.email,
  });
  if (!result.ok) {
    return { success: false, message: result.error };
  }

  revalidatePath("/reports/growth/content");
  return {
    success: true,
    message: "AI candidate discarded (0 OpenAI). Human draft unchanged.",
  };
}

export async function reopenContentPlanForReviewAction(
  _previous: ContentPlanActionState,
  formData: FormData,
): Promise<ContentPlanActionState> {
  const session = await requireInternalSession();
  const planId = String(formData.get("planId") ?? "").trim();
  if (!planId) {
    return { success: false, message: "Missing plan id." };
  }

  const { reopenContentPlanForReview } = await import(
    "@/lib/growth/content-plan-store"
  );
  const result = await reopenContentPlanForReview({
    id: planId,
    updatedByEmail: session.email,
  });
  if (!result.ok) {
    return { success: false, message: result.error };
  }

  revalidatePath("/reports/growth/content");
  return {
    success: true,
    message: "Plan reopened for review. AI revise/apply allowed again.",
  };
}

export async function saveContentHumanDraftAction(
  _previous: ContentPlanActionState,
  formData: FormData,
): Promise<ContentPlanActionState> {
  const session = await requireInternalSession();
  const planId = String(formData.get("planId") ?? "").trim();
  const draftRaw = String(formData.get("humanDraftJson") ?? "");

  if (!planId) {
    return { success: false, message: "Missing plan id." };
  }

  let humanDraftJson: unknown;
  try {
    humanDraftJson = JSON.parse(draftRaw);
  } catch {
    return { success: false, message: "humanDraftJson must be valid JSON." };
  }

  const { saveHumanDraft } = await import("@/lib/growth/content-plan-store");
  const result = await saveHumanDraft({
    id: planId,
    humanDraftJson,
    updatedByEmail: session.email,
  });
  if (!result.ok) {
    return { success: false, message: result.error };
  }

  revalidatePath("/reports/growth/content");
  return { success: true, message: "Human draft saved (AI draft preserved)." };
}

export async function approveContentPlanAction(
  _previous: ContentPlanActionState,
  formData: FormData,
): Promise<ContentPlanActionState> {
  const session = await requireInternalSession();
  const planId = String(formData.get("planId") ?? "").trim();
  if (!planId) {
    return { success: false, message: "Missing plan id." };
  }

  const { updateContentPlanStatus } = await import(
    "@/lib/growth/content-plan-store"
  );
  const result = await updateContentPlanStatus({
    id: planId,
    status: "APPROVED",
    updatedByEmail: session.email,
  });
  if (!result.ok) {
    return { success: false, message: result.error };
  }

  revalidatePath("/reports/growth/content");
  return {
    success: true,
    message: "Approved for human publish. Auto-publish remains disabled.",
  };
}

export async function markContentPlanPublishedAction(
  _previous: ContentPlanActionState,
  formData: FormData,
): Promise<ContentPlanActionState> {
  const session = await requireInternalSession();
  const planId = String(formData.get("planId") ?? "").trim();
  const publishedUrl = String(formData.get("publishedUrl") ?? "").trim();
  if (!planId || !publishedUrl) {
    return { success: false, message: "planId and publishedUrl required." };
  }

  const { updateContentPlanStatus } = await import(
    "@/lib/growth/content-plan-store"
  );
  const result = await updateContentPlanStatus({
    id: planId,
    status: "PUBLISHED",
    publishedUrl,
    updatedByEmail: session.email,
  });
  if (!result.ok) {
    return { success: false, message: result.error };
  }

  revalidatePath("/reports/growth/content");
  return {
    success: true,
    message: "Marked published. No Facebook ledger row auto-created.",
  };
}
