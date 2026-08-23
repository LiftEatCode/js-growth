"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";

import { convertToClientAction } from "@/app/reports/opportunities/onboarding-actions";
import { Button } from "@/components/ui";

export interface OpportunityOnboardingCardProps {
  opportunityId: string;
  eligible: boolean;
  eligibilityReason: string;
  paymentOverallLabel: string;
  depositPaid: boolean;
  balanceOutstandingCents: number;
  paidInFull: boolean;
  existingClient?: { id: string; name: string } | null;
  existingProject?: {
    id: string;
    name: string;
    statusLabel: string;
    clientId: string;
  } | null;
}

function formatUsd(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export function OpportunityOnboardingCard({
  opportunityId,
  eligible,
  eligibilityReason,
  paymentOverallLabel,
  depositPaid,
  balanceOutstandingCents,
  paidInFull,
  existingClient,
  existingProject,
}: OpportunityOnboardingCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function convert() {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await convertToClientAction({ opportunityId });
      if (!result.success) {
        setError(result.message ?? "Could not convert.");
        return;
      }
      setMessage(result.message ?? "Converted.");
      router.refresh();
    });
  }

  if (existingProject && existingClient) {
    return (
      <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">
            Client / Project
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Opportunity converted. Delivery engagement is active in onboarding.
          </p>
        </div>
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-slate-500">Client</dt>
            <dd className="font-medium text-slate-900">{existingClient.name}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Project</dt>
            <dd className="font-medium text-slate-900">{existingProject.name}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Status</dt>
            <dd className="font-medium text-slate-900">
              {existingProject.statusLabel}
            </dd>
          </div>
        </dl>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" nativeButton={false} render={<Link href={`/reports/clients/${existingClient.id}`} />}>
            View Client
          </Button>
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={
              <Link
                href={`/reports/clients/${existingProject.clientId}/projects/${existingProject.id}`}
              />
            }
          >
            View Project
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
      <div>
        <h2 className="text-sm font-semibold text-slate-900">
          Client / Project onboarding
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Payment creates eligibility. A human converts the Opportunity into a
          Client engagement.
        </p>
      </div>

      <dl className="grid gap-2 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-slate-500">Payment</dt>
          <dd className="text-right font-medium text-slate-900">
            {paymentOverallLabel}
          </dd>
        </div>
        {depositPaid && !paidInFull ? (
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Balance before handoff</dt>
            <dd className="text-right font-medium text-amber-800">
              {formatUsd(balanceOutstandingCents)}
            </dd>
          </div>
        ) : null}
        <div className="flex justify-between gap-4">
          <dt className="text-slate-500">Onboarding</dt>
          <dd
            className={`text-right font-medium ${eligible ? "text-emerald-800" : "text-slate-700"}`}
          >
            {eligible ? "Ready for onboarding" : "Not eligible"}
          </dd>
        </div>
      </dl>

      <p className="text-xs text-slate-500">{eligibilityReason}</p>

      {eligible ? (
        <Button
          type="button"
          size="sm"
          disabled={isPending}
          onClick={convert}
        >
          {isPending ? (
            <>
              <LoaderCircle className="size-4 animate-spin" />
              Converting…
            </>
          ) : (
            "Convert to Client / Start Onboarding"
          )}
        </Button>
      ) : null}

      {error ? (
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="text-sm text-emerald-800">{message}</p>
      ) : null}
    </div>
  );
}
