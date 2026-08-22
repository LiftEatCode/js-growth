import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export type RevokeAgreementAccessResult =
  | { ok: true; deliveryId: string }
  | { ok: false; code: string; message: string };

export async function revokeAgreementAccess(options: {
  deliveryId: string;
  actorEmail: string;
}): Promise<RevokeAgreementAccessResult> {
  const delivery = await prisma.agreementDelivery.findUnique({
    where: { id: options.deliveryId },
    include: {
      agreement: { select: { status: true } },
    },
  });

  if (!delivery) {
    return {
      ok: false,
      code: "DELIVERY_NOT_FOUND",
      message: "Delivery not found.",
    };
  }

  if (delivery.agreement.status === "ACCEPTED") {
    return {
      ok: false,
      code: "AGREEMENT_ACCEPTED",
      message: "Accepted Agreements keep their delivery record.",
    };
  }

  if (delivery.revokedAt) {
    return { ok: true, deliveryId: delivery.id };
  }

  await prisma.$transaction(async (tx) => {
    await tx.agreementDelivery.update({
      where: { id: delivery.id },
      data: {
        revokedAt: new Date(),
        revokedByEmail: options.actorEmail,
      },
    });

    await tx.opportunityActivity.create({
      data: {
        opportunityId: delivery.opportunityId,
        type: "AGREEMENT_ACCESS_REVOKED",
        actorEmail: options.actorEmail,
        toValueJson: {
          deliveryId: delivery.id,
          agreementId: delivery.agreementId,
        } as Prisma.InputJsonValue,
      },
    });
  });

  return { ok: true, deliveryId: delivery.id };
}
