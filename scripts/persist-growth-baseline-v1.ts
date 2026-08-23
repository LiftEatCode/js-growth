/**
 * One-shot persistence of Growth Baseline V1 GrowthSnapshot rows.
 * Idempotent. No external analytics APIs.
 */

import { Prisma } from "../src/generated/prisma/client";
import {
  GROWTH_BASELINE_PERIOD,
  GROWTH_BASELINE_VERSION,
  buildGrowthBaselineV1SnapshotPayloads,
} from "../src/lib/growth/baseline-v1";
import { validateGrowthSnapshotMetrics } from "../src/lib/growth/snapshot";
import { prisma } from "../src/lib/prisma";

async function main() {
  const payloads = buildGrowthBaselineV1SnapshotPayloads();
  const periodStart = new Date(`${GROWTH_BASELINE_PERIOD.start}T00:00:00.000Z`);
  const periodEnd = new Date(`${GROWTH_BASELINE_PERIOD.end}T23:59:59.999Z`);
  const createdByEmail = "growth-baseline-v1@js-solutions";

  const entries = [
    { source: "SEARCH_CONSOLE" as const, metrics: payloads.searchConsole },
    { source: "GA4" as const, metrics: payloads.ga4 },
    { source: "FACEBOOK" as const, metrics: payloads.facebook },
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

  for (const entry of entries) {
    const found = existing.find((row) => {
      if (row.source !== entry.source) return false;
      const metrics = row.metricsJson;
      return (
        metrics !== null &&
        typeof metrics === "object" &&
        !Array.isArray(metrics) &&
        (metrics as Record<string, unknown>).baselineVersion ===
          GROWTH_BASELINE_VERSION
      );
    });

    if (found) {
      alreadyPresent.push(entry.source);
      continue;
    }

    const validated = validateGrowthSnapshotMetrics(entry.source, entry.metrics);
    if (!validated.ok) {
      throw new Error(`${entry.source}: ${validated.error}`);
    }

    await prisma.growthSnapshot.create({
      data: {
        periodStart,
        periodEnd,
        source: entry.source,
        metricsJson: validated.metrics as Prisma.InputJsonValue,
        createdByEmail,
      },
    });
    created.push(entry.source);
  }

  console.log(JSON.stringify({ created, alreadyPresent }, null, 2));
  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
