/**
 * Commercial Sprint 10 — Onboarding lifecycle acceptance (DB).
 *
 * DEPOSIT_AND_BALANCE $2,050 / 50–50 through convert → checklist → start,
 * plus FULL_UPFRONT eligibility and balance handoff gate.
 */
import { config as loadEnv } from "dotenv";
import { resolve } from "node:path";

loadEnv({ path: resolve(process.cwd(), ".env.local") });
loadEnv({ path: resolve(process.cwd(), ".env") });

import { applyCommercialTestDatabaseEnv } from "../db-safety";

const TOTAL_CENTS = 205_000;
const DEPOSIT_CENTS = 102_500;
const BALANCE_CENTS = 102_500;
const ACTOR = "e2e-onboarding@js-solutions.test";
const BUSINESS_LABEL = "Rooftop Solutions Onboarding Fixture";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function section(name: string) {
  console.log(`\n==> ${name}`);
}

async function withTransientRetry<T>(
  label: string,
  fn: () => Promise<T>,
  attempts = 3,
): Promise<T> {
  let last: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (error) {
      last = error;
      const message =
        error instanceof Error ? error.message : String(error);
      console.warn(
        `[onboarding-lifecycle] transient on ${label} (attempt ${i + 1}/${attempts}): ${message}`,
      );
      await new Promise((r) => setTimeout(r, 750 * (i + 1)));
    }
  }
  throw last;
}

async function main() {
  applyCommercialTestDatabaseEnv();
  process.env.COMMERCIAL_TEST_MOCK_STRIPE = "1";
  process.env.COMMERCIAL_TEST_MOCK_RESEND = "1";
  process.env.COMMERCIAL_TEST_MOCK_EXTERNALS = "1";

  const secret = process.env.STRIPE_SECRET_KEY?.trim() ?? "";
  assert(
    !secret.startsWith("sk_live_"),
    "Refusing LIVE Stripe secret during onboarding acceptance",
  );

  const { PrismaClient } = await import("@/generated/prisma/client");
  const { PrismaNeon } = await import("@prisma/adapter-neon");
  const { neonConfig } = await import("@neondatabase/serverless");
  const ws = await import("ws");
  neonConfig.webSocketConstructor = ws.default;

  const {
    cleanupCommercialE2eFixtures,
    seedApprovedCommercialPipeline,
  } = await import("../fixtures/seed");
  const { acceptCommercialAgreement } = await import(
    "@/lib/commercialization/agreement/accept"
  );
  const { hashAgreementShareToken } = await import(
    "@/lib/commercialization/agreement-delivery/token"
  );
  const {
    createCommercialCheckout,
    fulfillCommercialPaymentCheckout,
    clearMockCommercialStripeSessions,
    COMMERCIAL_AGREEMENT_PAYMENT_PRODUCT_KEY,
  } = await import("@/lib/commercialization/payments");
  const {
    convertOpportunityToClientProject,
    getOnboardingEligibility,
    updateOnboardingItemStatus,
    startClientProject,
    updateDeliveryTaskStatus,
    completeClientProject,
    loadProjectDetail,
  } = await import("@/lib/commercialization/onboarding");
  const { loadPaymentStateForOpportunity } = await import(
    "@/lib/commercialization/payments"
  );

  const prisma = new PrismaClient({
    adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL! }),
  });

  const runIds: string[] = [];

  async function snapshotFacts(ids: {
    agreementId: string;
    scopeId: string;
    pricingId: string;
    proposalId: string;
  }) {
    const [agreement, scope, pricing, proposal] = await Promise.all([
      prisma.commercialAgreement.findUniqueOrThrow({
        where: { id: ids.agreementId },
      }),
      prisma.commercialScope.findUniqueOrThrow({ where: { id: ids.scopeId } }),
      prisma.commercialPricing.findUniqueOrThrow({
        where: { id: ids.pricingId },
      }),
      prisma.commercialProposal.findUniqueOrThrow({
        where: { id: ids.proposalId },
      }),
    ]);
    return {
      agreementStatus: agreement.status,
      agreementTotal: agreement.totalInvestmentCents,
      agreementUpdated: agreement.updatedAt.toISOString(),
      scopeRev: scope.revision,
      scopeUpdated: scope.updatedAt.toISOString(),
      pricingRev: pricing.revision,
      pricingTotal: pricing.finalTotalCents,
      pricingUpdated: pricing.updatedAt.toISOString(),
      proposalRev: proposal.revision,
      proposalUpdated: proposal.updatedAt.toISOString(),
    };
  }

  function paidSession(options: {
    paymentId: string;
    agreementId: string;
    opportunityId: string;
    sessionId: string;
    paymentType: "DEPOSIT" | "BALANCE" | "FULL";
    amountTotal: number;
  }) {
    return {
      id: options.sessionId,
      mode: "payment" as const,
      payment_status: "paid" as const,
      amount_total: options.amountTotal,
      currency: "usd",
      metadata: {
        product: COMMERCIAL_AGREEMENT_PAYMENT_PRODUCT_KEY,
        commercialPaymentId: options.paymentId,
        agreementId: options.agreementId,
        opportunityId: options.opportunityId,
        paymentType: options.paymentType,
      },
      payment_intent: `pi_test_mock_${options.paymentId}`,
    };
  }

  try {
    clearMockCommercialStripeSessions();

    // ── Primary DEPOSIT_AND_BALANCE onboarding ──
    section("seed + accept DEPOSIT_AND_BALANCE");
    const seeded = await withTransientRetry("seed", () =>
      seedApprovedCommercialPipeline(prisma, {
        withAcceptedProposalIntent: true,
        totalInvestmentCents: TOTAL_CENTS,
        businessLabel: BUSINESS_LABEL,
        paymentTermType: "DEPOSIT_AND_BALANCE",
      }),
    );
    runIds.push(seeded.runId);

    const accept = await acceptCommercialAgreement({
      shareTokenHash: hashAgreementShareToken(seeded.agreementShareToken),
      signerName: "Jane Client",
      signerEmail: "jane.client@example.com",
      signerTitle: "Owner",
      acceptanceConfirmed: true,
    });
    assert(accept.ok, "accept ok");

    section("deposit unpaid → not eligible");
    {
      const state = await loadPaymentStateForOpportunity({
        opportunityId: seeded.opportunityId,
      });
      const elig = getOnboardingEligibility({
        agreement: state.agreement,
        payments: state.payments,
      });
      assert(!elig.eligible, "not eligible before deposit");
      const convert = await convertOpportunityToClientProject({
        opportunityId: seeded.opportunityId,
        actorEmail: ACTOR,
      });
      assert(!convert.ok, "convert blocked before deposit");
    }

    section("simulate deposit PAID");
    {
      const checkout = await createCommercialCheckout({
        agreementId: seeded.agreementId,
        paymentType: "DEPOSIT",
        actorEmail: ACTOR,
      });
      assert(checkout.ok, "deposit checkout");
      if (!checkout.ok) throw new Error("checkout");
      const sessionId = checkout.sessionId;
      await fulfillCommercialPaymentCheckout(
        paidSession({
          paymentId: checkout.paymentId,
          agreementId: seeded.agreementId,
          opportunityId: seeded.opportunityId,
          sessionId,
          paymentType: "DEPOSIT",
          amountTotal: DEPOSIT_CENTS,
        }),
      );
    }

    const beforeFacts = await snapshotFacts({
      agreementId: seeded.agreementId,
      scopeId: seeded.scopeId,
      pricingId: seeded.pricingId,
      proposalId: seeded.proposalId,
    });

    section("eligible after deposit; convert");
    {
      const state = await loadPaymentStateForOpportunity({
        opportunityId: seeded.opportunityId,
      });
      const elig = getOnboardingEligibility({
        agreement: state.agreement,
        payments: state.payments,
      });
      assert(elig.eligible, "eligible after deposit");
      assert(elig.balanceOutstandingCents === BALANCE_CENTS, "balance due");

      const convert = await convertOpportunityToClientProject({
        opportunityId: seeded.opportunityId,
        actorEmail: ACTOR,
      });
      assert(convert.ok, "convert ok");
      if (!convert.ok) throw new Error("convert");
      assert(convert.created, "first convert creates");

      const opp = await prisma.opportunity.findUniqueOrThrow({
        where: { id: seeded.opportunityId },
      });
      assert(opp.stage === "WON", "Opportunity WON");
      assert(opp.wonAt != null, "wonAt set");
      assert(opp.clientId === convert.clientId, "client linked");

      const clients = await prisma.client.count({
        where: { sourceOpportunityId: seeded.opportunityId },
      });
      assert(clients === 1, "Client exactly once");

      const projects = await prisma.clientProject.findMany({
        where: { opportunityId: seeded.opportunityId },
      });
      assert(projects.length === 1, "Project exactly once");
      assert(projects[0]!.status === "ONBOARDING", "ONBOARDING");
      assert(projects[0]!.agreementId === seeded.agreementId, "exact Agreement");
      assert(projects[0]!.scopeId === seeded.scopeId, "exact Scope");
      assert(projects[0]!.pricingId === seeded.pricingId, "exact Pricing");
      assert(projects[0]!.proposalId === seeded.proposalId, "exact Proposal");
      assert(projects[0]!.commercialSnapshotJson != null, "snapshot");

      const detail = await loadProjectDetail({ projectId: convert.projectId });
      assert(detail, "project detail");
      assert(detail!.project.depositPaid, "deposit paid reflected");
      assert(
        detail!.project.balanceOutstandingCents === BALANCE_CENTS,
        "balance outstanding",
      );
      assert(!detail!.project.paidInFull, "not paid in full");

      const retry = await convertOpportunityToClientProject({
        opportunityId: seeded.opportunityId,
        actorEmail: ACTOR,
      });
      assert(retry.ok && !retry.created, "retry idempotent");
      if (!retry.ok) throw new Error("retry");
      assert(retry.clientId === convert.clientId, "same Client");
      assert(retry.projectId === convert.projectId, "same Project");
      assert(
        (await prisma.client.count({
          where: { sourceOpportunityId: seeded.opportunityId },
        })) === 1,
        "still one Client",
      );
      assert(
        (await prisma.clientProject.count({
          where: { opportunityId: seeded.opportunityId },
        })) === 1,
        "still one Project",
      );

      const afterFacts = await snapshotFacts({
        agreementId: seeded.agreementId,
        scopeId: seeded.scopeId,
        pricingId: seeded.pricingId,
        proposalId: seeded.proposalId,
      });
      assert(
        JSON.stringify(beforeFacts) === JSON.stringify(afterFacts),
        "no commercial source mutation",
      );

      // Complete required onboarding items
      section("complete checklist → READY → Start ACTIVE");
      const items = await prisma.projectOnboardingItem.findMany({
        where: { projectId: convert.projectId },
      });
      for (const item of items.filter((i) => i.required)) {
        if (
          item.status === "COMPLETED" ||
          item.status === "RECEIVED" ||
          item.status === "NOT_REQUIRED"
        ) {
          continue;
        }
        const upd = await updateOnboardingItemStatus({
          projectId: convert.projectId,
          itemId: item.id,
          status: "COMPLETED",
          actorEmail: ACTOR,
        });
        assert(upd.ok, `checklist ${item.key}`);
      }

      const projectReady = await prisma.clientProject.findUniqueOrThrow({
        where: { id: convert.projectId },
      });
      assert(
        projectReady.status === "READY" || projectReady.status === "ONBOARDING",
        "ready-ish after checklist",
      );

      const detailReady = await loadProjectDetail({
        projectId: convert.projectId,
      });
      assert(
        detailReady!.project.onboardingState === "READY_FOR_KICKOFF" ||
          detailReady!.project.status === "READY",
        "READY_FOR_KICKOFF",
      );

      const started = await startClientProject({
        projectId: convert.projectId,
        actorEmail: ACTOR,
      });
      assert(started.ok, "start project");
      const active = await prisma.clientProject.findUniqueOrThrow({
        where: { id: convert.projectId },
      });
      assert(active.status === "ACTIVE", "ACTIVE");

      // Complete delivery tasks; balance still due → handoff blocked
      section("balance handoff gate");
      const tasks = await prisma.projectDeliveryTask.findMany({
        where: { projectId: convert.projectId },
      });
      for (const task of tasks) {
        const upd = await updateDeliveryTaskStatus({
          projectId: convert.projectId,
          taskId: task.id,
          status: "COMPLETED",
          actorEmail: ACTOR,
        });
        assert(upd.ok, `task ${task.key}`);
      }

      const blocked = await completeClientProject({
        projectId: convert.projectId,
        actorEmail: ACTOR,
      });
      assert(
        !blocked.ok && blocked.code === "FINAL_HANDOFF_BLOCKED_BY_BALANCE",
        "final handoff blocked by balance",
      );

      const balCheckout = await createCommercialCheckout({
        agreementId: seeded.agreementId,
        paymentType: "BALANCE",
        actorEmail: ACTOR,
      });
      assert(balCheckout.ok, "balance checkout");
      if (!balCheckout.ok) throw new Error("bal");
      await fulfillCommercialPaymentCheckout(
        paidSession({
          paymentId: balCheckout.paymentId,
          agreementId: seeded.agreementId,
          opportunityId: seeded.opportunityId,
          sessionId: balCheckout.sessionId,
          paymentType: "BALANCE",
          amountTotal: BALANCE_CENTS,
        }),
      );

      const completed = await completeClientProject({
        projectId: convert.projectId,
        actorEmail: ACTOR,
      });
      assert(completed.ok, "complete after balance paid");
      const done = await prisma.clientProject.findUniqueOrThrow({
        where: { id: convert.projectId },
      });
      assert(done.status === "COMPLETED", "COMPLETED");
    }

    // ── FULL_UPFRONT ──
    section("FULL_UPFRONT eligibility");
    {
      clearMockCommercialStripeSessions();
      const fullSeed = await withTransientRetry("seed full", () =>
        seedApprovedCommercialPipeline(prisma, {
          withAcceptedProposalIntent: true,
          totalInvestmentCents: TOTAL_CENTS,
          businessLabel: `${BUSINESS_LABEL} Full`,
          paymentTermType: "FULL_UPFRONT",
        }),
      );
      runIds.push(fullSeed.runId);

      const fullAccept = await acceptCommercialAgreement({
        shareTokenHash: hashAgreementShareToken(fullSeed.agreementShareToken),
        signerName: "Full Client",
        signerEmail: "full.client@example.com",
        acceptanceConfirmed: true,
      });
      assert(fullAccept.ok, "full accept");

      const beforePay = await loadPaymentStateForOpportunity({
        opportunityId: fullSeed.opportunityId,
      });
      const beforeElig = getOnboardingEligibility({
        agreement: beforePay.agreement,
        payments: beforePay.payments,
      });
      assert(!beforeElig.eligible, "full unpaid not eligible");

      const checkout = await createCommercialCheckout({
        agreementId: fullSeed.agreementId,
        paymentType: "FULL",
        actorEmail: ACTOR,
      });
      assert(checkout.ok, "full checkout");
      if (!checkout.ok) throw new Error("full checkout");
      await fulfillCommercialPaymentCheckout(
        paidSession({
          paymentId: checkout.paymentId,
          agreementId: fullSeed.agreementId,
          opportunityId: fullSeed.opportunityId,
          sessionId: checkout.sessionId,
          paymentType: "FULL",
          amountTotal: TOTAL_CENTS,
        }),
      );

      const afterPay = await loadPaymentStateForOpportunity({
        opportunityId: fullSeed.opportunityId,
      });
      const afterElig = getOnboardingEligibility({
        agreement: afterPay.agreement,
        payments: afterPay.payments,
      });
      assert(afterElig.eligible && afterElig.paidInFull, "full paid eligible");

      const convert = await convertOpportunityToClientProject({
        opportunityId: fullSeed.opportunityId,
        actorEmail: ACTOR,
      });
      assert(convert.ok, "full convert");
    }

    console.log("\nonboarding-lifecycle.integration.ts PASS");
  } finally {
    for (const runId of runIds) {
      await cleanupCommercialE2eFixtures(prisma, runId).catch(() => undefined);
    }
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
