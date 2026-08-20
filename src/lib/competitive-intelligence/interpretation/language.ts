/**
 * Detect unexpected non-Latin scripts in client-facing English prose.
 * Does not attempt full language detection — only blocks obvious CJK,
 * Cyrillic, Arabic, Hebrew, Thai, Hangul, and similar script runs.
 */
export interface LanguageScriptViolation {
  rule: "UNEXPECTED_NON_ENGLISH_SCRIPT";
  excerpt: string;
}

export interface LanguageScriptCheckResult {
  valid: boolean;
  violations: LanguageScriptViolation[];
}

const MAX_EXCERPT = 120;

/**
 * Matches characters outside common Latin letters, digits, punctuation,
 * whitespace, and a few currency/symbol ranges used in English business copy.
 * Intentionally allows Latin Extended for accents (café, naïve, etc.).
 */
const UNEXPECTED_SCRIPT_PATTERN =
  /[\u0400-\u04FF\u0500-\u052F\u0600-\u06FF\u0750-\u077F\u0590-\u05FF\u0E00-\u0E7F\u3040-\u30FF\u3400-\u9FFF\uAC00-\uD7AF\uF900-\uFAFF]/u;

function excerptAround(text: string, index: number, length: number): string {
  const start = Math.max(0, index - 24);
  const end = Math.min(text.length, index + length + 24);
  return text.slice(start, end).trim().slice(0, MAX_EXCERPT);
}

export function detectUnexpectedNonEnglishScript(
  text: string,
): LanguageScriptCheckResult {
  const match = UNEXPECTED_SCRIPT_PATTERN.exec(text);
  if (!match) {
    return { valid: true, violations: [] };
  }

  return {
    valid: false,
    violations: [
      {
        rule: "UNEXPECTED_NON_ENGLISH_SCRIPT",
        excerpt: excerptAround(text, match.index, match[0].length),
      },
    ],
  };
}

export function formatLanguageScriptUserMessage(
  violation: LanguageScriptViolation,
): string {
  return "Validation failed: unexpected non-English script in client-facing text.";
}
