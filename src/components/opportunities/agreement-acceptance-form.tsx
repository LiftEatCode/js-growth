"use client";

import { useActionState } from "react";
import { LoaderCircle } from "lucide-react";

import {
  acceptAgreementFormAction,
  type AcceptAgreementActionResult,
} from "@/app/agreement/[token]/actions";

export interface AgreementAcceptanceFormProps {
  shareToken: string;
  acceptanceLanguage: string;
  alreadyAccepted: boolean;
  acceptedAtLabel?: string | null;
  signerName?: string | null;
  /** When accepted, optional Stripe Checkout URL created by an operator (no Stripe calls on load). */
  activeCheckoutUrl?: string | null;
  activeCheckoutLabel?: string | null;
  paymentOverallLabel?: string | null;
}

const initialState: AcceptAgreementActionResult = {
  success: false,
};

export function AgreementAcceptanceForm({
  shareToken,
  acceptanceLanguage,
  alreadyAccepted,
  acceptedAtLabel,
  signerName,
  activeCheckoutUrl = null,
  activeCheckoutLabel = null,
  paymentOverallLabel = null,
}: AgreementAcceptanceFormProps) {
  const [state, formAction, isPending] = useActionState(
    acceptAgreementFormAction,
    initialState,
  );

  const success = alreadyAccepted || state.success;

  if (success || alreadyAccepted) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-5 text-sm text-emerald-950">
          <p className="font-semibold">Agreement accepted.</p>
          <p className="mt-2">
            Thank you. JS Solutions will confirm the next steps and payment
            requirements with you.
          </p>
          {acceptedAtLabel ? (
            <p className="mt-2 text-emerald-900/80">
              Accepted {acceptedAtLabel}
              {signerName ? ` by ${signerName}` : ""}.
            </p>
          ) : null}
          {paymentOverallLabel ? (
            <p className="mt-3 font-medium">
              Payment status: {paymentOverallLabel}
            </p>
          ) : (
            <p className="mt-3 font-medium">Payment status: Pending</p>
          )}
        </div>

        {activeCheckoutUrl ? (
          <a
            href={activeCheckoutUrl}
            className="inline-flex w-full items-center justify-center rounded-lg bg-brand px-4 py-3 text-sm font-semibold text-white sm:w-auto"
          >
            {activeCheckoutLabel ?? "Complete Payment"}
          </a>
        ) : null}
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="shareToken" value={shareToken} />

      {state.message && !state.success ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
          {state.message}
        </p>
      ) : null}

      <label className="block space-y-1 text-sm">
        <span className="text-xs font-medium text-muted">Full name</span>
        <input
          name="signerName"
          required
          className="w-full rounded-lg border border-border bg-white px-3 py-2"
          autoComplete="name"
        />
      </label>

      <label className="block space-y-1 text-sm">
        <span className="text-xs font-medium text-muted">Email</span>
        <input
          name="signerEmail"
          type="email"
          required
          className="w-full rounded-lg border border-border bg-white px-3 py-2"
          autoComplete="email"
        />
      </label>

      <label className="block space-y-1 text-sm">
        <span className="text-xs font-medium text-muted">
          Title / role (optional)
        </span>
        <input
          name="signerTitle"
          className="w-full rounded-lg border border-border bg-white px-3 py-2"
          autoComplete="organization-title"
        />
      </label>

      <label className="flex items-start gap-3 text-sm text-ink/90">
        <input
          type="checkbox"
          name="acceptanceConfirmed"
          value="true"
          className="mt-1"
          required
        />
        <span>{acceptanceLanguage}</span>
      </label>

      {/*
        Native submit + HTML required checkbox (not React-disabled).
        Server still validates acceptanceConfirmed. Enables Playwright and
        progressive enhancement without fighting controlled checkbox state.
      */}
      <button
        type="submit"
        disabled={isPending}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60 sm:w-auto"
      >
        {isPending ? (
          <>
            <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
            Submitting…
          </>
        ) : (
          "Accept Agreement"
        )}
      </button>
    </form>
  );
}
