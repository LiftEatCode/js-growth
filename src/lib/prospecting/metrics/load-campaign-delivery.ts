import "server-only";

import { prisma } from "@/lib/prisma";
import type { ProviderDeliveryStatusValue } from "@/lib/prospecting/outreach/delivery/types";

export interface CampaignDeliveryHealthCounts {
  sent: number;
  delivered: number;
  delayed: number;
  failed: number;
  bounced: number;
  complained: number;
  suppressed: number;
}

export async function loadCampaignDeliveryHealth(
  campaignId: string,
): Promise<CampaignDeliveryHealthCounts> {
  const messages = await prisma.outreachMessage.findMany({
    where: {
      campaignId,
      channel: "EMAIL",
      status: "SENT",
    },
    select: {
      id: true,
      providerDeliveryStatus: true,
    },
  });

  const counts: CampaignDeliveryHealthCounts = {
    sent: messages.length,
    delivered: 0,
    delayed: 0,
    failed: 0,
    bounced: 0,
    complained: 0,
    suppressed: 0,
  };

  for (const message of messages) {
    const status = (message.providerDeliveryStatus ??
      "SENT") as ProviderDeliveryStatusValue;

    switch (status) {
      case "DELIVERED":
        counts.delivered += 1;
        break;
      case "DELAYED":
        counts.delayed += 1;
        break;
      case "FAILED":
        counts.failed += 1;
        break;
      case "BOUNCED":
        counts.bounced += 1;
        break;
      case "COMPLAINED":
        counts.complained += 1;
        break;
      case "SUPPRESSED":
        counts.suppressed += 1;
        break;
      default:
        break;
    }
  }

  return counts;
}
