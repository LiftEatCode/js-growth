"use server";

import {
  acceptCommercialAgreement,
} from "@/lib/commercialization/agreement";
import { hashAgreementShareToken } from "@/lib/commercialization/agreement-delivery";

export interface AcceptAgreementActionResult {
  success: boolean;
  message?: string;
  alreadyAccepted?: boolean;
}

export async function acceptAgreementAction(options: {
  shareToken: string;
  signerName: string;
  signerEmail: string;
  signerTitle?: string;
  acceptanceConfirmed: boolean;
}): Promise<AcceptAgreementActionResult> {
  const shareTokenHash = hashAgreementShareToken(options.shareToken);

  const result = await acceptCommercialAgreement({
    shareTokenHash,
    signerName: options.signerName,
    signerEmail: options.signerEmail,
    signerTitle: options.signerTitle,
    acceptanceConfirmed: options.acceptanceConfirmed,
  });

  if (!result.ok) {
    return { success: false, message: result.message };
  }

  return {
    success: true,
    alreadyAccepted: result.alreadyAccepted,
    message: result.alreadyAccepted
      ? "Agreement was already accepted."
      : "Agreement accepted.",
  };
}

/** Form-action entry for progressive enhancement / Playwright-native submit. */
export async function acceptAgreementFormAction(
  _prev: AcceptAgreementActionResult,
  formData: FormData,
): Promise<AcceptAgreementActionResult> {
  const shareToken = String(formData.get("shareToken") ?? "");
  const signerName = String(formData.get("signerName") ?? "");
  const signerEmail = String(formData.get("signerEmail") ?? "");
  const signerTitleRaw = formData.get("signerTitle");
  const signerTitle =
    typeof signerTitleRaw === "string" && signerTitleRaw.trim()
      ? signerTitleRaw
      : undefined;
  const acceptanceConfirmed = formData.get("acceptanceConfirmed") === "true";

  return acceptAgreementAction({
    shareToken,
    signerName,
    signerEmail,
    signerTitle,
    acceptanceConfirmed,
  });
}
