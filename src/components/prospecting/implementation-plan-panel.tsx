"use client";

import { useState, useTransition } from "react";
import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";

import {
  approveImplementationPlanAction,
  generateImplementationPlanAction,
  removeImplementationWorkstreamAction,
  reorderImplementationWorkstreamAction,
  saveImplementationPlanNotesAction,
  setImplementationWorkstreamPriorityAction,
} from "@/app/reports/prospecting/implementation-plan-actions";
import { Button } from "@/components/ui";
import { getServiceCapabilityDisplayName } from "@/lib/commercialization/capabilities";
import type { ServiceCapabilityId } from "@/lib/commercialization/capabilities";
import type { ImplementationPriority } from "@/lib/commercialization/implementation-plan/types";
import type { PlanEvidenceItem } from "@/lib/commercialization/implementation-plan/types";
import type { PreservationConstraint } from "@/lib/commercialization/implementation-plan/types";
import type { RecommendedAction } from "@/lib/commercialization/implementation-plan/types";
import type { WorkstreamType } from "@/lib/commercialization/implementation-plan/constants";

export interface ImplementationPlanPanelProps {
  campaignId: string;
  prospectId: string;
  plan: {
    id: string;
    status: "DRAFT" | "REVIEWED" | "APPROVED" | "SUPERSEDED";
    createdAtLabel: string;
    competitiveEvidenceUsed: boolean;
    approvedAtLabel: string | null;
    approvedByEmail: string | null;
    operatorNotes: string | null;
    workstreams: Array<{
      id: string;
      workstreamType: WorkstreamType;
      priority: ImplementationPriority;
      priorityScore: number;
      title: string;
      summary: string;
      sortOrder: number;
      removed: boolean;
      capabilities: ServiceCapabilityId[];
      evidence: PlanEvidenceItem[];
      actions: RecommendedAction[];
      preservationConstraints: PreservationConstraint[];
    }>;
  } | null;
  stale: boolean;
  staleReasons: string[];
  canGenerate: boolean;
  generateBlocker: string | null;
}

const PRIORITIES: ImplementationPriority[] = [
  "CRITICAL",
  "HIGH",
  "MEDIUM",
  "LOW",
];

function formatEvidenceLine(item: PlanEvidenceItem): string {
  if (item.type === "COMPETITIVE_CATEGORY_GAP") {
    return `${item.title} · target ${item.targetScorePercent ?? "—"} · avg ${item.competitorAverage ?? "—"} · gap ${item.gapVsAverage ?? "—"}`;
  }
  if (item.type === "AUDIT_CATEGORY") {
    return item.title;
  }
  return `${item.sourceKey}: ${item.title}`;
}

export function ImplementationPlanPanel({
  campaignId,
  prospectId,
  plan,
  stale,
  staleReasons,
  canGenerate,
  generateBlocker,
}: ImplementationPlanPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [notes, setNotes] = useState(plan?.operatorNotes ?? "");

  function run(action: () => Promise<{ success: boolean; message?: string }>) {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await action();
      if (!result.success) {
        setError(result.message ?? "Action failed.");
        return;
      }
      setMessage(result.message ?? "Done.");
      router.refresh();
    });
  }

  const activeWorkstreams =
    plan?.workstreams.filter((row) => !row.removed) ?? [];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          onClick={() =>
            run(() => generateImplementationPlanAction(campaignId, prospectId))
          }
          disabled={isPending || !canGenerate}
        >
          {isPending ? (
            <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
          ) : null}
          {plan ? "Rebuild Implementation Plan" : "Generate Implementation Plan"}
        </Button>
        {plan ? (
          <p className="text-sm text-muted">
            {plan.status}
            {stale ? " · Stale" : " · Current"} · {plan.createdAtLabel}
            {plan.competitiveEvidenceUsed
              ? " · Includes competitive evidence"
              : " · Audit-only evidence"}
          </p>
        ) : null}
      </div>

      <p className="text-sm text-muted">
        Deterministic recommendations from Website Growth Audit facts
        {plan?.competitiveEvidenceUsed
          ? " and current competitive comparison"
          : ""}
        . No OpenAI, Places, crawl, pricing, or proposals. Rebuild creates a new
        historical snapshot.
      </p>

      {generateBlocker ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {generateBlocker}
        </p>
      ) : null}

      {stale && staleReasons.length > 0 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="font-medium">Plan is stale</p>
          <ul className="mt-1 list-disc pl-5">
            {staleReasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="text-sm text-brand">{message}</p>
      ) : null}

      {!plan ? null : (
        <>
          <div className="space-y-4">
            <h3 className="font-heading text-lg font-semibold text-brand">
              Recommended workstreams
            </h3>
            {activeWorkstreams.length === 0 ? (
              <p className="text-sm text-muted">
                No active workstreams. Rebuild or restore by generating a new plan.
              </p>
            ) : (
              activeWorkstreams.map((row) => (
                <div
                  key={row.id}
                  className="rounded-xl border border-border bg-surface px-4 py-4 space-y-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-brand">
                        {row.sortOrder}. {row.title}{" "}
                        <span className="text-sm font-normal text-muted">
                          {row.priority}
                        </span>
                      </p>
                      <p className="mt-1 text-sm text-muted">{row.summary}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isPending}
                        onClick={() =>
                          run(() =>
                            reorderImplementationWorkstreamAction(
                              campaignId,
                              prospectId,
                              plan.id,
                              row.id,
                              "up",
                            ),
                          )
                        }
                      >
                        Move up
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isPending}
                        onClick={() =>
                          run(() =>
                            reorderImplementationWorkstreamAction(
                              campaignId,
                              prospectId,
                              plan.id,
                              row.id,
                              "down",
                            ),
                          )
                        }
                      >
                        Move down
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isPending}
                        onClick={() =>
                          run(() =>
                            removeImplementationWorkstreamAction(
                              campaignId,
                              prospectId,
                              plan.id,
                              row.id,
                            ),
                          )
                        }
                      >
                        Remove
                      </Button>
                    </div>
                  </div>

                  <label className="block text-sm text-muted">
                    Priority
                    <select
                      className="mt-1 block w-full max-w-xs rounded-lg border border-border bg-background px-3 py-2 text-sm"
                      value={row.priority}
                      disabled={isPending}
                      onChange={(event) =>
                        run(() =>
                          setImplementationWorkstreamPriorityAction(
                            campaignId,
                            prospectId,
                            plan.id,
                            row.id,
                            event.target.value as ImplementationPriority,
                          ),
                        )
                      }
                    >
                      {PRIORITIES.map((priority) => (
                        <option key={priority} value={priority}>
                          {priority}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                      Evidence
                    </p>
                    <ul className="mt-1 list-disc pl-5 text-sm text-foreground">
                      {row.evidence
                        .filter((item) => item.type !== "COMPETITIVE_ADVANTAGE")
                        .slice(0, 8)
                        .map((item) => (
                          <li key={item.sourceKey}>
                            {formatEvidenceLine(item)}
                          </li>
                        ))}
                    </ul>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                      JS Solutions capabilities
                    </p>
                    <p className="mt-1 text-sm">
                      {row.capabilities
                        .map((id) => getServiceCapabilityDisplayName(id))
                        .join(" · ")}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                      Recommended actions
                    </p>
                    <ul className="mt-1 list-disc pl-5 text-sm">
                      {row.actions.map((action) => (
                        <li key={action.id}>{action.label}</li>
                      ))}
                    </ul>
                  </div>

                  {row.preservationConstraints.length > 0 ? (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                        Preservation / maintenance
                      </p>
                      <ul className="mt-1 space-y-2 text-sm">
                        {row.preservationConstraints.map((constraint) => (
                          <li key={constraint.id}>
                            <p>{constraint.statement}</p>
                            {constraint.maintenanceActions &&
                            constraint.maintenanceActions.length > 0 ? (
                              <ul className="mt-1 list-disc pl-5 text-muted">
                                {constraint.maintenanceActions.map((action) => (
                                  <li key={action.id}>{action.label}</li>
                                ))}
                              </ul>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              ))
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-brand">
              Operator notes
              <textarea
                className="mt-1 block w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                rows={3}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                maxLength={4000}
              />
            </label>
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() =>
                run(() =>
                  saveImplementationPlanNotesAction(
                    campaignId,
                    prospectId,
                    plan.id,
                    notes,
                  ),
                )
              }
            >
              Save notes
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              disabled={isPending || plan.status === "APPROVED"}
              onClick={() =>
                run(() =>
                  approveImplementationPlanAction(
                    campaignId,
                    prospectId,
                    plan.id,
                  ),
                )
              }
            >
              Approve plan
            </Button>
            {plan.status === "APPROVED" && plan.approvedAtLabel ? (
              <p className="text-sm text-muted">
                Approved {plan.approvedAtLabel}
                {plan.approvedByEmail ? ` by ${plan.approvedByEmail}` : ""}
              </p>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}
