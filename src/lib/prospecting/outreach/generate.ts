import "server-only";

import {
  getAiGenerationTimeoutMs,
  getOpenAiApiKey,
  getOpenAiAuditModel,
} from "@/lib/website-audit/ai-interpretation/config";
import {
  AiGenerationTimeoutError,
  InvalidAiOutputError,
  withTimeout,
} from "@/lib/website-audit/ai-interpretation/errors";
import {
  MissingOpenAiKeyError,
  OpenAiTimeoutError,
} from "@/lib/website-audit/ai-interpretation/openai-provider";

import { compactOutreachContextJson } from "./context";
import { OUTREACH_GENERATION_TIMEOUT_MS } from "./constants";
import { createOpenAiOutreachProvider } from "./openai-provider";
import { buildOutreachUserPrompt, OUTREACH_SYSTEM_PROMPT } from "./prompt";
import type { OutreachDraftContext, OutreachDraftOutput } from "./types";
import { validateOutreachDraftOutput } from "./validate";

export interface GeneratedOutreachDraft {
  subject: string;
  body: string;
  model: string;
  promptTokens: number | null;
  completionTokens: number | null;
}

export function getOutreachDraftModel(): string {
  return getOpenAiAuditModel();
}

export async function generateOutreachDraft(options: {
  context: OutreachDraftContext;
}): Promise<GeneratedOutreachDraft> {
  const provider = createOpenAiOutreachProvider({
    apiKey: getOpenAiApiKey(),
  });
  const timeoutMs = Math.min(
    getAiGenerationTimeoutMs(),
    OUTREACH_GENERATION_TIMEOUT_MS,
  );

  try {
    const result = await withTimeout(
      provider.generate({
        model: getOutreachDraftModel(),
        system: OUTREACH_SYSTEM_PROMPT,
        user: buildOutreachUserPrompt(compactOutreachContextJson(options.context)),
        timeoutMs,
      }),
      timeoutMs,
    );

    const validated = validateOutreachDraftOutput(result.parsed, options.context);

    if (!validated.ok) {
      throw new InvalidAiOutputError(validated.reason);
    }

    return {
      subject: validated.content.subject,
      body: validated.content.body,
      model: result.model,
      promptTokens: result.usage.inputTokens,
      completionTokens: result.usage.outputTokens,
    };
  } catch (error) {
    if (error instanceof MissingOpenAiKeyError) {
      throw error;
    }

    if (
      error instanceof OpenAiTimeoutError ||
      error instanceof AiGenerationTimeoutError
    ) {
      throw new AiGenerationTimeoutError();
    }

    if (error instanceof InvalidAiOutputError) {
      throw error;
    }

    throw new InvalidAiOutputError("generation-failed");
  }
}

export type { OutreachDraftOutput };
