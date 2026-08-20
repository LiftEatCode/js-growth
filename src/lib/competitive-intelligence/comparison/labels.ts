import type { CompetitivePosition, FindingPattern, OpportunityPriority } from "./types";

export function competitivePositionLabel(position: CompetitivePosition): string {
  switch (position) {
    case "MAJOR_ADVANTAGE":
      return "Major advantage";
    case "ADVANTAGE":
      return "Advantage";
    case "PARITY":
      return "Parity";
    case "GAP":
      return "Gap";
    case "MAJOR_GAP":
      return "Major gap";
    default:
      return position;
  }
}

export function findingPatternLabel(pattern: FindingPattern): string {
  switch (pattern) {
    case "TARGET_ONLY_WEAKNESS":
      return "Target-only weakness";
    case "COMMON_MARKET_WEAKNESS":
      return "Common market weakness";
    case "COMPETITIVE_ADVANTAGE":
      return "Competitive advantage";
    case "MARKET_STANDARD":
      return "Market standard";
    case "MIXED":
      return "Mixed";
    default:
      return pattern;
  }
}

export function opportunityPriorityLabel(priority: OpportunityPriority): string {
  switch (priority) {
    case "CRITICAL":
      return "Critical";
    case "HIGH":
      return "High";
    case "MEDIUM":
      return "Medium";
    case "LOW":
      return "Low";
    default:
      return priority;
  }
}

export function formatSignedGap(value: number): string {
  if (value > 0) {
    return `+${value}`;
  }

  return String(value);
}
