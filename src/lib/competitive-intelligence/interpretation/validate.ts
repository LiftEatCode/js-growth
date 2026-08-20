import type { CompetitiveAiInput } from "./types";
import type { CompetitiveInterpretationContentParsed } from "./schema";

export type CompetitiveInterpretationValidationResult =
  | { ok: true; content: CompetitiveInterpretationContentParsed }
  | { ok: false; reason: string };

function assertSourceKey(
  key: string,
  allowed: Set<string>,
  context: string,
): string | null {
  if (!allowed.has(key)) {
    return `${context}: unknown sourceKey ${key}`;
  }
  return null;
}

export function validateCompetitiveInterpretationContent(
  content: CompetitiveInterpretationContentParsed,
  input: CompetitiveAiInput,
): CompetitiveInterpretationValidationResult {
  const allowed = new Set(input.allowedSourceKeys);
  const opportunityKeys = new Set(
    input.topOpportunities.map((row) => row.sourceKey),
  );
  const advantageKeys = new Set(input.topAdvantages.map((row) => row.sourceKey));
  const gapCategoryKeys = new Set(
    input.categories
      .filter((row) => row.position === "GAP" || row.position === "MAJOR_GAP")
      .map((row) => row.sourceKey),
  );
  const strengthCategoryKeys = new Set(
    input.categories
      .filter(
        (row) =>
          row.position === "ADVANTAGE" || row.position === "MAJOR_ADVANTAGE",
      )
      .map((row) => row.sourceKey),
  );

  const riskKeys = new Set<string>();
  for (const risk of content.risks) {
    const unknown = assertSourceKey(risk.sourceKey, allowed, "risks");
    if (unknown) return { ok: false, reason: unknown };
    if (riskKeys.has(risk.sourceKey)) {
      return { ok: false, reason: `risks: duplicate sourceKey ${risk.sourceKey}` };
    }
    riskKeys.add(risk.sourceKey);

    const isOpportunity = opportunityKeys.has(risk.sourceKey);
    const isGapCategory = gapCategoryKeys.has(risk.sourceKey);
    const isOverall = risk.sourceKey === "overall";
    if (!isOpportunity && !isGapCategory && !isOverall) {
      return {
        ok: false,
        reason: `risks: sourceKey ${risk.sourceKey} is not an opportunity, gap category, or overall`,
      };
    }
  }

  const advantageOutKeys = new Set<string>();
  for (const advantage of content.advantages) {
    const unknown = assertSourceKey(advantage.sourceKey, allowed, "advantages");
    if (unknown) return { ok: false, reason: unknown };
    if (advantageOutKeys.has(advantage.sourceKey)) {
      return {
        ok: false,
        reason: `advantages: duplicate sourceKey ${advantage.sourceKey}`,
      };
    }
    advantageOutKeys.add(advantage.sourceKey);

    const isAdvantage = advantageKeys.has(advantage.sourceKey);
    const isStrengthCategory = strengthCategoryKeys.has(advantage.sourceKey);
    const isOverall = advantage.sourceKey === "overall";
    if (!isAdvantage && !isStrengthCategory && !isOverall) {
      return {
        ok: false,
        reason: `advantages: sourceKey ${advantage.sourceKey} is not an advantage, strength category, or overall`,
      };
    }
  }

  const priorityKeys = new Set<string>();
  for (const priority of content.priorities) {
    const unknown = assertSourceKey(priority.sourceKey, allowed, "priorities");
    if (unknown) return { ok: false, reason: unknown };
    if (priorityKeys.has(priority.sourceKey)) {
      return {
        ok: false,
        reason: `priorities: duplicate sourceKey ${priority.sourceKey}`,
      };
    }
    priorityKeys.add(priority.sourceKey);

    if (
      !opportunityKeys.has(priority.sourceKey) &&
      !gapCategoryKeys.has(priority.sourceKey) &&
      priority.sourceKey !== "overall"
    ) {
      return {
        ok: false,
        reason: `priorities: sourceKey ${priority.sourceKey} must reference an opportunity, gap category, or overall`,
      };
    }
  }

  for (const phase of content.ninetyDayPlan) {
    for (const key of phase.sourceKeys) {
      const unknown = assertSourceKey(key, allowed, "ninetyDayPlan");
      if (unknown) return { ok: false, reason: unknown };
    }
  }

  const suspicious =
    /\b(revenue|market share|backlinks?|organic traffic|google prefers|more customers|more leads|ROI of|will increase (leads|revenue|conversions) by)\b/i;
  const blobs = [
    content.executiveSummary.headline,
    content.executiveSummary.summary,
    content.competitivePosition.assessment,
    content.competitivePosition.explanation,
    ...content.risks.flatMap((row) => [row.title, row.explanation]),
    ...content.advantages.flatMap((row) => [row.title, row.explanation]),
    ...content.priorities.flatMap((row) => [
      row.title,
      row.rationale,
      ...row.recommendedActions,
    ]),
    ...content.ninetyDayPlan.flatMap((row) => [
      row.objective,
      ...row.actions,
    ]),
    ...content.internalTalkingPoints,
  ];

  for (const text of blobs) {
    if (suspicious.test(text)) {
      return {
        ok: false,
        reason: "unsupported commercial claim detected in interpretation text",
      };
    }
  }

  return { ok: true, content };
}
