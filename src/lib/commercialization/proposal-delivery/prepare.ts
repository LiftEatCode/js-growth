import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

import {
  buildDefaultProposalEmailBody,
  buildDefaultProposalEmailSubject,
  buildProposalShareUrl,
} from "./defaults";
import {
  loadApprovedCurrentProposalContext,
  validateRecipientInput,
} from "./gates";
import {
  MAX_DELIVERY_MESSAGE_CHARS,
  MAX_DELIVERY_SUBJECT_CHARS,
} from "./constants";
import { generateProposalShareToken, hashProposalShareToken } from "./token";

export type PrepareProposalDeliveryResult =
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

export async function prepareProposalDelivery(options: {
  opportunityId: string;
  proposalId: string;
  actorEmail: string;
  recipientName: string;
  recipientEmail: string;
}): Promise<PrepareProposalDeliveryResult> {
  const gate = await loadApprovedCurrentProposalContext({
    opportunityId: options.opportunityId,
    proposalId: options.proposalId,
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

  const shareToken = generateProposalShareToken();
  const shareTokenHash = hashProposalShareToken(shareToken);
  const shareUrl = buildProposalShareUrl(shareToken);
  const subject = buildDefaultProposalEmailSubject(
    gate.context.proposal.businessName,
  ).slice(0, MAX_DELIVERY_SUBJECT_CHARS);
  const message = buildDefaultProposalEmailBody({
    recipientName: recipient.recipientName,
    businessName: gate.context.proposal.businessName,
    proposalLink: shareUrl,
  }).slice(0, MAX_DELIVERY_MESSAGE_CHARS);

  const delivery = await prisma.$transaction(async (tx) => {
    const row = await tx.proposalDelivery.create({
      data: {
        opportunityId: options.opportunityId,
        proposalId: options.proposalId,
        recipientName: recipient.recipientName,
        recipientEmail: recipient.recipientEmail,
        status: "DRAFT",
        subjectSnapshot: subject,
        messageSnapshot: message,
        proposalVersion: gate.context.proposal.proposalVersion,
        proposalPresentationVersion:
          gate.context.proposal.presentationVersion,
        shareTokenHash,
        preparedByEmail: options.actorEmail,
      },
    });

    await tx.opportunityActivity.create({
      data: {
        opportunityId: options.opportunityId,
        type: "PROPOSAL_DELIVERY_PREPARED",
        actorEmail: options.actorEmail,
        toValueJson: {
          deliveryId: row.id,
          proposalId: options.proposalId,
          proposalRevision: gate.context.proposal.revision,
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

export type UpdateProposalDeliveryResult =
  | { ok: true; deliveryId: string }
  | { ok: false; code: string; message: string };

export async function updateProposalDelivery(options: {
  deliveryId: string;
  actorEmail: string;
  recipientName?: string;
  recipientEmail?: string;
  subject?: string;
  message?: string;
  markReady?: boolean;
}): Promise<UpdateProposalDeliveryResult> {
  const delivery = await prisma.proposalDelivery.findUnique({
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

  await prisma.proposalDelivery.update({
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

export type RegenerateShareTokenResult =
  | { ok: true; deliveryId: string; shareToken: string; shareUrl: string }
  | { ok: false; code: string; message: string };

export async function regenerateProposalShareToken(options: {
  deliveryId: string;
  actorEmail: string;
}): Promise<RegenerateShareTokenResult> {
  const delivery = await prisma.proposalDelivery.findUnique({
    where: { id: options.deliveryId },
    include: {
      proposal: {
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

  const shareToken = generateProposalShareToken();
  const shareTokenHash = hashProposalShareToken(shareToken);
  const shareUrl = buildProposalShareUrl(shareToken);
  const message = buildDefaultProposalEmailBody({
    recipientName: delivery.recipientName,
    businessName: delivery.proposal.opportunity.prospect.businessName,
    proposalLink: shareUrl,
  }).slice(0, MAX_DELIVERY_MESSAGE_CHARS);

  await prisma.proposalDelivery.update({
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
