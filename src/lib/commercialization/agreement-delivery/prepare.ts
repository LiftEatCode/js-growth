import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

import {
  buildDefaultAgreementEmailBody,
  buildDefaultAgreementEmailSubject,
  buildAgreementShareUrl,
} from "./defaults";
import {
  loadApprovedAgreementContext,
  validateRecipientInput,
} from "./gates";
import {
  MAX_DELIVERY_MESSAGE_CHARS,
  MAX_DELIVERY_SUBJECT_CHARS,
} from "./constants";
import { generateAgreementShareToken, hashAgreementShareToken } from "./token";

export type PrepareAgreementDeliveryResult =
  | {
      ok: true;
      deliveryId: string;
      shareToken: string;
      shareUrl: string;
    }
  | {
      ok: false;
      code: string;
      message: string;
    };

export async function prepareAgreementDelivery(options: {
  opportunityId: string;
  agreementId: string;
  actorEmail: string;
  recipientName: string;
  recipientEmail: string;
}): Promise<PrepareAgreementDeliveryResult> {
  const gate = await loadApprovedAgreementContext({
    opportunityId: options.opportunityId,
    agreementId: options.agreementId,
  });
  if (!gate.ok) {
    return { ok: false, code: gate.code, message: gate.message };
  }

  const recipient = validateRecipientInput({
    recipientName: options.recipientName,
    recipientEmail: options.recipientEmail,
  });
  if (!recipient.ok) {
    return {
      ok: false,
      code: recipient.code,
      message: recipient.message,
    };
  }

  const shareToken = generateAgreementShareToken();
  const shareTokenHash = hashAgreementShareToken(shareToken);
  const shareUrl = buildAgreementShareUrl(shareToken);
  const subject = buildDefaultAgreementEmailSubject(
    gate.context.agreement.businessName,
  ).slice(0, MAX_DELIVERY_SUBJECT_CHARS);
  const message = buildDefaultAgreementEmailBody({
    recipientName: recipient.recipientName,
    businessName: gate.context.agreement.businessName,
    agreementLink: shareUrl,
  }).slice(0, MAX_DELIVERY_MESSAGE_CHARS);

  const delivery = await prisma.$transaction(async (tx) => {
    const row = await tx.agreementDelivery.create({
      data: {
        opportunityId: options.opportunityId,
        agreementId: options.agreementId,
        recipientName: recipient.recipientName,
        recipientEmail: recipient.recipientEmail,
        status: "DRAFT",
        subjectSnapshot: subject,
        messageSnapshot: message,
        agreementVersion: gate.context.agreement.agreementVersion,
        agreementPresentationVersion:
          gate.context.agreement.agreementPresentationVersion,
        termsVersion: gate.context.agreement.termsVersion,
        shareTokenHash,
        preparedByEmail: options.actorEmail,
      },
    });

    await tx.opportunityActivity.create({
      data: {
        opportunityId: options.opportunityId,
        type: "AGREEMENT_DELIVERY_PREPARED",
        actorEmail: options.actorEmail,
        toValueJson: {
          deliveryId: row.id,
          agreementId: options.agreementId,
          agreementRevision: gate.context.agreement.revision,
          status: "DRAFT",
        } as Prisma.InputJsonValue,
      },
    });

    return row;
  });

  return {
    ok: true,
    deliveryId: delivery.id,
    shareToken,
    shareUrl,
  };
}

export type UpdateAgreementDeliveryResult =
  | { ok: true; deliveryId: string }
  | { ok: false; code: string; message: string };

export async function updateAgreementDelivery(options: {
  deliveryId: string;
  actorEmail: string;
  recipientName?: string;
  recipientEmail?: string;
  subject?: string;
  message?: string;
  markReady?: boolean;
}): Promise<UpdateAgreementDeliveryResult> {
  const delivery = await prisma.agreementDelivery.findUnique({
    where: { id: options.deliveryId },
  });

  if (!delivery) {
    return {
      ok: false,
      code: "DELIVERY_NOT_FOUND",
      message: "Delivery not found.",
    };
  }

  if (delivery.revokedAt) {
    return {
      ok: false,
      code: "DELIVERY_REVOKED",
      message: "This delivery access has been revoked.",
    };
  }

  if (delivery.status === "SENT" || delivery.status === "SENDING") {
    return {
      ok: false,
      code: "DELIVERY_ALREADY_SENT",
      message: "Sent deliveries cannot be edited.",
    };
  }

  const recipientName =
    options.recipientName?.trim() ?? delivery.recipientName;
  const recipientEmail =
    options.recipientEmail !== undefined
      ? options.recipientEmail
      : delivery.recipientEmail;

  const recipient = validateRecipientInput({ recipientName, recipientEmail });
  if (!recipient.ok) {
    return {
      ok: false,
      code: recipient.code,
      message: recipient.message,
    };
  }

  const subject = (options.subject ?? delivery.subjectSnapshot)
    .trim()
    .slice(0, MAX_DELIVERY_SUBJECT_CHARS);
  const message = (options.message ?? delivery.messageSnapshot)
    .trim()
    .slice(0, MAX_DELIVERY_MESSAGE_CHARS);

  if (!subject || !message) {
    return {
      ok: false,
      code: "INVALID_INPUT",
      message: "Subject and message are required.",
    };
  }

  const nextStatus = options.markReady ? "READY" : delivery.status;

  await prisma.agreementDelivery.update({
    where: { id: delivery.id },
    data: {
      recipientName: recipient.recipientName,
      recipientEmail: recipient.recipientEmail,
      subjectSnapshot: subject,
      messageSnapshot: message,
      status: nextStatus,
    },
  });

  return { ok: true, deliveryId: delivery.id };
}

export type RegenerateAgreementShareTokenResult =
  | { ok: true; deliveryId: string; shareToken: string; shareUrl: string }
  | { ok: false; code: string; message: string };

export async function regenerateAgreementShareToken(options: {
  deliveryId: string;
  actorEmail: string;
}): Promise<RegenerateAgreementShareTokenResult> {
  const delivery = await prisma.agreementDelivery.findUnique({
    where: { id: options.deliveryId },
    include: {
      agreement: {
        select: {
          opportunity: {
            select: { prospect: { select: { businessName: true } } },
          },
        },
      },
    },
  });

  if (!delivery) {
    return {
      ok: false,
      code: "DELIVERY_NOT_FOUND",
      message: "Delivery not found.",
    };
  }

  if (delivery.revokedAt) {
    return {
      ok: false,
      code: "DELIVERY_REVOKED",
      message: "This delivery access has been revoked.",
    };
  }

  if (delivery.status === "SENT" || delivery.status === "SENDING") {
    return {
      ok: false,
      code: "DELIVERY_ALREADY_SENT",
      message: "Sent deliveries keep their original secure link.",
    };
  }

  const shareToken = generateAgreementShareToken();
  const shareTokenHash = hashAgreementShareToken(shareToken);
  const shareUrl = buildAgreementShareUrl(shareToken);
  const message = buildDefaultAgreementEmailBody({
    recipientName: delivery.recipientName,
    businessName: delivery.agreement.opportunity.prospect.businessName,
    agreementLink: shareUrl,
  }).slice(0, MAX_DELIVERY_MESSAGE_CHARS);

  await prisma.agreementDelivery.update({
    where: { id: delivery.id },
    data: {
      shareTokenHash,
      messageSnapshot: message,
    },
  });

  return {
    ok: true,
    deliveryId: delivery.id,
    shareToken,
    shareUrl,
  };
}
