import type { Metadata } from "next";

import { Container } from "@/components/ui";
import { formatUsdCents } from "@/lib/commercialization/pricing/constants";
import {
  derivePaymentState,
  loadPaymentsForAgreement,
  loadAcceptedAgreementPaymentAuthority,
} from "@/lib/commercialization/payments";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Payment confirmation",
    description: "Payment status for your implementation agreement.",
    robots: {
      index: false,
      follow: false,
    },
  };
}

interface PaymentReturnPageProps {
  searchParams: Promise<{
    status?: string;
    session_id?: string;
  }>;
}

/**
 * Success/cancel redirect is NOT payment authority.
 * This page only displays DB-reconciled state when available.
 * Never marks PAID from the browser redirect.
 */
export default async function PaymentReturnPage({
  searchParams,
}: PaymentReturnPageProps) {
  const params = await searchParams;
  const status = params.status?.trim().toLowerCase() ?? "";
  const sessionId = params.session_id?.trim() || null;

  // Intentionally do not call Stripe APIs here.
  let depositPaidLabel: string | null = null;
  let balanceRemainingLabel: string | null = null;
  let paidInFull = false;
  let confirmationPending = status === "success";

  if (sessionId) {
    const payment = await prisma.commercialPayment.findUnique({
      where: { stripeCheckoutSessionId: sessionId },
      select: {
        agreementId: true,
        status: true,
        type: true,
        amountPaidCents: true,
      },
    });

    if (payment) {
      const agreement = await loadAcceptedAgreementPaymentAuthority({
        agreementId: payment.agreementId,
      });
      const payments = await loadPaymentsForAgreement({
        agreementId: payment.agreementId,
      });
      const state = derivePaymentState({ agreement, payments });

      if (payment.status === "PAID") {
        confirmationPending = false;
        if (payment.type === "DEPOSIT") {
          depositPaidLabel = formatUsdCents(payment.amountPaidCents);
          balanceRemainingLabel =
            state.balance.amountCents != null
              ? formatUsdCents(state.balance.amountCents)
              : null;
        }
        if (state.derivedState === "PAID_IN_FULL") {
          paidInFull = true;
        }
      }
    }
  }

  const cancelled = status === "cancelled" || status === "canceled";

  return (
    <main className="min-h-screen bg-white py-16">
      <Container>
        <div className="mx-auto max-w-lg space-y-4 text-center">
          <p className="text-sm font-medium tracking-wide text-muted">
            JS Solutions
          </p>
          {cancelled ? (
            <>
              <h1 className="font-heading text-2xl font-semibold text-ink">
                Payment was not completed
              </h1>
              <p className="text-sm text-muted">
                No charge was recorded from this visit. You can return to your
                payment link when you are ready.
              </p>
            </>
          ) : confirmationPending ? (
            <>
              <h1 className="font-heading text-2xl font-semibold text-ink">
                Payment received — confirmation pending
              </h1>
              <p className="text-sm text-muted">
                We are confirming your payment. This page does not finalize
                payment status on its own.
              </p>
            </>
          ) : paidInFull ? (
            <>
              <h1 className="font-heading text-2xl font-semibold text-ink">
                Payment received
              </h1>
              <p className="text-sm text-muted">
                Paid in full. JS Solutions will confirm project next steps.
              </p>
            </>
          ) : depositPaidLabel ? (
            <>
              <h1 className="font-heading text-2xl font-semibold text-ink">
                Deposit received
              </h1>
              <p className="text-lg font-medium text-ink">{depositPaidLabel}</p>
              {balanceRemainingLabel ? (
                <p className="text-sm text-muted">
                  Remaining balance: {balanceRemainingLabel}
                </p>
              ) : null}
              <p className="text-sm text-muted">
                JS Solutions will confirm project next steps.
              </p>
            </>
          ) : (
            <>
              <h1 className="font-heading text-2xl font-semibold text-ink">
                Payment status
              </h1>
              <p className="text-sm text-muted">
                If you completed checkout, confirmation may take a moment.
              </p>
            </>
          )}
        </div>
      </Container>
    </main>
  );
}
