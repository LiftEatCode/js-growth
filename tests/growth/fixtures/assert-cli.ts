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
import { classifyFollowUpDueState } from "@/lib/follow-up/timezone";

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
      take: 20,
      select: { id: true, hostname: true, attributionJson: true, createdAt: true },
    });
    assert(rows.length > 0, `no audit for hostname containing ${hostnameContains}`);

    // Shared test DB can have concurrent example.com audits; pick the newest
    // row whose attributed channel matches the expectation.
    let matched: (typeof rows)[number] | null = null;
    for (const candidate of rows) {
      const channel = channelFromAcquisition(
        parseAcquisitionContextFromUnknown(candidate.attributionJson),
      );
      if (channel === expectedChannel) {
        matched = candidate;
        break;
      }
    }
    assert(
      matched,
      `expected channel ${expectedChannel} among recent ${hostnameContains} audits; latest=${rows[0]!.id} attribution=${JSON.stringify(rows[0]!.attributionJson)}`,
    );
    assert(
      !attributionHasPii(matched.attributionJson),
      `PII keys found in attributionJson for ${matched.id}`,
    );
    console.log("OK audit channel", {
      id: matched.id,
      channel: expectedChannel,
      hostname: matched.hostname,
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

async function assertFollowupActivity(
  leadId: string,
  activityType: string,
  expectedAcquisitionChannel: string,
) {
  await withPrisma(async (prisma) => {
    const activities = await prisma.followUpActivity.findMany({
      where: { leadId, activityType: activityType as never },
      orderBy: { occurredAt: "desc" },
      take: 5,
    });
    assert(activities.length > 0, `no ${activityType} activity for lead ${leadId}`);

    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        reports: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { attributionJson: true },
        },
        contactSubmissions: {
          take: 1,
          select: { attributionJson: true },
        },
      },
    });
    assert(lead, `lead missing ${leadId}`);
    if (activities[0]!.nextFollowUpAt) {
      assert(lead.followUpAt, "followUpAt should be set from activity");
    }
    const attr =
      lead.reports[0]?.attributionJson ??
      lead.contactSubmissions[0]?.attributionJson;
    const channel = channelFromAcquisition(
      parseAcquisitionContextFromUnknown(attr),
    );
    assert(
      channel === expectedAcquisitionChannel,
      `acquisition must remain ${expectedAcquisitionChannel}, got ${channel}`,
    );
    console.log("OK follow-up activity", {
      leadId,
      activityType,
      acquisition: channel,
    });
  });
}

async function assertFollowupNotOverdue(leadId: string) {
  await withPrisma(async (prisma) => {
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      select: { followUpAt: true },
    });
    assert(lead, `lead missing ${leadId}`);
    const due = classifyFollowUpDueState(lead.followUpAt);
    assert(due !== "OVERDUE", `lead still OVERDUE (${due})`);
    console.log("OK follow-up not overdue", { leadId, due });
  });
}

async function assertContactLeadLinked(submissionId: string) {
  await withPrisma(async (prisma) => {
    const row = await prisma.contactSubmission.findUnique({
      where: { id: submissionId },
      select: { leadId: true, attributionJson: true },
    });
    assert(row?.leadId, `contact ${submissionId} not linked`);
    const channel = channelFromAcquisition(
      parseAcquisitionContextFromUnknown(row.attributionJson),
    );
    assert(channel === "FACEBOOK", `contact attribution drifted to ${channel}`);
    // Idempotent: count leads with same email linked once
    const lead = await prisma.lead.findUnique({
      where: { id: row.leadId },
      select: { email: true },
    });
    assert(lead, "linked lead missing");
    const dupes = await prisma.lead.count({
      where: { email: lead.email },
    });
    assert(dupes === 1, `duplicate leads for ${lead.email}: ${dupes}`);
    console.log("OK contact lead linked", { submissionId, leadId: row.leadId });
  });
}

async function assertLeadNoAutoOpportunity(leadId: string) {
  await withPrisma(async (prisma) => {
    const count = await prisma.opportunity.count({ where: { leadId } });
    assert(count === 0, `auto opportunity created for lead ${leadId}`);
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      select: { status: true },
    });
    assert(lead, "lead missing");
    console.log("OK no auto opportunity", { leadId, status: lead.status });
  });
}

async function cleanupFollowup(runId: string) {
  await withPrisma(async (prisma) => {
    const leads = await prisma.lead.findMany({
      where: { notes: { contains: `growth-sprint11-${runId}` } },
      select: { id: true },
    });
    const leadIds = leads.map((l) => l.id);
    if (leadIds.length) {
      await prisma.followUpActivity.deleteMany({
        where: { leadId: { in: leadIds } },
      });
      await prisma.auditReport.deleteMany({ where: { leadId: { in: leadIds } } });
      await prisma.contactSubmission.deleteMany({
        where: { leadId: { in: leadIds } },
      });
      await prisma.leadActivity.deleteMany({ where: { leadId: { in: leadIds } } });
      await prisma.lead.deleteMany({ where: { id: { in: leadIds } } });
    }

    await prisma.contactSubmission.deleteMany({
      where: { message: { contains: `growth-sprint11-${runId}` } },
    });

    const prospects = await prisma.prospect.findMany({
      where: { notes: { contains: `growth-sprint11-${runId}` } },
      select: { id: true, hostname: true },
    });
    const prospectIds = prospects.map((p) => p.id);
    if (prospectIds.length) {
      await prisma.followUpActivity.deleteMany({
        where: { prospectId: { in: prospectIds } },
      });
      await prisma.campaignProspect.deleteMany({
        where: { prospectId: { in: prospectIds } },
      });
      await prisma.prospect.deleteMany({ where: { id: { in: prospectIds } } });
    }
    for (const p of prospects) {
      if (p.hostname) {
        await prisma.suppressionEntry.deleteMany({
          where: { value: p.hostname },
        });
      }
    }

    await prisma.campaign.deleteMany({
      where: { name: { contains: runId } },
    });

    const followupFixture = resolve(
      process.cwd(),
      "tests/growth/.e2e-followup-fixture.json",
    );
    if (existsSync(followupFixture)) {
      unlinkSync(followupFixture);
    }
    console.log("OK follow-up cleanup", runId);
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
    case "assert-followup-activity":
      await assertFollowupActivity(args[0]!, args[1]!, args[2]!);
      break;
    case "assert-followup-not-overdue":
      await assertFollowupNotOverdue(args[0]!);
      break;
    case "assert-contact-lead-linked":
      await assertContactLeadLinked(args[0]!);
      break;
    case "assert-lead-no-auto-opportunity":
      await assertLeadNoAutoOpportunity(args[0]!);
      break;
    case "cleanup-followup":
      await cleanupFollowup(args[0]!);
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
