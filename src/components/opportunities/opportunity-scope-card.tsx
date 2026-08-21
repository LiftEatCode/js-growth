"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";

import {
  createScopeAction,
  reviseScopeAction,
} from "@/app/reports/opportunities/scope-actions";
import { Button } from "@/components/ui";

export interface OpportunityScopeCardProps {
  opportunityId: string;
  scope: {
    id: string;
    statusLabel: string;
    status: string;
    revision: number;
    sectionCount: number;
    deliverableCount: number;
    approvedAtLabel: string | null;
  } | null;
}

export function OpportunityScopeCard({
  opportunityId,
  scope,
}: OpportunityScopeCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function create() {
    setError(null);
    startTransition(async () => {
      const result = await createScopeAction(opportunityId);
      if (!result.success) {
        setError(result.message ?? "Could not create Scope.");
        if (result.scopeId) {
          router.push(
            `/reports/opportunities/${opportunityId}/scope/${result.scopeId}`,
          );
        }
        return;
      }
      if (result.scopeId) {
        router.push(
          `/reports/opportunities/${opportunityId}/scope/${result.scopeId}`,
        );
      }
    });
  }

  function revise() {
    setError(null);
    startTransition(async () => {
      const result = await reviseScopeAction(opportunityId);
      if (!result.success) {
        setError(result.message ?? "Could not revise Scope.");
        return;
      }
      if (result.scopeId) {
        router.push(
          `/reports/opportunities/${opportunityId}/scope/${result.scopeId}`,
        );
      }
    });
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        Scope is the commercial offer definition. The Implementation Plan remains
        the recommendation. No pricing or proposal in this step.
      </p>

      {scope ? (
        <div className="space-y-3 rounded-xl border border-border/80 px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                {scope.statusLabel} · Revision {scope.revision}
              </p>
              <p className="mt-1 text-sm text-ink">
                {scope.sectionCount} sections · {scope.deliverableCount}{" "}
                deliverables
              </p>
              {scope.approvedAtLabel ? (
                <p className="mt-1 text-xs text-muted">
                  Approved {scope.approvedAtLabel}
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
                    href={`/reports/opportunities/${opportunityId}/scope/${scope.id}`}
                  />
                }
              >
                {scope.status === "APPROVED" ? "View Scope" : "Edit Scope"}
              </Button>
              {scope.status === "APPROVED" ? (
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
        <Button type="button" onClick={create} disabled={isPending}>
          {isPending ? (
            <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
          ) : null}
          Create Scope
        </Button>
      )}

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
          {error}
        </p>
      ) : null}
    </div>
  );
}
