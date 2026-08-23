export const COMMERCIAL_PAYMENT_VERSION = 1;

/** Stripe metadata product key — distinct from Professional Audit. */
export const COMMERCIAL_AGREEMENT_PAYMENT_PRODUCT_KEY =
  "commercial-agreement-payment" as const;

export const COMMERCIAL_PAYMENT_TYPES = ["DEPOSIT", "BALANCE", "FULL"] as const;
export type CommercialPaymentTypeValue =
  (typeof COMMERCIAL_PAYMENT_TYPES)[number];

export const COMMERCIAL_PAYMENT_STATUSES = [
  "PENDING",
  "CHECKOUT_CREATED",
  "PAID",
  "FAILED",
  "EXPIRED",
  "REFUNDED",
  "CANCELED",
] as const;
export type CommercialPaymentStatusValue =
  (typeof COMMERCIAL_PAYMENT_STATUSES)[number];

export const COMMERCIAL_PAYMENT_CURRENCY_V1 = "USD" as const;

export const ACTIVE_CHECKOUT_STATUSES = [
  "PENDING",
  "CHECKOUT_CREATED",
] as const satisfies readonly CommercialPaymentStatusValue[];

export const TERMINAL_PAYMENT_STATUSES = [
  "PAID",
  "REFUNDED",
  "CANCELED",
] as const satisfies readonly CommercialPaymentStatusValue[];

export type DerivedPaymentState =
  | "NO_ACCEPTED_AGREEMENT"
  | "CUSTOM_TERMS_MANUAL"
  | "AGREEMENT_ACCEPTED_PAYMENT_PENDING"
  | "DEPOSIT_DUE"
  | "DEPOSIT_CHECKOUT_CREATED"
  | "DEPOSIT_PAID_BALANCE_PENDING"
  | "BALANCE_DUE"
  | "BALANCE_CHECKOUT_CREATED"
  | "PAID_IN_FULL"
  | "PAYMENT_FAILED"
  | "PAYMENT_EXPIRED"
  | "PAYMENT_REVIEW_REQUIRED"
  | "FULL_DUE"
  | "FULL_CHECKOUT_CREATED";

export function commercialPaymentTypeLabel(
  type: CommercialPaymentTypeValue,
): string {
  switch (type) {
    case "DEPOSIT":
      return "Deposit";
    case "BALANCE":
      return "Balance";
    case "FULL":
      return "Full payment";
    default: {
      const _exhaustive: never = type;
      return _exhaustive;
    }
  }
}

export function commercialPaymentStatusLabel(
  status: CommercialPaymentStatusValue,
): string {
  switch (status) {
    case "PENDING":
      return "Pending";
    case "CHECKOUT_CREATED":
      return "Checkout created";
    case "PAID":
      return "Paid";
    case "FAILED":
      return "Failed";
    case "EXPIRED":
      return "Expired";
    case "REFUNDED":
      return "Refunded";
    case "CANCELED":
      return "Canceled";
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

export function derivedPaymentStateLabel(state: DerivedPaymentState): string {
  switch (state) {
    case "NO_ACCEPTED_AGREEMENT":
      return "No accepted agreement";
    case "CUSTOM_TERMS_MANUAL":
      return "Custom terms — manual handling";
    case "AGREEMENT_ACCEPTED_PAYMENT_PENDING":
      return "Payment pending";
    case "DEPOSIT_DUE":
      return "Deposit due";
    case "DEPOSIT_CHECKOUT_CREATED":
      return "Deposit checkout created";
    case "DEPOSIT_PAID_BALANCE_PENDING":
      return "Deposit paid — balance pending";
    case "BALANCE_DUE":
      return "Balance due";
    case "BALANCE_CHECKOUT_CREATED":
      return "Balance checkout created";
    case "PAID_IN_FULL":
      return "Paid in full";
    case "PAYMENT_FAILED":
      return "Payment failed";
    case "PAYMENT_EXPIRED":
      return "Payment expired";
    case "PAYMENT_REVIEW_REQUIRED":
      return "Payment review required";
    case "FULL_DUE":
      return "Payment due";
    case "FULL_CHECKOUT_CREATED":
      return "Checkout created";
    default: {
      const _exhaustive: never = state;
      return _exhaustive;
    }
  }
}

export function paymentLineDisplayLabel(
  status: CommercialPaymentStatusValue | "DUE" | "PENDING" | "NOT_APPLICABLE",
): string {
  if (status === "DUE") return "Due";
  if (status === "PENDING") return "Pending";
  if (status === "NOT_APPLICABLE") return "—";
  return commercialPaymentStatusLabel(status);
}

export function commercialCheckoutIdempotencyKey(paymentId: string): string {
  return `commercial-payment-checkout:${paymentId}`;
}

export function assertNotLiveStripeInAutomatedTest(): void {
  if (process.env.COMMERCIAL_TEST_MOCK_STRIPE === "1") {
    return;
  }

  const isAutomated =
    process.env.COMMERCIAL_TEST_MOCK_EXTERNALS === "1" ||
    process.env.PLAYWRIGHT_TEST === "1" ||
    process.env.CI === "true" ||
    process.env.NODE_ENV === "test";

  if (!isAutomated) {
    return;
  }

  const secret = process.env.STRIPE_SECRET_KEY?.trim() ?? "";
  if (secret.startsWith("sk_live_")) {
    throw new Error(
      "Refusing commercial payment Stripe call: LIVE secret key detected during automated test. Use TEST keys or COMMERCIAL_TEST_MOCK_STRIPE=1.",
    );
  }
}

export function isCommercialStripeMockEnabled(): boolean {
  return process.env.COMMERCIAL_TEST_MOCK_STRIPE === "1";
}
