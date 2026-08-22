"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";

import {
  createProposalAction,
  reviseProposalAction,
} from "@/app/reports/opportunities/proposal-actions";
import { Button } from "@/components/ui";

export interface OpportunityProposalCardProps {
  opportunityId: string;
  canCreate: boolean;
  blockedReason: string | null;
  proposal: {
    id: string;
    statusLabel: string;
    status: string;
    revision: number;
    title: string;
    totalInvestmentLabel: string;
    approvedAtLabel: string | null;
    stale: boolean;
  } | null;
}

export function OpportunityProposalCard({
  opportunityId,
  canCreate,
  blockedReason,
  proposal,
}: OpportunityProposalCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function create() {
    setError(null);
    startTransition(async () => {
      const result = await createProposalAction(opportunityId);
      if (!result.success) {
        setError(result.message ?? "Could not create Proposal.");
        if (result.proposalId) {
          router.push(
            `/reports/opportunities/${opportunityId}/proposal/${result.proposalId}`,
          );
        }
        return;
      }
      if (result.proposalId) {
        router.push(
          `/reports/opportunities/${opportunityId}/proposal/${result.proposalId}`,
        );
      }
    });
  }

  function revise() {
    setError(null);
    startTransition(async () => {
      const result = await reviseProposalAction(opportunityId);
      if (!result.success) {
        setError(result.message ?? "Could not revise Proposal.");
        return;
      }
      if (result.proposalId) {
        router.push(
          `/reports/opportunities/${opportunityId}/proposal/${result.proposalId}`,
        );
      }
    });
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        Proposal presents approved Scope and Pricing as a client-readable
        commercial offer. It does not change Scope or Pricing.
      </p>

      {proposal ? (
        <div className="space-y-3 rounded-xl border border-border/80 px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                {proposal.statusLabel} · Revision {proposal.revision}
                {proposal.stale ? " · Stale" : " · Current"}
              </p>
              <p className="mt-1 text-sm text-ink">{proposal.title}</p>
              <p className="mt-1 text-sm text-ink">
                Base investment {proposal.totalInvestmentLabel}
              </p>
              {proposal.approvedAtLabel ? (
                <p className="mt-1 text-xs text-muted">
                  Approved {proposal.approvedAtLabel}
                </p>
              ) : null}
              {proposal.stale ? (
                <p className="mt-1 text-xs text-amber-800">
                  Newer commercial inputs exist. Historical proposal is
                  unchanged — revise to snapshot current approved Scope and
                  Pricing.
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
                    href={`/reports/opportunities/${opportunityId}/proposal/${proposal.id}`}
                  />
                }
              >
                {proposal.status === "APPROVED"
                  ? "View Proposal"
                  : "Edit Proposal"}
              </Button>
              <Button
                type="button"
                variant="outline"
                nativeButton={false}
                render={
                  <Link
                    href={`/reports/opportunities/${opportunityId}/proposal/${proposal.id}?preview=1`}
                  />
                }
              >
                Preview
              </Button>
              {proposal.status === "APPROVED" ? (
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
        <>
          <Button
            type="button"
            onClick={create}
            disabled={isPending || !canCreate}
          >
            {isPending ? (
              <LoaderCircle
                aria-hidden="true"
                className="size-4 animate-spin"
              />
            ) : null}
            Create Proposal
          </Button>
          {blockedReason ? (
            <p className="text-xs text-muted">{blockedReason}</p>
          ) : null}
        </>
      )}

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
          {error}
        </p>
      ) : null}
    </div>
  );
}
