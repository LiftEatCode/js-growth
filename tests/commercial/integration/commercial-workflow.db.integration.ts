/**
 * DB-backed commercial workflow integration.
 * Requires COMMERCIAL_TEST_DATABASE_URL (or COMMERCIAL_E2E_USE_DEV_DB=1).
 * Mocks Resend via COMMERCIAL_TEST_MOCK_RESEND=1.
 */
import { config as loadEnv } from "dotenv";
import { resolve } from "node:path";

loadEnv({ path: resolve(process.cwd(), ".env.local") });
loadEnv({ path: resolve(process.cwd(), ".env") });

import { applyCommercialTestDatabaseEnv } from "../db-safety";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function main() {
  applyCommercialTestDatabaseEnv();

  const { PrismaClient } = await import("@/generated/prisma/client");
  const { PrismaNeon } = await import("@prisma/adapter-neon");
  const { neonConfig } = await import("@neondatabase/serverless");
  const ws = await import("ws");
  neonConfig.webSocketConstructor = ws.default;

  const { clearMockResendCalls, getMockResendCalls } = await import(
    "@/lib/email/resend"
  );
  const {
    cleanupCommercialE2eFixtures,
    seedApprovedCommercialPipeline,
    COMMERCIAL_E2E_ACTOR,
  } = await import("../fixtures/seed");
  const { acceptCommercialAgreement } = await import(
    "@/lib/commercialization/agreement/accept"
  );
  const { hashAgreementShareToken } = await import(
    "@/lib/commercialization/agreement-delivery/token"
  );
  const { prepareAgreementDelivery } = await import(
    "@/lib/commercialization/agreement-delivery/prepare"
  );
  const { sendAgreementDelivery } = await import(
    "@/lib/commercialization/agreement-delivery/send"
  );
  const { recordAgreementLinkView } = await import(
    "@/lib/commercialization/agreement-delivery/record-view"
  );
  const { prepareProposalDelivery } = await import(
    "@/lib/commercialization/proposal-delivery/prepare"
  );
  const { createAgreementForOpportunity } = await import(
    "@/lib/commercialization/agreement/create"
  );
  const { createCommercialScope } = await import(
    "@/lib/commercialization/scope/create"
  );

  const adapter = new PrismaNeon({
    connectionString: process.env.DATABASE_URL!,
  });
  const prisma = new PrismaClient({ adapter });

  clearMockResendCalls();
  let seeded: Awaited<
    ReturnType<typeof seedApprovedCommercialPipeline>
  > | null = null;
  let seeded2: Awaited<
    ReturnType<typeof seedApprovedCommercialPipeline>
  > | null = null;

  try {
    seeded = await seedApprovedCommercialPipeline(prisma, {
      withAcceptedProposalIntent: true,
    });

    assert(seeded.depositCents === 150_000, "seeded deposit 50%");
    assert(seeded.balanceCents === 150_000, "seeded balance 50%");
    assert(
      seeded.depositCents + seeded.balanceCents === seeded.totalInvestmentCents,
      "payment terms reconcile",
    );
    assert(
      seeded.proposalDeliveryId !== seeded.agreementDeliveryId,
      "proposal and agreement deliveries are distinct",
    );

    clearMockResendCalls();
    const prep = await prepareAgreementDelivery({
      opportunityId: seeded.opportunityId,
      agreementId: seeded.agreementId,
      actorEmail: COMMERCIAL_E2E_ACTOR,
      recipientName: "Jane Client",
      recipientEmail: "jane.client@example.com",
    });
    assert(prep.ok, `prepare agreement delivery failed`);
    assert(getMockResendCalls().length === 0, "prepare agreement sends 0 emails");

    clearMockResendCalls();
    const view = await recordAgreementLinkView({
      shareToken: seeded.agreementShareToken,
    });
    assert(view.recorded, "agreement view recorded");
    assert(getMockResendCalls().length === 0, "view sends 0 emails");

    const deliveryAfterView = await prisma.agreementDelivery.findUnique({
      where: { id: seeded.agreementDeliveryId },
    });
    assert((deliveryAfterView?.viewCount ?? 0) >= 1, "view count incremented");

    clearMockResendCalls();
    if (!prep.ok) {
      throw new Error("prepare failed");
    }
    await prisma.agreementDelivery.update({
      where: { id: prep.deliveryId },
      data: { status: "READY" },
    });
    const sent = await sendAgreementDelivery({
      deliveryId: prep.deliveryId,
      actorEmail: COMMERCIAL_E2E_ACTOR,
      shareToken: prep.shareToken,
    });
    assert(sent.ok, `send agreement failed`);
    assert(getMockResendCalls().length === 1, "explicit send max 1 Resend call");

    const badCheckbox = await acceptCommercialAgreement({
      shareTokenHash: hashAgreementShareToken(seeded.agreementShareToken),
      signerName: "Jane Client",
      signerEmail: "jane.client@example.com",
      acceptanceConfirmed: false,
    });
    assert(!badCheckbox.ok, "checkbox required");

    const badEmail = await acceptCommercialAgreement({
      shareTokenHash: hashAgreementShareToken(seeded.agreementShareToken),
      signerName: "Jane Client",
      signerEmail: "not-an-email",
      acceptanceConfirmed: true,
    });
    assert(!badEmail.ok, "malformed email rejected");

    const missingName = await acceptCommercialAgreement({
      shareTokenHash: hashAgreementShareToken(seeded.agreementShareToken),
      signerName: "  ",
      signerEmail: "jane.client@example.com",
      acceptanceConfirmed: true,
    });
    assert(!missingName.ok, "signer name required");

    const accepted = await acceptCommercialAgreement({
      shareTokenHash: hashAgreementShareToken(seeded.agreementShareToken),
      signerName: "Jane Client",
      signerEmail: "jane.client@example.com",
      signerTitle: "Owner",
      acceptanceConfirmed: true,
    });
    assert(accepted.ok, "acceptance should succeed");
    assert(!accepted.alreadyAccepted, "first acceptance is new");

    const duplicate = await acceptCommercialAgreement({
      shareTokenHash: hashAgreementShareToken(seeded.agreementShareToken),
      signerName: "Jane Client",
      signerEmail: "jane.client@example.com",
      acceptanceConfirmed: true,
    });
    assert(duplicate.ok && duplicate.alreadyAccepted, "acceptance idempotent");

    const acceptanceCount = await prisma.agreementAcceptance.count({
      where: { agreementId: seeded.agreementId },
    });
    assert(acceptanceCount === 1, "exactly one acceptance row");

    const agreementAfter = await prisma.commercialAgreement.findUnique({
      where: { id: seeded.agreementId },
    });
    assert(agreementAfter?.status === "ACCEPTED", "agreement ACCEPTED");

    const opportunity = await prisma.opportunity.findUnique({
      where: { id: seeded.opportunityId },
    });
    assert(opportunity?.stage !== "WON", "opportunity not auto WON");

    const invalidAccept = await acceptCommercialAgreement({
      shareTokenHash: hashAgreementShareToken("totally-invalid-token"),
      signerName: "X",
      signerEmail: "x@example.com",
      acceptanceConfirmed: true,
    });
    assert(!invalidAccept.ok, "invalid agreement token rejected");

    clearMockResendCalls();
    seeded2 = await seedApprovedCommercialPipeline(prisma, {
      withAcceptedProposalIntent: true,
    });
    const proposalPrep = await prepareProposalDelivery({
      opportunityId: seeded2.opportunityId,
      proposalId: seeded2.proposalId,
      actorEmail: COMMERCIAL_E2E_ACTOR,
      recipientName: "Sam Client",
      recipientEmail: "sam.client@example.com",
    });
    assert(proposalPrep.ok, "proposal prepare ok");
    assert(getMockResendCalls().length === 0, "proposal prepare sends 0 emails");

    const createBlocked = await createAgreementForOpportunity({
      opportunityId: seeded2.opportunityId,
      proposalId: seeded2.proposalId,
      actorEmail: COMMERCIAL_E2E_ACTOR,
    });
    assert(!createBlocked.ok, "second agreement blocked while active exists");

    const campaign = await prisma.campaign.create({
      data: {
        name: `Scope flow ${Date.now()}`,
        locationLabel: "Austin, TX",
        createdByEmail: COMMERCIAL_E2E_ACTOR,
      },
    });
    const prospect = await prisma.prospect.create({
      data: {
        businessName: `E2E Commercial ScopeOnly ${Date.now()}`,
        city: "Austin",
        state: "TX",
      },
    });
    await prisma.campaignProspect.create({
      data: { campaignId: campaign.id, prospectId: prospect.id },
    });
    const opp = await prisma.opportunity.create({
      data: {
        prospectId: prospect.id,
        campaignId: campaign.id,
        name: "Scope only opp",
        ownerEmail: COMMERCIAL_E2E_ACTOR,
        createdByEmail: COMMERCIAL_E2E_ACTOR,
        recommendedCapabilitiesJson: {
          capabilityVersion: 1,
          sourcePlanId: null,
          sourcePlanStatus: null,
          snapshottedAt: new Date().toISOString(),
          capabilities: [],
          noPlanAtSnapshot: true,
        },
      },
    });
    const scopeCreate = await createCommercialScope({
      opportunityId: opp.id,
      createdByEmail: COMMERCIAL_E2E_ACTOR,
    });
    assert(scopeCreate.ok, "create scope on opportunity");

    await cleanupCommercialE2eFixtures(prisma, seeded2.runId);
    seeded2 = null;
    await prisma.commercialScope.deleteMany({ where: { opportunityId: opp.id } });
    await prisma.opportunity.delete({ where: { id: opp.id } });
    await prisma.campaignProspect.deleteMany({ where: { prospectId: prospect.id } });
    await prisma.prospect.delete({ where: { id: prospect.id } });
    await prisma.campaign.delete({ where: { id: campaign.id } });

    console.log("commercial-workflow.db.integration.ts: PASS");
  } finally {
    if (seeded) {
      await cleanupCommercialE2eFixtures(prisma, seeded.runId);
    }
    if (seeded2) {
      await cleanupCommercialE2eFixtures(prisma, seeded2.runId);
    }
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
