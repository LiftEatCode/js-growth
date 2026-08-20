import "server-only";

import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";

import { buildOpenAiInterpretationModelParams } from "@/lib/website-audit/ai-interpretation/openai-params";
import {
  MissingOpenAiKeyError,
  OpenAiProviderError,
  OpenAiTimeoutError,
} from "@/lib/website-audit/ai-interpretation/openai-provider";

import { competitiveInterpretationContentSchema } from "./schema";

export interface CompetitiveInterpretationProviderResult {
  parsed: unknown;
  model: string;
  usage: {
    inputTokens: number | null;
    outputTokens: number | null;
    totalTokens: number | null;
  };
}

export type CompetitiveInterpretationProvider = {
  generate(input: {
    model: string;
    system: string;
    user: string;
    timeoutMs: number;
  }): Promise<CompetitiveInterpretationProviderResult>;
};

function extractOutputText(response: OpenAI.Responses.Response): string {
  if (typeof response.output_text === "string" && response.output_text) {
    return response.output_text;
  }

  const chunks: string[] = [];

  for (const item of response.output ?? []) {
    if (item.type !== "message") {
      continue;
    }

    for (const part of item.content) {
      if (part.type === "output_text") {
        chunks.push(part.text);
      }
    }
  }

  return chunks.join("");
}

function categorizeOpenAiError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();

  if (error instanceof OpenAiTimeoutError || lower.includes("timeout")) {
    return "timeout";
  }

  if (
    lower.includes("401") ||
    lower.includes("unauthorized") ||
    lower.includes("invalid api key")
  ) {
    return "authentication";
  }

  if (lower.includes("429") || lower.includes("rate limit")) {
    return "rate-limit";
  }

  if (lower.includes("network") || lower.includes("fetch")) {
    return "network";
  }

  return "provider";
}

export function createOpenAiCompetitiveInterpretationProvider(options: {
  apiKey: string | null;
}): CompetitiveInterpretationProvider {
  return {
    async generate(input) {
      if (!options.apiKey) {
        throw new MissingOpenAiKeyError();
      }

      const client = new OpenAI({
        apiKey: options.apiKey,
        timeout: input.timeoutMs,
      });

      const modelParams = buildOpenAiInterpretationModelParams(input.model);

      try {
        const response = await client.responses.create(
          {
            model: input.model,
            instructions: input.system,
            input: input.user,
            ...modelParams,
            max_output_tokens: Math.min(modelParams.max_output_tokens, 4_500),
            text: {
              format: zodTextFormat(
                competitiveInterpretationContentSchema,
                "competitive_interpretation",
              ),
            },
          },
          { timeout: input.timeoutMs },
        );

        const text = extractOutputText(response);

        if (!text.trim()) {
          throw new OpenAiProviderError(
            "invalid-output",
            "Model returned empty output.",
          );
        }

        let parsed: unknown;

        try {
          parsed = JSON.parse(text) as unknown;
        } catch {
          throw new OpenAiProviderError(
            "invalid-output",
            "Model returned non-JSON output.",
          );
        }

        return {
          parsed,
          model: response.model ?? input.model,
          usage: {
            inputTokens: response.usage?.input_tokens ?? null,
            outputTokens: response.usage?.output_tokens ?? null,
            totalTokens: response.usage?.total_tokens ?? null,
          },
        };
      } catch (error) {
        if (
          error instanceof MissingOpenAiKeyError ||
          error instanceof OpenAiProviderError
        ) {
          throw error;
        }

        const category = categorizeOpenAiError(error);

        if (category === "timeout") {
          throw new OpenAiTimeoutError();
        }

        throw new OpenAiProviderError(
          category,
          error instanceof Error ? error.message : "OpenAI provider error.",
        );
      }
    },
  };
}

export { MissingOpenAiKeyError, OpenAiProviderError, OpenAiTimeoutError };
