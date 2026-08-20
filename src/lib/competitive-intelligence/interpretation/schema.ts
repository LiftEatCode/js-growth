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
