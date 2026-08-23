/**
 * CLI helpers for Playwright assertions that need Prisma.
 * Usage: npx tsx --import ./tests/commercial/shims/register.mjs tests/commercial/fixtures/assert-cli.ts <command>
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { config as loadEnv } from "dotenv";

loadEnv({ path: resolve(process.cwd(), ".env.local") });
loadEnv({ path: resolve(process.cwd(), ".env") });

import { applyCommercialTestDatabaseEnv } from "../db-safety";

async function main() {
  const command = process.argv[2];
  const fixturePath = resolve(process.cwd(), "tests/commercial/.e2e-fixture.json");
  if (!existsSync(fixturePath)) {
    throw new Error("Missing .e2e-fixture.json — run seed-cli first");
  }
  const seeded = JSON.parse(readFileSync(fixturePath, "utf8")) as {
    opportunityId: string;
    agreementId: string;
    proposalDeliveryId: string;
    agreementDeliveryId: string;
    proposalShareToken: string;
    agreementShareToken: string;
  };

  applyCommercialTestDatabaseEnv();

  const { PrismaClient } = await import("@/generated/prisma/client");
  const { PrismaNeon } = await import("@prisma/adapter-neon");
  const { neonConfig } = await import("@neondatabase/serverless");
  const ws = await import("ws");
  neonConfig.webSocketConstructor = ws.default;
  const prisma = new PrismaClient({
    adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL! }),
  });

  try {
    if (command === "record-proposal-view") {
      const { recordProposalLinkView } = await import(
        "@/lib/commercialization/proposal-delivery/record-view"
      );
      const before = await prisma.proposalDelivery.findUnique({
        where: { id: seeded.proposalDeliveryId },
      });
      await recordProposalLinkView({ shareToken: seeded.proposalShareToken });
      const after = await prisma.proposalDelivery.findUnique({
        where: { id: seeded.proposalDeliveryId },
      });
      if ((after?.viewCount ?? 0) <= (before?.viewCount ?? 0)) {
        throw new Error("view count did not increase");
      }
      console.log("OK");
      return;
    }

    if (command === "revoke-proposal") {
      await prisma.proposalDelivery.update({
        where: { id: seeded.proposalDeliveryId },
        data: { revokedAt: new Date(), revokedByEmail: "e2e@test" },
      });
      console.log("OK");
      return;
    }

    if (command === "unrevoke-proposal") {
      await prisma.proposalDelivery.update({
        where: { id: seeded.proposalDeliveryId },
        data: { revokedAt: null, revokedByEmail: null },
      });
      console.log("OK");
      return;
    }

    if (command === "assert-acceptance-gates") {
      const { acceptCommercialAgreement } = await import(
        "@/lib/commercialization/agreement/accept"
      );
      const { hashAgreementShareToken } = await import(
        "@/lib/commercialization/agreement-delivery/token"
      );
      const hash = hashAgreementShareToken(seeded.agreementShareToken);

      const noCheck = await acceptCommercialAgreement({
        shareTokenHash: hash,
        signerName: "Jane Client",
        signerEmail: "jane.client@example.com",
        acceptanceConfirmed: false,
      });
      if (noCheck.ok) throw new Error("checkbox gate failed");

      const badEmail = await acceptCommercialAgreement({
        shareTokenHash: hash,
        signerName: "Jane Client",
        signerEmail: "not-an-email",
        acceptanceConfirmed: true,
      });
      if (badEmail.ok) throw new Error("email gate failed");

      const noName = await acceptCommercialAgreement({
        shareTokenHash: hash,
        signerName: " ",
        signerEmail: "jane.client@example.com",
        acceptanceConfirmed: true,
      });
      if (noName.ok) throw new Error("name gate failed");

      console.log("OK");
      return;
    }

    if (command === "accept-agreement") {
      const { acceptCommercialAgreement } = await import(
        "@/lib/commercialization/agreement/accept"
      );
      const { hashAgreementShareToken } = await import(
        "@/lib/commercialization/agreement-delivery/token"
      );
      const result = await acceptCommercialAgreement({
        shareTokenHash: hashAgreementShareToken(seeded.agreementShareToken),
        signerName: "Jane Client",
        signerEmail: "jane.client@example.com",
        signerTitle: "Owner",
        acceptanceConfirmed: true,
      });
      if (!result.ok) {
        throw new Error(result.message);
      }
      console.log("OK");
      return;
    }

    if (command === "assert-accepted") {
      const agreement = await prisma.commercialAgreement.findUnique({
        where: { id: seeded.agreementId },
        include: { acceptance: true },
      });
      const opportunity = await prisma.opportunity.findUnique({
        where: { id: seeded.opportunityId },
      });
      if (agreement?.status !== "ACCEPTED" || !agreement.acceptance) {
        throw new Error("agreement not accepted");
      }
      if (opportunity?.stage === "WON") {
        throw new Error("opportunity incorrectly marked WON");
      }
      console.log("OK");
      return;
    }

    if (command === "create-deposit-checkout") {
      const { createCommercialCheckout } = await import(
        "@/lib/commercialization/payments/create-checkout"
      );
      const result = await createCommercialCheckout({
        agreementId: seeded.agreementId,
        paymentType: "DEPOSIT",
        actorEmail: "e2e-commercial@js-solutions.test",
      });
      if (!result.ok) {
        throw new Error(result.message);
      }
      const fixture = {
        ...seeded,
        depositPaymentId: result.paymentId,
        depositCheckoutSessionId: result.sessionId,
        depositCheckoutUrl: result.checkoutUrl,
      };
      const { writeFileSync } = await import("node:fs");
      writeFileSync(fixturePath, JSON.stringify(fixture, null, 2));
      console.log("OK");
      return;
    }

    if (command === "complete-deposit-webhook") {
      const payment = await prisma.commercialPayment.findFirst({
        where: {
          agreementId: seeded.agreementId,
          type: "DEPOSIT",
          status: { in: ["CHECKOUT_CREATED", "PENDING"] },
        },
        orderBy: { createdAt: "desc" },
      });
      if (!payment?.stripeCheckoutSessionId) {
        throw new Error("missing deposit checkout session");
      }
      const { fulfillCommercialPaymentCheckout } = await import(
        "@/lib/commercialization/payments/webhook"
      );
      const { COMMERCIAL_AGREEMENT_PAYMENT_PRODUCT_KEY } = await import(
        "@/lib/commercialization/payments/constants"
      );
      const result = await fulfillCommercialPaymentCheckout({
        id: payment.stripeCheckoutSessionId,
        mode: "payment",
        payment_status: "paid",
        amount_total: payment.amountDueCents,
        currency: payment.currency.toLowerCase(),
        metadata: {
          product: COMMERCIAL_AGREEMENT_PAYMENT_PRODUCT_KEY,
          commercialPaymentId: payment.id,
          agreementId: payment.agreementId,
          opportunityId: payment.opportunityId,
          paymentType: "DEPOSIT",
        },
        payment_intent: `pi_test_mock_${payment.id}`,
      });
      if (!result.paid) {
        throw new Error(`deposit not paid: ${result.reason}`);
      }
      console.log("OK");
      return;
    }

    if (command === "create-balance-checkout") {
      const { createCommercialCheckout } = await import(
        "@/lib/commercialization/payments/create-checkout"
      );
      const result = await createCommercialCheckout({
        agreementId: seeded.agreementId,
        paymentType: "BALANCE",
        actorEmail: "e2e-commercial@js-solutions.test",
      });
      if (!result.ok) {
        throw new Error(result.message);
      }
      const fixture = {
        ...seeded,
        balancePaymentId: result.paymentId,
        balanceCheckoutSessionId: result.sessionId,
        balanceCheckoutUrl: result.checkoutUrl,
      };
      const { writeFileSync } = await import("node:fs");
      writeFileSync(fixturePath, JSON.stringify(fixture, null, 2));
      console.log("OK");
      return;
    }

    if (command === "complete-balance-webhook") {
      const payment = await prisma.commercialPayment.findFirst({
        where: {
          agreementId: seeded.agreementId,
          type: "BALANCE",
          status: { in: ["CHECKOUT_CREATED", "PENDING"] },
        },
        orderBy: { createdAt: "desc" },
      });
      if (!payment?.stripeCheckoutSessionId) {
        throw new Error("missing balance checkout session");
      }
      const { fulfillCommercialPaymentCheckout } = await import(
        "@/lib/commercialization/payments/webhook"
      );
      const { COMMERCIAL_AGREEMENT_PAYMENT_PRODUCT_KEY } = await import(
        "@/lib/commercialization/payments/constants"
      );
      const result = await fulfillCommercialPaymentCheckout({
        id: payment.stripeCheckoutSessionId,
        mode: "payment",
        payment_status: "paid",
        amount_total: payment.amountDueCents,
        currency: payment.currency.toLowerCase(),
        metadata: {
          product: COMMERCIAL_AGREEMENT_PAYMENT_PRODUCT_KEY,
          commercialPaymentId: payment.id,
          agreementId: payment.agreementId,
          opportunityId: payment.opportunityId,
          paymentType: "BALANCE",
        },
        payment_intent: `pi_test_mock_${payment.id}`,
      });
      if (!result.paid) {
        throw new Error(`balance not paid: ${result.reason}`);
      }
      console.log("OK");
      return;
    }

    if (command === "assert-deposit-paid") {
      const deposit = await prisma.commercialPayment.findFirst({
        where: {
          agreementId: seeded.agreementId,
          type: "DEPOSIT",
          status: "PAID",
        },
      });
      if (!deposit) throw new Error("deposit not paid");
      const opportunity = await prisma.opportunity.findUnique({
        where: { id: seeded.opportunityId },
      });
      if (opportunity?.stage === "WON") {
        throw new Error("opportunity incorrectly marked WON after deposit");
      }
      console.log("OK");
      return;
    }

    if (command === "assert-paid-in-full") {
      const payments = await prisma.commercialPayment.findMany({
        where: { agreementId: seeded.agreementId, status: "PAID" },
      });
      if (payments.length < 2) {
        throw new Error("expected deposit + balance paid");
      }
      const opportunity = await prisma.opportunity.findUnique({
        where: { id: seeded.opportunityId },
      });
      if (opportunity?.stage === "WON") {
        throw new Error("opportunity incorrectly marked WON after paid in full");
      }
      console.log("OK");
      return;
    }

    if (command === "convert-to-client") {
      const { convertOpportunityToClientProject } = await import(
        "@/lib/commercialization/onboarding/convert"
      );
      const result = await convertOpportunityToClientProject({
        opportunityId: seeded.opportunityId,
        actorEmail: "e2e-commercial@js-solutions.test",
      });
      if (!result.ok) {
        throw new Error(result.message);
      }
      const { writeFileSync } = await import("node:fs");
      writeFileSync(
        fixturePath,
        JSON.stringify(
          {
            ...seeded,
            clientId: result.clientId,
            projectId: result.projectId,
          },
          null,
          2,
        ),
      );
      console.log("OK");
      return;
    }

    if (command === "complete-required-onboarding") {
      const project = await prisma.clientProject.findUnique({
        where: { opportunityId: seeded.opportunityId },
        include: { onboardingItems: true },
      });
      if (!project) throw new Error("project missing");
      const { updateOnboardingItemStatus } = await import(
        "@/lib/commercialization/onboarding/mutate"
      );
      for (const item of project.onboardingItems) {
        if (!item.required) continue;
        if (
          item.status === "COMPLETED" ||
          item.status === "RECEIVED" ||
          item.status === "NOT_REQUIRED"
        ) {
          continue;
        }
        const upd = await updateOnboardingItemStatus({
          projectId: project.id,
          itemId: item.id,
          status: "COMPLETED",
          actorEmail: "e2e-commercial@js-solutions.test",
        });
        if (!upd.ok) throw new Error(upd.message);
      }
      console.log("OK");
      return;
    }

    if (command === "start-project") {
      const project = await prisma.clientProject.findUnique({
        where: { opportunityId: seeded.opportunityId },
      });
      if (!project) throw new Error("project missing");
      const { startClientProject } = await import(
        "@/lib/commercialization/onboarding/mutate"
      );
      const result = await startClientProject({
        projectId: project.id,
        actorEmail: "e2e-commercial@js-solutions.test",
      });
      if (!result.ok) throw new Error(result.message);
      console.log("OK");
      return;
    }

    throw new Error(`Unknown command: ${command}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
