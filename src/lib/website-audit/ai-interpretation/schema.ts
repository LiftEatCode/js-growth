import { z } from "zod";

import {
  MAX_CLOSING_SUMMARY_CHARS,
  MAX_COMPETITIVE_BULLET_CHARS,
  MAX_COMPETITIVE_SUMMARY_CHARS,
  MAX_DIAGNOSIS_EXPLANATION_CHARS,
  MAX_DIAGNOSIS_HEADLINE_CHARS,
  MAX_EXECUTIVE_SUMMARY_CHARS,
  MAX_IMPLEMENTATION_FIELD_CHARS,
  MAX_PHASE_ACTION_CHARS,
  MAX_PRIORITY_FIELD_CHARS,
  MAX_PRIORITY_TITLE_CHARS,
  MAX_START_THIS_WEEK_CHARS,
} from "./constants";

export const aiBusinessImpactSchema = z.enum([
  "search-visibility",
  "lead-generation",
  "conversion",
  "local-visibility",
  "trust",
  "user-experience",
  "technical-foundation",
]);

export const aiImplementationAreaNameSchema = z.enum([
  "technical-seo",
  "service-page-seo",
  "local-seo",
  "conversion",
  "content-expansion",
  "performance",
  "trust",
]);

export const aiStrategicPrioritySchema = z.object({
  rank: z.number().int().min(1).max(5),
  title: z.string().min(1).max(MAX_PRIORITY_TITLE_CHARS),
  whyItMatters: z.string().min(1).max(MAX_PRIORITY_FIELD_CHARS),
  evidence: z.string().min(1).max(MAX_PRIORITY_FIELD_CHARS),
  recommendedDirection: z.string().min(1).max(MAX_PRIORITY_FIELD_CHARS),
  expectedBusinessImpact: z.array(aiBusinessImpactSchema).min(1).max(4),
});

export const aiImplementationAreaSchema = z.object({
  area: aiImplementationAreaNameSchema,
  whyItMatters: z.string().min(1).max(MAX_IMPLEMENTATION_FIELD_CHARS),
  recommendedDirection: z.string().min(1).max(MAX_IMPLEMENTATION_FIELD_CHARS),
  professionalHelpMayBeUseful: z.boolean(),
});

export const aiCompetitiveInterpretationSchema = z.object({
  positionSummary: z.string().min(1).max(MAX_COMPETITIVE_SUMMARY_CHARS),
  strongestAdvantages: z
    .array(z.string().min(1).max(MAX_COMPETITIVE_BULLET_CHARS))
    .max(5),
  biggestGaps: z
    .array(z.string().min(1).max(MAX_COMPETITIVE_BULLET_CHARS))
    .max(5),
});

export const aiInterpretationContentSchema = z.object({
  executiveSummary: z.string().min(1).max(MAX_EXECUTIVE_SUMMARY_CHARS),
  strategicDiagnosis: z.object({
    headline: z.string().min(1).max(MAX_DIAGNOSIS_HEADLINE_CHARS),
    explanation: z.string().min(1).max(MAX_DIAGNOSIS_EXPLANATION_CHARS),
  }),
  topPriorities: z.array(aiStrategicPrioritySchema).min(1).max(5),
  startThisWeek: z
    .array(z.string().min(1).max(MAX_START_THIS_WEEK_CHARS))
    .min(1)
    .max(4),
  competitiveInterpretation: aiCompetitiveInterpretationSchema.nullable(),
  ninetyDayStrategy: z.object({
    first30Days: z.array(z.string().min(1).max(MAX_PHASE_ACTION_CHARS)).min(1).max(5),
    days31To60: z.array(z.string().min(1).max(MAX_PHASE_ACTION_CHARS)).min(1).max(5),
    days61To90: z.array(z.string().min(1).max(MAX_PHASE_ACTION_CHARS)).min(1).max(5),
  }),
  implementationAreas: z.array(aiImplementationAreaSchema).min(1).max(8),
  closingSummary: z.string().min(1).max(MAX_CLOSING_SUMMARY_CHARS),
});

export type AiInterpretationContent = z.infer<
  typeof aiInterpretationContentSchema
>;

function stripUnsupportedKeys(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(stripUnsupportedKeys);
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  const input = value as Record<string, unknown>;
  const output: Record<string, unknown> = {};

  for (const [key, nested] of Object.entries(input)) {
    if (key === "$schema" || key === "$id") {
      continue;
    }

    output[key] = stripUnsupportedKeys(nested);
  }

  if (output.type === "object" && output.additionalProperties === undefined) {
    output.additionalProperties = false;
  }

  return output;
}

export function jsonSchemaForOpenAi(): Record<string, unknown> {
  const schema = stripUnsupportedKeys(
    z.toJSONSchema(aiInterpretationContentSchema, {
      target: "draft-7",
    }),
  );

  return schema as Record<string, unknown>;
}
