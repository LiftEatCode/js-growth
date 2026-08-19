import "server-only";

import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";

import { buildOpenAiInterpretationModelParams } from "@/lib/website-audit/ai-interpretation/openai-params";
import {
  MissingOpenAiKeyError,
  OpenAiProviderError,
  OpenAiTimeoutError,
} from "@/lib/website-audit/ai-interpretation/openai-provider";

import { outreachDraftOutputSchema } from "./schema";

export interface OutreachGenerationProviderResult {
  parsed: unknown;
  model: string;
  usage: {
    inputTokens: number | null;
    outputTokens: number | null;
    totalTokens: number | null;
  };
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

export function createOpenAiOutreachProvider(options: {
  apiKey: string | null;
}): {
  generate(input: {
    model: string;
    system: string;
    user: string;
    timeoutMs: number;
  }): Promise<OutreachGenerationProviderResult>;
} {
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
            max_output_tokens: Math.min(modelParams.max_output_tokens, 900),
            text: {
              format: zodTextFormat(outreachDraftOutputSchema, "outreach_draft"),
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

        const message = error instanceof Error ? error.message : String(error);
        const lower = message.toLowerCase();

        if (error instanceof OpenAiTimeoutError || lower.includes("timeout")) {
          throw new OpenAiTimeoutError();
        }

        throw new OpenAiProviderError(
          "provider",
          "The outreach draft could not be generated.",
        );
      }
    },
  };
}
