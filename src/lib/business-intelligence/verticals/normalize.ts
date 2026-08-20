import {
  PLACES_TYPE_VERTICAL,
  STRONG_VERTICAL_RULES,
  WEAK_VERTICAL_RULES,
} from "./taxonomy";
import type {
  BusinessVertical,
  VerticalNormalizationResult,
  VerticalSignal,
} from "./types";

function uniqueVerticals(values: BusinessVertical[]): BusinessVertical[] {
  return [...new Set(values)];
}

function matchRules(
  text: string,
  source: VerticalSignal["source"],
  strongOnly: boolean,
): VerticalNormalizationResult["evidence"] {
  const evidence: VerticalNormalizationResult["evidence"] = [];
  const rules = strongOnly
    ? STRONG_VERTICAL_RULES
    : [...STRONG_VERTICAL_RULES, ...WEAK_VERTICAL_RULES];

  for (const rule of rules) {
    for (const pattern of rule.patterns) {
      const match = text.match(pattern);

      if (match?.[0]) {
        evidence.push({
          vertical: rule.vertical,
          source,
          matched: match[0],
        });
        break;
      }
    }
  }

  return evidence;
}

export function normalizeBusinessVerticals(
  signals: VerticalSignal[],
): VerticalNormalizationResult {
  const evidence: VerticalNormalizationResult["evidence"] = [];

  for (const signal of signals) {
    const text = signal.text.trim();

    if (!text) {
      continue;
    }

    if (signal.source === "places_type") {
      const mapped = PLACES_TYPE_VERTICAL[text.toLowerCase().replace(/\s+/g, "_")];

      if (mapped) {
        evidence.push({
          vertical: mapped,
          source: signal.source,
          matched: text,
        });
      }
    }

    const preferStrong =
      signal.source === "business_name" ||
      signal.source === "industry" ||
      signal.source === "campaign";

    evidence.push(...matchRules(text, signal.source, preferStrong));
  }

  const strong = uniqueVerticals(
    evidence
      .filter((row) =>
        STRONG_VERTICAL_RULES.some((rule) => rule.vertical === row.vertical),
      )
      .map((row) => row.vertical),
  );

  const weak = uniqueVerticals(
    evidence
      .filter((row) =>
        WEAK_VERTICAL_RULES.some((rule) => rule.vertical === row.vertical),
      )
      .map((row) => row.vertical),
  );

  const verticals =
    strong.length > 0
      ? uniqueVerticals([
          ...strong,
          ...weak.filter((row) => row !== "HOME_SERVICES"),
        ])
      : weak.length > 0
        ? weak
        : (["OTHER"] as BusinessVertical[]);

  return {
    verticals,
    evidence,
  };
}
