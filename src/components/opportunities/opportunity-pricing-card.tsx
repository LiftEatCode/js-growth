"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";

import {
  createPricingAction,
  revisePricingAction,
} from "@/app/reports/opportunities/pricing-actions";
import { Button } from "@/components/ui";

export interface OpportunityPricingCardProps {
  opportunityId: string;
  hasApprovedScope: boolean;
  pricing: {
    id: string;
    statusLabel: string;
    status: string;
    revision: number;
    lineItemCount: number;
    finalTotalLabel: string;
    approvedAtLabel: string | null;
  } | null;
}

export function OpportunityPricingCard({
  opportunityId,
  hasApprovedScope,
  pricing,
}: OpportunityPricingCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function create() {
    setError(null);
    startTransition(async () => {
      const result = await createPricingAction(opportunityId);
      if (!result.success) {
        setError(result.message ?? "Could not create Pricing.");
        if (result.pricingId) {
          router.push(
            `/reports/opportunities/${opportunityId}/pricing/${result.pricingId}`,
          );
        }
        return;
      }
      if (result.pricingId) {
        router.push(
          `/reports/opportunities/${opportunityId}/pricing/${result.pricingId}`,
        );
      }
    });
  }

  function revise() {
    setError(null);
    startTransition(async () => {
      const result = await revisePricingAction(opportunityId);
      if (!result.success) {
        setError(result.message ?? "Could not revise Pricing.");
        return;
      }
      if (result.pricingId) {
        router.push(
          `/reports/opportunities/${opportunityId}/pricing/${result.pricingId}`,
        );
      }
    });
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        Pricing is a deterministic recommendation from the approved Scope, then
        human review. No proposals or payments in this step.
      </p>

      {pricing ? (
        <div className="space-y-3 rounded-xl border border-border/80 px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                {pricing.statusLabel} · Revision {pricing.revision}
              </p>
              <p className="mt-1 text-sm text-ink">
                {pricing.lineItemCount} work units · {pricing.finalTotalLabel}
              </p>
              {pricing.approvedAtLabel ? (
                <p className="mt-1 text-xs text-muted">
                  Approved {pricing.approvedAtLabel}
                </p>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                nativeButton={false}
                render={
                  <Link
                    href={`/reports/opportunities/${opportunityId}/pricing/${pricing.id}`}
                  />
                }
              >
                {pricing.status === "APPROVED" ? "View Pricing" : "Edit Pricing"}
              </Button>
              {pricing.status === "APPROVED" ? (
                <Button type="button" disabled={isPending} onClick={revise}>
                  {isPending ? (
                    <LoaderCircle
                      aria-hidden="true"
                      className="size-4 animate-spin"
                    />
                  ) : null}
                  Revise
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      ) : (
        <Button
          type="button"
          onClick={create}
          disabled={isPending || !hasApprovedScope}
        >
          {isPending ? (
            <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
          ) : null}
          Create Pricing
        </Button>
      )}

      {!hasApprovedScope && !pricing ? (
        <p className="text-xs text-muted">
          Approve a Commercial Scope before creating Pricing.
        </p>
      ) : null}

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
          {error}
        </p>
      ) : null}
    </div>
  );
}
