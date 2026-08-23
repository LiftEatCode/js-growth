import "server-only";

import { Prisma as PrismaNamespace } from "@/generated/prisma/client";

import { classifyFacebookOrganicPublisher } from "@/lib/growth/facebook-growth";
import { prisma } from "@/lib/prisma";

/**
 * First-party Facebook organic attribution from audit reports.
 * Does not call Meta APIs. Blank/unknown publisher stays NOT_ATTRIBUTABLE.
 */

export type FacebookOrganicAttributionSummary = {
  periodStart: Date;
  periodEnd: Date;
  totalAttributedAudits: number;
  company: number;
  founder: number;
  notAttributablePublisher: number;
};

export async function getFacebookOrganicAttributionSummary(input: {
  periodStart: Date;
  periodEnd: Date;
}): Promise<FacebookOrganicAttributionSummary> {
  const rows = await prisma.auditReport.findMany({
    where: {
      source: "PUBLIC_FUNNEL",
      createdAt: {
        gte: input.periodStart,
        lt: input.periodEnd,
      },
      attributionJson: { not: PrismaNamespace.DbNull },
    },
    select: { attributionJson: true },
    take: 5000,
  });

  let totalAttributedAudits = 0;
  let company = 0;
  let founder = 0;
  let notAttributablePublisher = 0;

  for (const row of rows) {
    const raw = row.attributionJson;
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
      continue;
    }
    const record = raw as Record<string, unknown>;
    const source =
      typeof record.source === "string" ? record.source.toLowerCase() : "";
    const medium =
      typeof record.medium === "string" ? record.medium.toLowerCase() : "";
    if (source !== "facebook" || medium !== "organic_social") {
      continue;
    }

    totalAttributedAudits += 1;
    const publisher = classifyFacebookOrganicPublisher({
      source,
      medium,
      campaign: typeof record.campaign === "string" ? record.campaign : null,
      content: typeof record.content === "string" ? record.content : null,
    });

    if (publisher === "COMPANY") {
      company += 1;
    } else if (publisher === "FOUNDER") {
      founder += 1;
    } else {
      notAttributablePublisher += 1;
    }
  }

  return {
    periodStart: input.periodStart,
    periodEnd: input.periodEnd,
    totalAttributedAudits,
    company,
    founder,
    notAttributablePublisher,
  };
}
