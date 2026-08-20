import type { CompetitiveAiInput } from "./types";
import type { CompetitiveInterpretationContentParsed } from "./schema";
import {
  detectUnsupportedCommercialClaims,
  formatCommercialClaimUserMessage,
} from "./claims";
import {
  detectUnexpectedNonEnglishScript,
  formatLanguageScriptUserMessage,
} from "./language";

export interface CompetitiveInterpretationValidationViolation {
  rule: string;
  section: string;
  excerpt: string;
  message: string;
}

export type CompetitiveInterpretationValidationResult =
  | { ok: true; content: CompetitiveInterpretationContentParsed }
  | {
      ok: false;
      reason: string;
      rule: string;
      section: string;
      excerpt: string;
      violations: CompetitiveInterpretationValidationViolation[];
    };

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

function fail(
  rule: string,
  section: string,
  message: string,
  excerpt = "",
): CompetitiveInterpretationValidationResult {
  return {
    ok: false,
    reason: message,
    rule,
    section,
    excerpt: excerpt.slice(0, 120),
    violations: [
      {
        rule,
        section,
        excerpt: excerpt.slice(0, 120),
        message,
      },
    ],
  };
}

function isImprovementPrimaryKey(
  sourceKey: string,
  opportunityKeys: Set<string>,
  gapCategoryKeys: Set<string>,
): boolean {
  return (
    sourceKey === "overall" ||
    opportunityKeys.has(sourceKey) ||
    gapCategoryKeys.has(sourceKey)
  );
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
    if (unknown) {
      return fail("UNKNOWN_SOURCE_KEY", "risks", unknown, risk.sourceKey);
    }
    if (riskKeys.has(risk.sourceKey)) {
      return fail(
        "DUPLICATE_SOURCE_KEY",
        "risks",
        `risks: duplicate sourceKey ${risk.sourceKey}`,
        risk.sourceKey,
      );
    }
    riskKeys.add(risk.sourceKey);

    const isOpportunity = opportunityKeys.has(risk.sourceKey);
    const isGapCategory = gapCategoryKeys.has(risk.sourceKey);
    const isOverall = risk.sourceKey === "overall";
    if (!isOpportunity && !isGapCategory && !isOverall) {
      return fail(
        "INVALID_RISK_SOURCE",
        "risks",
        `risks: sourceKey ${risk.sourceKey} is not an opportunity, gap category, or overall`,
        risk.sourceKey,
      );
    }
  }

  const advantageOutKeys = new Set<string>();
  for (const advantage of content.advantages) {
    const unknown = assertSourceKey(advantage.sourceKey, allowed, "advantages");
    if (unknown) {
      return fail("UNKNOWN_SOURCE_KEY", "advantages", unknown, advantage.sourceKey);
    }
    if (advantageOutKeys.has(advantage.sourceKey)) {
      return fail(
        "DUPLICATE_SOURCE_KEY",
        "advantages",
        `advantages: duplicate sourceKey ${advantage.sourceKey}`,
        advantage.sourceKey,
      );
    }
    advantageOutKeys.add(advantage.sourceKey);

    const isAdvantage = advantageKeys.has(advantage.sourceKey);
    const isStrengthCategory = strengthCategoryKeys.has(advantage.sourceKey);
    const isOverall = advantage.sourceKey === "overall";
    if (!isAdvantage && !isStrengthCategory && !isOverall) {
      return fail(
        "INVALID_ADVANTAGE_SOURCE",
        "advantages",
        `advantages: sourceKey ${advantage.sourceKey} is not an advantage, strength category, or overall`,
        advantage.sourceKey,
      );
    }
  }

  const priorityKeys = new Set<string>();
  for (const priority of content.priorities) {
    const unknown = assertSourceKey(priority.sourceKey, allowed, "priorities");
    if (unknown) {
      return fail("UNKNOWN_SOURCE_KEY", "priorities", unknown, priority.sourceKey);
    }
    if (priorityKeys.has(priority.sourceKey)) {
      return fail(
        "DUPLICATE_SOURCE_KEY",
        "priorities",
        `priorities: duplicate sourceKey ${priority.sourceKey}`,
        priority.sourceKey,
      );
    }
    priorityKeys.add(priority.sourceKey);

    if (
      !isImprovementPrimaryKey(
        priority.sourceKey,
        opportunityKeys,
        gapCategoryKeys,
      )
    ) {
      return fail(
        "INVALID_PRIORITY_PRIMARY_SOURCE",
        "priorities",
        `priorities: sourceKey ${priority.sourceKey} must reference an opportunity, gap category, or overall`,
        priority.sourceKey,
      );
    }

    const supporting = priority.supportingSourceKeys;
    const seenSupporting = new Set<string>();
    for (const key of supporting) {
      const supportingUnknown = assertSourceKey(
        key,
        allowed,
        "priorities.supportingSourceKeys",
      );
      if (supportingUnknown) {
        return fail(
          "UNKNOWN_SOURCE_KEY",
          "priorities",
          supportingUnknown,
          key,
        );
      }
      if (key === priority.sourceKey) {
        return fail(
          "INVALID_SUPPORTING_SOURCE",
          "priorities",
          `priorities: supportingSourceKey ${key} duplicates primary sourceKey`,
          key,
        );
      }
      if (seenSupporting.has(key)) {
        return fail(
          "DUPLICATE_SOURCE_KEY",
          "priorities",
          `priorities: duplicate supportingSourceKey ${key}`,
          key,
        );
      }
      seenSupporting.add(key);
    }
  }

  for (const phase of content.ninetyDayPlan) {
    for (const key of phase.sourceKeys) {
      const unknown = assertSourceKey(key, allowed, "ninetyDayPlan");
      if (unknown) {
        return fail("UNKNOWN_SOURCE_KEY", "ninetyDayPlan", unknown, key);
      }
    }
  }

  const textSections: Array<{ section: string; text: string }> = [
    { section: "executiveSummary.headline", text: content.executiveSummary.headline },
    { section: "executiveSummary.summary", text: content.executiveSummary.summary },
    {
      section: "competitivePosition.assessment",
      text: content.competitivePosition.assessment,
    },
    {
      section: "competitivePosition.explanation",
      text: content.competitivePosition.explanation,
    },
    ...content.risks.flatMap((row, index) => [
      { section: `risks[${index}].title`, text: row.title },
      { section: `risks[${index}].explanation`, text: row.explanation },
    ]),
    ...content.advantages.flatMap((row, index) => [
      { section: `advantages[${index}].title`, text: row.title },
      { section: `advantages[${index}].explanation`, text: row.explanation },
    ]),
    ...content.priorities.flatMap((row, index) => [
      { section: `priorities[${index}].title`, text: row.title },
      { section: `priorities[${index}].rationale`, text: row.rationale },
      ...row.recommendedActions.map((action, actionIndex) => ({
        section: `priorities[${index}].recommendedActions[${actionIndex}]`,
        text: action,
      })),
    ]),
    ...content.ninetyDayPlan.flatMap((row, index) => [
      { section: `ninetyDayPlan[${index}].objective`, text: row.objective },
      ...row.actions.map((action, actionIndex) => ({
        section: `ninetyDayPlan[${index}].actions[${actionIndex}]`,
        text: action,
      })),
    ]),
    ...content.internalTalkingPoints.map((point, index) => ({
      section: `internalTalkingPoints[${index}]`,
      text: point,
    })),
  ];

  for (const { section, text } of textSections) {
    const languageCheck = detectUnexpectedNonEnglishScript(text);
    if (!languageCheck.valid && languageCheck.violations[0]) {
      const violation = languageCheck.violations[0];
      return fail(
        violation.rule,
        section,
        formatLanguageScriptUserMessage(violation),
        violation.excerpt,
      );
    }

    const claimCheck = detectUnsupportedCommercialClaims(text);
    if (!claimCheck.valid && claimCheck.violations[0]) {
      const violation = claimCheck.violations[0];
      return fail(
        violation.rule,
        section,
        formatCommercialClaimUserMessage(violation),
        violation.excerpt,
      );
    }
  }

  return { ok: true, content };
}
