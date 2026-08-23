import type { InspectableCheckoutSession } from "@/lib/payments/checkout-session";

import type { CommercialPaymentTypeValue } from "./constants";
import { COMMERCIAL_AGREEMENT_PAYMENT_PRODUCT_KEY } from "./constants";

export type CommercialAmountReconcileResult =
  | { ok: true; amountPaidCents: number; currency: string }
  | {
      ok: false;
      code: "PAYMENT_AMOUNT_MISMATCH" | "PAYMENT_CURRENCY_MISMATCH" | "MISSING_AMOUNT";
      message: string;
      actualAmountCents: number | null;
      actualCurrency: string | null;
    };

export function reconcileCommercialCheckoutAmount(options: {
  session: Pick<InspectableCheckoutSession, "amount_total" | "currency">;
  expectedAmountCents: number;
  expectedCurrency: string;
}): CommercialAmountReconcileResult {
  const actualAmountCents =
    typeof options.session.amount_total === "number"
      ? options.session.amount_total
      : null;
  const actualCurrency = options.session.currency?.toUpperCase() ?? null;
  const expectedCurrency = options.expectedCurrency.toUpperCase();

  if (actualAmountCents === null) {
    return {
      ok: false,
      code: "MISSING_AMOUNT",
      message: "Stripe session is missing amount_total.",
      actualAmountCents: null,
      actualCurrency,
    };
  }

  if (actualCurrency !== expectedCurrency) {
    return {
      ok: false,
      code: "PAYMENT_CURRENCY_MISMATCH",
      message: `Currency mismatch: expected ${expectedCurrency}, got ${actualCurrency}.`,
      actualAmountCents,
      actualCurrency,
    };
  }

  if (actualAmountCents !== options.expectedAmountCents) {
    return {
      ok: false,
      code: "PAYMENT_AMOUNT_MISMATCH",
      message: `Amount mismatch: expected ${options.expectedAmountCents}, got ${actualAmountCents}.`,
      actualAmountCents,
      actualCurrency,
    };
  }

  return {
    ok: true,
    amountPaidCents: actualAmountCents,
    currency: expectedCurrency,
  };
}

export function isCommercialAgreementPaymentSession(
  session: Pick<InspectableCheckoutSession, "metadata">,
): boolean {
  return (
    session.metadata?.product === COMMERCIAL_AGREEMENT_PAYMENT_PRODUCT_KEY
  );
}

export function readCommercialPaymentMetadata(
  session: Pick<InspectableCheckoutSession, "metadata">,
): {
  commercialPaymentId: string | null;
  agreementId: string | null;
  opportunityId: string | null;
  paymentType: CommercialPaymentTypeValue | null;
} {
  const meta = session.metadata ?? {};
  const paymentType = meta.paymentType?.trim() as
    | CommercialPaymentTypeValue
    | undefined;

  return {
    commercialPaymentId: meta.commercialPaymentId?.trim() || null,
    agreementId: meta.agreementId?.trim() || null,
    opportunityId: meta.opportunityId?.trim() || null,
    paymentType:
      paymentType === "DEPOSIT" ||
      paymentType === "BALANCE" ||
      paymentType === "FULL"
        ? paymentType
        : null,
  };
}
