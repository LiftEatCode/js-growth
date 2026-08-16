import type { ReportMode, ReportTier } from "./types";

export function resolveReportTier(options: {
  mode: ReportMode;
  professionallyUnlocked?: boolean;
}): ReportTier {
  if (options.professionallyUnlocked) {
    return "professional";
  }

  if (options.mode !== "public") {
    return "professional";
  }

  return "free";
}
