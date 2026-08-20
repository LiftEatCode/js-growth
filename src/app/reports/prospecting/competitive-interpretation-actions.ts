"use server";

import { revalidatePath } from "next/cache";

import { getInternalSession } from "@/lib/internal-auth";
import { generateCompetitiveInterpretation } from "@/lib/competitive-intelligence/interpretation/create";

export interface CompetitiveInterpretationActionResult {
  success: boolean;
  message?: string;
  campaignId?: string;
  prospectId?: string;
  interpretationId?: string;
  reused?: boolean;
}

export async function generateCompetitiveAiInterpretation(
  campaignId: string,
  prospectId: string,
  options?: { force?: boolean; comparisonSnapshotId?: string },
): Promise<CompetitiveInterpretationActionResult> {
  const session = await getInternalSession();

  if (!session) {
    return {
      success: false,
      message: "You are not authorized to generate competitive interpretations.",
    };
  }

  const result = await generateCompetitiveInterpretation({
    campaignId,
    prospectId,
    comparisonSnapshotId: options?.comparisonSnapshotId,
    createdByEmail: session.email,
    force: options?.force === true,
  });

  if (!result.ok) {
    return {
      success: false,
      campaignId,
      prospectId,
      interpretationId: result.interpretationId,
      message: result.message,
    };
  }

  revalidatePath("/reports/prospecting");
  revalidatePath(`/reports/prospecting/${campaignId}`);
  revalidatePath(`/reports/prospecting/${campaignId}/prospects/${prospectId}`);

  return {
    success: true,
    campaignId,
    prospectId,
    interpretationId: result.interpretationId,
    reused: result.reused,
    message: result.reused
      ? "Existing interpretation reused (same comparison, versions, model, and fingerprint)."
      : "AI competitive interpretation generated.",
  };
}
