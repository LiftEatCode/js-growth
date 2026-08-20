"use server";

import { revalidatePath } from "next/cache";

import { getInternalSession } from "@/lib/internal-auth";
import { generateCompetitiveComparisonSnapshot } from "@/lib/competitive-intelligence/comparison/load";

export interface CompetitiveComparisonActionResult {
  success: boolean;
  message?: string;
  campaignId?: string;
  prospectId?: string;
  snapshotId?: string;
}

export async function generateCompetitiveComparison(
  campaignId: string,
  prospectId: string,
): Promise<CompetitiveComparisonActionResult> {
  const session = await getInternalSession();

  if (!session) {
    return {
      success: false,
      message: "You are not authorized to generate competitive comparisons.",
    };
  }

  const result = await generateCompetitiveComparisonSnapshot({
    campaignId,
    prospectId,
    createdByEmail: session.email,
  });

  if (!result.ok) {
    return {
      success: false,
      campaignId,
      prospectId,
      message: result.message,
    };
  }

  revalidatePath("/reports/prospecting");
  revalidatePath(`/reports/prospecting/${campaignId}`);
  revalidatePath(`/reports/prospecting/${campaignId}/prospects/${prospectId}`);

  const skipped =
    result.skippedCompetitors.length > 0
      ? ` Skipped ${result.skippedCompetitors.length} selected competitor(s) without compatible audits.`
      : "";

  return {
    success: true,
    campaignId,
    prospectId,
    snapshotId: result.snapshotId,
    message: `Competitive comparison generated from ${result.comparison.competitorsCompared.length} competitor audit(s).${skipped}`,
  };
}
