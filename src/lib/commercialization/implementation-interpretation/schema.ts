import { z } from "zod";

import { assertOpenAiStructuredOutputSchemaHasNoOptionalProperties } from "@/lib/competitive-intelligence/interpretation/schema";

import {
  MAX_ACTION_EXPLANATION_CHARS,
  MAX_AI_ACTIONS_PER_WORKSTREAM,
  MAX_AI_IMPLEMENTATION_CONSIDERATIONS,
  MAX_AI_IMPLEMENTATION_WORKSTREAMS,
  MAX_AI_PRESERVATION_CONSTRAINTS,
  MAX_AI_SEQUENCING_PHASES,
  MAX_AI_TALKING_POINTS,
  MAX_APPROACH_CHARS,
  MAX_BUSINESS_RATIONALE_CHARS,
  MAX_CLIENT_TITLE_CHARS,
  MAX_CONSIDERATION_EXPLANATION_CHARS,
  MAX_CONSIDERATION_TITLE_CHARS,
  MAX_EXECUTIVE_HEADLINE_CHARS,
  MAX_EXECUTIVE_SUMMARY_CHARS,
  MAX_PHASE_EXPLANATION_CHARS,
  MAX_PHASE_LABEL_CHARS,
  MAX_PRESERVATION_NOTE_CHARS,
  MAX_TALKING_POINT_CHARS,
  MAX_WORKSTREAM_EXPLANATION_CHARS,
} from "./constants";

export const implementationInterpretationContentSchema = z.object({
  executiveStrategy: z.object({
    headline: z.string().min(1).max(MAX_EXECUTIVE_HEADLINE_CHARS),
    summary: z.string().min(1).max(MAX_EXECUTIVE_SUMMARY_CHARS),
  }),
  implementationApproach: z.object({
    explanation: z.string().min(1).max(MAX_APPROACH_CHARS),
  }),
  workstreams: z
    .array(
      z.object({
        sourceKey: z.string().min(1).max(120),
        clientTitle: z.string().min(1).max(MAX_CLIENT_TITLE_CHARS),
        explanation: z.string().min(1).max(MAX_WORKSTREAM_EXPLANATION_CHARS),
        businessRationale: z.string().min(1).max(MAX_BUSINESS_RATIONALE_CHARS),
        actionExplanations: z
          .array(
            z.object({
              sourceKey: z.string().min(1).max(160),
              explanation: z.string().min(1).max(MAX_ACTION_EXPLANATION_CHARS),
            }),
          )
          .max(MAX_AI_ACTIONS_PER_WORKSTREAM),
        preservationNotes: z
          .array(
            z.object({
              sourceKey: z.string().min(1).max(120),
              explanation: z.string().min(1).max(MAX_PRESERVATION_NOTE_CHARS),
            }),
          )
          .max(MAX_AI_PRESERVATION_CONSTRAINTS),
      }),
    )
    .min(1)
    .max(MAX_AI_IMPLEMENTATION_WORKSTREAMS),
  sequencing: z
    .array(
      z.object({
        phase: z.string().min(1).max(MAX_PHASE_LABEL_CHARS),
        objective: z.string().min(1).max(MAX_PHASE_EXPLANATION_CHARS),
        sourceKeys: z.array(z.string().min(1).max(120)).min(1).max(8),
        explanation: z.string().min(1).max(MAX_PHASE_EXPLANATION_CHARS),
      }),
    )
    .min(1)
    .max(MAX_AI_SEQUENCING_PHASES),
  implementationConsiderations: z
    .array(
      z.object({
        sourceKeys: z.array(z.string().min(1).max(120)).min(1).max(8),
        title: z.string().min(1).max(MAX_CONSIDERATION_TITLE_CHARS),
        explanation: z.string().min(1).max(MAX_CONSIDERATION_EXPLANATION_CHARS),
      }),
    )
    .max(MAX_AI_IMPLEMENTATION_CONSIDERATIONS),
  internalTalkingPoints: z
    .array(z.string().min(1).max(MAX_TALKING_POINT_CHARS))
    .max(MAX_AI_TALKING_POINTS),
});

export type ImplementationInterpretationContentParsed = z.infer<
  typeof implementationInterpretationContentSchema
>;

export function jsonSchemaForImplementationInterpretation(): Record<
  string,
  unknown
> {
  return z.toJSONSchema(implementationInterpretationContentSchema, {
    target: "draft-7",
  }) as Record<string, unknown>;
}

export { assertOpenAiStructuredOutputSchemaHasNoOptionalProperties };
