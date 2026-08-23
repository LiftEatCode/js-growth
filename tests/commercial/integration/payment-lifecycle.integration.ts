/**
 * Commercial Sprint 9–10 — Payment lifecycle acceptance (DB).
 *
 * Controlled $2,050 / 50–50 DEPOSIT_AND_BALANCE fixture through production
 * domain paths + Stripe mock. Prefer COMMERCIAL_TEST_DATABASE_URL.
 *
 * Sprint 10 onboarding policy (authoritative):
 *   DEPOSIT PAID → ready for onboarding (balance may remain due)
 *   Balance unpaid does NOT block onboarding; it blocks final handoff/completion.
 *   Payment never auto-WON / auto-creates Client or Project.
 */
import { config as loadEnv } from "dotenv";
import { resolve } from "node:path";
import Stripe from "stripe";

loadEnv({ path: resolve(process.cwd(), ".env.local") });
loadEnv({ path: resolve(process.cwd(), ".env") });

import { applyCommercialTestDatabaseEnv } from "../db-safety";

const TOTAL_CENTS = 205_000;
const DEPOSIT_CENTS = 102_500;
const BALANCE_CENTS = 102_500;
const ACTOR = "e2e-commercial@js-solutions.test";
const BUSINESS_LABEL = "Rooftop Solutions Payment Acceptance Fixture";

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
        error instanceof Error
          ? error.message
          : typeof error === "object" && error && "type" in error
            ? String((error as { type?: string }).type)
            : String(error);
      console.warn(
        `[payment-lifecycle] transient failure on ${label} (attempt ${i + 1}/${attempts}): ${message}`,
      );
      await new Promise((resolve) => setTimeout(resolve, 750 * (i + 1)));
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
    "Refusing LIVE Stripe secret key during payment lifecycle acceptance",
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
    loadPaymentStateForOpportunity,
    commercialCheckoutIdempotencyKey,
    COMMERCIAL_AGREEMENT_PAYMENT_PRODUCT_KEY,
    clearMockCommercialStripeSessions,
    getLastMockCommercialCheckoutCreate,
    getMockCommercialStripeSession,
  } = await import("@/lib/commercialization/payments");
  const {
    getOnboardingEligibility,
    canCompleteProject,
  } = await import("@/lib/commercialization/onboarding");
  const { verifyStripeWebhook } = await import("@/lib/payments/webhook");

  const prisma = new PrismaClient({
    adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL! }),
  });

  const runIds: string[] = [];

  async function snapshotCommercialFacts(ids: {
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
      agreement: {
        status: agreement.status,
        totalInvestmentCents: agreement.totalInvestmentCents,
        depositCents: agreement.depositCents,
        balanceCents: agreement.balanceCents,
        paymentTermType: agreement.paymentTermType,
        currency: agreement.currency,
        snapshotJson: JSON.stringify(agreement.snapshotJson),
        updatedAt: agreement.updatedAt.toISOString(),
      },
      scope: {
        status: scope.status,
        revision: scope.revision,
        updatedAt: scope.updatedAt.toISOString(),
      },
      pricing: {
        status: pricing.status,
        revision: pricing.revision,
        finalTotalCents: pricing.finalTotalCents,
        updatedAt: pricing.updatedAt.toISOString(),
      },
      proposal: {
        status: proposal.status,
        revision: proposal.revision,
        totalInvestmentCents: proposal.totalInvestmentCents,
        updatedAt: proposal.updatedAt.toISOString(),
      },
    };
  }

  function buildPaidSession(options: {
    paymentId: string;
    agreementId: string;
    opportunityId: string;
    sessionId: string;
    paymentType: "DEPOSIT" | "BALANCE" | "FULL";
    amountTotal: number;
    currency: string;
  }) {
    return {
      id: options.sessionId,
      mode: "payment" as const,
      payment_status: "paid" as const,
      amount_total: options.amountTotal,
      currency: options.currency,
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

    // ─────────────────────────────────────────────────────────────
    // Primary $2,050 / 50–50 lifecycle
    // ─────────────────────────────────────────────────────────────
    section("seed + accept $2,050 DEPOSIT_AND_BALANCE fixture");
    const seeded = await withTransientRetry("seed primary fixture", () =>
      seedApprovedCommercialPipeline(prisma, {
        withAcceptedProposalIntent: true,
        totalInvestmentCents: TOTAL_CENTS,
        businessLabel: BUSINESS_LABEL,
        paymentTermType: "DEPOSIT_AND_BALANCE",
      }),
    );
    runIds.push(seeded.runId);

    assert(seeded.totalInvestmentCents === TOTAL_CENTS, "seed total 205000");
    assert(seeded.depositCents === DEPOSIT_CENTS, "seed deposit 102500");
    assert(seeded.balanceCents === BALANCE_CENTS, "seed balance 102500");
    assert(
      seeded.businessName.includes(BUSINESS_LABEL),
      "business label present",
    );

    const accept = await acceptCommercialAgreement({
      shareTokenHash: hashAgreementShareToken(seeded.agreementShareToken),
      signerName: "Jane Client",
      signerEmail: "jane.client@example.com",
      signerTitle: "Owner",
      acceptanceConfirmed: true,
    });
    assert(accept.ok, `accept failed: ${"message" in accept ? accept.message : ""}`);

    // 1. INITIAL ACCEPTED STATE
    section("1. initial accepted payment-pending state");
    {
      const agreement = await prisma.commercialAgreement.findUniqueOrThrow({
        where: { id: seeded.agreementId },
      });
      assert(agreement.status === "ACCEPTED", "agreement ACCEPTED");
      assert(
        agreement.totalInvestmentCents === TOTAL_CENTS,
        "totalAgreementInvestmentCents === 205000",
      );
      assert(agreement.depositCents === DEPOSIT_CENTS, "depositCents === 102500");
      assert(agreement.balanceCents === BALANCE_CENTS, "balanceCents === 102500");

      const opportunity = await prisma.opportunity.findUniqueOrThrow({
        where: { id: seeded.opportunityId },
      });
      assert(opportunity.stage !== "WON", "opportunity NOT WON");

      const paidCount = await prisma.commercialPayment.count({
        where: { agreementId: seeded.agreementId, status: "PAID" },
      });
      assert(paidCount === 0, "no CommercialPayment PAID");

      const paymentCountBefore = await prisma.commercialPayment.count({
        where: { agreementId: seeded.agreementId },
      });
      assert(paymentCountBefore === 0, "no checkout created by accept alone");

      const state = await loadPaymentStateForOpportunity({
        opportunityId: seeded.opportunityId,
      });
      assert(
        state.state.derivedState === "DEPOSIT_DUE" ||
          state.state.derivedState === "AGREEMENT_ACCEPTED_PAYMENT_PENDING",
        `expected deposit/payment pending, got ${state.state.derivedState}`,
      );
      assert(state.state.totalPaidCents === 0, "total paid 0");
      assert(state.state.remainingCents === TOTAL_CENTS, "remaining 205000");
      assert(
        !state.state.readyForOnboarding,
        "deposit unpaid → not ready for onboarding",
      );
      const elig = getOnboardingEligibility({
        agreement: state.agreement,
        payments: state.payments,
      });
      assert(!elig.eligible, "1. deposit unpaid => NOT onboarding eligible");
      assert(
        !elig.eligible && elig.code === "DEPOSIT_UNPAID",
        "deposit unpaid eligibility code",
      );
      assert(
        (await prisma.clientProject.count({
          where: { opportunityId: seeded.opportunityId },
        })) === 0,
        "no Project before convert",
      );
      assert(
        (await prisma.client.count({
          where: { sourceOpportunityId: seeded.opportunityId },
        })) === 0,
        "no Client before convert",
      );
      assert(
        getLastMockCommercialCheckoutCreate() === null,
        "loading state must not create Stripe checkout",
      );
    }

    const factsBefore = await snapshotCommercialFacts(seeded);

    // 2. CREATE DEPOSIT CHECKOUT
    section("2. create deposit checkout");
    const depositCheckout = await createCommercialCheckout({
      agreementId: seeded.agreementId,
      paymentType: "DEPOSIT",
      actorEmail: ACTOR,
    });
    assert(depositCheckout.ok, `deposit checkout failed: ${!depositCheckout.ok ? depositCheckout.message : ""}`);
    if (!depositCheckout.ok) throw new Error("unreachable");

    {
      const deposits = await prisma.commercialPayment.findMany({
        where: { agreementId: seeded.agreementId, type: "DEPOSIT" },
      });
      assert(deposits.length === 1, "exactly one DEPOSIT payment");
      const deposit = deposits[0]!;
      assert(deposit.type === "DEPOSIT", "type DEPOSIT");
      assert(deposit.amountDueCents === DEPOSIT_CENTS, "amountDue 102500");
      assert(deposit.currency === "USD", "currency USD");
      assert(
        deposit.status === "CHECKOUT_CREATED" || deposit.status === "PENDING",
        `active checkout status, got ${deposit.status}`,
      );
      assert(deposit.id === depositCheckout.paymentId, "payment id matches");

      const mockCreate = getLastMockCommercialCheckoutCreate();
      assert(mockCreate, "mock stripe create recorded");
      assert(mockCreate!.amountDueCents === DEPOSIT_CENTS, "stripe amount 102500");
      assert(
        mockCreate!.currency.toUpperCase() === "USD",
        "stripe currency USD",
      );
      assert(
        mockCreate!.metadata.commercialPaymentId === deposit.id,
        "metadata commercialPaymentId",
      );
      assert(
        mockCreate!.metadata.agreementId === seeded.agreementId,
        "metadata agreementId",
      );
      assert(
        mockCreate!.metadata.product === COMMERCIAL_AGREEMENT_PAYMENT_PRODUCT_KEY,
        "metadata product key",
      );
      assert(
        mockCreate!.idempotencyKey ===
          commercialCheckoutIdempotencyKey(deposit.id),
        "idempotency key commercial-payment-checkout:{paymentId}",
      );

      const mockSession = getMockCommercialStripeSession(
        depositCheckout.sessionId,
      );
      assert(mockSession, "mock session stored");
      assert(mockSession!.amount_total === DEPOSIT_CENTS, "session amount");

      const agreement = await prisma.commercialAgreement.findUniqueOrThrow({
        where: { id: seeded.agreementId },
      });
      assert(agreement.status === "ACCEPTED", "agreement still ACCEPTED");
      assert(
        agreement.totalInvestmentCents === TOTAL_CENTS &&
          agreement.depositCents === DEPOSIT_CENTS &&
          agreement.balanceCents === BALANCE_CENTS,
        "agreement amounts unchanged",
      );
      const opportunity = await prisma.opportunity.findUniqueOrThrow({
        where: { id: seeded.opportunityId },
      });
      assert(opportunity.stage !== "WON", "still not WON after checkout");
    }

    // 3. SUCCESS REDIRECT MUST NOT PAY
    section("3. success redirect is non-authoritative");
    {
      // Simulate /payment/return?status=success&session_id=... read path only.
      const payment = await prisma.commercialPayment.findUnique({
        where: { stripeCheckoutSessionId: depositCheckout.sessionId },
      });
      assert(payment, "payment found by session id");
      assert(payment!.status !== "PAID", "redirect must not mark PAID");
      assert(payment!.amountPaidCents === 0, "amountPaid still 0");

      const state = await loadPaymentStateForOpportunity({
        opportunityId: seeded.opportunityId,
      });
      assert(state.state.deposit.status !== "PAID", "deposit not considered paid");
      assert(
        state.state.derivedState !== "DEPOSIT_PAID_BALANCE_PENDING" &&
          state.state.derivedState !== "PAID_IN_FULL",
        "not deposit-paid / paid-in-full from redirect",
      );

      const agreement = await prisma.commercialAgreement.findUniqueOrThrow({
        where: { id: seeded.agreementId },
      });
      assert(agreement.status === "ACCEPTED", "agreement still ACCEPTED");
    }

    // 4. DEPOSIT WEBHOOK
    section("4. deposit webhook → Deposit Paid");
    {
      const deposit = await prisma.commercialPayment.findUniqueOrThrow({
        where: { id: depositCheckout.paymentId },
      });
      const activitiesBefore = await prisma.opportunityActivity.count({
        where: {
          opportunityId: seeded.opportunityId,
          type: { in: ["PAYMENT_COMPLETED", "DEPOSIT_PAID"] },
        },
      });

      const result = await fulfillCommercialPaymentCheckout(
        buildPaidSession({
          paymentId: deposit.id,
          agreementId: seeded.agreementId,
          opportunityId: seeded.opportunityId,
          sessionId: deposit.stripeCheckoutSessionId!,
          paymentType: "DEPOSIT",
          amountTotal: DEPOSIT_CENTS,
          currency: "usd",
        }),
      );
      assert(result.paid, `deposit webhook not paid: ${result.reason}`);

      const paid = await prisma.commercialPayment.findUniqueOrThrow({
        where: { id: deposit.id },
      });
      assert(paid.status === "PAID", "DEPOSIT PAID");
      assert(paid.amountPaidCents === DEPOSIT_CENTS, "amountPaidCents 102500");
      assert(paid.paidAt != null, "paidAt exists");

      const state = await loadPaymentStateForOpportunity({
        opportunityId: seeded.opportunityId,
      });
      assert(
        state.state.derivedState === "DEPOSIT_PAID_BALANCE_PENDING" ||
          state.state.derivedState === "BALANCE_DUE",
        `deposit paid state, got ${state.state.derivedState}`,
      );
      assert(state.state.totalPaidCents === DEPOSIT_CENTS, "total paid 102500");
      assert(state.state.remainingCents === BALANCE_CENTS, "remaining 102500");
      assert(state.state.deposit.status === "PAID", "deposit line PAID");
      assert(
        state.state.readyForOnboarding,
        "2. deposit paid => ready for onboarding (Sprint 10)",
      );
      assert(
        state.state.overallLabel.toLowerCase().includes("deposit") ||
          state.state.derivedState === "DEPOSIT_PAID_BALANCE_PENDING",
        "overall indicates deposit paid / balance pending",
      );

      const elig = getOnboardingEligibility({
        agreement: state.agreement,
        payments: state.payments,
      });
      assert(elig.eligible, "2. deposit paid => onboarding eligible");
      assert(elig.depositPaid, "eligibility.depositPaid");
      assert(
        elig.balanceOutstandingCents === BALANCE_CENTS,
        "4. balance unpaid remains outstanding",
      );
      assert(!elig.paidInFull, "not paid in full after deposit only");

      const handoffGate = canCompleteProject({
        projectStatus: "ACTIVE",
        allRequiredDeliveryTasksComplete: true,
        paidInFull: elig.paidInFull,
      });
      assert(
        !handoffGate.ok &&
          handoffGate.code === "FINAL_HANDOFF_BLOCKED_BY_BALANCE",
        "5. balance unpaid still blocks final handoff/completion",
      );

      const agreement = await prisma.commercialAgreement.findUniqueOrThrow({
        where: { id: seeded.agreementId },
      });
      assert(agreement.totalInvestmentCents === TOTAL_CENTS, "agreement total unchanged");
      assert(agreement.depositCents === DEPOSIT_CENTS, "agreement deposit unchanged");
      assert(agreement.balanceCents === BALANCE_CENTS, "agreement balance unchanged");

      const opportunity = await prisma.opportunity.findUniqueOrThrow({
        where: { id: seeded.opportunityId },
      });
      assert(opportunity.stage !== "WON", "7. not WON after deposit");
      assert(opportunity.clientId == null, "8. payment does not auto-link Client");
      assert(
        (await prisma.clientProject.count({
          where: { opportunityId: seeded.opportunityId },
        })) === 0,
        "8. payment does not auto-create Project",
      );
      assert(
        (await prisma.client.count({
          where: { sourceOpportunityId: seeded.opportunityId },
        })) === 0,
        "8. payment does not auto-create Client",
      );

      const activitiesAfter = await prisma.opportunityActivity.count({
        where: {
          opportunityId: seeded.opportunityId,
          type: { in: ["PAYMENT_COMPLETED", "DEPOSIT_PAID"] },
        },
      });
      assert(
        activitiesAfter > activitiesBefore,
        "payment/deposit completion activity recorded",
      );
      const depositPaidActivity = await prisma.opportunityActivity.findFirst({
        where: { opportunityId: seeded.opportunityId, type: "DEPOSIT_PAID" },
      });
      assert(depositPaidActivity, "DEPOSIT_PAID activity exists");
    }

    // 5. DUPLICATE DEPOSIT SAFETY
    section("5. duplicate deposit safety");
    {
      const deposit = await prisma.commercialPayment.findUniqueOrThrow({
        where: { id: depositCheckout.paymentId },
      });
      const activitiesBefore = await prisma.opportunityActivity.count({
        where: {
          opportunityId: seeded.opportunityId,
          type: { in: ["PAYMENT_COMPLETED", "DEPOSIT_PAID"] },
        },
      });
      const paymentCountBefore = await prisma.commercialPayment.count({
        where: { agreementId: seeded.agreementId },
      });

      const replay = await fulfillCommercialPaymentCheckout(
        buildPaidSession({
          paymentId: deposit.id,
          agreementId: seeded.agreementId,
          opportunityId: seeded.opportunityId,
          sessionId: deposit.stripeCheckoutSessionId!,
          paymentType: "DEPOSIT",
          amountTotal: DEPOSIT_CENTS,
          currency: "usd",
        }),
      );
      assert(replay.paid, "replay still reports paid (idempotent)");
      assert(
        replay.reason === "already-paid" ||
          replay.reason === "already-paid-race" ||
          replay.reason === "paid",
        `idempotent reason, got ${replay.reason}`,
      );

      const paymentCountAfter = await prisma.commercialPayment.count({
        where: { agreementId: seeded.agreementId },
      });
      assert(
        paymentCountAfter === paymentCountBefore,
        "no duplicate CommercialPayment",
      );

      const state = await loadPaymentStateForOpportunity({
        opportunityId: seeded.opportunityId,
      });
      assert(state.state.totalPaidCents === DEPOSIT_CENTS, "total paid still 102500");
      assert(state.state.remainingCents === BALANCE_CENTS, "remaining still 102500");

      const activitiesAfter = await prisma.opportunityActivity.count({
        where: {
          opportunityId: seeded.opportunityId,
          type: { in: ["PAYMENT_COMPLETED", "DEPOSIT_PAID"] },
        },
      });
      assert(
        activitiesAfter === activitiesBefore,
        "no duplicate completion activity on webhook replay",
      );

      const dupCheckout = await createCommercialCheckout({
        agreementId: seeded.agreementId,
        paymentType: "DEPOSIT",
        actorEmail: ACTOR,
      });
      assert(!dupCheckout.ok, "second deposit checkout must be rejected");
      assert(
        !dupCheckout.ok &&
          (dupCheckout.code === "REQUIREMENT_ALREADY_PAID" ||
            dupCheckout.message.toLowerCase().includes("paid") ||
            dupCheckout.message.toLowerCase().includes("already")),
        `reject reason for duplicate deposit: ${!dupCheckout.ok ? dupCheckout.code : ""}`,
      );
    }

    // 6. BALANCE CHECKOUT
    section("6. create balance checkout");
    const balanceCheckout = await createCommercialCheckout({
      agreementId: seeded.agreementId,
      paymentType: "BALANCE",
      actorEmail: ACTOR,
    });
    assert(balanceCheckout.ok, `balance checkout failed: ${!balanceCheckout.ok ? balanceCheckout.message : ""}`);
    if (!balanceCheckout.ok) throw new Error("unreachable");

    {
      const balance = await prisma.commercialPayment.findUniqueOrThrow({
        where: { id: balanceCheckout.paymentId },
      });
      assert(balance.type === "BALANCE", "type BALANCE");
      assert(balance.amountDueCents === BALANCE_CENTS, "balance due 102500");
      assert(balance.currency === "USD", "balance currency USD");

      const mockCreate = getLastMockCommercialCheckoutCreate();
      assert(mockCreate!.amountDueCents === BALANCE_CENTS, "stripe balance amount");
      assert(mockCreate!.currency.toUpperCase() === "USD", "stripe balance currency");

      const state = await loadPaymentStateForOpportunity({
        opportunityId: seeded.opportunityId,
      });
      assert(state.state.deposit.status === "PAID", "deposit remains PAID");
      assert(state.state.totalPaidCents === DEPOSIT_CENTS, "total paid still 102500");
      assert(state.state.remainingCents === BALANCE_CENTS, "remaining 102500");
      assert(
        state.state.readyForOnboarding,
        "3. balance checkout pending does not revoke onboarding eligibility",
      );
      const elig = getOnboardingEligibility({
        agreement: state.agreement,
        payments: state.payments,
      });
      assert(
        elig.eligible,
        "3. balance unpaid does NOT revoke onboarding eligibility",
      );
      assert(
        elig.balanceOutstandingCents === BALANCE_CENTS,
        "balance still outstanding during balance checkout",
      );

      const opportunity = await prisma.opportunity.findUniqueOrThrow({
        where: { id: seeded.opportunityId },
      });
      assert(opportunity.stage !== "WON", "not WON after balance checkout");
    }

    // 7. BALANCE SUCCESS REDIRECT
    section("7. balance success redirect non-authoritative");
    {
      const balance = await prisma.commercialPayment.findUniqueOrThrow({
        where: { id: balanceCheckout.paymentId },
      });
      assert(balance.status !== "PAID", "balance not paid from redirect alone");
      const state = await loadPaymentStateForOpportunity({
        opportunityId: seeded.opportunityId,
      });
      assert(state.state.derivedState !== "PAID_IN_FULL", "not Paid in Full yet");
      assert(
        state.state.readyForOnboarding,
        "deposit-paid agreement should be ready for onboarding (Sprint 10)",
      );
      const elig = getOnboardingEligibility({
        agreement: state.agreement,
        payments: state.payments,
      });
      assert(
        elig.eligible && !elig.paidInFull,
        "onboarding eligible; balance still unpaid (redirect non-authoritative)",
      );
      assert(
        elig.balanceOutstandingCents === BALANCE_CENTS,
        "balance remains due before final handoff",
      );
    }

    // 8. BALANCE WEBHOOK
    section("8. balance webhook → Paid in Full");
    {
      const balance = await prisma.commercialPayment.findUniqueOrThrow({
        where: { id: balanceCheckout.paymentId },
      });
      const result = await fulfillCommercialPaymentCheckout(
        buildPaidSession({
          paymentId: balance.id,
          agreementId: seeded.agreementId,
          opportunityId: seeded.opportunityId,
          sessionId: balance.stripeCheckoutSessionId!,
          paymentType: "BALANCE",
          amountTotal: BALANCE_CENTS,
          currency: "usd",
        }),
      );
      assert(result.paid, `balance webhook not paid: ${result.reason}`);

      const paidBalance = await prisma.commercialPayment.findUniqueOrThrow({
        where: { id: balance.id },
      });
      assert(paidBalance.status === "PAID", "BALANCE PAID");
      assert(
        paidBalance.amountPaidCents === BALANCE_CENTS,
        "balance amountPaidCents 102500",
      );

      const deposit = await prisma.commercialPayment.findFirstOrThrow({
        where: {
          agreementId: seeded.agreementId,
          type: "DEPOSIT",
          status: "PAID",
        },
      });
      assert(deposit.status === "PAID", "deposit remains PAID");

      const state = await loadPaymentStateForOpportunity({
        opportunityId: seeded.opportunityId,
      });
      assert(state.state.derivedState === "PAID_IN_FULL", "PAID IN FULL");
      assert(state.state.totalPaidCents === TOTAL_CENTS, "total paid 205000");
      assert(state.state.remainingCents === 0, "remaining 0");
      assert(state.state.readyForOnboarding, "ready for onboarding");
      assert(
        state.state.overallLabel
          .toLowerCase()
          .includes("ready for onboarding") ||
          state.state.overallLabel.toLowerCase().includes("paid in full"),
        `handoff label: ${state.state.overallLabel}`,
      );

      const elig = getOnboardingEligibility({
        agreement: state.agreement,
        payments: state.payments,
      });
      assert(elig.eligible && elig.paidInFull, "6. Paid in Full / financial gate");
      assert(elig.balanceOutstandingCents === 0, "no balance outstanding");
      const handoffGate = canCompleteProject({
        projectStatus: "ACTIVE",
        allRequiredDeliveryTasksComplete: true,
        paidInFull: elig.paidInFull,
      });
      assert(handoffGate.ok, "6. final handoff allowed when paid in full");

      const opportunity = await prisma.opportunity.findUniqueOrThrow({
        where: { id: seeded.opportunityId },
      });
      assert(opportunity.stage !== "WON", "7. Opportunity NOT automatically WON");
      assert(opportunity.clientId == null, "8. no Client auto-linked after full pay");
      assert(
        (await prisma.clientProject.count({
          where: { opportunityId: seeded.opportunityId },
        })) === 0,
        "8. no Project auto-created by payment webhooks",
      );
      assert(
        (await prisma.client.count({
          where: { sourceOpportunityId: seeded.opportunityId },
        })) === 0,
        "8. no Client auto-created by payment webhooks",
      );

      const agreement = await prisma.commercialAgreement.findUniqueOrThrow({
        where: { id: seeded.agreementId },
      });
      assert(agreement.status === "ACCEPTED", "agreement still ACCEPTED");

      const factsAfter = await snapshotCommercialFacts(seeded);
      assert(
        factsAfter.agreement.totalInvestmentCents ===
          factsBefore.agreement.totalInvestmentCents &&
          factsAfter.agreement.depositCents ===
            factsBefore.agreement.depositCents &&
          factsAfter.agreement.balanceCents ===
            factsBefore.agreement.balanceCents &&
          factsAfter.agreement.paymentTermType ===
            factsBefore.agreement.paymentTermType &&
          factsAfter.agreement.snapshotJson ===
            factsBefore.agreement.snapshotJson,
        "Agreement commercial facts unchanged",
      );
      assert(
        factsAfter.scope.revision === factsBefore.scope.revision &&
          factsAfter.scope.status === factsBefore.scope.status,
        "Scope unchanged",
      );
      assert(
        factsAfter.pricing.finalTotalCents ===
          factsBefore.pricing.finalTotalCents &&
          factsAfter.pricing.revision === factsBefore.pricing.revision,
        "Pricing unchanged",
      );
      assert(
        factsAfter.proposal.totalInvestmentCents ===
          factsBefore.proposal.totalInvestmentCents &&
          factsAfter.proposal.revision === factsBefore.proposal.revision,
        "Proposal unchanged",
      );
    }

    // 9. DUPLICATE BALANCE SAFETY
    section("9. duplicate balance safety");
    {
      const balance = await prisma.commercialPayment.findUniqueOrThrow({
        where: { id: balanceCheckout.paymentId },
      });
      const paymentCountBefore = await prisma.commercialPayment.count({
        where: { agreementId: seeded.agreementId },
      });
      const activitiesBefore = await prisma.opportunityActivity.count({
        where: {
          opportunityId: seeded.opportunityId,
          type: { in: ["PAYMENT_COMPLETED", "BALANCE_PAID"] },
        },
      });

      await fulfillCommercialPaymentCheckout(
        buildPaidSession({
          paymentId: balance.id,
          agreementId: seeded.agreementId,
          opportunityId: seeded.opportunityId,
          sessionId: balance.stripeCheckoutSessionId!,
          paymentType: "BALANCE",
          amountTotal: BALANCE_CENTS,
          currency: "usd",
        }),
      );

      const state = await loadPaymentStateForOpportunity({
        opportunityId: seeded.opportunityId,
      });
      assert(state.state.totalPaidCents === TOTAL_CENTS, "total paid remains 205000");
      assert(state.state.remainingCents === 0, "remaining remains 0");

      const paymentCountAfter = await prisma.commercialPayment.count({
        where: { agreementId: seeded.agreementId },
      });
      assert(paymentCountAfter === paymentCountBefore, "no duplicate payment row");

      const activitiesAfter = await prisma.opportunityActivity.count({
        where: {
          opportunityId: seeded.opportunityId,
          type: { in: ["PAYMENT_COMPLETED", "BALANCE_PAID"] },
        },
      });
      assert(
        activitiesAfter === activitiesBefore,
        "no duplicate balance completion activity",
      );

      const dup = await createCommercialCheckout({
        agreementId: seeded.agreementId,
        paymentType: "BALANCE",
        actorEmail: ACTOR,
      });
      assert(!dup.ok, "second balance checkout blocked");
    }

    // 10. RECONCILIATION FAILURE TESTS (fresh deposit fixture)
    section("10. reconciliation fail-closed");
    {
      const mismatchSeed = await seedApprovedCommercialPipeline(prisma, {
        totalInvestmentCents: TOTAL_CENTS,
        businessLabel: `${BUSINESS_LABEL} Mismatch`,
        paymentTermType: "DEPOSIT_AND_BALANCE",
      });
      runIds.push(mismatchSeed.runId);
      await acceptCommercialAgreement({
        shareTokenHash: hashAgreementShareToken(
          mismatchSeed.agreementShareToken,
        ),
        signerName: "Jane Client",
        signerEmail: "jane.client@example.com",
        acceptanceConfirmed: true,
      });

      const checkout = await createCommercialCheckout({
        agreementId: mismatchSeed.agreementId,
        paymentType: "DEPOSIT",
        actorEmail: ACTOR,
      });
      assert(checkout.ok, "mismatch fixture deposit checkout");
      if (!checkout.ok) throw new Error("unreachable");

      const amountMismatch = await fulfillCommercialPaymentCheckout(
        buildPaidSession({
          paymentId: checkout.paymentId,
          agreementId: mismatchSeed.agreementId,
          opportunityId: mismatchSeed.opportunityId,
          sessionId: checkout.sessionId,
          paymentType: "DEPOSIT",
          amountTotal: 102_499,
          currency: "usd",
        }),
      );
      assert(!amountMismatch.paid, "102499 must NOT mark paid");
      let row = await prisma.commercialPayment.findUniqueOrThrow({
        where: { id: checkout.paymentId },
      });
      assert(row.status !== "PAID", "amount mismatch leaves unpaid");
      assert(
        row.reconciliationCode === "PAYMENT_AMOUNT_MISMATCH",
        "amount mismatch code",
      );

      // Clear reconciliation to retry currency mismatch on same unpaid row
      await prisma.commercialPayment.update({
        where: { id: checkout.paymentId },
        data: { reconciliationCode: null, reconciliationMessage: null },
      });

      const currencyMismatch = await fulfillCommercialPaymentCheckout(
        buildPaidSession({
          paymentId: checkout.paymentId,
          agreementId: mismatchSeed.agreementId,
          opportunityId: mismatchSeed.opportunityId,
          sessionId: checkout.sessionId,
          paymentType: "DEPOSIT",
          amountTotal: DEPOSIT_CENTS,
          currency: "eur",
        }),
      );
      assert(!currencyMismatch.paid, "EUR must NOT mark paid");
      row = await prisma.commercialPayment.findUniqueOrThrow({
        where: { id: checkout.paymentId },
      });
      assert(row.status !== "PAID", "currency mismatch leaves unpaid");
      assert(
        row.reconciliationCode === "PAYMENT_CURRENCY_MISMATCH",
        "currency mismatch code",
      );

      await prisma.commercialPayment.update({
        where: { id: checkout.paymentId },
        data: { reconciliationCode: null, reconciliationMessage: null },
      });

      const wrongAgreement = await fulfillCommercialPaymentCheckout({
        id: checkout.sessionId,
        mode: "payment",
        payment_status: "paid",
        amount_total: DEPOSIT_CENTS,
        currency: "usd",
        metadata: {
          product: COMMERCIAL_AGREEMENT_PAYMENT_PRODUCT_KEY,
          commercialPaymentId: checkout.paymentId,
          agreementId: "wrong-agreement-id",
          opportunityId: mismatchSeed.opportunityId,
          paymentType: "DEPOSIT",
        },
        payment_intent: `pi_test_wrong_${checkout.paymentId}`,
      });
      assert(!wrongAgreement.paid, "wrong agreement must NOT mark paid");
      row = await prisma.commercialPayment.findUniqueOrThrow({
        where: { id: checkout.paymentId },
      });
      assert(row.status !== "PAID", "wrong association leaves unpaid");

      // Invalid signature — no mutation
      const statusBefore = row.status;
      const webhookSecret = "whsec_payment_lifecycle_test";
      process.env.STRIPE_WEBHOOK_SECRET = webhookSecret;
      const payload = JSON.stringify({
        id: "evt_invalid_sig",
        object: "event",
        type: "checkout.session.completed",
        data: {
          object: buildPaidSession({
            paymentId: checkout.paymentId,
            agreementId: mismatchSeed.agreementId,
            opportunityId: mismatchSeed.opportunityId,
            sessionId: checkout.sessionId,
            paymentType: "DEPOSIT",
            amountTotal: DEPOSIT_CENTS,
            currency: "usd",
          }),
        },
      });
      const invalid = verifyStripeWebhook(payload, "t=1,v1=deadbeef", webhookSecret);
      assert(!invalid.ok, "invalid signature rejected");
      // Valid signature verifies (control)
      const validHeader = Stripe.webhooks.generateTestHeaderString({
        payload,
        secret: webhookSecret,
      });
      const valid = verifyStripeWebhook(payload, validHeader, webhookSecret);
      assert(valid.ok, "valid signature accepted");

      // Route-level: invalid signature must not mutate
      const { POST } = await import("@/app/api/stripe/webhook/route");
      const response = await POST(
        new Request("http://localhost/api/stripe/webhook", {
          method: "POST",
          headers: { "stripe-signature": "t=1,v1=not-valid" },
          body: payload,
        }),
      );
      assert(response.status === 400, "webhook route rejects invalid signature");
      row = await prisma.commercialPayment.findUniqueOrThrow({
        where: { id: checkout.paymentId },
      });
      assert(row.status === statusBefore, "invalid signature did not mutate");
      assert(row.status !== "PAID", "still not paid after invalid webhook");
    }

    // 11. BALANCE BEFORE DEPOSIT BLOCKED
    section("11. balance before deposit blocked");
    {
      const gateSeed = await seedApprovedCommercialPipeline(prisma, {
        totalInvestmentCents: TOTAL_CENTS,
        businessLabel: `${BUSINESS_LABEL} Balance Gate`,
        paymentTermType: "DEPOSIT_AND_BALANCE",
      });
      runIds.push(gateSeed.runId);
      await acceptCommercialAgreement({
        shareTokenHash: hashAgreementShareToken(gateSeed.agreementShareToken),
        signerName: "Jane Client",
        signerEmail: "jane.client@example.com",
        acceptanceConfirmed: true,
      });

      const earlyBalance = await createCommercialCheckout({
        agreementId: gateSeed.agreementId,
        paymentType: "BALANCE",
        actorEmail: ACTOR,
      });
      assert(!earlyBalance.ok, "balance before deposit blocked");
      assert(
        !earlyBalance.ok && earlyBalance.code === "DEPOSIT_NOT_PAID",
        `expected DEPOSIT_NOT_PAID, got ${!earlyBalance.ok ? earlyBalance.code : ""}`,
      );
    }

    // 12. FULL-UPFRONT REGRESSION
    section("12. full-upfront regression");
    {
      const fullSeed = await seedApprovedCommercialPipeline(prisma, {
        totalInvestmentCents: TOTAL_CENTS,
        businessLabel: `${BUSINESS_LABEL} Full Upfront`,
        paymentTermType: "FULL_UPFRONT",
      });
      runIds.push(fullSeed.runId);
      await acceptCommercialAgreement({
        shareTokenHash: hashAgreementShareToken(fullSeed.agreementShareToken),
        signerName: "Jane Client",
        signerEmail: "jane.client@example.com",
        acceptanceConfirmed: true,
      });

      const agreement = await prisma.commercialAgreement.findUniqueOrThrow({
        where: { id: fullSeed.agreementId },
      });
      assert(agreement.paymentTermType === "FULL_UPFRONT", "FULL_UPFRONT term");

      const fullCheckout = await createCommercialCheckout({
        agreementId: fullSeed.agreementId,
        paymentType: "FULL",
        actorEmail: ACTOR,
      });
      assert(fullCheckout.ok, "full checkout created");
      if (!fullCheckout.ok) throw new Error("unreachable");
      assert(fullCheckout.amountDueCents === TOTAL_CENTS, "full amount 205000");

      const mockCreate = getLastMockCommercialCheckoutCreate();
      assert(mockCreate!.amountDueCents === TOTAL_CENTS, "stripe full 205000");
      assert(mockCreate!.currency.toUpperCase() === "USD", "stripe full USD");

      const paid = await fulfillCommercialPaymentCheckout(
        buildPaidSession({
          paymentId: fullCheckout.paymentId,
          agreementId: fullSeed.agreementId,
          opportunityId: fullSeed.opportunityId,
          sessionId: fullCheckout.sessionId,
          paymentType: "FULL",
          amountTotal: TOTAL_CENTS,
          currency: "usd",
        }),
      );
      assert(paid.paid, "full webhook paid");

      const state = await loadPaymentStateForOpportunity({
        opportunityId: fullSeed.opportunityId,
      });
      assert(state.state.totalPaidCents === TOTAL_CENTS, "full paid 205000");
      assert(state.state.remainingCents === 0, "full remaining 0");
      assert(state.state.derivedState === "PAID_IN_FULL", "full Paid in Full");

      const depositRows = await prisma.commercialPayment.count({
        where: { agreementId: fullSeed.agreementId, type: "DEPOSIT" },
      });
      const balanceRows = await prisma.commercialPayment.count({
        where: { agreementId: fullSeed.agreementId, type: "BALANCE" },
      });
      assert(depositRows === 0, "no DEPOSIT payment for FULL_UPFRONT");
      assert(balanceRows === 0, "no BALANCE payment for FULL_UPFRONT");

      const opportunity = await prisma.opportunity.findUniqueOrThrow({
        where: { id: fullSeed.opportunityId },
      });
      assert(opportunity.stage !== "WON", "full upfront not auto-WON");
    }

    console.log("\npayment-lifecycle.integration.ts PASS");
  } finally {
    for (const runId of runIds) {
      await cleanupCommercialE2eFixtures(prisma, runId);
    }
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("\npayment-lifecycle.integration.ts FAIL");
  console.error(error);
  process.exit(1);
});
