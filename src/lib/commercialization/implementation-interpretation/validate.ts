import { detectUnsupportedCommercialClaims } from "@/lib/competitive-intelligence/interpretation/claims";
import { detectUnexpectedNonEnglishScript } from "@/lib/competitive-intelligence/interpretation/language";

import type {
  ImplementationAiInput,
  ImplementationInterpretationContent,
} from "./types";

export type ImplementationInterpretationValidationResult =
  | { ok: true }
  | {
      ok: false;
      rule: string;
      section: string;
      excerpt: string;
      reason: string;
    };

function fail(
  rule: string,
  section: string,
  excerpt: string,
  reason: string,
): ImplementationInterpretationValidationResult {
  return { ok: false, rule, section, excerpt, reason };
}

function collectProse(
  content: ImplementationInterpretationContent,
): Array<{ section: string; text: string }> {
  const sections: Array<{ section: string; text: string }> = [
    { section: "executiveStrategy.headline", text: content.executiveStrategy.headline },
    { section: "executiveStrategy.summary", text: content.executiveStrategy.summary },
    {
      section: "implementationApproach.explanation",
      text: content.implementationApproach.explanation,
    },
  ];

  for (const [index, ws] of content.workstreams.entries()) {
    sections.push(
      { section: `workstreams[${index}].clientTitle`, text: ws.clientTitle },
      { section: `workstreams[${index}].explanation`, text: ws.explanation },
      {
        section: `workstreams[${index}].businessRationale`,
        text: ws.businessRationale,
      },
    );
    for (const [aIndex, action] of ws.actionExplanations.entries()) {
      sections.push({
        section: `workstreams[${index}].actionExplanations[${aIndex}]`,
        text: action.explanation,
      });
    }
    for (const [pIndex, note] of ws.preservationNotes.entries()) {
      sections.push({
        section: `workstreams[${index}].preservationNotes[${pIndex}]`,
        text: note.explanation,
      });
    }
  }

  for (const [index, phase] of content.sequencing.entries()) {
    sections.push(
      { section: `sequencing[${index}].phase`, text: phase.phase },
      { section: `sequencing[${index}].objective`, text: phase.objective },
      { section: `sequencing[${index}].explanation`, text: phase.explanation },
    );
  }

  for (const [index, item] of content.implementationConsiderations.entries()) {
    sections.push(
      { section: `considerations[${index}].title`, text: item.title },
      {
        section: `considerations[${index}].explanation`,
        text: item.explanation,
      },
    );
  }

  for (const [index, point] of content.internalTalkingPoints.entries()) {
    sections.push({
      section: `internalTalkingPoints[${index}]`,
      text: point,
    });
  }

  return sections;
}

export function validateImplementationInterpretationContent(
  content: ImplementationInterpretationContent,
  input: ImplementationAiInput,
): ImplementationInterpretationValidationResult {
  const allowed = new Set(input.allowedSourceKeys);
  const expectedWorkstreamKeys = input.workstreams.map((ws) => ws.sourceKey);
  const outputKeys = content.workstreams.map((ws) => ws.sourceKey);

  if (outputKeys.length !== expectedWorkstreamKeys.length) {
    return fail(
      "WORKSTREAM_COUNT_MISMATCH",
      "workstreams",
      String(outputKeys.length),
      `Expected ${expectedWorkstreamKeys.length} workstreams, got ${outputKeys.length}.`,
    );
  }

  for (const key of expectedWorkstreamKeys) {
    if (!outputKeys.includes(key)) {
      return fail(
        "MISSING_WORKSTREAM",
        "workstreams",
        key,
        `Missing required workstream sourceKey ${key}.`,
      );
    }
  }

  for (const key of outputKeys) {
    if (!expectedWorkstreamKeys.includes(key)) {
      return fail(
        "UNKNOWN_WORKSTREAM",
        "workstreams",
        key,
        `Unknown workstream sourceKey ${key}.`,
      );
    }
  }

  if (new Set(outputKeys).size !== outputKeys.length) {
    return fail(
      "DUPLICATE_WORKSTREAM",
      "workstreams",
      outputKeys.join(","),
      "Duplicate workstream sourceKeys.",
    );
  }

  const workstreamByKey = new Map(
    input.workstreams.map((ws) => [ws.sourceKey, ws]),
  );

  for (const [index, ws] of content.workstreams.entries()) {
    const deterministic = workstreamByKey.get(ws.sourceKey);
    if (!deterministic) {
      return fail(
        "UNKNOWN_WORKSTREAM",
        `workstreams[${index}]`,
        ws.sourceKey,
        "Workstream not in deterministic plan.",
      );
    }

    const allowedActions = new Set(
      deterministic.actions.map((action) => action.sourceKey),
    );
    const allowedPreservation = new Set(
      deterministic.preservationConstraints.map((item) => item.sourceKey),
    );

    for (const action of ws.actionExplanations) {
      if (!allowed.has(action.sourceKey)) {
        return fail(
          "UNKNOWN_SOURCE_KEY",
          `workstreams[${index}].actionExplanations`,
          action.sourceKey,
          "Action sourceKey not in allowedSourceKeys.",
        );
      }
      if (!allowedActions.has(action.sourceKey)) {
        return fail(
          "UNKNOWN_ACTION",
          `workstreams[${index}].actionExplanations`,
          action.sourceKey,
          "Action is not on this deterministic workstream.",
        );
      }
    }

    for (const note of ws.preservationNotes) {
      if (!allowed.has(note.sourceKey)) {
        return fail(
          "UNKNOWN_SOURCE_KEY",
          `workstreams[${index}].preservationNotes`,
          note.sourceKey,
          "Preservation sourceKey not allowed.",
        );
      }
      if (!allowedPreservation.has(note.sourceKey)) {
        return fail(
          "UNKNOWN_PRESERVATION",
          `workstreams[${index}].preservationNotes`,
          note.sourceKey,
          "Preservation note not on this workstream.",
        );
      }
    }
  }

  for (const [index, phase] of content.sequencing.entries()) {
    for (const key of phase.sourceKeys) {
      if (!allowed.has(key)) {
        return fail(
          "UNKNOWN_SOURCE_KEY",
          `sequencing[${index}]`,
          key,
          "Sequencing sourceKey not allowed.",
        );
      }
      if (!key.startsWith("workstream:")) {
        return fail(
          "INVALID_SEQUENCING_KEY",
          `sequencing[${index}]`,
          key,
          "Sequencing sourceKeys must be workstream:* keys.",
        );
      }
    }
  }

  for (const [index, item] of content.implementationConsiderations.entries()) {
    for (const key of item.sourceKeys) {
      if (!allowed.has(key)) {
        return fail(
          "UNKNOWN_SOURCE_KEY",
          `considerations[${index}]`,
          key,
          "Consideration sourceKey not allowed.",
        );
      }
    }
  }

  for (const section of collectProse(content)) {
    const language = detectUnexpectedNonEnglishScript(section.text);
    if (!language.valid) {
      return fail(
        language.violations[0]?.rule ?? "UNEXPECTED_NON_ENGLISH_SCRIPT",
        section.section,
        language.violations[0]?.excerpt ?? section.text.slice(0, 80),
        "Unexpected non-English script in interpretation prose.",
      );
    }

    const claims = detectUnsupportedCommercialClaims(section.text);
    if (!claims.valid) {
      return fail(
        claims.violations[0]?.rule ?? "UNSUPPORTED_COMMERCIAL_CLAIM",
        section.section,
        claims.violations[0]?.excerpt ?? section.text.slice(0, 80),
        "Unsupported commercial claim in interpretation prose.",
      );
    }
  }

  return { ok: true };
}
