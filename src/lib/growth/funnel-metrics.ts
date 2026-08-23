import "server-only";

import { Prisma as PrismaNamespace } from "@/generated/prisma/client";

import { prisma } from "@/lib/prisma";

/**
 * Aggregate-only commercial/product funnel metrics for the growth dashboard.
 * Never expose commercial record IDs to browser analytics.
 */

export type InternalFunnelMetrics = {
  periodStart: Date;
  periodEnd: Date;
  auditsCreated: number;
  freeReportsCompleted: number;
  professionalPurchases: number;
  prospectsCreated: number;
  opportunitiesCreated: number;
  proposalsCreated: number;
  agreementsAccepted: number;
  clientsCreated: number;
  attributionBySource: Array<{
    source: string;
    medium: string | null;
    count: number;
  }>;
};

function periodFilter(periodStart: Date, periodEnd: Date) {
  return {
    gte: periodStart,
    lt: periodEnd,
  };
}

export async function getInternalFunnelMetrics(input: {
  periodStart: Date;
  periodEnd: Date;
}): Promise<InternalFunnelMetrics> {
  const createdAt = periodFilter(input.periodStart, input.periodEnd);

  const [
    auditsCreated,
    freeReportsCompleted,
    professionalPurchases,
    prospectsCreated,
    opportunitiesCreated,
    proposalsCreated,
    agreementsAccepted,
    clientsCreated,
    attributedReports,
  ] = await Promise.all([
    prisma.auditReport.count({
      where: {
        source: "PUBLIC_FUNNEL",
        createdAt,
      },
    }),
    prisma.auditReport.count({
      where: {
        source: "PUBLIC_FUNNEL",
        createdAt,
      },
    }),
    prisma.reportPurchase.count({
      where: {
        status: "PAID",
        paidAt: createdAt,
      },
    }),
    prisma.prospect.count({ where: { createdAt } }),
    prisma.opportunity.count({ where: { createdAt } }),
    prisma.commercialProposal.count({ where: { createdAt } }),
    prisma.commercialAgreement.count({
      where: {
        status: "ACCEPTED",
        createdAt,
      },
    }),
    prisma.client.count({ where: { createdAt } }),
    prisma.auditReport.findMany({
      where: {
        source: "PUBLIC_FUNNEL",
        createdAt,
        attributionJson: { not: PrismaNamespace.DbNull },
      },
      select: { attributionJson: true },
      take: 5000,
    }),
  ]);

  const attributionCounts = new Map<string, number>();

  for (const row of attributedReports) {
    const raw = row.attributionJson;
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
      continue;
    }
    const record = raw as Record<string, unknown>;
    const source =
      typeof record.source === "string" && record.source
        ? record.source
        : "(none)";
    const medium =
      typeof record.medium === "string" && record.medium
        ? record.medium
        : null;
    const key = `${source}||${medium ?? ""}`;
    attributionCounts.set(key, (attributionCounts.get(key) ?? 0) + 1);
  }

  const attributionBySource = [...attributionCounts.entries()]
    .map(([key, count]) => {
      const [source, medium] = key.split("||");
      return {
        source,
        medium: medium || null,
        count,
      };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);

  return {
    periodStart: input.periodStart,
    periodEnd: input.periodEnd,
    auditsCreated,
    freeReportsCompleted,
    professionalPurchases,
    prospectsCreated,
    opportunitiesCreated,
    proposalsCreated,
    agreementsAccepted,
    clientsCreated,
    attributionBySource,
  };
}

export function previousPeriod(
  periodStart: Date,
  periodEnd: Date,
): { periodStart: Date; periodEnd: Date } {
  const durationMs = periodEnd.getTime() - periodStart.getTime();
  return {
    periodStart: new Date(periodStart.getTime() - durationMs),
    periodEnd: new Date(periodStart.getTime()),
  };
}

export function lastNDaysEndingNow(days: number): {
  periodStart: Date;
  periodEnd: Date;
} {
  const periodEnd = new Date();
  const periodStart = new Date(periodEnd.getTime() - days * 24 * 60 * 60 * 1000);
  return { periodStart, periodEnd };
}
