/**
 * Assert / query helpers for growth Playwright acceptance.
 *
 * Usage:
 *   npx tsx --import ./tests/commercial/shims/register.mjs tests/growth/fixtures/assert-cli.ts <command> [args...]
 *
 * Commands:
 *   assert-historical-unknown <auditId>
 *   assert-audit-channel <hostnameContains> <expectedChannel>
 *   assert-contact <email> <expectedChannel>
 *   cleanup <runId>
 */
import { resolve } from "node:path";
import { config as loadEnv } from "dotenv";
import { readFileSync, existsSync, unlinkSync } from "node:fs";

loadEnv({ path: resolve(process.cwd(), ".env.local") });
loadEnv({ path: resolve(process.cwd(), ".env") });

import { applyGrowthTestDatabaseEnv } from "../db-safety";
import {
  channelFromAcquisition,
  parseAcquisitionContextFromUnknown,
} from "@/lib/growth/acquisition-capture";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function attributionHasPii(value: unknown): boolean {
  if (!value || typeof value !== "object") {
    return false;
  }
  const keys = Object.keys(value as Record<string, unknown>).map((k) =>
    k.toLowerCase(),
  );
  return keys.some((k) =>
    ["email", "phone", "message", "name", "reportid", "opportunityid", "leadid"].includes(
      k,
    ),
  );
}

async function withPrisma<T>(
  fn: (prisma: import("@/generated/prisma/client").PrismaClient) => Promise<T>,
): Promise<T> {
  applyGrowthTestDatabaseEnv();
  const { PrismaClient } = await import("@/generated/prisma/client");
  const { PrismaNeon } = await import("@prisma/adapter-neon");
  const { neonConfig } = await import("@neondatabase/serverless");
  const ws = await import("ws");
  neonConfig.webSocketConstructor = ws.default;

  const prisma = new PrismaClient({
    adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL! }),
  });
  try {
    return await fn(prisma);
  } finally {
    await prisma.$disconnect();
  }
}

async function assertHistoricalUnknown(auditId: string) {
  await withPrisma(async (prisma) => {
    const row = await prisma.auditReport.findUnique({
      where: { id: auditId },
      select: { attributionJson: true, id: true },
    });
    assert(row, `historical audit missing: ${auditId}`);
    assert(
      row.attributionJson == null,
      `historical UNKNOWN was mutated: ${JSON.stringify(row.attributionJson)}`,
    );
    console.log("OK historical UNKNOWN unchanged", auditId);
  });
}

async function assertAuditChannel(
  hostnameContains: string,
  expectedChannel: string,
) {
  await withPrisma(async (prisma) => {
    const rows = await prisma.auditReport.findMany({
      where: {
        hostname: { contains: hostnameContains },
        source: "PUBLIC_FUNNEL",
      },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, hostname: true, attributionJson: true, createdAt: true },
    });
    assert(rows.length > 0, `no audit for hostname containing ${hostnameContains}`);
    const row = rows[0]!;
    const ctx = parseAcquisitionContextFromUnknown(row.attributionJson);
    const channel = channelFromAcquisition(ctx);
    assert(
      channel === expectedChannel,
      `expected channel ${expectedChannel}, got ${channel} for ${row.id} attribution=${JSON.stringify(row.attributionJson)}`,
    );
    assert(
      !attributionHasPii(row.attributionJson),
      `PII keys found in attributionJson for ${row.id}`,
    );
    console.log("OK audit channel", {
      id: row.id,
      channel,
      hostname: row.hostname,
    });
  });
}

async function assertContact(email: string, expectedChannel: string) {
  await withPrisma(async (prisma) => {
    const row = await prisma.contactSubmission.findFirst({
      where: { email },
      orderBy: { createdAt: "desc" },
    });
    assert(row, `contact submission missing for ${email}`);
    assert(row.leadOrigin === "CONTACT", "leadOrigin must be CONTACT");
    const ctx = parseAcquisitionContextFromUnknown(row.attributionJson);
    const channel = channelFromAcquisition(ctx);
    assert(
      channel === expectedChannel,
      `expected contact channel ${expectedChannel}, got ${channel}`,
    );
    assert(
      !attributionHasPii(row.attributionJson),
      "PII keys found in contact attributionJson",
    );
    const attrRaw = JSON.stringify(row.attributionJson ?? {});
    assert(!attrRaw.includes(email), "email must not appear in attributionJson");
    assert(!attrRaw.includes(row.name), "name must not appear in attributionJson");
    console.log("OK contact attribution", { id: row.id, channel });
  });
}

async function cleanup(runId: string) {
  await withPrisma(async (prisma) => {
    const fixturePath = resolve(process.cwd(), "tests/growth/.e2e-fixture.json");
    if (existsSync(fixturePath)) {
      const fixture = JSON.parse(readFileSync(fixturePath, "utf8")) as {
        historicalAuditId?: string;
        emailPrefix?: string;
      };
      if (fixture.historicalAuditId) {
        await prisma.auditReport.deleteMany({
          where: { id: fixture.historicalAuditId },
        });
      }
      if (fixture.emailPrefix) {
        await prisma.contactSubmission.deleteMany({
          where: { email: { startsWith: fixture.emailPrefix } },
        });
      }
      unlinkSync(fixturePath);
    }
    await prisma.auditReport.deleteMany({
      where: {
        OR: [
          { hostname: { contains: "example.com" }, website: { contains: runId } },
          { audit: { path: ["runId"], equals: runId } },
        ],
      },
    });
    console.log("OK growth cleanup", runId);
  });
}

async function main() {
  const [command, ...args] = process.argv.slice(2);
  if (!command) {
    throw new Error("assert-cli requires a command");
  }
  switch (command) {
    case "assert-historical-unknown":
      await assertHistoricalUnknown(args[0]!);
      break;
    case "assert-audit-channel":
      await assertAuditChannel(args[0]!, args[1]!);
      break;
    case "assert-contact":
      await assertContact(args[0]!, args[1]!);
      break;
    case "cleanup":
      await cleanup(args[0]!);
      break;
    default:
      throw new Error(`Unknown command: ${command}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
