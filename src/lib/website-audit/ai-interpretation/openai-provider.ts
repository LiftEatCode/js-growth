import "server-only";

import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";

import { buildOpenAiInterpretationModelParams } from "./openai-params";
import { aiInterpretationContentSchema } from "./schema";
import type {
  InterpretationProvider,
  InterpretationProviderResult,
} from "./types";

export class MissingOpenAiKeyError extends Error {
  constructor() {
    super("OPENAI_API_KEY is not configured.");
    this.name = "MissingOpenAiKeyError";
  }
}

export class OpenAiTimeoutError extends Error {
  constructor() {
    super("OpenAI request timed out.");
    this.name = "OpenAiTimeoutError";
  }
}

export class OpenAiProviderError extends Error {
  readonly category: string;

  constructor(category: string, message: string) {
    super(message);
    this.name = "OpenAiProviderError";
    this.category = category;
  }
}

function categorizeOpenAiError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();

  if (error instanceof OpenAiTimeoutError || lower.includes("timeout")) {
    return "timeout";
  }

  if (lower.includes("401") || lower.includes("unauthorized") || lower.includes("invalid api key")) {
    return "authentication";
  }

  if (lower.includes("429") || lower.includes("rate limit")) {
    return "rate-limit";
  }

  if (lower.includes("unsupported parameter")) {
    return "unsupported-parameter";
  }

  if (lower.includes("model") && lower.includes("not")) {
    return "model-unavailable";
  }

  if (lower.includes("network") || lower.includes("fetch")) {
    return "network";
  }

  return "provider";
}

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

export function createOpenAiInterpretationProvider(options: {
  apiKey: string | null;
}): InterpretationProvider {
  return {
    async generate(input): Promise<InterpretationProviderResult> {
      if (!options.apiKey) {
        throw new MissingOpenAiKeyError();
      }

      const client = new OpenAI({
        apiKey: options.apiKey,
        timeout: input.timeoutMs,
      });

      try {
        const response = await client.responses.create(
          {
            model: input.model,
            instructions: input.system,
            input: input.user,
            ...buildOpenAiInterpretationModelParams(input.model),
            text: {
              format: zodTextFormat(
                aiInterpretationContentSchema,
                "audit_interpretation",
              ),
            },
          },
          { timeout: input.timeoutMs },
        );

        const text = extractOutputText(response);

        if (!text.trim()) {
          const incompleteReason = response.incomplete_details?.reason;
          throw new OpenAiProviderError(
            "invalid-output",
            response.status === "incomplete"
              ? `Model response incomplete (${incompleteReason ?? "unknown"}).`
              : "Model returned empty output.",
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
        if (error instanceof MissingOpenAiKeyError || error instanceof OpenAiProviderError) {
          throw error;
        }

        const category = categorizeOpenAiError(error);

        if (category === "timeout") {
          throw new OpenAiTimeoutError();
        }

        throw new OpenAiProviderError(
          category,
          error instanceof Error ? error.message : "OpenAI generation failed.",
        );
      }
    },
  };
}
