import "server-only";

import {
  CONTENT_PLANNER_PROMPT_VERSION,
  INITIAL_CONTENT_PLAN_SEEDS,
  buildDeterministicBrief,
  buildServicePageSkeletonDraft,
  evaluateClaimSafety,
  isContentPlanStatus,
  isContentPriorityBand,
  validateBriefForGeneration,
  type ContentBriefV1,
  type ContentPlanStatus,
  type ContentPriorityBand,
  type SeedContentPlan,
} from "@/lib/growth/content-intelligence";
import {
  appendGenerationHistory,
  canApplyCandidate,
  canDiscardCandidate,
  canRunAiMutation,
  decidePersistAiDraft,
  isAiBusyLockActive,
  nextAiBusyUntil,
  type ContentAiHistoryOperation,
} from "@/lib/growth/content-plan-revision";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isValidContentPlanSlug(value: string): boolean {
  return value.length >= 3 && value.length <= 80 && SLUG_RE.test(value);
}

export async function listContentPlans(limit = 50) {
  return prisma.growthContentPlan.findMany({
    orderBy: [{ createdAt: "desc" }],
    take: Math.min(limit, 100),
  });
}

export async function getContentPlanBySlug(slug: string) {
  return prisma.growthContentPlan.findUnique({ where: { slug } });
}

export async function createContentPlanFromSeed(
  seed: SeedContentPlan,
  createdByEmail: string,
): Promise<{ ok: true; id: string; created: boolean } | { ok: false; error: string }> {
  if (!isValidContentPlanSlug(seed.slug)) {
    return { ok: false, error: "Invalid slug" };
  }

  const existing = await prisma.growthContentPlan.findUnique({
    where: { slug: seed.slug },
    select: { id: true },
  });
  if (existing) {
    return { ok: true, id: existing.id, created: false };
  }

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
      searchOpportunitySlug: seed.sourceOpportunitySlug,
      whyRecommendedJson: seed.whyRecommended,
      briefJson: brief as unknown as Prisma.InputJsonValue,
      plannerPromptVersion: CONTENT_PLANNER_PROMPT_VERSION,
      createdByEmail,
    },
    select: { id: true },
  });

  return { ok: true, id: row.id, created: true };
}

export async function ensureInitialContentPlans(
  createdByEmail: string,
): Promise<{ created: number; skipped: number }> {
  let created = 0;
  let skipped = 0;
  for (const seed of INITIAL_CONTENT_PLAN_SEEDS) {
    const result = await createContentPlanFromSeed(seed, createdByEmail);
    if (!result.ok) {
      skipped += 1;
      continue;
    }
    if (result.created) created += 1;
    else skipped += 1;
  }
  return { created, skipped };
}

export async function updateContentPlanStatus(input: {
  id: string;
  status: ContentPlanStatus;
  updatedByEmail: string;
  publishedUrl?: string | null;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isContentPlanStatus(input.status)) {
    return { ok: false, error: "Invalid status" };
  }
  if (input.status === "PUBLISHED" && !input.publishedUrl?.trim()) {
    return {
      ok: false,
      error: "publishedUrl required when marking PUBLISHED (manual publish only)",
    };
  }

  const existing = await prisma.growthContentPlan.findUnique({
    where: { id: input.id },
  });
  if (!existing) {
    return { ok: false, error: "Plan not found" };
  }

  // AI / system must never jump to PUBLISHED without operator + URL.
  if (input.status === "PUBLISHED" && existing.status !== "APPROVED") {
    return {
      ok: false,
      error: "Plan must be APPROVED before PUBLISHED",
    };
  }

  if (input.status === "PUBLISHED") {
    const { canMarkPlanPublished, resolveCanonicalDraftSource } = await import(
      "@/lib/growth/content-performance"
    );
    const canonical = resolveCanonicalDraftSource({
      humanDraftJson: existing.humanDraftJson,
      generationJson: existing.generationJson,
      candidateDraftJson: existing.candidateDraftJson,
    });
    const gate = canMarkPlanPublished({
      status: existing.status,
      publishedUrl: input.publishedUrl ?? existing.publishedUrl,
      hasCanonicalDraft: canonical.source !== "none",
    });
    if (!gate.ok) {
      return { ok: false, error: gate.error! };
    }
  }

  const publishedAt =
    input.status === "PUBLISHED" ? new Date() : existing.publishedAt;

  let performanceJson: Prisma.InputJsonValue | undefined;
  if (input.status === "PUBLISHED") {
    const {
      performanceStateAfterPublish,
      parsePerformanceJson,
      SEO_PAGE_IMPLEMENTED_LINKS,
      SEO_PAGE_RECOMMENDED_LINKS,
      SEO_SERVICE_PAGE_PUBLIC_SLUG,
    } = await import("@/lib/growth/content-performance");
    const prev = parsePerformanceJson(existing.performanceJson);
    performanceJson = performanceStateAfterPublish({
      previous: prev,
      publishedAt: publishedAt!,
      publicContentSlug:
        existing.slug === "seo-service-page-v1"
          ? SEO_SERVICE_PAGE_PUBLIC_SLUG
          : existing.slug.replace(/-/g, "_").slice(0, 80),
      recommendedLinks: [...SEO_PAGE_RECOMMENDED_LINKS],
      implementedLinks: [...SEO_PAGE_IMPLEMENTED_LINKS],
    }) as unknown as Prisma.InputJsonValue;
  }

  await prisma.growthContentPlan.update({
    where: { id: input.id },
    data: {
      status: input.status,
      publishedUrl: input.publishedUrl?.trim() || existing.publishedUrl,
      publishedAt: input.status === "PUBLISHED" ? publishedAt : existing.publishedAt,
      ...(performanceJson ? { performanceJson } : {}),
      updatedByEmail: input.updatedByEmail,
    },
  });

  // Preserve search opportunity; mark PUBLISHED = we acted (not "SEO worked").
  if (
    input.status === "PUBLISHED" &&
    existing.searchOpportunitySlug
  ) {
    await prisma.growthSearchOpportunity.updateMany({
      where: { slug: existing.searchOpportunitySlug },
      data: {
        status: "PUBLISHED",
        currentPagePath:
          input.publishedUrl?.trim() || existing.publishedUrl || undefined,
        notes:
          "CONTENT_PUBLISHED: opportunity acted on. Not proof that SEO worked.",
        updatedByEmail: input.updatedByEmail,
      },
    });
  }

  return { ok: true };
}

export async function saveHumanDraft(input: {
  id: string;
  humanDraftJson: unknown;
  updatedByEmail: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const existing = await prisma.growthContentPlan.findUnique({
    where: { id: input.id },
  });
  if (!existing) {
    return { ok: false, error: "Plan not found" };
  }
  if (existing.status === "APPROVED" || existing.status === "PUBLISHED") {
    return {
      ok: false,
      error:
        "Plan is APPROVED/PUBLISHED. Reopen for review before editing the canonical draft.",
    };
  }

  const text = JSON.stringify(input.humanDraftJson);
  const safety = evaluateClaimSafety(text);
  await prisma.growthContentPlan.update({
    where: { id: input.id },
    data: {
      humanDraftJson: input.humanDraftJson as Prisma.InputJsonValue,
      reviewJson: {
        claimFlags: safety.flags,
        readiness: safety.readiness,
        source: "deterministic",
      } as Prisma.InputJsonValue,
      status: "IN_REVIEW",
      updatedByEmail: input.updatedByEmail,
    },
  });
  return { ok: true };
}

/**
 * Acquire exclusive AI busy lock. Returns false if another request holds the lock.
 */
export async function tryAcquireAiBusyLock(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const now = new Date();
  const until = nextAiBusyUntil(now);
  const result = await prisma.growthContentPlan.updateMany({
    where: {
      id,
      OR: [{ aiBusyUntil: null }, { aiBusyUntil: { lt: now } }],
    },
    data: { aiBusyUntil: until },
  });
  if (result.count === 0) {
    const exists = await prisma.growthContentPlan.findUnique({
      where: { id },
      select: { id: true, aiBusyUntil: true },
    });
    if (!exists) {
      return { ok: false, error: "Plan not found" };
    }
    return {
      ok: false,
      error: "AI revision already in progress. Wait and retry.",
    };
  }
  return { ok: true };
}

export async function releaseAiBusyLock(id: string): Promise<void> {
  await prisma.growthContentPlan.updateMany({
    where: { id },
    data: { aiBusyUntil: null },
  });
}

export async function persistAiDraftResult(input: {
  id: string;
  draftPayload: unknown;
  model: string;
  promptVersion: number;
  inputTokens: number | null;
  outputTokens: number | null;
  operation:
    | "INITIAL_GENERATE"
    | "REGENERATE_FROM_BRIEF"
    | "REVISE_CURRENT_DRAFT";
  updatedByEmail: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const existing = await prisma.growthContentPlan.findUnique({
    where: { id: input.id },
  });
  if (!existing) {
    return { ok: false, error: "Plan not found" };
  }

  const decision = decidePersistAiDraft({
    status: existing.status,
    hasHumanDraft: existing.humanDraftJson != null,
    operation: input.operation,
    aiBusyUntil: existing.aiBusyUntil,
  });
  if (!decision.ok) {
    return { ok: false, error: decision.error };
  }

  const history = appendGenerationHistory(existing.generationHistoryJson, {
    at: new Date().toISOString(),
    operation: input.operation,
    model: input.model,
    promptVersion: input.promptVersion,
    inputTokens: input.inputTokens,
    outputTokens: input.outputTokens,
    resultStatus: "ok",
  });

  const safety = evaluateClaimSafety(JSON.stringify(input.draftPayload));

  const data: Prisma.GrowthContentPlanUpdateInput = {
    generationHistoryJson: history as Prisma.InputJsonValue,
    reviewJson: {
      claimFlags: safety.flags,
      readiness: safety.readiness,
      source: "deterministic_post_generate",
    } as Prisma.InputJsonValue,
    status: decision.nextStatus,
    developerPromptVersion: input.promptVersion,
    lastModel: input.model,
    lastInputTokens: input.inputTokens,
    lastOutputTokens: input.outputTokens,
    updatedByEmail: input.updatedByEmail,
    aiBusyUntil: null,
  };

  if (decision.target === "generationJson") {
    data.generationJson = input.draftPayload as Prisma.InputJsonValue;
  } else {
    data.candidateDraftJson = input.draftPayload as Prisma.InputJsonValue;
  }

  // Explicit: never touch humanDraftJson here.
  await prisma.growthContentPlan.update({
    where: { id: input.id },
    data,
  });
  return { ok: true };
}

/** @deprecated Prefer persistAiDraftResult — kept for skeleton INITIAL path. */
export async function persistGeneratedDraft(input: {
  id: string;
  generationJson: unknown;
  model: string;
  promptVersion: number;
  inputTokens: number | null;
  outputTokens: number | null;
  operation: string;
  updatedByEmail: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const op =
    input.operation === "REGENERATE_FROM_BRIEF" ||
    input.operation === "REVISE_CURRENT_DRAFT"
      ? input.operation
      : "INITIAL_GENERATE";
  return persistAiDraftResult({
    id: input.id,
    draftPayload: input.generationJson,
    model: input.model,
    promptVersion: input.promptVersion,
    inputTokens: input.inputTokens,
    outputTokens: input.outputTokens,
    operation: op,
    updatedByEmail: input.updatedByEmail,
  });
}

export async function applyCandidateDraft(input: {
  id: string;
  updatedByEmail: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const existing = await prisma.growthContentPlan.findUnique({
    where: { id: input.id },
  });
  if (!existing) {
    return { ok: false, error: "Plan not found" };
  }
  if (isAiBusyLockActive(existing.aiBusyUntil)) {
    return {
      ok: false,
      error: "AI revision already in progress. Wait and retry.",
    };
  }

  const gate = canApplyCandidate({
    status: existing.status,
    hasCandidate: existing.candidateDraftJson != null,
  });
  if (!gate.ok) {
    return { ok: false, error: gate.error! };
  }

  const safety = evaluateClaimSafety(
    JSON.stringify(existing.candidateDraftJson),
  );
  const history = appendGenerationHistory(existing.generationHistoryJson, {
    at: new Date().toISOString(),
    operation: "APPLY_CANDIDATE",
    resultStatus: "applied",
  });

  await prisma.growthContentPlan.update({
    where: { id: input.id },
    data: {
      humanDraftJson: existing.candidateDraftJson as Prisma.InputJsonValue,
      candidateDraftJson: Prisma.DbNull,
      reviewJson: {
        claimFlags: safety.flags,
        readiness: safety.readiness,
        source: "apply_candidate",
      } as Prisma.InputJsonValue,
      generationHistoryJson: history as Prisma.InputJsonValue,
      status: "IN_REVIEW",
      updatedByEmail: input.updatedByEmail,
    },
  });
  return { ok: true };
}

export async function discardCandidateDraft(input: {
  id: string;
  updatedByEmail: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const existing = await prisma.growthContentPlan.findUnique({
    where: { id: input.id },
  });
  if (!existing) {
    return { ok: false, error: "Plan not found" };
  }

  const gate = canDiscardCandidate({
    hasCandidate: existing.candidateDraftJson != null,
  });
  if (!gate.ok) {
    return { ok: false, error: gate.error! };
  }

  const history = appendGenerationHistory(existing.generationHistoryJson, {
    at: new Date().toISOString(),
    operation: "DISCARD_CANDIDATE",
    resultStatus: "discarded",
  });

  await prisma.growthContentPlan.update({
    where: { id: input.id },
    data: {
      candidateDraftJson: Prisma.DbNull,
      generationHistoryJson: history as Prisma.InputJsonValue,
      updatedByEmail: input.updatedByEmail,
      // humanDraftJson intentionally untouched
    },
  });
  return { ok: true };
}

export async function reopenContentPlanForReview(input: {
  id: string;
  updatedByEmail: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const existing = await prisma.growthContentPlan.findUnique({
    where: { id: input.id },
  });
  if (!existing) {
    return { ok: false, error: "Plan not found" };
  }
  if (existing.status !== "APPROVED") {
    return {
      ok: false,
      error: "Only APPROVED plans can reopen for review.",
    };
  }

  const history = appendGenerationHistory(existing.generationHistoryJson, {
    at: new Date().toISOString(),
    operation: "REOPEN_FOR_REVIEW",
    resultStatus: "ok",
  });

  await prisma.growthContentPlan.update({
    where: { id: input.id },
    data: {
      status: "IN_REVIEW",
      generationHistoryJson: history as Prisma.InputJsonValue,
      updatedByEmail: input.updatedByEmail,
    },
  });
  return { ok: true };
}

export async function recordAiOperationFailure(input: {
  id: string;
  operation: ContentAiHistoryOperation;
  updatedByEmail: string;
}): Promise<void> {
  const existing = await prisma.growthContentPlan.findUnique({
    where: { id: input.id },
    select: { generationHistoryJson: true },
  });
  if (!existing) return;

  const history = appendGenerationHistory(existing.generationHistoryJson, {
    at: new Date().toISOString(),
    operation: input.operation,
    resultStatus: "error",
  });

  await prisma.growthContentPlan.update({
    where: { id: input.id },
    data: {
      generationHistoryJson: history as Prisma.InputJsonValue,
      aiBusyUntil: null,
      updatedByEmail: input.updatedByEmail,
    },
  });
}

export async function applySkeletonDraftWithoutOpenAi(input: {
  id: string;
  updatedByEmail: string;
  /** When human draft exists, skeleton lands as candidate (regenerate). */
  asRegenerateCandidate?: boolean;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const plan = await prisma.growthContentPlan.findUnique({
    where: { id: input.id },
  });
  if (!plan) {
    return { ok: false, error: "Plan not found" };
  }
  const brief = plan.briefJson as ContentBriefV1 | null;
  if (!brief) {
    return { ok: false, error: "Brief required" };
  }
  const validation = validateBriefForGeneration(brief);
  if (!validation.ok) {
    return { ok: false, error: validation.errors.join("; ") };
  }

  const gate = canRunAiMutation(plan.status);
  if (!gate.ok) {
    return { ok: false, error: gate.error! };
  }

  const draft =
    brief.contentType === "SERVICE_PAGE"
      ? buildServicePageSkeletonDraft(brief)
      : {
          title: brief.workingTitle,
          outline: brief.supportingQuestions,
          bodyMarkdown: `Draft placeholder for ${brief.contentType}. Run GENERATE_DRAFT when OpenAI is configured.`,
          cta: brief.cta,
          internalLinks: brief.internalLinkTargets,
          flags: brief.founderInputRequired
            ? ["FOUNDER_INPUT_REQUIRED"]
            : [],
        };

  const hasHuman = plan.humanDraftJson != null;
  const operation =
    hasHuman || input.asRegenerateCandidate
      ? "REGENERATE_FROM_BRIEF"
      : "INITIAL_GENERATE";

  return persistAiDraftResult({
    id: input.id,
    draftPayload: {
      mode: "skeleton",
      draft,
    },
    model: "deterministic-skeleton",
    promptVersion: CONTENT_PLANNER_PROMPT_VERSION,
    inputTokens: null,
    outputTokens: null,
    operation,
    updatedByEmail: input.updatedByEmail,
  });
}

export async function updateContentPlanPriority(input: {
  id: string;
  priorityBand: ContentPriorityBand;
  updatedByEmail: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isContentPriorityBand(input.priorityBand)) {
    return { ok: false, error: "Invalid priority" };
  }
  await prisma.growthContentPlan.update({
    where: { id: input.id },
    data: {
      priorityBand: input.priorityBand,
      updatedByEmail: input.updatedByEmail,
    },
  });
  return { ok: true };
}

/**
 * Create a Facebook derivative plan from a published (or approved) source plan.
 * Does NOT create GrowthContentRecord.
 */
export async function createDerivativeContentPlan(input: {
  sourcePlanId: string;
  derivative: "FACEBOOK_COMPANY" | "FACEBOOK_FOUNDER";
  createdByEmail: string;
}): Promise<
  | { ok: true; id: string; slug: string; created: boolean }
  | { ok: false; error: string }
> {
  const source = await prisma.growthContentPlan.findUnique({
    where: { id: input.sourcePlanId },
  });
  if (!source) {
    return { ok: false, error: "Source plan not found" };
  }
  if (source.status !== "PUBLISHED" && source.status !== "APPROVED") {
    return {
      ok: false,
      error: "Derivative plans require APPROVED or PUBLISHED source.",
    };
  }

  const { facebookCompanyDerivativeSeed, facebookFounderDerivativeSeed } =
    await import("@/lib/growth/content-distribution");
  const seedBase =
    input.derivative === "FACEBOOK_FOUNDER"
      ? facebookFounderDerivativeSeed({
          sourcePlanSlug: source.slug,
          sourcePublishedUrl: source.publishedUrl ?? source.targetServicePath ?? "/seo",
        })
      : facebookCompanyDerivativeSeed({
          sourcePlanSlug: source.slug,
          sourcePublishedUrl: source.publishedUrl ?? source.targetServicePath ?? "/seo",
        });

  if (!isValidContentPlanSlug(seedBase.slug)) {
    return { ok: false, error: "Invalid derivative slug" };
  }

  const existing = await prisma.growthContentPlan.findUnique({
    where: { slug: seedBase.slug },
    select: { id: true },
  });
  if (existing) {
    return {
      ok: true,
      id: existing.id,
      slug: seedBase.slug,
      created: false,
    };
  }

  const { buildDeterministicBrief, requiresFounderInput } = await import(
    "@/lib/growth/content-intelligence"
  );

  const seed: SeedContentPlan = {
    slug: seedBase.slug,
    contentType: seedBase.contentType,
    sourceType: "CONTENT_REFRESH",
    sourceOpportunitySlug: null,
    topic: seedBase.topic,
    workingTitle: seedBase.workingTitle,
    audience: seedBase.audience,
    primaryObjective: seedBase.primaryObjective,
    searchIntent: null,
    pageType: null,
    targetServicePath: seedBase.targetServicePath,
    publisher: seedBase.publisher,
    priorityBand: seedBase.priorityBand,
    whyRecommended: seedBase.whyRecommended,
  };

  const brief = buildDeterministicBrief(seed);
  if (requiresFounderInput(seed.contentType)) {
    // Brief validation will block generation until founder input — expected.
  }

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
      searchOpportunitySlug: null,
      sourceAssetSlug: source.slug,
      whyRecommendedJson: seed.whyRecommended,
      briefJson: brief as unknown as Prisma.InputJsonValue,
      plannerPromptVersion: CONTENT_PLANNER_PROMPT_VERSION,
      createdByEmail: input.createdByEmail,
    },
    select: { id: true, slug: true },
  });

  return { ok: true, id: row.id, slug: row.slug, created: true };
}

export async function recordManualSearchPerformance(input: {
  id: string;
  capture: {
    windowStart: string;
    windowEnd: string;
    clicks: number | null;
    impressions: number | null;
    ctr: number | null;
    averagePosition: number | null;
    queryDataStatus: "NO_DATA" | "NOT_CAPTURED" | "INSUFFICIENT_DATA" | "AVAILABLE";
    notes?: string;
  };
  updatedByEmail: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const existing = await prisma.growthContentPlan.findUnique({
    where: { id: input.id },
  });
  if (!existing) {
    return { ok: false, error: "Plan not found" };
  }
  if (existing.status !== "PUBLISHED" && existing.status !== "MONITORING") {
    return {
      ok: false,
      error: "Search performance capture requires PUBLISHED (or MONITORING) plan.",
    };
  }

  const {
    deriveMeasurementAndLabel,
    parsePerformanceJson,
    performanceStateAfterPublish,
    SEO_PAGE_IMPLEMENTED_LINKS,
    SEO_PAGE_RECOMMENDED_LINKS,
    SEO_SERVICE_PAGE_PUBLIC_SLUG,
  } = await import("@/lib/growth/content-performance");
  const { validateSearchCtr } = await import("@/lib/growth/content-review");

  const ctrCheck = validateSearchCtr({
    clicks: input.capture.clicks,
    impressions: input.capture.impressions,
    ctr: input.capture.ctr,
  });
  if (!ctrCheck.ok) {
    return { ok: false, error: ctrCheck.warning ?? "CTR validation failed" };
  }
  if (
    input.capture.averagePosition != null &&
    !(input.capture.averagePosition > 0)
  ) {
    return {
      ok: false,
      error: "averagePosition must be a positive number when captured.",
    };
  }

  let state = parsePerformanceJson(existing.performanceJson);
  if (!state) {
    state = performanceStateAfterPublish({
      previous: null,
      publishedAt: existing.publishedAt ?? new Date(),
      publicContentSlug:
        existing.slug === "seo-service-page-v1"
          ? SEO_SERVICE_PAGE_PUBLIC_SLUG
          : existing.slug.replace(/-/g, "_").slice(0, 80),
      recommendedLinks: [...SEO_PAGE_RECOMMENDED_LINKS],
      implementedLinks: [...SEO_PAGE_IMPLEMENTED_LINKS],
    });
  }

  const capture = {
    ...input.capture,
    capturedAt: new Date().toISOString(),
    evidenceKind: "OBSERVED" as const,
  };
  const searchEvidence = [...state.searchEvidence, capture].slice(-24);
  const derived = deriveMeasurementAndLabel({
    publishedAt: existing.publishedAt ?? state.publishedAt,
    latestSearch: capture,
  });

  await prisma.growthContentPlan.update({
    where: { id: input.id },
    data: {
      performanceJson: {
        ...state,
        searchEvidence,
        measurementState: derived.measurementState,
        performanceLabel: derived.performanceLabel,
      } as unknown as Prisma.InputJsonValue,
      updatedByEmail: input.updatedByEmail,
    },
  });
  return { ok: true };
}

export async function updateContentIndexingState(input: {
  id: string;
  indexingState: string;
  updatedByEmail: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const { REVIEW_INDEXING_STATES } = await import("@/lib/growth/content-review");
  if (
    !(REVIEW_INDEXING_STATES as readonly string[]).includes(input.indexingState)
  ) {
    return { ok: false, error: "Invalid indexing state" };
  }

  const existing = await prisma.growthContentPlan.findUnique({
    where: { id: input.id },
  });
  if (!existing) return { ok: false, error: "Plan not found" };
  if (existing.status !== "PUBLISHED" && existing.status !== "MONITORING") {
    return { ok: false, error: "Indexing state requires published plan." };
  }

  const {
    parsePerformanceJson,
    performanceStateAfterPublish,
    SEO_PAGE_IMPLEMENTED_LINKS,
    SEO_PAGE_RECOMMENDED_LINKS,
    SEO_SERVICE_PAGE_PUBLIC_SLUG,
  } = await import("@/lib/growth/content-performance");

  let state = parsePerformanceJson(existing.performanceJson);
  if (!state) {
    state = performanceStateAfterPublish({
      previous: null,
      publishedAt: existing.publishedAt ?? new Date(),
      publicContentSlug:
        existing.slug === "seo-service-page-v1"
          ? SEO_SERVICE_PAGE_PUBLIC_SLUG
          : existing.slug.replace(/-/g, "_").slice(0, 80),
      recommendedLinks: [...SEO_PAGE_RECOMMENDED_LINKS],
      implementedLinks: [...SEO_PAGE_IMPLEMENTED_LINKS],
    });
  }

  await prisma.growthContentPlan.update({
    where: { id: input.id },
    data: {
      performanceJson: {
        ...state,
        indexingState: input.indexingState,
      } as unknown as Prisma.InputJsonValue,
      updatedByEmail: input.updatedByEmail,
    },
  });
  return { ok: true };
}

export async function recordContentPerformanceReview(input: {
  id: string;
  checkpoint: string;
  decision: string;
  notes?: string;
  updatedByEmail: string;
}): Promise<{ ok: true; decision: string } | { ok: false; error: string }> {
  const existing = await prisma.growthContentPlan.findUnique({
    where: { id: input.id },
  });
  if (!existing) return { ok: false, error: "Plan not found" };

  const {
    appendReviewHistory,
    canReviewPerformance,
    computeEvidenceStrength,
    isContentReviewCheckpoint,
    isContentReviewDecision,
    recommendReviewDecision,
    refreshBlockedWithoutEvidence,
  } = await import("@/lib/growth/content-review");
  const { parsePerformanceJson } = await import(
    "@/lib/growth/content-performance"
  );

  if (!isContentReviewCheckpoint(input.checkpoint)) {
    return { ok: false, error: "Invalid checkpoint" };
  }
  if (!isContentReviewDecision(input.decision)) {
    return { ok: false, error: "Invalid decision" };
  }

  const state = parsePerformanceJson(existing.performanceJson);
  if (!state) {
    return { ok: false, error: "performanceJson missing — mark published first." };
  }

  const eligible = canReviewPerformance({
    planStatus: existing.status,
    measurementState: state.measurementState,
    publishedAt: state.publishedAt,
  });
  if (!eligible.ok) {
    return { ok: false, error: eligible.reason };
  }

  const latestSearch =
    state.searchEvidence[state.searchEvidence.length - 1] ?? null;
  const strength = computeEvidenceStrength({
    publishedAt: state.publishedAt,
    latestSearch,
    indexingState: state.indexingState,
  });
  const recommended = recommendReviewDecision({
    publishedAt: state.publishedAt,
    measurementState: state.measurementState,
    performanceLabel: state.performanceLabel,
    indexingState: state.indexingState,
    evidenceStrength: strength,
    latestSearch,
  });

  const decision = input.decision;
  const refreshGate = refreshBlockedWithoutEvidence({
    decision,
    evidenceStrength: strength,
    performanceLabel: state.performanceLabel,
  });
  if (refreshGate.blocked) {
    return { ok: false, error: refreshGate.reason };
  }

  const review = {
    reviewVersion: 1 as const,
    id: `rev_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    checkpoint: input.checkpoint,
    createdAt: new Date().toISOString(),
    createdByEmail: input.updatedByEmail,
    decision,
    evidenceStrength: strength,
    performanceLabel: state.performanceLabel,
    measurementState: state.measurementState,
    indexingState: state.indexingState,
    observedFacts: recommended.observedFacts,
    interpretations: recommended.interpretations,
    hypotheses: recommended.hypotheses,
    recommendations: recommended.recommendations,
    notes: input.notes,
    searchWindowStart: latestSearch?.windowStart,
    searchWindowEnd: latestSearch?.windowEnd,
    comparedToPrevious: false,
  };

  const nextState = appendReviewHistory(state, review);

  await prisma.growthContentPlan.update({
    where: { id: input.id },
    data: {
      performanceJson: nextState as unknown as Prisma.InputJsonValue,
      updatedByEmail: input.updatedByEmail,
    },
  });

  if (existing.searchOpportunitySlug) {
    const opportunityUpdate: {
      notes: string;
      updatedByEmail: string;
      status?: "MONITORING";
    } = {
      notes: `Review ${decision} @ ${input.checkpoint}; strength=${strength}. Original provenance preserved.`,
      updatedByEmail: input.updatedByEmail,
    };
    if (decision === "KEEP_MONITORING" || decision === "NO_CHANGE") {
      opportunityUpdate.status = "MONITORING";
    }
    await prisma.growthSearchOpportunity.updateMany({
      where: { slug: existing.searchOpportunitySlug },
      data: opportunityUpdate,
    });
  }

  return { ok: true, decision };
}

export async function createRefreshPlanFromReview(input: {
  sourcePlanId: string;
  createdByEmail: string;
  reason: string;
}): Promise<
  | { ok: true; id: string; slug: string; created: boolean }
  | { ok: false; error: string }
> {
  const source = await prisma.growthContentPlan.findUnique({
    where: { id: input.sourcePlanId },
  });
  if (!source) return { ok: false, error: "Source plan not found" };
  if (source.status !== "PUBLISHED" && source.status !== "MONITORING") {
    return { ok: false, error: "Refresh requires published source asset." };
  }

  const { getReviewHistory } = await import("@/lib/growth/content-review");
  const { parsePerformanceJson } = await import(
    "@/lib/growth/content-performance"
  );
  const state = parsePerformanceJson(source.performanceJson);
  const history = getReviewHistory(state);
  const last = history[history.length - 1];
  if (!last || last.decision !== "REFRESH_CONTENT") {
    return {
      ok: false,
      error:
        "Record a REFRESH_CONTENT review decision before creating a refresh plan.",
    };
  }

  const slug = `refresh-${source.slug}`.slice(0, 80);
  const existing = await prisma.growthContentPlan.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (existing) {
    return { ok: true, id: existing.id, slug, created: false };
  }

  const seed: SeedContentPlan = {
    slug,
    contentType: source.contentType as SeedContentPlan["contentType"],
    sourceType: "CONTENT_REFRESH",
    sourceOpportunitySlug: source.searchOpportunitySlug,
    topic: source.topic as SeedContentPlan["topic"],
    workingTitle: `Refresh: ${source.workingTitle}`.slice(0, 200),
    audience: source.audience,
    primaryObjective:
      source.primaryObjective as SeedContentPlan["primaryObjective"],
    searchIntent:
      (source.searchIntent as SeedContentPlan["searchIntent"]) ?? null,
    pageType: (source.pageType as SeedContentPlan["pageType"]) ?? null,
    targetServicePath: source.targetServicePath ?? source.publishedUrl,
    publisher: source.publisher as SeedContentPlan["publisher"],
    priorityBand: "NEXT",
    whyRecommended: [
      input.reason.slice(0, 300),
      `Source asset: ${source.slug}`,
      `Review id: ${last.id}`,
      "Do not create a duplicate URL — refresh existing published path.",
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
      searchOpportunitySlug: seed.sourceOpportunitySlug,
      sourceAssetSlug: source.slug,
      whyRecommendedJson: seed.whyRecommended,
      briefJson: brief as unknown as Prisma.InputJsonValue,
      plannerPromptVersion: CONTENT_PLANNER_PROMPT_VERSION,
      createdByEmail: input.createdByEmail,
    },
    select: { id: true, slug: true },
  });

  return { ok: true, id: row.id, slug: row.slug, created: true };
}
