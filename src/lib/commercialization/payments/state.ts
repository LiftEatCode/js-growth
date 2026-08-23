import type {
  CommercialPaymentStatusValue,
  CommercialPaymentTypeValue,
  DerivedPaymentState,
} from "./constants";
import { derivedPaymentStateLabel } from "./constants";
import type {
  AcceptedAgreementPaymentAuthority,
  LoadedPaymentSummary,
  PaymentStateSnapshot,
} from "./types";

function latestOfType(
  payments: LoadedPaymentSummary[],
  type: CommercialPaymentTypeValue,
): LoadedPaymentSummary | null {
  const rows = payments
    .filter((p) => p.type === type)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  return rows[0] ?? null;
}

function paidOfType(
  payments: LoadedPaymentSummary[],
  type: CommercialPaymentTypeValue,
): LoadedPaymentSummary | null {
  return (
    payments.find((p) => p.type === type && p.status === "PAID") ?? null
  );
}

function activeCheckout(
  payment: LoadedPaymentSummary | null,
): payment is LoadedPaymentSummary & { checkoutUrl: string } {
  return (
    !!payment &&
    (payment.status === "PENDING" || payment.status === "CHECKOUT_CREATED") &&
    !!payment.checkoutUrl
  );
}

function mapLineStatus(
  payment: LoadedPaymentSummary | null,
  fallback: "DUE" | "PENDING" | "NOT_APPLICABLE",
): CommercialPaymentStatusValue | "DUE" | "PENDING" | "NOT_APPLICABLE" {
  if (!payment) {
    return fallback;
  }
  if (payment.status === "CHECKOUT_CREATED" || payment.status === "PENDING") {
    return payment.status;
  }
  return payment.status;
}

export function derivePaymentState(options: {
  agreement: AcceptedAgreementPaymentAuthority | null;
  payments: LoadedPaymentSummary[];
}): PaymentStateSnapshot {
  const empty: PaymentStateSnapshot = {
    derivedState: "NO_ACCEPTED_AGREEMENT",
    overallLabel: derivedPaymentStateLabel("NO_ACCEPTED_AGREEMENT"),
    readyForOnboarding: false,
    totalInvestmentCents: 0,
    totalPaidCents: 0,
    remainingCents: 0,
    deposit: {
      amountCents: null,
      status: "NOT_APPLICABLE",
      checkoutUrl: null,
      paymentId: null,
    },
    balance: {
      amountCents: null,
      status: "NOT_APPLICABLE",
      checkoutUrl: null,
      paymentId: null,
    },
    full: {
      amountCents: null,
      status: "NOT_APPLICABLE",
      checkoutUrl: null,
      paymentId: null,
    },
    canCreateDepositCheckout: false,
    canCreateBalanceCheckout: false,
    canCreateFullCheckout: false,
    canRegenerateActiveCheckout: false,
    activeCheckoutUrl: null,
    activePaymentId: null,
    activePaymentType: null,
  };

  const { agreement, payments } = options;
  if (!agreement || agreement.status !== "ACCEPTED") {
    return empty;
  }

  const totalPaidCents = payments
    .filter((p) => p.status === "PAID")
    .reduce((sum, p) => sum + p.amountPaidCents, 0);

  const hasRefundReview = payments.some(
    (p) => p.status === "REFUNDED" || p.reconciliationCode === "PAYMENT_REVIEW_REQUIRED",
  );
  const hasMismatch = payments.some(
    (p) =>
      p.reconciliationCode === "PAYMENT_AMOUNT_MISMATCH" ||
      p.reconciliationCode === "PAYMENT_CURRENCY_MISMATCH",
  );

  if (agreement.paymentTermType === "CUSTOM") {
    return {
      ...empty,
      derivedState: "CUSTOM_TERMS_MANUAL",
      overallLabel: derivedPaymentStateLabel("CUSTOM_TERMS_MANUAL"),
      totalInvestmentCents: agreement.totalInvestmentCents,
      totalPaidCents,
      remainingCents: Math.max(0, agreement.totalInvestmentCents - totalPaidCents),
    };
  }

  const depositPaid = paidOfType(payments, "DEPOSIT");
  const balancePaid = paidOfType(payments, "BALANCE");
  const fullPaid = paidOfType(payments, "FULL");
  const depositActive = latestOfType(payments, "DEPOSIT");
  const balanceActive = latestOfType(payments, "BALANCE");
  const fullActive = latestOfType(payments, "FULL");

  let derivedState: DerivedPaymentState = "AGREEMENT_ACCEPTED_PAYMENT_PENDING";

  if (hasRefundReview || hasMismatch) {
    derivedState = "PAYMENT_REVIEW_REQUIRED";
  } else if (agreement.paymentTermType === "FULL_UPFRONT") {
    if (fullPaid) {
      derivedState = "PAID_IN_FULL";
    } else if (
      fullActive?.status === "FAILED" ||
      fullActive?.status === "EXPIRED"
    ) {
      derivedState =
        fullActive.status === "FAILED" ? "PAYMENT_FAILED" : "PAYMENT_EXPIRED";
    } else if (activeCheckout(fullActive)) {
      derivedState = "FULL_CHECKOUT_CREATED";
    } else {
      derivedState = "FULL_DUE";
    }
  } else {
    // DEPOSIT_AND_BALANCE
    if (depositPaid && balancePaid) {
      derivedState = "PAID_IN_FULL";
    } else if (depositPaid && !balancePaid) {
      if (activeCheckout(balanceActive)) {
        derivedState = "BALANCE_CHECKOUT_CREATED";
      } else if (balanceActive?.status === "FAILED") {
        derivedState = "PAYMENT_FAILED";
      } else if (balanceActive?.status === "EXPIRED") {
        derivedState = "PAYMENT_EXPIRED";
      } else {
        derivedState = "DEPOSIT_PAID_BALANCE_PENDING";
      }
    } else if (activeCheckout(depositActive)) {
      derivedState = "DEPOSIT_CHECKOUT_CREATED";
    } else if (depositActive?.status === "FAILED") {
      derivedState = "PAYMENT_FAILED";
    } else if (depositActive?.status === "EXPIRED") {
      derivedState = "PAYMENT_EXPIRED";
    } else {
      derivedState = "DEPOSIT_DUE";
    }
  }

  const remainingCents = Math.max(
    0,
    agreement.totalInvestmentCents - totalPaidCents,
  );

  const canCreateDepositCheckout =
    agreement.paymentTermType === "DEPOSIT_AND_BALANCE" &&
    !depositPaid &&
    !activeCheckout(depositActive);

  const canCreateBalanceCheckout =
    agreement.paymentTermType === "DEPOSIT_AND_BALANCE" &&
    !!depositPaid &&
    !balancePaid &&
    !activeCheckout(balanceActive);

  const canCreateFullCheckout =
    agreement.paymentTermType === "FULL_UPFRONT" &&
    !fullPaid &&
    !activeCheckout(fullActive);

  const canRegenerateActiveCheckout =
    (!!depositActive &&
      (depositActive.status === "EXPIRED" ||
        depositActive.status === "FAILED" ||
        depositActive.status === "CANCELED") &&
      !depositPaid) ||
    (!!balanceActive &&
      (balanceActive.status === "EXPIRED" ||
        balanceActive.status === "FAILED" ||
        balanceActive.status === "CANCELED") &&
      !!depositPaid &&
      !balancePaid) ||
    (!!fullActive &&
      (fullActive.status === "EXPIRED" ||
        fullActive.status === "FAILED" ||
        fullActive.status === "CANCELED") &&
      !fullPaid);

  let activeCheckoutUrl: string | null = null;
  let activePaymentId: string | null = null;
  let activePaymentType: CommercialPaymentTypeValue | null = null;

  for (const candidate of [balanceActive, depositActive, fullActive]) {
    if (activeCheckout(candidate)) {
      activeCheckoutUrl = candidate.checkoutUrl;
      activePaymentId = candidate.id;
      activePaymentType = candidate.type;
      break;
    }
  }

  return {
    derivedState,
    overallLabel:
      derivedState === "PAID_IN_FULL"
        ? "Payment complete — ready for onboarding"
        : derivedState === "DEPOSIT_PAID_BALANCE_PENDING" ||
            derivedState === "BALANCE_CHECKOUT_CREATED"
          ? "Deposit paid — ready for onboarding"
          : derivedPaymentStateLabel(derivedState),
    // Sprint 10: deposit paid enables onboarding for DEPOSIT_AND_BALANCE.
    // Paid in full also qualifies. Balance may remain due before final handoff.
    readyForOnboarding:
      derivedState === "PAID_IN_FULL" ||
      derivedState === "DEPOSIT_PAID_BALANCE_PENDING" ||
      derivedState === "BALANCE_CHECKOUT_CREATED",
    totalInvestmentCents: agreement.totalInvestmentCents,
    totalPaidCents,
    remainingCents,
    deposit: {
      amountCents:
        agreement.paymentTermType === "DEPOSIT_AND_BALANCE"
          ? agreement.depositCents
          : null,
      status:
        agreement.paymentTermType === "DEPOSIT_AND_BALANCE"
          ? depositPaid
            ? "PAID"
            : mapLineStatus(depositActive, "DUE")
          : "NOT_APPLICABLE",
      checkoutUrl: activeCheckout(depositActive)
        ? depositActive.checkoutUrl
        : null,
      paymentId: depositPaid?.id ?? depositActive?.id ?? null,
    },
    balance: {
      amountCents:
        agreement.paymentTermType === "DEPOSIT_AND_BALANCE"
          ? agreement.balanceCents
          : null,
      status:
        agreement.paymentTermType === "DEPOSIT_AND_BALANCE"
          ? balancePaid
            ? "PAID"
            : depositPaid
              ? mapLineStatus(balanceActive, "DUE")
              : "PENDING"
          : "NOT_APPLICABLE",
      checkoutUrl: activeCheckout(balanceActive)
        ? balanceActive.checkoutUrl
        : null,
      paymentId: balancePaid?.id ?? balanceActive?.id ?? null,
    },
    full: {
      amountCents:
        agreement.paymentTermType === "FULL_UPFRONT"
          ? agreement.totalInvestmentCents
          : null,
      status:
        agreement.paymentTermType === "FULL_UPFRONT"
          ? fullPaid
            ? "PAID"
            : mapLineStatus(fullActive, "DUE")
          : "NOT_APPLICABLE",
      checkoutUrl: activeCheckout(fullActive) ? fullActive.checkoutUrl : null,
      paymentId: fullPaid?.id ?? fullActive?.id ?? null,
    },
    canCreateDepositCheckout,
    canCreateBalanceCheckout,
    canCreateFullCheckout,
    canRegenerateActiveCheckout,
    activeCheckoutUrl,
    activePaymentId,
    activePaymentType,
  };
}
