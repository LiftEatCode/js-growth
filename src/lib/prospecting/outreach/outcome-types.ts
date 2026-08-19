export type OutreachOutcomeValue =
  | "REPLIED"
  | "INTERESTED"
  | "NOT_INTERESTED"
  | "NO_RESPONSE"
  | "BOUNCED";

export const OUTREACH_OUTCOME_VALUES: OutreachOutcomeValue[] = [
  "REPLIED",
  "INTERESTED",
  "NOT_INTERESTED",
  "NO_RESPONSE",
  "BOUNCED",
];

export function isOutreachOutcomeValue(
  value: string,
): value is OutreachOutcomeValue {
  return OUTREACH_OUTCOME_VALUES.includes(value as OutreachOutcomeValue);
}

export function outreachOutcomeLabel(outcome: OutreachOutcomeValue): string {
  switch (outcome) {
    case "REPLIED":
      return "Replied";
    case "INTERESTED":
      return "Interested";
    case "NOT_INTERESTED":
      return "Not interested";
    case "NO_RESPONSE":
      return "No response";
    case "BOUNCED":
      return "Bounced";
  }
}
