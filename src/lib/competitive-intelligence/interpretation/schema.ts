import { z } from "zod";

import {
  MAX_ACTIONS_PER_PRIORITY,
  MAX_ADVANTAGES_OUT,
  MAX_ACTION_CHARS,
  MAX_EXPLANATION_CHARS,
  MAX_EXECUTIVE_HEADLINE_CHARS,
  MAX_EXECUTIVE_SUMMARY_CHARS,
  MAX_NINETY_DAY_PHASES,
  MAX_PHASE_ACTIONS,
  MAX_PRIORITIES,
  MAX_RISKS,
  MAX_SUPPORTING_SOURCE_KEYS,
  MAX_TALKING_POINT_CHARS,
  MAX_TALKING_POINTS,
  MAX_TITLE_CHARS,
} from "./constants";

export const competitiveInterpretationContentSchema = z.object({
  executiveSummary: z.object({
    headline: z.string().min(1).max(MAX_EXECUTIVE_HEADLINE_CHARS),
    summary: z.string().min(1).max(MAX_EXECUTIVE_SUMMARY_CHARS),
  }),
  competitivePosition: z.object({
    assessment: z.string().min(1).max(MAX_TITLE_CHARS),
    explanation: z.string().min(1).max(MAX_EXPLANATION_CHARS),
  }),
  risks: z
    .array(
      z.object({
        sourceKey: z.string().min(1).max(120),
        title: z.string().min(1).max(MAX_TITLE_CHARS),
        explanation: z.string().min(1).max(MAX_EXPLANATION_CHARS),
      }),
    )
    .min(1)
    .max(MAX_RISKS),
  advantages: z
    .array(
      z.object({
        sourceKey: z.string().min(1).max(120),
        title: z.string().min(1).max(MAX_TITLE_CHARS),
        explanation: z.string().min(1).max(MAX_EXPLANATION_CHARS),
      }),
    )
    .min(1)
    .max(MAX_ADVANTAGES_OUT),
  priorities: z
    .array(
      z.object({
        sourceKey: z.string().min(1).max(120),
        supportingSourceKeys: z
          .array(z.string().min(1).max(120))
          .max(MAX_SUPPORTING_SOURCE_KEYS),
        title: z.string().min(1).max(MAX_TITLE_CHARS),
        rationale: z.string().min(1).max(MAX_EXPLANATION_CHARS),
        recommendedActions: z
          .array(z.string().min(1).max(MAX_ACTION_CHARS))
          .min(1)
          .max(MAX_ACTIONS_PER_PRIORITY),
      }),
    )
    .min(1)
    .max(MAX_PRIORITIES),
  ninetyDayPlan: z
    .array(
      z.object({
        phase: z.string().min(1).max(80),
        objective: z.string().min(1).max(MAX_EXPLANATION_CHARS),
        actions: z
          .array(z.string().min(1).max(MAX_ACTION_CHARS))
          .min(1)
          .max(MAX_PHASE_ACTIONS),
        sourceKeys: z.array(z.string().min(1).max(120)).min(1).max(8),
      }),
    )
    .min(1)
    .max(MAX_NINETY_DAY_PHASES),
  internalTalkingPoints: z
    .array(z.string().min(1).max(MAX_TALKING_POINT_CHARS))
    .max(MAX_TALKING_POINTS),
});

export type CompetitiveInterpretationContentParsed = z.infer<
  typeof competitiveInterpretationContentSchema
>;

/**
 * OpenAI Structured Outputs requires every property listed under `properties`
 * to also appear in that object's `required` array. Prefer required empty
 * arrays for collections instead of optional properties.
 */
export function jsonSchemaForCompetitiveInterpretation(): Record<string, unknown> {
  return z.toJSONSchema(competitiveInterpretationContentSchema, {
    target: "draft-7",
  }) as Record<string, unknown>;
}

export function assertOpenAiStructuredOutputSchemaHasNoOptionalProperties(
  schema: unknown,
  path = "root",
): void {
  if (!schema || typeof schema !== "object" || Array.isArray(schema)) {
    return;
  }

  const node = schema as Record<string, unknown>;

  if (node.type === "object" || node.properties) {
    const properties = (node.properties ?? {}) as Record<string, unknown>;
    const required = Array.isArray(node.required)
      ? (node.required as string[])
      : [];
    const propertyKeys = Object.keys(properties);

    for (const key of propertyKeys) {
      if (!required.includes(key)) {
        throw new Error(
          `OpenAI Structured Outputs schema has optional property at ${path}.properties.${key}`,
        );
      }
    }

    for (const [key, nested] of Object.entries(properties)) {
      assertOpenAiStructuredOutputSchemaHasNoOptionalProperties(
        nested,
        `${path}.properties.${key}`,
      );
    }
  }

  if (node.items) {
    assertOpenAiStructuredOutputSchemaHasNoOptionalProperties(
      node.items,
      `${path}.items`,
    );
  }

  for (const combiner of ["anyOf", "oneOf", "allOf"] as const) {
    const entries = node[combiner];
    if (Array.isArray(entries)) {
      entries.forEach((entry, index) => {
        assertOpenAiStructuredOutputSchemaHasNoOptionalProperties(
          entry,
          `${path}.${combiner}[${index}]`,
        );
      });
    }
  }

  if (node.$defs && typeof node.$defs === "object") {
    for (const [key, nested] of Object.entries(
      node.$defs as Record<string, unknown>,
    )) {
      assertOpenAiStructuredOutputSchemaHasNoOptionalProperties(
        nested,
        `${path}.$defs.${key}`,
      );
    }
  }

  if (node.definitions && typeof node.definitions === "object") {
    for (const [key, nested] of Object.entries(
      node.definitions as Record<string, unknown>,
    )) {
      assertOpenAiStructuredOutputSchemaHasNoOptionalProperties(
        nested,
        `${path}.definitions.${key}`,
      );
    }
  }
}
