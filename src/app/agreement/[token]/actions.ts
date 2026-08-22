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
