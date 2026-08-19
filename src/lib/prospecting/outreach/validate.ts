import { contactFormDraftOutputSchema, outreachDraftOutputSchema } from "./schema";
import type { OutreachDraftContext, OutreachDraftOutput } from "./types";

const UUID_PATTERN =
  /[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i;
const STRIPE_PATTERN = /\b(?:cs|pi|evt)_(?:test|live)_[a-z0-9]+\b/i;
const PLACEHOLDER_PATTERN = /\[[A-Z][A-Za-z ]{2,}\]/;
const FENCE_PATTERN = /```/;
const JSON_PATTERN = /^\s*[{[]/;
const PERCENT_CLAIM_PATTERN = /\b\d{1,3}\s?%/;
const MONEY_CLAIM_PATTERN = /\$\s?\d/;
const NUMERIC_LEAD_PATTERN =
  /\b\d+\s+(?:leads?|customers?|visitors?|rankings?|inquiries)\b/i;
const AGGRESSIVE_PATTERN =
  /losing customers|hurting your rankings|google is penaliz|missing \d+|increase revenue|competitors are outranking|major problems|website is broken/i;
const INTERNAL_PATTERN =
  /prospecting engine|google places|qualification score|selected you|chatgpt|openai|\bAI\b|lead scoring|campaign id/i;
const SCORE_PATTERN = /website growth score|qualification score|overall score/i;

export function validateOutreachDraftOutput(
  value: unknown,
  context: OutreachDraftContext,
): { ok: true; content: OutreachDraftOutput } | { ok: false; reason: string } {
  const schema =
    context.channel === "CONTACT_FORM"
      ? contactFormDraftOutputSchema
      : outreachDraftOutputSchema;
  const parsed = schema.safeParse(value);

  if (!parsed.success) {
    return { ok: false, reason: "schema" };
  }

  const subject = (parsed.data.subject ?? "").trim();
  const body = parsed.data.body.trim().replace(/\r\n/g, "\n");
  const combined = `${subject}\n${body}`;

  if (!body) {
    return { ok: false, reason: "empty" };
  }

  if (context.channel === "EMAIL" && !subject) {
    return { ok: false, reason: "empty" };
  }

  if (FENCE_PATTERN.test(combined) || JSON_PATTERN.test(body)) {
    return { ok: false, reason: "markup" };
  }

  if (PLACEHOLDER_PATTERN.test(combined)) {
    return { ok: false, reason: "placeholder" };
  }

  if (UUID_PATTERN.test(combined) || STRIPE_PATTERN.test(combined)) {
    return { ok: false, reason: "internal-id" };
  }

  if (
    PERCENT_CLAIM_PATTERN.test(combined) ||
    MONEY_CLAIM_PATTERN.test(combined) ||
    NUMERIC_LEAD_PATTERN.test(combined)
  ) {
    return { ok: false, reason: "unsupported-numeric-claim" };
  }

  if (AGGRESSIVE_PATTERN.test(combined) || SCORE_PATTERN.test(combined)) {
    return { ok: false, reason: "unsupported-claim" };
  }

  if (INTERNAL_PATTERN.test(combined)) {
    return { ok: false, reason: "internal-language" };
  }

  if (combined.includes(String(context.websiteGrowthScore))) {
    return { ok: false, reason: "score-leaked" };
  }

  if (/https?:\/\/\S*[{}<>]/.test(combined)) {
    return { ok: false, reason: "malformed-url" };
  }

  return {
    ok: true,
    content: { subject, body },
  };
}
