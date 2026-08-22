import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { getResendClient } from "@/lib/email/resend";
import { prisma } from "@/lib/prisma";

import { buildProposalShareUrl, injectProposalLinkIntoMessage } from "./defaults";
import { canSendDeliveryStatus } from "./gates";
import {
  proposalDeliverySendIdempotencyKey,
  verifyProposalShareToken,
} from "./token";

export type SendProposalDeliveryResult =
  | { ok: true; deliveryId: string; providerMessageId: string | null }
  | { ok: false; code: string; message: string };

export async function sendProposalDelivery(options: {
  deliveryId: string;
  actorEmail: string;
  shareToken: string;
}): Promise<SendProposalDeliveryResult> {
  const delivery = await prisma.proposalDelivery.findUnique({
    where: { id: options.deliveryId },
    include: {
      proposal: {
        select: {
          id: true,
          revision: true,
          status: true,
          opportunityId: true,
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

  if (delivery.status === "SENT") {
    return {
      ok: false,
      code: "DELIVERY_ALREADY_SENT",
      message: "This proposal has already been sent.",
    };
  }

  if (!canSendDeliveryStatus(delivery.status)) {
    return {
      ok: false,
      code: "DELIVERY_NOT_READY",
      message: "Mark the delivery ready before sending.",
    };
  }

  if (delivery.proposal.status !== "APPROVED") {
    return {
      ok: false,
      code: "PROPOSAL_NOT_APPROVED",
      message: "Only an approved Proposal can be sent.",
    };
  }

  if (!verifyProposalShareToken(options.shareToken, delivery.shareTokenHash)) {
    return {
      ok: false,
      code: "INVALID_SHARE_TOKEN",
      message: "Secure link token does not match this delivery.",
    };
  }

  const locked = await prisma.proposalDelivery.updateMany({
    where: {
      id: delivery.id,
      status: { in: ["READY", "FAILED"] },
      revokedAt: null,
    },
    data: { status: "SENDING" },
  });

  if (locked.count !== 1) {
    return {
      ok: false,
      code: "DELIVERY_NOT_READY",
      message: "Delivery is not in a sendable state.",
    };
  }

  const fromEmail = process.env.CONTACT_FROM_EMAIL;
  const replyTo = process.env.CONTACT_REPLY_TO_EMAIL ?? process.env.CONTACT_TO_EMAIL;

  if (!fromEmail) {
    await markSendFailed({
      deliveryId: delivery.id,
      opportunityId: delivery.opportunityId,
      actorEmail: options.actorEmail,
      failureCode: "MISSING_FROM_EMAIL",
      failureMessage: "Email sender is not configured.",
    });
    return {
      ok: false,
      code: "SEND_FAILED",
      message: "Email sender is not configured.",
    };
  }

  const proposalLink = buildProposalShareUrl(options.shareToken);
  const body = injectProposalLinkIntoMessage(
    delivery.messageSnapshot,
    proposalLink,
  );

  try {
    const resend = getResendClient();
    const { error: sendError, data } = await resend.emails.send(
      {
        from: fromEmail,
        to: delivery.recipientEmail,
        replyTo: replyTo ?? undefined,
        subject: delivery.subjectSnapshot,
        text: body,
      },
      {
        idempotencyKey: proposalDeliverySendIdempotencyKey(delivery.id),
      },
    );

    if (sendError) {
      await markSendFailed({
        deliveryId: delivery.id,
        opportunityId: delivery.opportunityId,
        actorEmail: options.actorEmail,
        failureCode: "RESEND_ERROR",
        failureMessage: sendError.message ?? "Resend send failed.",
      });
      return {
        ok: false,
        code: "SEND_FAILED",
        message: "Email delivery failed. Review and retry explicitly.",
      };
    }

    const providerMessageId = data?.id ? String(data.id) : null;

    await prisma.$transaction(async (tx) => {
      await tx.proposalDelivery.update({
        where: { id: delivery.id },
        data: {
          status: "SENT",
          sentAt: new Date(),
          sentByEmail: options.actorEmail,
          deliveryProvider: "RESEND",
          providerMessageId,
          failureCode: null,
          failureMessage: null,
          messageSnapshot: body,
        },
      });

      await tx.opportunityActivity.create({
        data: {
          opportunityId: delivery.opportunityId,
          type: "PROPOSAL_SENT",
          actorEmail: options.actorEmail,
          toValueJson: {
            deliveryId: delivery.id,
            proposalId: delivery.proposalId,
            proposalRevision: delivery.proposal.revision,
            status: "SENT",
          } as Prisma.InputJsonValue,
        },
      });
    });

    return {
      ok: true,
      deliveryId: delivery.id,
      providerMessageId,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected send failure.";
    await markSendFailed({
      deliveryId: delivery.id,
      opportunityId: delivery.opportunityId,
      actorEmail: options.actorEmail,
      failureCode: "SEND_EXCEPTION",
      failureMessage: message,
    });
    return {
      ok: false,
      code: "SEND_FAILED",
      message: "Email delivery failed. Review and retry explicitly.",
    };
  }
}

async function markSendFailed(options: {
  deliveryId: string;
  opportunityId: string;
  actorEmail: string;
  failureCode: string;
  failureMessage: string;
}): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await tx.proposalDelivery.update({
      where: { id: options.deliveryId },
      data: {
        status: "FAILED",
        failureCode: options.failureCode.slice(0, 80),
        failureMessage: options.failureMessage.slice(0, 500),
      },
    });

    await tx.opportunityActivity.create({
      data: {
        opportunityId: options.opportunityId,
        type: "PROPOSAL_SEND_FAILED",
        actorEmail: options.actorEmail,
        toValueJson: {
          deliveryId: options.deliveryId,
          failureCode: options.failureCode.slice(0, 80),
        } as Prisma.InputJsonValue,
      },
    });
  });
}
