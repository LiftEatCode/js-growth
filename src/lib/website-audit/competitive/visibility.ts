import type { ReportCapabilities } from "../report-config";
import type { CompetitiveData } from "./types";

export type CompetitiveVisibility =
  | "hidden"
  | "teaser"
  | "full"
  | "unavailable";

export function isCompetitiveData(value: unknown): value is CompetitiveData {
  if (!value || typeof value !== "object") {
    return false;
  }

  const data = value as CompetitiveData;

  return (
    (data.status === "compared" ||
      data.status === "partial" ||
      data.status === "unavailable") &&
    typeof data.analyzedCount === "number" &&
    Array.isArray(data.competitors) &&
    Array.isArray(data.gaps) &&
    Array.isArray(data.findings)
  );
}

export function getCompetitiveVisibility(
  data: CompetitiveData | undefined,
  capabilities: Pick<ReportCapabilities, "showCompetitiveIntelligence">,
): CompetitiveVisibility {
  if (!isCompetitiveData(data)) {
    return "hidden";
  }

  if (!capabilities.showCompetitiveIntelligence) {
    if (data.status === "unavailable" || data.analyzedCount === 0) {
      return "hidden";
    }

    return "teaser";
  }

  if (data.status === "unavailable" || data.analyzedCount === 0) {
    return "unavailable";
  }

  return "full";
}
