export const OPENAI_AUDIT_TEMPERATURE = 0.2;
export const OPENAI_AUDIT_MAX_OUTPUT_TOKENS = 3_500;
export const OPENAI_REASONING_MAX_OUTPUT_TOKENS = 8_000;
export const OPENAI_REASONING_EFFORT = "low" as const;

export function isOpenAiSamplingRestrictedModel(model: string): boolean {
  const id = model.trim().toLowerCase();

  return (
    id.startsWith("gpt-5") ||
    id.startsWith("o1") ||
    id.startsWith("o3") ||
    id.startsWith("o4") ||
    id.includes("codex")
  );
}

export function buildOpenAiInterpretationModelParams(model: string): {
  max_output_tokens: number;
  temperature?: number;
  reasoning?: { effort: typeof OPENAI_REASONING_EFFORT };
} {
  if (isOpenAiSamplingRestrictedModel(model)) {
    return {
      max_output_tokens: OPENAI_REASONING_MAX_OUTPUT_TOKENS,
      reasoning: { effort: OPENAI_REASONING_EFFORT },
    };
  }

  return {
    max_output_tokens: OPENAI_AUDIT_MAX_OUTPUT_TOKENS,
    temperature: OPENAI_AUDIT_TEMPERATURE,
  };
}
