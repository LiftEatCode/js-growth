import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

import { hashAgreementShareToken } from "./token";

export async function recordAgreementLinkView(options: {
  shareToken: string;
}): Promise<{ recorded: boolean; deliveryId?: string }> {
  const shareTokenHash = hashAgreementShareToken(options.shareToken);

  const delivery = await prisma.agreementDelivery.findUnique({
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
    await tx.agreementDelivery.update({
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
          type: "AGREEMENT_LINK_VIEWED",
          actorEmail: "system@agreement-view",
          toValueJson: {
            deliveryId: delivery.id,
          } as Prisma.InputJsonValue,
        },
      });
    }
  });

  return { recorded: true, deliveryId: delivery.id };
}
