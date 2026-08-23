/**
 * CLI cleanup for Playwright.
 * Usage:
 *   cleanup-cli.ts              # reads .e2e-fixture.json
 *   cleanup-cli.ts <runId>      # cleanup by runId
 */
import { existsSync, readFileSync, unlinkSync } from "node:fs";
import { resolve } from "node:path";
import { config as loadEnv } from "dotenv";

loadEnv({ path: resolve(process.cwd(), ".env.local") });
loadEnv({ path: resolve(process.cwd(), ".env") });

import { applyCommercialTestDatabaseEnv } from "../db-safety";

async function main() {
  applyCommercialTestDatabaseEnv();

  const { PrismaClient } = await import("@/generated/prisma/client");
  const { PrismaNeon } = await import("@prisma/adapter-neon");
  const { neonConfig } = await import("@neondatabase/serverless");
  const ws = await import("ws");
  neonConfig.webSocketConstructor = ws.default;

  const { cleanupCommercialE2eFixtures } = await import("./seed");

  const prisma = new PrismaClient({
    adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL! }),
  });

  const argRunId = process.argv[2]?.trim();
  const fixturePaths = [
    resolve(process.cwd(), "tests/commercial/.e2e-fixture.json"),
    resolve(process.cwd(), "tests/commercial/.e2e-payment-fixture.json"),
  ];

  try {
    if (argRunId) {
      await cleanupCommercialE2eFixtures(prisma, argRunId);
      for (const path of fixturePaths) {
        if (existsSync(path)) {
          const seeded = JSON.parse(readFileSync(path, "utf8")) as {
            runId?: string;
          };
          if (seeded.runId === argRunId) {
            unlinkSync(path);
          }
        }
      }
      return;
    }

    for (const fixturePath of fixturePaths) {
      if (!existsSync(fixturePath)) continue;
      const seeded = JSON.parse(readFileSync(fixturePath, "utf8")) as {
        runId: string;
      };
      await cleanupCommercialE2eFixtures(prisma, seeded.runId);
      unlinkSync(fixturePath);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
