import { evaluateAgreementStaleness } from "@/lib/commercialization/agreement/staleness";
import { prisma } from "@/lib/prisma";

import {
  isValidRecipientEmail,
  normalizeRecipientEmail,
  type AgreementDeliveryStatus,
} from "./constants";

export type AgreementDeliveryGateFailure =
  | "MISSING_OPPORTUNITY"
  | "TERMINAL_OPPORTUNITY"
  | "MISSING_AGREEMENT"
  | "AGREEMENT_NOT_APPROVED"
  | "AGREEMENT_STALE"
  | "AGREEMENT_VOIDED"
  | "AGREEMENT_SUPERSEDED"
  | "AGREEMENT_ALREADY_ACCEPTED"
  | "INVALID_RECIPIENT";

export interface ApprovedAgreementContext {
  agreement: {
    id: string;
    opportunityId: string;
    revision: number;
    status: "APPROVED";
    agreementVersion: number;
    agreementPresentationVersion: number;
    termsVersion: number;
    businessName: string;
    stale: boolean;
  };
}

export async function loadApprovedAgreementContext(options: {
  opportunityId: string;
  agreementId: string;
}): Promise<
  | { ok: true; context: ApprovedAgreementContext }
  | { ok: false; code: AgreementDeliveryGateFailure; message: string }
> {
  const opportunity = await prisma.opportunity.findUnique({
    where: { id: options.opportunityId },
    select: { id: true, stage: true },
  });

  if (!opportunity) {
    return {
      ok: false,
      code: "MISSING_OPPORTUNITY",
      message: "Opportunity not found.",
    };
  }

  if (opportunity.stage === "LOST") {
    return {
      ok: false,
      code: "TERMINAL_OPPORTUNITY",
      message: "Cannot deliver an Agreement on a lost Opportunity.",
    };
  }

  const agreement = await prisma.commercialAgreement.findFirst({
    where: {
      id: options.agreementId,
      opportunityId: options.opportunityId,
    },
    include: {
      opportunity: {
        select: {
          prospect: { select: { businessName: true } },
        },
      },
      proposal: { select: { revision: true } },
      commercialScope: { select: { id: true, revision: true } },
      commercialPricing: { select: { id: true, revision: true } },
    },
  });

  if (!agreement) {
    return {
      ok: false,
      code: "MISSING_AGREEMENT",
      message: "Agreement not found for this Opportunity.",
    };
  }

  if (agreement.status === "VOIDED") {
    return {
      ok: false,
      code: "AGREEMENT_VOIDED",
      message: "Voided Agreements cannot be delivered.",
    };
  }

  if (agreement.status === "SUPERSEDED") {
    return {
      ok: false,
      code: "AGREEMENT_SUPERSEDED",
      message: "Superseded Agreements cannot be delivered.",
    };
  }

  if (agreement.status === "ACCEPTED") {
    return {
      ok: false,
      code: "AGREEMENT_ALREADY_ACCEPTED",
      message: "This Agreement has already been accepted.",
    };
  }

  if (agreement.status !== "APPROVED") {
    return {
      ok: false,
      code: "AGREEMENT_NOT_APPROVED",
      message: "Only an approved Agreement can be delivered.",
    };
  }

  const staleness = evaluateAgreementStaleness({
    storedFingerprint: agreement.sourceFingerprint,
    current: {
      opportunityId: options.opportunityId,
      proposalId: agreement.proposalId,
      proposalRevision: agreement.proposal.revision,
      commercialScopeId: agreement.commercialScopeId,
      scopeRevision: agreement.commercialScope.revision,
      commercialPricingId: agreement.commercialPricingId,
      pricingRevision: agreement.commercialPricing.revision,
      agreementVersion: agreement.agreementVersion,
      agreementPresentationVersion: agreement.agreementPresentationVersion,
      termsVersion: agreement.termsVersion,
      paymentTermType: agreement.paymentTermType,
      depositPercent: agreement.depositPercent,
      paymentCustomText: agreement.paymentCustomText,
    },
  });

  if (staleness.stale) {
    return {
      ok: false,
      code: "AGREEMENT_STALE",
      message:
        "Agreement is stale relative to upstream commercial authority. Revise before delivery.",
    };
  }

  return {
    ok: true,
    context: {
      agreement: {
        id: agreement.id,
        opportunityId: agreement.opportunityId,
        revision: agreement.revision,
        status: "APPROVED",
        agreementVersion: agreement.agreementVersion,
        agreementPresentationVersion: agreement.agreementPresentationVersion,
        termsVersion: agreement.termsVersion,
        businessName: agreement.opportunity.prospect.businessName,
        stale: false,
      },
    },
  };
}

export function validateRecipientInput(options: {
  recipientName: string;
  recipientEmail: string;
}):
  | { ok: true; recipientName: string; recipientEmail: string }
  | { ok: false; code: "INVALID_RECIPIENT"; message: string } {
  const recipientName = options.recipientName.trim();
  const recipientEmail = normalizeRecipientEmail(options.recipientEmail);

  if (!recipientName) {
    return {
      ok: false,
      code: "INVALID_RECIPIENT",
      message: "Recipient name is required.",
    };
  }

  if (!isValidRecipientEmail(recipientEmail)) {
    return {
      ok: false,
      code: "INVALID_RECIPIENT",
      message: "A valid recipient email is required.",
    };
  }

  return { ok: true, recipientName, recipientEmail };
}

export function isEditableDeliveryStatus(
  status: AgreementDeliveryStatus,
): boolean {
  return status === "DRAFT" || status === "READY" || status === "FAILED";
}

export function canSendDeliveryStatus(status: AgreementDeliveryStatus): boolean {
  return status === "READY" || status === "FAILED";
}
