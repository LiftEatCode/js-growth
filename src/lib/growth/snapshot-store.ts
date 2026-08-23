import "server-only";

import type { Prisma } from "@/generated/prisma/client";

import { prisma } from "@/lib/prisma";
import {
  validateGrowthSnapshotMetrics,
  type GrowthSnapshotSource,
} from "@/lib/growth/snapshot";

export async function listGrowthSnapshots(limit = 40) {
  return prisma.growthSnapshot.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function createGrowthSnapshot(input: {
  periodStart: Date;
  periodEnd: Date;
  source: GrowthSnapshotSource;
  metrics: unknown;
  createdByEmail: string;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  if (input.periodEnd.getTime() <= input.periodStart.getTime()) {
    return { ok: false, error: "periodEnd must be after periodStart" };
  }

  const validated = validateGrowthSnapshotMetrics(input.source, input.metrics);
  if (!validated.ok) {
    return validated;
  }

  const created = await prisma.growthSnapshot.create({
    data: {
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      source: input.source,
      metricsJson: validated.metrics as Prisma.InputJsonValue,
      createdByEmail: input.createdByEmail,
    },
  });

  return { ok: true, id: created.id };
}
