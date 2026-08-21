"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";

import { createOpportunityAction } from "@/app/reports/opportunities/actions";
import { Button } from "@/components/ui";
import { getServiceCapabilityDisplayName } from "@/lib/commercialization/capabilities";
import type { ServiceCapabilityId } from "@/lib/commercialization/capabilities";

export interface ProspectOpportunityCardProps {
  campaignId: string;
  prospectId: string;
  active: {
    id: string;
    stageLabel: string;
    capabilities: ServiceCapabilityId[];
    nextAction: string | null;
    nextActionAtLabel: string | null;
    nextActionState: "none" | "overdue" | "upcoming";
    lastActivityLabel: string | null;
  } | null;
  latestTerminal: { id: string; stage: string } | null;
}

export function ProspectOpportunityCard({
  campaignId,
  prospectId,
  active,
  latestTerminal,
}: ProspectOpportunityCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function create() {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await createOpportunityAction(campaignId, prospectId);
      if (!result.success) {
        setError(result.message ?? "Could not create Opportunity.");
        if (result.opportunityId) {
          router.push(`/reports/opportunities/${result.opportunityId}`);
        }
        return;
      }
      setMessage(result.message ?? "Opportunity created.");
      if (result.opportunityId) {
        router.push(`/reports/opportunities/${result.opportunityId}`);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        An Opportunity is a human-created commercial pursuit. Creating one does
        not send email, call OpenAI, crawl the site, or change the
        Implementation Plan.
      </p>

      {active ? (
        <div className="space-y-3 rounded-xl border border-border/80 px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                Stage
              </p>
              <p className="font-medium text-ink">{active.stageLabel}</p>
            </div>
            <Button
              type="button"
              variant="outline"
              nativeButton={false}
              render={
                <Link href={`/reports/opportunities/${active.id}`} />
              }
            >
              View Opportunity
            </Button>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              Recommended capabilities
            </p>
            <p className="mt-1 text-sm text-ink/90">
              {active.capabilities.length > 0
                ? active.capabilities
                    .map((id) => getServiceCapabilityDisplayName(id))
                    .join(" · ")
                : "None snapshotted yet"}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              Next action
            </p>
            <p className="mt-1 text-sm text-ink/90">
              {active.nextAction ?? "Not set"}
              {active.nextActionAtLabel
                ? ` · ${active.nextActionAtLabel}`
                : ""}
              {active.nextActionState === "overdue" ? " · Overdue" : ""}
            </p>
          </div>

          {active.lastActivityLabel ? (
            <p className="text-xs text-muted">
              Last activity {active.lastActivityLabel}
            </p>
          ) : null}
        </div>
      ) : (
        <div className="space-y-3">
          {latestTerminal ? (
            <p className="text-sm text-muted">
              Latest Opportunity is {latestTerminal.stage}. You can create a new
              active Opportunity for another commercial pursuit.
            </p>
          ) : null}
          <Button type="button" onClick={create} disabled={isPending}>
            {isPending ? (
              <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
            ) : null}
            Create Opportunity
          </Button>
        </div>
      )}

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          {message}
        </p>
      ) : null}
    </div>
  );
}
