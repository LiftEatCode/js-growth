import { AI_INTERPRETATION_VERSION } from "./constants";
import {
  AiGenerationTimeoutError,
  InvalidAiOutputError,
  withTimeout,
} from "./errors";
import { fingerprintAiContext } from "./fingerprint";
import { AI_SYSTEM_PROMPT, buildAiUserPrompt } from "./prompt";
import { validateAiInterpretationContent } from "./validate";
import type {
  AiAuditContext,
  AiInterpretationRecord,
  InterpretationProvider,
} from "./types";

export async function generateAuditInterpretation(options: {
  context: AiAuditContext;
  model: string;
  timeoutMs: number;
  provider: InterpretationProvider;
}): Promise<AiInterpretationRecord> {
  const user = buildAiUserPrompt(JSON.stringify(options.context));
  const result = await withTimeout(
    options.provider.generate({
      model: options.model,
      system: AI_SYSTEM_PROMPT,
      user,
      timeoutMs: options.timeoutMs,
    }),
    options.timeoutMs,
  );

  const validated = validateAiInterpretationContent(result.parsed);

  if (!validated.ok) {
    throw new InvalidAiOutputError(validated.reason);
  }

  if (
    !options.context.competitive.available &&
    validated.content.competitiveInterpretation
  ) {
    throw new InvalidAiOutputError("unexpected-competitive-section");
  }

  return {
    version: AI_INTERPRETATION_VERSION,
    model: result.model,
    generatedAt: new Date().toISOString(),
    inputFingerprint: fingerprintAiContext(options.context),
    usage: result.usage,
    content: validated.content,
  };
}

export { AiGenerationTimeoutError, InvalidAiOutputError };
