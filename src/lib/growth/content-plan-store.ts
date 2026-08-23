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
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

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

  await prisma.growthContentPlan.update({
    where: { id: input.id },
    data: {
      status: input.status,
      publishedUrl: input.publishedUrl?.trim() || existing.publishedUrl,
      updatedByEmail: input.updatedByEmail,
    },
  });
  return { ok: true };
}

export async function saveHumanDraft(input: {
  id: string;
  humanDraftJson: unknown;
  updatedByEmail: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
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
  const existing = await prisma.growthContentPlan.findUnique({
    where: { id: input.id },
  });
  if (!existing) {
    return { ok: false, error: "Plan not found" };
  }

  // Never overwrite human edits with regeneration.
  if (existing.humanDraftJson != null) {
    return {
      ok: false,
      error:
        "Human draft exists — clear or edit human draft before regenerating AI draft",
    };
  }

  const history = Array.isArray(existing.generationHistoryJson)
    ? (existing.generationHistoryJson as unknown[])
    : [];
  history.push({
    at: new Date().toISOString(),
    operation: input.operation,
    model: input.model,
    promptVersion: input.promptVersion,
    inputTokens: input.inputTokens,
    outputTokens: input.outputTokens,
  });

  const safety = evaluateClaimSafety(JSON.stringify(input.generationJson));

  await prisma.growthContentPlan.update({
    where: { id: input.id },
    data: {
      generationJson: input.generationJson as Prisma.InputJsonValue,
      generationHistoryJson: history as Prisma.InputJsonValue,
      reviewJson: {
        claimFlags: safety.flags,
        readiness: safety.readiness,
        source: "deterministic_post_generate",
      } as Prisma.InputJsonValue,
      status: "DRAFT",
      developerPromptVersion: input.promptVersion,
      lastModel: input.model,
      lastInputTokens: input.inputTokens,
      lastOutputTokens: input.outputTokens,
      updatedByEmail: input.updatedByEmail,
    },
  });
  return { ok: true };
}

export async function applySkeletonDraftWithoutOpenAi(input: {
  id: string;
  updatedByEmail: string;
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

  return persistGeneratedDraft({
    id: input.id,
    generationJson: {
      mode: "skeleton",
      draft,
    },
    model: "deterministic-skeleton",
    promptVersion: CONTENT_PLANNER_PROMPT_VERSION,
    inputTokens: null,
    outputTokens: null,
    operation: "GENERATE_DRAFT",
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
