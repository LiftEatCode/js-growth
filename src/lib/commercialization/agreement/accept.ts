import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

import {
  isValidSignerEmail,
  MAX_SIGNER_EMAIL_CHARS,
  MAX_SIGNER_NAME_CHARS,
  MAX_SIGNER_TITLE_CHARS,
  normalizeSignerEmail,
} from "./constants";
import { hashAgreementSnapshot } from "./hash";
import { evaluateAgreementStaleness } from "./staleness";
import type { AgreementSnapshot } from "./types";

export type AcceptAgreementResult =
  | {
      ok: true;
      alreadyAccepted: boolean;
      acceptedAt: Date;
    }
  | {
      ok: false;
      code: string;
      message: string;
    };

function parseSnapshot(raw: unknown): AgreementSnapshot | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }
  return raw as AgreementSnapshot;
}

export async function acceptCommercialAgreement(options: {
  shareTokenHash: string;
  signerName: string;
  signerEmail: string;
  signerTitle?: string | null;
  acceptanceConfirmed: boolean;
}): Promise<AcceptAgreementResult> {
  const delivery = await prisma.agreementDelivery.findUnique({
    where: { shareTokenHash: options.shareTokenHash },
    include: {
      agreement: {
        include: {
          acceptance: true,
          proposal: { select: { revision: true } },
          commercialScope: { select: { id: true, revision: true } },
          commercialPricing: { select: { id: true, revision: true } },
        },
      },
    },
  });

  if (!delivery || delivery.revokedAt) {
    return {
      ok: false,
      code: "INVALID_TOKEN",
      message: "This agreement link is invalid or has been revoked.",
    };
  }

  const agreement = delivery.agreement;

  if (agreement.status === "ACCEPTED" && agreement.acceptance) {
    return {
      ok: true,
      alreadyAccepted: true,
      acceptedAt: agreement.acceptance.acceptedAt,
    };
  }

  if (agreement.status !== "APPROVED") {
    return {
      ok: false,
      code: "NOT_APPROVED",
      message: "This Agreement is not available for acceptance.",
    };
  }

  const staleness = evaluateAgreementStaleness({
    storedFingerprint: agreement.sourceFingerprint,
    current: {
      opportunityId: agreement.opportunityId,
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
      code: "STALE",
      message:
        "This Agreement is no longer current. Contact JS Solutions for an updated agreement.",
    };
  }

  if (!options.acceptanceConfirmed) {
    return {
      ok: false,
      code: "CONFIRMATION_REQUIRED",
      message: "You must confirm acceptance before submitting.",
    };
  }

  const signerName = options.signerName.trim().slice(0, MAX_SIGNER_NAME_CHARS);
  const signerEmail = normalizeSignerEmail(options.signerEmail).slice(
    0,
    MAX_SIGNER_EMAIL_CHARS,
  );
  const signerTitle =
    options.signerTitle?.trim().slice(0, MAX_SIGNER_TITLE_CHARS) || null;

  if (!signerName) {
    return {
      ok: false,
      code: "INVALID_INPUT",
      message: "Signer name is required.",
    };
  }

  if (!isValidSignerEmail(signerEmail)) {
    return {
      ok: false,
      code: "INVALID_INPUT",
      message: "A valid signer email is required.",
    };
  }

  const snapshot = parseSnapshot(agreement.snapshotJson);
  if (!snapshot) {
    return {
      ok: false,
      code: "INVALID_SNAPSHOT",
      message: "Agreement content is unavailable.",
    };
  }

  const snapshotHash = hashAgreementSnapshot(snapshot);
  const acceptedAt = new Date();

  try {
    await prisma.$transaction(async (tx) => {
      const locked = await tx.commercialAgreement.updateMany({
        where: {
          id: agreement.id,
          status: "APPROVED",
        },
        data: {
          status: "ACCEPTED",
          acceptedAt,
        },
      });

      if (locked.count !== 1) {
        const existing = await tx.agreementAcceptance.findUnique({
          where: { agreementId: agreement.id },
        });
        if (existing) {
          return;
        }
        throw new Error("ACCEPTANCE_RACE");
      }

      await tx.agreementAcceptance.create({
        data: {
          agreementId: agreement.id,
          signerName,
          signerEmail,
          signerTitle,
          acceptedAt,
          agreementVersion: agreement.agreementVersion,
          agreementPresentationVersion: agreement.agreementPresentationVersion,
          termsVersion: agreement.termsVersion,
          agreementSnapshotHash: snapshotHash,
          acceptanceTextSnapshot: agreement.acceptanceLanguage,
        },
      });

      await tx.opportunityActivity.create({
        data: {
          opportunityId: agreement.opportunityId,
          type: "AGREEMENT_ACCEPTED",
          actorEmail: signerEmail,
          toValueJson: {
            agreementId: agreement.id,
            revision: agreement.revision,
            agreementSnapshotHash: snapshotHash,
          } as Prisma.InputJsonValue,
        },
      });
    });
  } catch (error) {
    if (error instanceof Error && error.message === "ACCEPTANCE_RACE") {
      const existing = await prisma.agreementAcceptance.findUnique({
        where: { agreementId: agreement.id },
      });
      if (existing) {
        return {
          ok: true,
          alreadyAccepted: true,
          acceptedAt: existing.acceptedAt,
        };
      }
    }
    throw error;
  }

  return {
    ok: true,
    alreadyAccepted: false,
    acceptedAt,
  };
}
