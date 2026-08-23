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
import { persistGeneratedDraft } from "@/lib/growth/content-plan-store";
import { prisma } from "@/lib/prisma";

import {
  MissingOpenAiKeyError,
  OpenAiProviderError,
  createContentAiProvider,
} from "./openai-provider";
import {
  buildContentDeveloperSystemPrompt,
  buildContentDeveloperUserPrompt,
} from "./prompt";
import { contentDraftStructuredSchema } from "./schema";

export type GenerateContentDraftResult =
  | { ok: true; model: string; usedOpenAi: true }
  | { ok: false; error: string; code?: string };

/**
 * Operator-initiated draft generation. Exactly one OpenAI call when configured.
 * Does not publish. Does not create GrowthContentRecord.
 */
export async function generateContentDraft(input: {
  planId: string;
  updatedByEmail: string;
  operatorNotes?: string | null;
  provider?: ReturnType<typeof createContentAiProvider>;
}): Promise<GenerateContentDraftResult> {
  const plan = await prisma.growthContentPlan.findUnique({
    where: { id: input.planId },
  });
  if (!plan) {
    return { ok: false, error: "Plan not found", code: "NOT_FOUND" };
  }
  if (plan.humanDraftJson != null) {
    return {
      ok: false,
      error: "Human draft exists — edit it instead of regenerating",
      code: "HUMAN_DRAFT_EXISTS",
    };
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

  const provider =
    input.provider ?? createContentAiProvider({ apiKey });
  const model = getOpenAiAuditModel();
  const timeoutMs = getAiGenerationTimeoutMs();

  try {
    const result = await provider.generate({
      model,
      system: buildContentDeveloperSystemPrompt(),
      user: buildContentDeveloperUserPrompt({
        brief,
        operatorNotes: input.operatorNotes,
      }),
      timeoutMs,
    });

    const parsed = contentDraftStructuredSchema.safeParse(result.parsed);
    if (!parsed.success) {
      return {
        ok: false,
        error: "Model output failed schema validation",
        code: "INVALID_OUTPUT",
      };
    }

    const safety = evaluateClaimSafety(
      `${parsed.data.bodyMarkdown}\n${parsed.data.cta}\n${parsed.data.seoTitle ?? ""}`,
    );

    const persist = await persistGeneratedDraft({
      id: input.planId,
      generationJson: {
        mode: "openai",
        promptVersion: CONTENT_DEVELOPER_PROMPT_VERSION,
        draft: {
          ...parsed.data,
          claimFlags: [
            ...parsed.data.claimFlags,
            ...safety.flags,
          ],
        },
      },
      model: result.model,
      promptVersion: CONTENT_DEVELOPER_PROMPT_VERSION,
      inputTokens: result.usage.inputTokens,
      outputTokens: result.usage.outputTokens,
      operation: "GENERATE_DRAFT",
      updatedByEmail: input.updatedByEmail,
    });

    if (!persist.ok) {
      return { ok: false, error: persist.error, code: "PERSIST_FAILED" };
    }

    return { ok: true, model: result.model, usedOpenAi: true };
  } catch (error) {
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
