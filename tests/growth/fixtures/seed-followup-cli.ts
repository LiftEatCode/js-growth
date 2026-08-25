/**
 * Seed Sprint 11 follow-up acceptance fixtures.
 * Additive to growth fixture file.
 */
import { writeFileSync, readFileSync, existsSync } from "node:fs";
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

  const runId = `fu_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  const marker = `growth-sprint11-${runId}`;

  try {
    const overdueDate = new Date();
    overdueDate.setUTCDate(overdueDate.getUTCDate() - 3);

    const fbLead = await prisma.lead.create({
      data: {
        firstName: "Follow",
        lastName: `Inbound${runId.slice(-4)}`,
        email: `fu-inbound-${runId}@example.com`,
        company: `FU Inbound Co ${runId}`,
        website: `https://fu-inbound-${runId}.example.com`,
        status: "NEW",
        followUpAt: null,
        notes: marker,
      },
    });

    await prisma.auditReport.create({
      data: {
        id: randomUUID(),
        version: 1,
        website: fbLead.website,
        hostname: `fu-inbound-${runId}.example.com`,
        reportMode: "public",
        source: "PUBLIC_FUNNEL",
        overallScore: 62,
        grade: "C",
        criticalIssues: 2,
        quickWins: 1,
        opportunityScore: 55,
        audit: { marker },
        leadId: fbLead.id,
        attributionJson: {
          source: "facebook",
          medium: "organic_social",
          campaign: "company_audit",
          content: "company_seo_mistakes_001",
          landingPath: "/website-audit",
          capturedAt: new Date().toISOString(),
          acquisitionCaptureVersion: 1,
          referrerClass: "FACEBOOK",
          entryType: "UTM",
        },
      },
    });

    const overdueLead = await prisma.lead.create({
      data: {
        firstName: "Overdue",
        lastName: `Lead${runId.slice(-4)}`,
        email: `fu-overdue-${runId}@example.com`,
        company: `FU Overdue Co ${runId}`,
        website: `https://fu-overdue-${runId}.example.com`,
        status: "CONTACTED",
        followUpAt: overdueDate,
        notes: marker,
      },
    });

    const campaign = await prisma.campaign.create({
      data: {
        name: `FU Campaign ${runId}`,
        status: "ACTIVE",
        locationLabel: "Test City, TX",
        industries: ["Professional Services"],
        createdByEmail: "followup-test@example.com",
      },
    });

    const suppressedProspect = await prisma.prospect.create({
      data: {
        businessName: `FU Suppressed ${runId}`,
        website: `https://fu-suppressed-${runId}.example.com`,
        hostname: `fu-suppressed-${runId}.example.com`,
        outreachStatus: "SUPPRESSED",
        followUpAt: overdueDate,
        notes: marker,
      },
    });

    await prisma.campaignProspect.create({
      data: {
        campaignId: campaign.id,
        prospectId: suppressedProspect.id,
      },
    });

    await prisma.suppressionEntry.create({
      data: {
        type: "HOSTNAME",
        value: `fu-suppressed-${runId}.example.com`,
        reason: "OPTED_OUT",
      },
    });

    // Prior activity retained on suppressed prospect
    await prisma.followUpActivity.create({
      data: {
        activityType: "EMAIL",
        direction: "OUTBOUND",
        outcome: "SENT",
        summary: `Historical pre-suppression note ${marker}`,
        occurredAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        prospectId: suppressedProspect.id,
      },
    });

    const contact = await prisma.contactSubmission.create({
      data: {
        name: `Contact ${runId}`,
        email: `fu-contact-${runId}@example.com`,
        phone: null,
        businessName: `FU Contact Co ${runId}`,
        website: `https://fu-contact-${runId}.example.com`,
        service: "Local SEO",
        message: `Sprint 11 contact ${marker}`,
        leadOrigin: "CONTACT",
        attributionJson: {
          source: "facebook",
          medium: "organic_social",
          campaign: "contact",
          content: "company_seo_mistakes_001",
          landingPath: "/contact",
          capturedAt: new Date().toISOString(),
          acquisitionCaptureVersion: 1,
          referrerClass: "FACEBOOK",
          entryType: "UTM",
        },
      },
    });

    const fixture = {
      runId,
      marker,
      fbLeadId: fbLead.id,
      overdueLeadId: overdueLead.id,
      suppressedProspectId: suppressedProspect.id,
      campaignId: campaign.id,
      contactSubmissionId: contact.id,
      createdAt: new Date().toISOString(),
    };

    const out = resolve(process.cwd(), "tests/growth/.e2e-followup-fixture.json");
    writeFileSync(out, JSON.stringify(fixture, null, 2));

    // Merge marker into main growth fixture if present
    const growthFixturePath = resolve(
      process.cwd(),
      "tests/growth/.e2e-fixture.json",
    );
    if (existsSync(growthFixturePath)) {
      const growth = JSON.parse(readFileSync(growthFixturePath, "utf8"));
      growth.followUpRunId = runId;
      writeFileSync(growthFixturePath, JSON.stringify(growth, null, 2));
    }

    console.log(`Wrote follow-up fixture ${out}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
