"use client";

import { useState, useTransition } from "react";
import { LoaderCircle } from "lucide-react";

import { acceptAgreementAction } from "@/app/agreement/[token]/actions";
import { Button } from "@/components/ui";

export interface AgreementAcceptanceFormProps {
  shareToken: string;
  acceptanceLanguage: string;
  alreadyAccepted: boolean;
  acceptedAtLabel?: string | null;
  signerName?: string | null;
}

export function AgreementAcceptanceForm({
  shareToken,
  acceptanceLanguage,
  alreadyAccepted,
  acceptedAtLabel,
  signerName,
}: AgreementAcceptanceFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(alreadyAccepted);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [title, setTitle] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  if (success || alreadyAccepted) {
    return (
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
      </div>
    );
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      const result = await acceptAgreementAction({
        shareToken,
        signerName: name,
        signerEmail: email,
        signerTitle: title || undefined,
        acceptanceConfirmed: confirmed,
      });
      if (!result.success) {
        setError(result.message ?? "Could not accept agreement.");
        return;
      }
      setSuccess(true);
    });
  }

  return (
    <div className="space-y-4">
      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
          {error}
        </p>
      ) : null}

      <label className="block space-y-1 text-sm">
        <span className="text-xs font-medium text-muted">Full name</span>
        <input
          className="w-full rounded-lg border border-border bg-white px-3 py-2"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
        />
      </label>

      <label className="block space-y-1 text-sm">
        <span className="text-xs font-medium text-muted">Email</span>
        <input
          type="email"
          className="w-full rounded-lg border border-border bg-white px-3 py-2"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />
      </label>

      <label className="block space-y-1 text-sm">
        <span className="text-xs font-medium text-muted">
          Title / role (optional)
        </span>
        <input
          className="w-full rounded-lg border border-border bg-white px-3 py-2"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoComplete="organization-title"
        />
      </label>

      <label className="flex items-start gap-3 text-sm text-ink/90">
        <input
          type="checkbox"
          className="mt-1"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
        />
        <span>{acceptanceLanguage}</span>
      </label>

      <Button
        type="button"
        disabled={isPending}
        onClick={submit}
        className="w-full sm:w-auto"
      >
        {isPending ? (
          <>
            <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
            Submitting…
          </>
        ) : (
          "Accept Agreement"
        )}
      </Button>
    </div>
  );
}
