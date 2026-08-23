/**
 * CLI seed for Playwright.
 * Default: $3,000 DEPOSIT_AND_BALANCE pipeline.
 * --payment-lifecycle: $2,050 Rooftop Solutions Payment Acceptance Fixture.
 */
import { writeFileSync } from "node:fs";
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

  const { seedApprovedCommercialPipeline } = await import("./seed");

  const prisma = new PrismaClient({
    adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL! }),
  });

  const paymentLifecycle = process.argv.includes("--payment-lifecycle");

  try {
    const seeded = await seedApprovedCommercialPipeline(prisma, {
      withAcceptedProposalIntent: true,
      ...(paymentLifecycle
        ? {
            totalInvestmentCents: 205_000,
            businessLabel: "Rooftop Solutions Payment Acceptance Fixture",
            paymentTermType: "DEPOSIT_AND_BALANCE" as const,
          }
        : {}),
    });
    const out = resolve(
      process.cwd(),
      paymentLifecycle
        ? "tests/commercial/.e2e-payment-fixture.json"
        : "tests/commercial/.e2e-fixture.json",
    );
    writeFileSync(out, JSON.stringify(seeded, null, 2));
    console.log(`Wrote fixture ${out}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
