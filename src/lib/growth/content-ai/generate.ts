import "server-only";

import {
  getAiGenerationTimeoutMs,
  getOpenAiApiKey,
  getOpenAiAuditModel,
} from "@/lib/website-audit/ai-interpretation/config";
import {
  CONTENT_DEVELOPER_PROMPT_VERSION,
  evaluateClaimSafety,
  validateBriefForGeneration,
  type ContentBriefV1,
} from "@/lib/growth/content-intelligence";
import {
  persistAiDraftResult,
  recordAiOperationFailure,
  releaseAiBusyLock,
  tryAcquireAiBusyLock,
} from "@/lib/growth/content-plan-store";
import { canRunAiMutation } from "@/lib/growth/content-plan-revision";
import { prisma } from "@/lib/prisma";

import {
  MissingOpenAiKeyError,
  OpenAiProviderError,
  createContentAiProvider,
} from "./openai-provider";
import {
  buildContentDeveloperSystemPrompt,
  buildContentDeveloperUserPrompt,
  buildContentReviseUserPrompt,
} from "./prompt";
import { contentDraftStructuredSchema } from "./schema";

export type GenerateContentDraftResult =
  | { ok: true; model: string; usedOpenAi: true; target: string }
  | { ok: false; error: string; code?: string };

export type ContentAiOperation =
  | "INITIAL_GENERATE"
  | "REGENERATE_FROM_BRIEF"
  | "REVISE_CURRENT_DRAFT";

/**
 * Operator-initiated AI draft. Never writes humanDraftJson.
 * INITIAL → generationJson when no human draft.
 * REGENERATE / REVISE → candidateDraftJson only.
 */
export async function runContentAiDraft(input: {
  planId: string;
  updatedByEmail: string;
  operation: ContentAiOperation;
  operatorNotes?: string | null;
  revisionInstruction?: string | null;
  provider?: ReturnType<typeof createContentAiProvider>;
}): Promise<GenerateContentDraftResult> {
  const plan = await prisma.growthContentPlan.findUnique({
    where: { id: input.planId },
  });
  if (!plan) {
    return { ok: false, error: "Plan not found", code: "NOT_FOUND" };
  }

  const statusGate = canRunAiMutation(plan.status);
  if (!statusGate.ok) {
    return { ok: false, error: statusGate.error!, code: "STATUS_BLOCKED" };
  }

  if (
    input.operation === "INITIAL_GENERATE" &&
    plan.humanDraftJson != null
  ) {
    return {
      ok: false,
      error:
        "Human draft exists — use Regenerate from Brief or Revise with AI.",
      code: "USE_CANDIDATE_FLOW",
    };
  }

  if (
    input.operation === "REVISE_CURRENT_DRAFT" &&
    plan.humanDraftJson == null
  ) {
    return {
      ok: false,
      error: "Revise requires a current human/canonical draft.",
      code: "NO_HUMAN_DRAFT",
    };
  }

  if (input.operation === "REVISE_CURRENT_DRAFT") {
    const instruction = input.revisionInstruction?.trim();
    if (!instruction) {
      return {
        ok: false,
        error: "Revision instruction is required.",
        code: "NO_INSTRUCTION",
      };
    }
  }

  const brief = plan.briefJson as ContentBriefV1 | null;
  if (!brief) {
    return { ok: false, error: "Brief missing", code: "NO_BRIEF" };
  }

  const validation = validateBriefForGeneration(brief);
  if (!validation.ok) {
    return {
      ok: false,
      error: validation.errors.join("; "),
      code: "INVALID_BRIEF",
    };
  }

  const apiKey = getOpenAiApiKey();
  if (!apiKey) {
    return {
      ok: false,
      error: "OpenAI is not configured (OPENAI_API_KEY).",
      code: "NOT_CONFIGURED",
    };
  }

  const lock = await tryAcquireAiBusyLock(input.planId);
  if (!lock.ok) {
    return { ok: false, error: lock.error, code: "AI_BUSY" };
  }

  const provider =
    input.provider ?? createContentAiProvider({ apiKey });
  const model = getOpenAiAuditModel();
  const timeoutMs = getAiGenerationTimeoutMs();

  try {
    const userPrompt =
      input.operation === "REVISE_CURRENT_DRAFT"
        ? buildContentReviseUserPrompt({
            brief,
            currentHumanDraft: plan.humanDraftJson,
            revisionInstruction: input.revisionInstruction!.trim(),
            operatorNotes: input.operatorNotes,
          })
        : buildContentDeveloperUserPrompt({
            brief,
            operatorNotes: input.operatorNotes,
          });

    const result = await provider.generate({
      model,
      system: buildContentDeveloperSystemPrompt(),
      user: userPrompt,
      timeoutMs,
    });

    const parsed = contentDraftStructuredSchema.safeParse(result.parsed);
    if (!parsed.success) {
      await recordAiOperationFailure({
        id: input.planId,
        operation: input.operation,
        updatedByEmail: input.updatedByEmail,
      });
      return {
        ok: false,
        error: "Model output failed schema validation",
        code: "INVALID_OUTPUT",
      };
    }

    const safety = evaluateClaimSafety(
      `${parsed.data.bodyMarkdown}\n${parsed.data.cta}\n${parsed.data.seoTitle ?? ""}`,
    );

    const draftPayload = {
      mode: "openai" as const,
      promptVersion: CONTENT_DEVELOPER_PROMPT_VERSION,
      operation: input.operation,
      draft: {
        ...parsed.data,
        claimFlags: [...parsed.data.claimFlags, ...safety.flags],
      },
    };

    const persist = await persistAiDraftResult({
      id: input.planId,
      draftPayload,
      model: result.model,
      promptVersion: CONTENT_DEVELOPER_PROMPT_VERSION,
      inputTokens: result.usage.inputTokens,
      outputTokens: result.usage.outputTokens,
      operation: input.operation,
      updatedByEmail: input.updatedByEmail,
    });

    if (!persist.ok) {
      await releaseAiBusyLock(input.planId);
      return { ok: false, error: persist.error, code: "PERSIST_FAILED" };
    }

    const target =
      input.operation === "INITIAL_GENERATE" && plan.humanDraftJson == null
        ? "generationJson"
        : "candidateDraftJson";

    return {
      ok: true,
      model: result.model,
      usedOpenAi: true,
      target,
    };
  } catch (error) {
    await recordAiOperationFailure({
      id: input.planId,
      operation: input.operation,
      updatedByEmail: input.updatedByEmail,
    });
    if (error instanceof MissingOpenAiKeyError) {
      return {
        ok: false,
        error: "OpenAI is not configured.",
        code: "NOT_CONFIGURED",
      };
    }
    if (error instanceof OpenAiProviderError) {
      return { ok: false, error: error.message, code: error.category };
    }
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Generation failed",
      code: "PROVIDER",
    };
  }
}

/** Initial generate when no human draft. */
export async function generateContentDraft(input: {
  planId: string;
  updatedByEmail: string;
  operatorNotes?: string | null;
  provider?: ReturnType<typeof createContentAiProvider>;
}): Promise<GenerateContentDraftResult> {
  return runContentAiDraft({
    ...input,
    operation: "INITIAL_GENERATE",
  });
}

export async function regenerateContentDraftFromBrief(input: {
  planId: string;
  updatedByEmail: string;
  operatorNotes?: string | null;
  provider?: ReturnType<typeof createContentAiProvider>;
}): Promise<GenerateContentDraftResult> {
  return runContentAiDraft({
    ...input,
    operation: "REGENERATE_FROM_BRIEF",
  });
}

export async function reviseContentDraftWithAi(input: {
  planId: string;
  updatedByEmail: string;
  revisionInstruction: string;
  operatorNotes?: string | null;
  provider?: ReturnType<typeof createContentAiProvider>;
}): Promise<GenerateContentDraftResult> {
  return runContentAiDraft({
    ...input,
    operation: "REVISE_CURRENT_DRAFT",
  });
}
