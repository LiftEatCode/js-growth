/**
 * Commercial Sprint 9 — Payment / deposit collection verification.
 * Pure deterministic tests + source scans. No OpenAI, Places, crawl, LIVE Stripe, or production DB.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { isForbiddenAnalyticsParamKey } from "@/lib/analytics/commercial-events";
import { OPPORTUNITY_ACTIVITY_TYPES } from "@/lib/commercialization/opportunities/constants";
import {
  COMMERCIAL_PAYMENT_VERSION,
  COMMERCIAL_AGREEMENT_PAYMENT_PRODUCT_KEY,
  commercialCheckoutIdempotencyKey,
  paymentLineDisplayLabel,
} from "./constants";
import {
  buildCheckoutLineDescription,
  derivePaymentRequirement,
} from "./requirements";
import { derivePaymentState } from "./state";
import {
  reconcileCommercialCheckoutAmount,
  isCommercialAgreementPaymentSession,
} from "./reconcile";
import type { AcceptedAgreementPaymentAuthority } from "./types";
import type { LoadedPaymentSummary } from "./types";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function collectTsFiles(root: string): string[] {
  const entries = readdirSync(root);
  const files: string[] = [];
  for (const entry of entries) {
    const full = join(root, entry);
    const stats = statSync(full);
    if (stats.isDirectory()) {
      files.push(...collectTsFiles(full));
      continue;
    }
    if (extname(full) === ".ts" || extname(full) === ".tsx") {
      files.push(full);
    }
  }
  return files;
}

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, "../../../..");

assert(COMMERCIAL_PAYMENT_VERSION === 1, "payment version 1");
assert(
  COMMERCIAL_AGREEMENT_PAYMENT_PRODUCT_KEY === "commercial-agreement-payment",
  "product key isolated from audit",
);

for (const type of [
  "PAYMENT_REQUIREMENT_CREATED",
  "PAYMENT_CHECKOUT_CREATED",
  "PAYMENT_LINK_SENT",
  "PAYMENT_COMPLETED",
  "PAYMENT_FAILED",
  "PAYMENT_EXPIRED",
  "DEPOSIT_PAID",
  "BALANCE_PAID",
  "PAYMENT_RECONCILIATION_FAILED",
] as const) {
  assert(OPPORTUNITY_ACTIVITY_TYPES.includes(type), `activity ${type}`);
}

const baseAgreement = (overrides: Partial<AcceptedAgreementPaymentAuthority> = {}): AcceptedAgreementPaymentAuthority => ({
  agreementId: "agr_1",
  opportunityId: "opp_1",
  status: "ACCEPTED",
  currency: "USD",
  paymentTermType: "DEPOSIT_AND_BALANCE",
  totalInvestmentCents: 205_000,
  depositCents: 102_500,
  balanceCents: 102_500,
  paymentCustomText: null,
  businessName: "Rooftop Solutions",
  ...overrides,
});

// 1–2 accepted required / approved blocked
{
  const blocked = derivePaymentRequirement({
    agreement: baseAgreement({ status: "APPROVED" }),
    requestedType: "DEPOSIT",
    depositPaid: false,
    typeAlreadyPaid: false,
    nextSequence: 1,
  });
  assert(!blocked.ok && blocked.code === "AGREEMENT_NOT_ACCEPTED", "approved blocked");
}

{
  const ok = derivePaymentRequirement({
    agreement: baseAgreement(),
    requestedType: "DEPOSIT",
    depositPaid: false,
    typeAlreadyPaid: false,
    nextSequence: 1,
  });
  assert(ok.ok && ok.requirement.amountDueCents === 102_500, "deposit from agreement");
}

// 3–5 amounts from agreement snapshot
{
  const bal = derivePaymentRequirement({
    agreement: baseAgreement(),
    requestedType: "BALANCE",
    depositPaid: true,
    typeAlreadyPaid: false,
    nextSequence: 1,
  });
  assert(bal.ok && bal.requirement.amountDueCents === 102_500, "balance from agreement");

  const full = derivePaymentRequirement({
    agreement: baseAgreement({
      paymentTermType: "FULL_UPFRONT",
      depositCents: null,
      balanceCents: null,
    }),
    requestedType: "FULL",
    depositPaid: false,
    typeAlreadyPaid: false,
    nextSequence: 1,
  });
  assert(full.ok && full.requirement.amountDueCents === 205_000, "full from agreement");
}

// 8 custom ambiguous blocked
{
  const custom = derivePaymentRequirement({
    agreement: baseAgreement({
      paymentTermType: "CUSTOM",
      paymentCustomText: "Net 30 somehow",
      depositCents: null,
      balanceCents: null,
    }),
    requestedType: "DEPOSIT",
    depositPaid: false,
    typeAlreadyPaid: false,
    nextSequence: 1,
  });
  assert(!custom.ok && custom.code === "CUSTOM_TERMS_AMBIGUOUS", "custom blocked");
}

// 9–11 integer cents + odd cents reconcile
{
  const odd = baseAgreement({
    totalInvestmentCents: 205_001,
    depositCents: 102_500,
    balanceCents: 102_501,
  });
  assert(
    odd.depositCents! + odd.balanceCents! === odd.totalInvestmentCents,
    "odd cents reconcile",
  );
  const req = derivePaymentRequirement({
    agreement: odd,
    requestedType: "DEPOSIT",
    depositPaid: false,
    typeAlreadyPaid: false,
    nextSequence: 1,
  });
  assert(req.ok && Number.isInteger(req.requirement.amountDueCents), "integer cents");
}

{
  const bad = derivePaymentRequirement({
    agreement: baseAgreement({
      depositCents: 100_000,
      balanceCents: 100_000,
      totalInvestmentCents: 205_000,
    }),
    requestedType: "DEPOSIT",
    depositPaid: false,
    typeAlreadyPaid: false,
    nextSequence: 1,
  });
  assert(!bad.ok && bad.code === "AMOUNT_INVALID", "deposit+balance must equal total");
}

// 12–17 duplicate / balance gating
{
  const dup = derivePaymentRequirement({
    agreement: baseAgreement(),
    requestedType: "DEPOSIT",
    depositPaid: false,
    typeAlreadyPaid: true,
    nextSequence: 2,
  });
  assert(!dup.ok && dup.code === "REQUIREMENT_ALREADY_PAID", "duplicate deposit blocked");

  const earlyBal = derivePaymentRequirement({
    agreement: baseAgreement(),
    requestedType: "BALANCE",
    depositPaid: false,
    typeAlreadyPaid: false,
    nextSequence: 1,
  });
  assert(!earlyBal.ok && earlyBal.code === "DEPOSIT_NOT_PAID", "balance before deposit blocked");
}

// 18 idempotency key
assert(
  commercialCheckoutIdempotencyKey("pay_abc") ===
    "commercial-payment-checkout:pay_abc",
  "idempotency key",
);

// 19–20 checkout description / no internal IDs
{
  const desc = buildCheckoutLineDescription({
    businessName: "Rooftop Solutions",
    type: "DEPOSIT",
  });
  assert(desc.includes("Rooftop Solutions"), "line description has business");
  assert(!desc.includes("agr_"), "no agreement id in description");
  assert(!desc.includes("opp_"), "no opportunity id in description");
}

// 22–23 success/cancel redirects are not authority — source scan
{
  const returnPage = readFileSync(
    join(repoRoot, "src/app/payment/return/page.tsx"),
    "utf8",
  );
  assert(
    returnPage.includes("NOT payment authority") ||
      returnPage.includes("does not finalize"),
    "return page documents non-authority",
  );
  assert(!returnPage.includes("status: \"PAID\""), "return page does not mark PAID");
  assert(!returnPage.includes("getStripe("), "return page 0 Stripe calls");
}

// 24–29 reconciliation
{
  const match = reconcileCommercialCheckoutAmount({
    session: { amount_total: 102_500, currency: "usd" },
    expectedAmountCents: 102_500,
    expectedCurrency: "USD",
  });
  assert(match.ok, "amount match");

  const amtMismatch = reconcileCommercialCheckoutAmount({
    session: { amount_total: 99_000, currency: "usd" },
    expectedAmountCents: 102_500,
    expectedCurrency: "USD",
  });
  assert(
    !amtMismatch.ok && amtMismatch.code === "PAYMENT_AMOUNT_MISMATCH",
    "amount mismatch",
  );

  const curMismatch = reconcileCommercialCheckoutAmount({
    session: { amount_total: 102_500, currency: "eur" },
    expectedAmountCents: 102_500,
    expectedCurrency: "USD",
  });
  assert(
    !curMismatch.ok && curMismatch.code === "PAYMENT_CURRENCY_MISMATCH",
    "currency mismatch",
  );
}

assert(
  isCommercialAgreementPaymentSession({
    metadata: { product: COMMERCIAL_AGREEMENT_PAYMENT_PRODUCT_KEY },
  }),
  "commercial session detect",
);
assert(
  !isCommercialAgreementPaymentSession({
    metadata: { product: "professional-website-growth-audit" },
  }),
  "audit session not commercial",
);

// 30–33 derived state machine
function payment(
  overrides: Partial<LoadedPaymentSummary> &
    Pick<LoadedPaymentSummary, "type" | "status">,
): LoadedPaymentSummary {
  return {
    id: overrides.id ?? `p_${overrides.type}`,
    type: overrides.type,
    status: overrides.status,
    currency: "USD",
    amountDueCents: overrides.amountDueCents ?? 102_500,
    amountPaidCents: overrides.amountPaidCents ?? 0,
    paymentSequence: 1,
    checkoutUrl: overrides.checkoutUrl ?? null,
    stripeCheckoutSessionId: overrides.stripeCheckoutSessionId ?? null,
    paidAt: overrides.paidAt ?? null,
    failedAt: null,
    expiredAt: null,
    refundedAt: null,
    reconciliationCode: overrides.reconciliationCode ?? null,
    createdAt: new Date("2026-08-22T12:00:00Z"),
  };
}

{
  const pending = derivePaymentState({
    agreement: baseAgreement(),
    payments: [],
  });
  assert(pending.derivedState === "DEPOSIT_DUE", "deposit due");
  assert(pending.canCreateDepositCheckout, "can create deposit");
  assert(!pending.canCreateBalanceCheckout, "cannot create balance yet");
}

{
  const afterDeposit = derivePaymentState({
    agreement: baseAgreement(),
    payments: [
      payment({
        type: "DEPOSIT",
        status: "PAID",
        amountPaidCents: 102_500,
        paidAt: new Date(),
      }),
    ],
  });
  assert(
    afterDeposit.derivedState === "DEPOSIT_PAID_BALANCE_PENDING",
    "deposit paid balance pending",
  );
  assert(afterDeposit.canCreateBalanceCheckout, "can create balance after deposit");
  assert(
    afterDeposit.readyForOnboarding,
    "deposit paid enables onboarding (Sprint 10 deposit-start policy)",
  );
  assert(
    afterDeposit.overallLabel.toLowerCase().includes("ready for onboarding") ||
      afterDeposit.overallLabel.toLowerCase().includes("deposit paid"),
    "deposit paid overall label",
  );
}

{
  const paidInFull = derivePaymentState({
    agreement: baseAgreement(),
    payments: [
      payment({
        type: "DEPOSIT",
        status: "PAID",
        amountPaidCents: 102_500,
        paidAt: new Date(),
      }),
      payment({
        type: "BALANCE",
        status: "PAID",
        amountPaidCents: 102_500,
        paidAt: new Date(),
      }),
    ],
  });
  assert(paidInFull.derivedState === "PAID_IN_FULL", "paid in full");
  assert(paidInFull.readyForOnboarding, "ready for onboarding");
  assert(paidInFull.remainingCents === 0, "remaining 0");
}

{
  const fullPaid = derivePaymentState({
    agreement: baseAgreement({
      paymentTermType: "FULL_UPFRONT",
      depositCents: null,
      balanceCents: null,
    }),
    payments: [
      payment({
        type: "FULL",
        status: "PAID",
        amountDueCents: 205_000,
        amountPaidCents: 205_000,
        paidAt: new Date(),
      }),
    ],
  });
  assert(fullPaid.derivedState === "PAID_IN_FULL", "full upfront paid in full");
}

assert(paymentLineDisplayLabel("DUE") === "Due", "line label due");

// 34–38 no auto WON / no mutate commercial facts — source scans
{
  const webhookSrc = readFileSync(join(here, "webhook.ts"), "utf8");
  assert(!webhookSrc.includes('stage: "WON"'), "webhook does not set WON");
  assert(!webhookSrc.includes("commercialScope"), "webhook does not touch scope");
  assert(!webhookSrc.includes("commercialPricing"), "webhook does not touch pricing");
  assert(
    !webhookSrc.includes("commercialProposal.update") &&
      !webhookSrc.includes("commercialAgreement.update"),
    "webhook does not mutate agreement/proposal",
  );
}

{
  const createSrc = readFileSync(join(here, "create-checkout.ts"), "utf8");
  assert(
    createSrc.includes("commercialCheckoutIdempotencyKey"),
    "checkout uses idempotency key",
  );
  assert(
    createSrc.includes("price_data") ||
      readFileSync(join(here, "stripe-adapter.ts"), "utf8").includes("price_data"),
    "uses dynamic price_data",
  );
  assert(
    !createSrc.includes("acceptCommercialAgreement"),
    "checkout does not auto-accept",
  );
}

// 39–41 public agreement / return 0 Stripe; explicit checkout only
{
  const publicAgreement = readFileSync(
    join(repoRoot, "src/app/agreement/[token]/page.tsx"),
    "utf8",
  );
  assert(!publicAgreement.includes("getStripe("), "public agreement 0 Stripe");
  assert(
    publicAgreement.includes("No Stripe API calls") ||
      publicAgreement.includes("operator-created"),
    "documents no auto checkout on load",
  );
}

{
  const accept = readFileSync(
    join(repoRoot, "src/lib/commercialization/agreement/accept.ts"),
    "utf8",
  );
  assert(
    !accept.includes("createCommercialCheckout"),
    "acceptance does not auto-create checkout",
  );
}

// 42–43 analytics forbidden keys
for (const key of [
  "commercial_payment_id",
  "stripe_checkout_session_id",
  "stripe_payment_intent_id",
  "payment_link",
  "checkout_url",
  "payment_amount",
  "deposit_amount",
  "balance_amount",
  "payment_failure_message",
  "payment_metadata",
  "stripe_customer_id",
]) {
  assert(isForbiddenAnalyticsParamKey(key), `forbidden analytics ${key}`);
}

// 44 live stripe guard present
{
  const constants = readFileSync(join(here, "constants.ts"), "utf8");
  assert(constants.includes("sk_live_"), "refuses LIVE stripe in tests");
}

// 57–63 no subscriptions / invoices / tax / paid externals in module
{
  const paymentFiles = collectTsFiles(here);
  const joined = paymentFiles
    .filter((f) => !f.endsWith(".verify.ts"))
    .map((f) => readFileSync(f, "utf8"))
    .join("\n");
  assert(!joined.includes("subscriptions.create"), "no subscriptions");
  assert(!joined.includes("invoices.create"), "no invoices");
  assert(!joined.includes("automatic_tax: true"), "no auto tax enabled");
  assert(!joined.includes("openai"), "no openai");
  assert(!/from ["']openai["']/.test(joined), "no openai import");
}

// Form uses native submit for browser acceptance
{
  const form = readFileSync(
    join(
      repoRoot,
      "src/components/opportunities/agreement-acceptance-form.tsx",
    ),
    "utf8",
  );
  assert(form.includes('type="submit"'), "native submit for Playwright");
  assert(form.includes("acceptAgreementFormAction"), "form action wired");
}

// Migration present
{
  const migration = readFileSync(
    join(
      repoRoot,
      "prisma/migrations/20260823180000_add_commercial_payments/migration.sql",
    ),
    "utf8",
  );
  assert(migration.includes("CommercialPayment"), "migration has model");
  assert(
    migration.includes("CommercialPayment_agreementId_type_paid_key"),
    "paid uniqueness",
  );
  assert(
    migration.includes("CommercialPayment_agreementId_type_active_key"),
    "active uniqueness",
  );
}

console.log("commercial-payment.verify.ts PASS");
