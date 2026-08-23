import type { AgreementPaymentTermType } from "@/lib/commercialization/agreement/constants";
import type { DerivedPaymentState } from "@/lib/commercialization/payments/constants";
import { derivePaymentState } from "@/lib/commercialization/payments/state";
import type {
  AcceptedAgreementPaymentAuthority,
  LoadedPaymentSummary,
} from "@/lib/commercialization/payments/types";

import type { OnboardingEligibilityResult } from "./types";

/**
 * Pure deterministic onboarding eligibility.
 *
 * DEPOSIT_AND_BALANCE: deposit PAID enables start (balance may remain due).
 * FULL_UPFRONT: FULL PAID required.
 * CUSTOM: blocked unless operator override (handled by caller).
 */
export function getOnboardingEligibility(options: {
  agreement: AcceptedAgreementPaymentAuthority | null;
  payments: LoadedPaymentSummary[];
}): OnboardingEligibilityResult {
  if (!options.agreement || options.agreement.status !== "ACCEPTED") {
    return {
      ok: true,
      eligible: false,
      paymentState: "NO_ACCEPTED_AGREEMENT",
      depositPaid: false,
      balanceOutstandingCents: 0,
      paidInFull: false,
      reason: "An accepted Agreement is required before onboarding.",
      code: "AGREEMENT_NOT_ACCEPTED",
    };
  }

  const agreement = options.agreement;
  const state = derivePaymentState({
    agreement,
    payments: options.payments,
  });

  if (
    state.derivedState === "PAYMENT_REVIEW_REQUIRED" ||
    options.payments.some(
      (p) =>
        p.reconciliationCode === "PAYMENT_AMOUNT_MISMATCH" ||
        p.reconciliationCode === "PAYMENT_CURRENCY_MISMATCH" ||
        p.reconciliationCode === "PAYMENT_REVIEW_REQUIRED",
    )
  ) {
    return {
      ok: true,
      eligible: false,
      paymentState: state.derivedState,
      depositPaid: state.deposit.status === "PAID",
      balanceOutstandingCents:
        state.balance.status === "PAID" ? 0 : state.balance.amountCents ?? 0,
      paidInFull: state.derivedState === "PAID_IN_FULL",
      reason: "Payment requires reconciliation review before onboarding.",
      code: "PAYMENT_REVIEW_REQUIRED",
    };
  }

  const term = agreement.paymentTermType as AgreementPaymentTermType;

  if (term === "CUSTOM") {
    return {
      ok: true,
      eligible: false,
      paymentState: "CUSTOM_BLOCKED",
      depositPaid: false,
      balanceOutstandingCents: agreement.totalInvestmentCents,
      paidInFull: false,
      reason:
        "Custom payment terms are ambiguous for automatic onboarding. Use a structured term type or a future override workflow.",
      code: "CUSTOM_AMBIGUOUS",
    };
  }

  if (term === "FULL_UPFRONT") {
    const paidInFull = state.derivedState === "PAID_IN_FULL";
    if (!paidInFull) {
      return {
        ok: true,
        eligible: false,
        paymentState: state.derivedState,
        depositPaid: false,
        balanceOutstandingCents: state.remainingCents,
        paidInFull: false,
        reason: "Full upfront payment must be PAID before onboarding.",
        code: "FULL_UNPAID",
      };
    }
    return {
      ok: true,
      eligible: true,
      paymentState: state.derivedState,
      depositPaid: true,
      balanceOutstandingCents: 0,
      paidInFull: true,
      reason: "Full payment received — eligible for onboarding.",
    };
  }

  // DEPOSIT_AND_BALANCE — deposit paid enables onboarding; balance may remain.
  const depositPaid = state.deposit.status === "PAID";
  const balanceOutstandingCents =
    state.balance.status === "PAID" ? 0 : state.balance.amountCents ?? 0;
  const paidInFull = state.derivedState === "PAID_IN_FULL";

  if (!depositPaid) {
    return {
      ok: true,
      eligible: false,
      paymentState: state.derivedState,
      depositPaid: false,
      balanceOutstandingCents: balanceOutstandingCents || state.remainingCents,
      paidInFull: false,
      reason: "Deposit must be PAID before onboarding can start.",
      code: "DEPOSIT_UNPAID",
    };
  }

  return {
    ok: true,
    eligible: true,
    paymentState: state.derivedState as DerivedPaymentState,
    depositPaid: true,
    balanceOutstandingCents,
    paidInFull,
    reason: paidInFull
      ? "Paid in full — eligible for onboarding."
      : "Deposit paid — eligible to start onboarding. Balance remains due before final handoff.",
  };
}
