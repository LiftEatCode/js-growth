import type { CompetitorAuditStatusValue } from "./types";
import { getScoreBand } from "@/lib/website-audit/score-bands";

export function competitorWebsiteAuditStatusLabel(
  status: CompetitorAuditStatusValue | string | null | undefined,
): string {
  switch (status) {
    case "PENDING":
      return "Pending";
    case "RUNNING":
      return "Running";
    case "COMPLETED":
      return "Completed";
    case "FAILED":
      return "Failed";
    default:
      return "Not audited";
  }
}

export function competitorWebsiteGrowthScoreText(
  score: number | null | undefined,
): string | null {
  if (typeof score !== "number" || !Number.isFinite(score)) {
    return null;
  }

  return `${score} · ${getScoreBand(score).label}`;
}
