import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

import { hashProposalShareToken } from "./token";

export async function recordProposalLinkView(options: {
  shareToken: string;
}): Promise<{ recorded: boolean; deliveryId?: string }> {
  const shareTokenHash = hashProposalShareToken(options.shareToken);

  const delivery = await prisma.proposalDelivery.findUnique({
    where: { shareTokenHash },
    select: {
      id: true,
      opportunityId: true,
      revokedAt: true,
      firstViewedAt: true,
    },
  });

  if (!delivery || delivery.revokedAt) {
    return { recorded: false };
  }

  const now = new Date();
  const firstView = delivery.firstViewedAt == null;

  await prisma.$transaction(async (tx) => {
    await tx.proposalDelivery.update({
      where: { id: delivery.id },
      data: {
        viewCount: { increment: 1 },
        firstViewedAt: delivery.firstViewedAt ?? now,
        lastViewedAt: now,
      },
    });

    if (firstView) {
      await tx.opportunityActivity.create({
        data: {
          opportunityId: delivery.opportunityId,
          type: "PROPOSAL_LINK_VIEWED",
          actorEmail: "system@proposal-view",
          toValueJson: {
            deliveryId: delivery.id,
          } as Prisma.InputJsonValue,
        },
      });
    }
  });

  return { recorded: true, deliveryId: delivery.id };
}
