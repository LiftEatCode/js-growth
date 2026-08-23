import "server-only";

import type { Prisma } from "@/generated/prisma/client";

import {
  GROWTH_BASELINE_PERIOD,
  GROWTH_BASELINE_VERSION,
  buildGrowthBaselineV1SnapshotPayloads,
} from "@/lib/growth/baseline-v1";
import {
  validateGrowthSnapshotMetrics,
  type GrowthSnapshotSource,
} from "@/lib/growth/snapshot";
import { prisma } from "@/lib/prisma";

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

function isBaselineV1Metrics(metrics: unknown): boolean {
  if (!metrics || typeof metrics !== "object" || Array.isArray(metrics)) {
    return false;
  }
  const record = metrics as Record<string, unknown>;
  return record.baselineVersion === GROWTH_BASELINE_VERSION;
}

/**
 * Idempotently persist Growth Baseline V1 snapshots (SEARCH_CONSOLE, GA4, FACEBOOK).
 * No external API calls. Does not overwrite existing Baseline V1 rows.
 */
export async function ensureGrowthBaselineV1Snapshots(createdByEmail: string): Promise<{
  created: string[];
  alreadyPresent: string[];
}> {
  const payloads = buildGrowthBaselineV1SnapshotPayloads();
  const periodStart = new Date(`${GROWTH_BASELINE_PERIOD.start}T00:00:00.000Z`);
  const periodEnd = new Date(`${GROWTH_BASELINE_PERIOD.end}T23:59:59.999Z`);

  const sources: Array<{
    source: GrowthSnapshotSource;
    metrics: Record<string, unknown>;
  }> = [
    { source: "SEARCH_CONSOLE", metrics: payloads.searchConsole },
    { source: "GA4", metrics: payloads.ga4 },
    { source: "FACEBOOK", metrics: payloads.facebook },
  ];

  const existing = await prisma.growthSnapshot.findMany({
    where: {
      source: { in: ["SEARCH_CONSOLE", "GA4", "FACEBOOK"] },
      periodStart,
      periodEnd,
    },
    select: { id: true, source: true, metricsJson: true },
  });

  const created: string[] = [];
  const alreadyPresent: string[] = [];

  for (const entry of sources) {
    const found = existing.find(
      (row) => row.source === entry.source && isBaselineV1Metrics(row.metricsJson),
    );
    if (found) {
      alreadyPresent.push(entry.source);
      continue;
    }

    const result = await createGrowthSnapshot({
      periodStart,
      periodEnd,
      source: entry.source,
      metrics: entry.metrics,
      createdByEmail,
    });

    if (!result.ok) {
      throw new Error(
        `Failed to persist Growth Baseline V1 ${entry.source}: ${result.error}`,
      );
    }
    created.push(entry.source);
  }

  return { created, alreadyPresent };
}
