"use client";

import { useState, useTransition } from "react";
import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";

import {
  createBalanceCheckoutAction,
  createDepositCheckoutAction,
  createFullCheckoutAction,
  sendPaymentLinkAction,
} from "@/app/reports/opportunities/payment-actions";
import { Button } from "@/components/ui";
import { formatUsdCents } from "@/lib/commercialization/pricing/constants";
import { paymentLineDisplayLabel } from "@/lib/commercialization/payments/constants";
import type { PaymentStateSnapshot } from "@/lib/commercialization/payments/types";

export interface OpportunityPaymentCardProps {
  opportunityId: string;
  agreementId: string;
  paymentTermLabel: string;
  state: PaymentStateSnapshot;
  contactEmail: string | null;
  contactName: string | null;
}

export function OpportunityPaymentCard({
  opportunityId,
  agreementId,
  paymentTermLabel,
  state,
  contactEmail,
  contactName,
}: OpportunityPaymentCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(
    state.activeCheckoutUrl,
  );
  const [activePaymentId, setActivePaymentId] = useState<string | null>(
    state.activePaymentId,
  );
  const [copied, setCopied] = useState(false);

  function refresh() {
    router.refresh();
  }

  function runCreate(
    action: typeof createDepositCheckoutAction,
    regenerate = false,
  ) {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await action({
        opportunityId,
        agreementId,
        regenerate,
      });
      if (!result.success) {
        setError(result.message ?? "Could not create checkout.");
        return;
      }
      setCheckoutUrl(result.checkoutUrl ?? null);
      setActivePaymentId(result.paymentId ?? null);
      setMessage(result.message ?? "Checkout ready.");
      refresh();
    });
  }

  function copyLink() {
    if (!checkoutUrl) {
      return;
    }
    void navigator.clipboard.writeText(checkoutUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function sendLink() {
    if (!activePaymentId || !contactEmail) {
      setError("A recipient email is required to send the payment link.");
      return;
    }
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await sendPaymentLinkAction({
        opportunityId,
        paymentId: activePaymentId,
        recipientEmail: contactEmail,
        recipientName: contactName ?? undefined,
      });
      if (!result.success) {
        setError(result.message ?? "Could not send payment link.");
        return;
      }
      setMessage("Payment link sent (1 email).");
      refresh();
    });
  }

  return (
    <div className="space-y-4 text-sm">
      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-red-900">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-emerald-950">
          {message}
        </p>
      ) : null}

      <dl className="grid gap-2 sm:grid-cols-2">
        <div>
          <dt className="text-xs font-medium text-muted">Agreement</dt>
          <dd className="font-medium text-ink">Accepted</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-muted">Terms</dt>
          <dd className="font-medium text-ink">{paymentTermLabel}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-muted">Total</dt>
          <dd className="font-medium text-ink">
            {formatUsdCents(state.totalInvestmentCents)}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-muted">Overall</dt>
          <dd className="font-medium text-ink">{state.overallLabel}</dd>
        </div>
      </dl>

      {state.deposit.status !== "NOT_APPLICABLE" ? (
        <div className="rounded-lg border border-border px-3 py-3">
          <p className="text-xs font-medium text-muted">Deposit</p>
          <p className="mt-1 font-medium text-ink">
            {state.deposit.amountCents != null
              ? formatUsdCents(state.deposit.amountCents)
              : "—"}{" "}
            — {paymentLineDisplayLabel(state.deposit.status)}
          </p>
        </div>
      ) : null}

      {state.balance.status !== "NOT_APPLICABLE" ? (
        <div className="rounded-lg border border-border px-3 py-3">
          <p className="text-xs font-medium text-muted">Balance</p>
          <p className="mt-1 font-medium text-ink">
            {state.balance.amountCents != null
              ? formatUsdCents(state.balance.amountCents)
              : "—"}{" "}
            — {paymentLineDisplayLabel(state.balance.status)}
          </p>
        </div>
      ) : null}

      {state.full.status !== "NOT_APPLICABLE" ? (
        <div className="rounded-lg border border-border px-3 py-3">
          <p className="text-xs font-medium text-muted">Payment</p>
          <p className="mt-1 font-medium text-ink">
            {state.full.amountCents != null
              ? formatUsdCents(state.full.amountCents)
              : "—"}{" "}
            — {paymentLineDisplayLabel(state.full.status)}
          </p>
        </div>
      ) : null}

      {state.readyForOnboarding ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-emerald-950">
          {state.derivedState === "PAID_IN_FULL"
            ? "Payment complete — ready for onboarding."
            : "Deposit paid — ready for onboarding. Balance may remain due before final handoff."}{" "}
          Opportunity is not automatically marked Won.
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {state.canCreateDepositCheckout ||
        (state.canRegenerateActiveCheckout &&
          state.deposit.status !== "PAID" &&
          state.deposit.status !== "NOT_APPLICABLE") ? (
          <Button
            type="button"
            disabled={isPending}
            onClick={() =>
              runCreate(
                createDepositCheckoutAction,
                !state.canCreateDepositCheckout &&
                  state.canRegenerateActiveCheckout,
              )
            }
          >
            {isPending ? (
              <LoaderCircle className="size-4 animate-spin" aria-hidden />
            ) : null}
            {state.canCreateDepositCheckout
              ? "Create Deposit Checkout"
              : "Regenerate Deposit Checkout"}
          </Button>
        ) : null}

        {state.canCreateBalanceCheckout ||
        (state.canRegenerateActiveCheckout &&
          state.deposit.status === "PAID" &&
          state.balance.status !== "PAID" &&
          state.balance.status !== "NOT_APPLICABLE") ? (
          <Button
            type="button"
            disabled={isPending}
            onClick={() =>
              runCreate(
                createBalanceCheckoutAction,
                !state.canCreateBalanceCheckout &&
                  state.canRegenerateActiveCheckout,
              )
            }
          >
            Create Balance Checkout
          </Button>
        ) : null}

        {state.canCreateFullCheckout ||
        (state.canRegenerateActiveCheckout &&
          state.full.status !== "PAID" &&
          state.full.status !== "NOT_APPLICABLE") ? (
          <Button
            type="button"
            disabled={isPending}
            onClick={() =>
              runCreate(
                createFullCheckoutAction,
                !state.canCreateFullCheckout &&
                  state.canRegenerateActiveCheckout,
              )
            }
          >
            Create Full Payment Checkout
          </Button>
        ) : null}

        {checkoutUrl || state.activeCheckoutUrl ? (
          <>
            <Button type="button" variant="outline" onClick={copyLink}>
              {copied ? "Copied" : "Copy Payment Link"}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={isPending || !contactEmail}
              onClick={sendLink}
            >
              Send Payment Link
            </Button>
          </>
        ) : null}
      </div>

      <p className="text-xs text-muted">
        Stripe is the processor only. Amounts come from the accepted Agreement.
        Browser redirects never mark payment paid — webhooks do.
      </p>
    </div>
  );
}
