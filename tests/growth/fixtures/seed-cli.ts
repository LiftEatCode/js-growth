/**
 * Seed historical UNKNOWN audit + growth acceptance markers.
 */
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { config as loadEnv } from "dotenv";
import { randomUUID } from "node:crypto";

loadEnv({ path: resolve(process.cwd(), ".env.local") });
loadEnv({ path: resolve(process.cwd(), ".env") });

import { applyGrowthTestDatabaseEnv } from "../db-safety";

async function main() {
  applyGrowthTestDatabaseEnv();

  const { PrismaClient } = await import("@/generated/prisma/client");
  const { PrismaNeon } = await import("@prisma/adapter-neon");
  const { neonConfig } = await import("@neondatabase/serverless");
  const ws = await import("ws");
  neonConfig.webSocketConstructor = ws.default;

  const prisma = new PrismaClient({
    adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL! }),
  });

  const runId = `growth_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  const historicalId = randomUUID();

  try {
    await prisma.auditReport.create({
      data: {
        id: historicalId,
        version: 1,
        website: "https://historical-unknown.example.com/",
        hostname: "historical-unknown.example.com",
        reportMode: "public",
        source: "PUBLIC_FUNNEL",
        overallScore: 50,
        grade: "C",
        criticalIssues: 1,
        quickWins: 1,
        opportunityScore: 40,
        audit: {
          marker: "growth-acceptance-historical-unknown",
          runId,
        },
        attributionJson: null,
      },
    });

    const fixture = {
      runId,
      historicalAuditId: historicalId,
      emailPrefix: `growth-accept-${runId}`,
      createdAt: new Date().toISOString(),
    };

    const out = resolve(process.cwd(), "tests/growth/.e2e-fixture.json");
    writeFileSync(out, JSON.stringify(fixture, null, 2));
    console.log(`Wrote growth fixture ${out}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
