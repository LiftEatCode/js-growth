import { aiInterpretationContentSchema } from "./schema";
import type { AiInterpretationContent } from "./schema";

export function validateAiInterpretationContent(
  value: unknown,
):
  | { ok: true; content: AiInterpretationContent }
  | { ok: false; reason: string } {
  const parsed = aiInterpretationContentSchema.safeParse(value);

  if (!parsed.success) {
    return {
      ok: false,
      reason: parsed.error.issues[0]?.message ?? "invalid-ai-output",
    };
  }

  const content = parsed.data;
  const ranks = content.topPriorities.map((item) => item.rank);
  const uniqueRanks = new Set(ranks);

  if (uniqueRanks.size !== ranks.length) {
    return { ok: false, reason: "duplicate-priority-rank" };
  }

  return { ok: true, content };
}
