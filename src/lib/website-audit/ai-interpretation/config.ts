import {
  DEFAULT_OPENAI_AUDIT_MODEL,
  AI_GENERATION_TIMEOUT_MS,
} from "./constants";

export function getOpenAiApiKey(): string | null {
  const value = process.env.OPENAI_API_KEY?.trim();
  return value ? value : null;
}

export function getOpenAiAuditModel(): string {
  return process.env.OPENAI_AUDIT_MODEL?.trim() || DEFAULT_OPENAI_AUDIT_MODEL;
}

export function getAiGenerationTimeoutMs(): number {
  return AI_GENERATION_TIMEOUT_MS;
}

export function isAiConfigured(): boolean {
  return Boolean(getOpenAiApiKey());
}
