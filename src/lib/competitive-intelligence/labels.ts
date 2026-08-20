import type { CompetitorStatusValue, CompetitorValidationLabel, GeographyMode } from "./types";
import { formatCompetitorDistanceDisplay } from "./geography";

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

export function competitorDistanceLabel(input: {
  distanceMiles: number | null;
  geographyMode: GeographyMode;
  geographyBand: string;
}): string {
  return formatCompetitorDistanceDisplay({
    distanceMiles: input.distanceMiles,
    geographyMode: input.geographyMode,
    geographyBand: input.geographyBand as
      | "very_near"
      | "near"
      | "regional"
      | "distant"
      | "same_city"
      | "same_region"
      | "unknown",
  });
}

export function competitorMatchSummary(input: {
  matchedVerticals: string[];
  geographyMode: GeographyMode;
  distanceMiles: number | null;
  hasWebsite: boolean;
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
    input.geographyMode === "EXACT_DISTANCE" && input.distanceMiles !== null
      ? `${input.distanceMiles} mi away`
      : input.geographyMode === "SAME_CITY_FALLBACK"
        ? "same city"
        : input.geographyMode === "SAME_REGION_FALLBACK"
          ? "same region"
          : "location unknown";

  const website = input.hasWebsite ? "public website" : "no public website";

  return `${vertical} + ${geo} + ${website}`;
}
