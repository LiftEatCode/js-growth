import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export type RevokeProposalAccessResult =
  | { ok: true; deliveryId: string }
  | { ok: false; code: string; message: string };

export async function revokeProposalAccess(options: {
  deliveryId: string;
  actorEmail: string;
}): Promise<RevokeProposalAccessResult> {
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
    return { ok: true, deliveryId: delivery.id };
  }

  await prisma.$transaction(async (tx) => {
    await tx.proposalDelivery.update({
      where: { id: delivery.id },
      data: {
        revokedAt: new Date(),
        revokedByEmail: options.actorEmail,
      },
    });

    await tx.opportunityActivity.create({
      data: {
        opportunityId: delivery.opportunityId,
        type: "PROPOSAL_ACCESS_REVOKED",
        actorEmail: options.actorEmail,
        toValueJson: {
          deliveryId: delivery.id,
          proposalId: delivery.proposalId,
        } as Prisma.InputJsonValue,
      },
    });
  });

  return { ok: true, deliveryId: delivery.id };
}
