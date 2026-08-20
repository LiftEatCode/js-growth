"use server";

import { revalidatePath } from "next/cache";

import { generateImplementationInterpretation } from "@/lib/commercialization/implementation-interpretation/create";
import { getInternalSession } from "@/lib/internal-auth";

export interface ImplementationInterpretationActionResult {
  success: boolean;
  message?: string;
  campaignId?: string;
  prospectId?: string;
  interpretationId?: string;
  reused?: boolean;
}

export async function generateImplementationAiStrategy(
  campaignId: string,
  prospectId: string,
  options?: { force?: boolean; implementationPlanId?: string },
): Promise<ImplementationInterpretationActionResult> {
  const session = await getInternalSession();

  if (!session) {
    return {
      success: false,
      message: "You are not authorized to generate implementation strategies.",
    };
  }

  const result = await generateImplementationInterpretation({
    campaignId,
    prospectId,
    implementationPlanId: options?.implementationPlanId,
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
      ? "Existing AI strategy reused (same plan, versions, model, and fingerprint)."
      : "AI implementation strategy generated.",
  };
}
