export type DuplicateMatchKind = "prospect" | "lead" | "suppression";

export interface DuplicateMatch {
  kind: DuplicateMatchKind;
  id: string;
  label: string;
  detail: string;
}

export interface DuplicateWarning {
  hostname: string;
  matches: DuplicateMatch[];
}

export function buildDuplicateWarning(
  hostname: string,
  matches: DuplicateMatch[],
): DuplicateWarning | null {
  if (!hostname || matches.length === 0) {
    return null;
  }

  return {
    hostname,
    matches,
  };
}

export function summarizeDuplicateWarning(
  warning: DuplicateWarning,
): string {
  const kinds = new Set(warning.matches.map((match) => match.kind));
  const parts: string[] = [];

  if (kinds.has("prospect")) {
    parts.push("an existing prospect");
  }

  if (kinds.has("lead")) {
    parts.push("an inbound lead");
  }

  if (kinds.has("suppression")) {
    parts.push("the suppression list");
  }

  return `Hostname ${warning.hostname} already appears on ${parts.join(" and ")}.`;
}
