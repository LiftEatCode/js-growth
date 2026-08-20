import type { CompetitorStatusValue, CompetitorValidationLabel } from "./types";

export function competitorStatusLabel(status: CompetitorStatusValue): string {
  switch (status) {
    case "CANDIDATE":
      return "Candidate";
    case "VALIDATED":
      return "Validated";
    case "SELECTED":
      return "Selected";
    case "REJECTED":
      return "Rejected";
    case "STALE":
      return "Stale";
    default:
      return status;
  }
}

export function competitorValidationLabelText(
  label: CompetitorValidationLabel,
): string {
  switch (label) {
    case "STRONG":
      return "Strong";
    case "LIKELY":
      return "Likely";
    case "WEAK":
      return "Weak";
    case "REJECTED":
      return "Rejected";
    default:
      return label;
  }
}

export function competitorMatchSummary(input: {
  matchedVerticals: string[];
  geographicBand: string;
  rejectionReasons: string[];
}): string {
  if (input.rejectionReasons.includes("same_hostname")) {
    return "Same business / domain";
  }

  if (input.rejectionReasons.includes("supplier")) {
    return "Looks like a supplier, not a service competitor";
  }

  if (input.rejectionReasons.includes("retailer")) {
    return "Looks like retail, not a service competitor";
  }

  if (input.rejectionReasons.includes("unrelated_vertical")) {
    return "Different business type";
  }

  if (input.rejectionReasons.includes("outside_market")) {
    return "Outside the target market radius";
  }

  const vertical =
    input.matchedVerticals.length > 0
      ? `Same vertical (${input.matchedVerticals.join(", ")})`
      : "Limited vertical overlap";

  const geo =
    input.geographicBand === "very_near"
      ? "very close geography"
      : input.geographicBand === "near"
        ? "close geography"
        : input.geographicBand === "regional"
          ? "regional match"
          : input.geographicBand === "distant"
            ? "distant geography"
            : "location unknown";

  return `${vertical} + ${geo}`;
}
