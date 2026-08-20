"use client";

import { useState, useTransition } from "react";
import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";

import { generateImplementationAiStrategy } from "@/app/reports/prospecting/implementation-interpretation-actions";
import { Button } from "@/components/ui";
import { getServiceCapabilityDisplayName } from "@/lib/commercialization/capabilities";
import type { ServiceCapabilityId } from "@/lib/commercialization/capabilities";
import type { WorkstreamType } from "@/lib/commercialization/implementation-plan/constants";
import type {
  ImplementationPriority,
  PlanEvidenceItem,
  PreservationConstraint,
  RecommendedAction,
} from "@/lib/commercialization/implementation-plan/types";
import {
  actionSourceKey,
  preservationSourceKey,
  workstreamSourceKey,
} from "@/lib/commercialization/implementation-interpretation/source-keys";
import type { ImplementationInterpretationContent } from "@/lib/commercialization/implementation-interpretation/types";

export interface ImplementationStrategyPanelProps {
  campaignId: string;
  prospectId: string;
  implementationPlanId: string | null;
  plan: {
    workstreams: Array<{
      workstreamType: WorkstreamType;
      priority: ImplementationPriority;
      title: string;
      capabilities: ServiceCapabilityId[];
      evidence: PlanEvidenceItem[];
      actions: RecommendedAction[];
      preservationConstraints: PreservationConstraint[];
      removed: boolean;
    }>;
  } | null;
  interpretation: {
    id: string;
    createdAtLabel: string;
    content: ImplementationInterpretationContent;
  } | null;
  stale: boolean;
  staleReasons: string[];
  canGenerate: boolean;
  generateBlocker: string | null;
  latestFailureMessage: string | null;
  reusableExists: boolean;
}

function formatEvidenceLine(item: PlanEvidenceItem): string {
  if (item.type === "COMPETITIVE_CATEGORY_GAP") {
    return `${item.title} · target ${item.targetScorePercent ?? "—"} · avg ${item.competitorAverage ?? "—"} · gap ${item.gapVsAverage ?? "—"}`;
  }
  if (item.type === "AUDIT_CATEGORY") {
    return item.title;
  }
  return `${item.title}`;
}

export function ImplementationStrategyPanel({
  campaignId,
  prospectId,
  implementationPlanId,
  plan,
  interpretation,
  stale,
  staleReasons,
  canGenerate,
  generateBlocker,
  latestFailureMessage,
  reusableExists,
}: ImplementationStrategyPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function runGenerate(force: boolean) {
    setError(null);
    setMessage(null);

    startTransition(async () => {
      const result = await generateImplementationAiStrategy(
        campaignId,
        prospectId,
        {
          force,
          implementationPlanId: implementationPlanId ?? undefined,
        },
      );

      if (!result.success) {
        setError(result.message ?? "AI strategy could not be generated.");
        return;
      }

      setMessage(result.message ?? "AI strategy ready.");
      router.refresh();
    });
  }

  const content = interpretation?.content ?? null;
  const hasInterpretation = Boolean(content);
  const activeWorkstreams =
    plan?.workstreams.filter((row) => !row.removed) ?? [];

  const aiByWorkstream = new Map(
    content?.workstreams.map((ws) => [ws.sourceKey, ws]) ?? [],
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          onClick={() => runGenerate(hasInterpretation)}
          disabled={isPending || !canGenerate}
        >
          {isPending ? (
            <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
          ) : null}
          {hasInterpretation
            ? "Regenerate AI Strategy"
            : "Generate AI Strategy"}
        </Button>
        {interpretation ? (
          <p className="text-sm text-muted">
            AI Strategy {stale ? "Stale" : "Current"} ·{" "}
            {interpretation.createdAtLabel}
          </p>
        ) : null}
      </div>

      <p className="text-sm text-muted">
        AI explains the deterministic Implementation Plan. Priorities,
        capabilities, actions, and evidence always come from the plan — not the
        model. Page refresh never calls OpenAI. Regenerate creates a new
        historical row.
      </p>

      {generateBlocker ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {generateBlocker}
        </p>
      ) : null}

      {stale && staleReasons.length > 0 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="font-medium">AI strategy is stale</p>
          <ul className="mt-1 list-disc pl-5">
            {staleReasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
          <p className="mt-2">
            Regenerate when ready. Prior completed strategies are preserved.
            AI generation does not approve the Implementation Plan.
          </p>
        </div>
      ) : null}

      {reusableExists && !hasInterpretation ? (
        <p className="text-sm text-muted">
          A matching completed strategy already exists for this plan and will be
          reused unless you regenerate.
        </p>
      ) : null}

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

      {latestFailureMessage && !content ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
          Latest generation failed: {latestFailureMessage}
        </p>
      ) : null}

      {content ? (
        <div className="space-y-6">
          <section className="space-y-2">
            <h3 className="font-heading text-lg font-semibold text-brand">
              Implementation outlook
            </h3>
            <p className="text-base font-medium text-ink">
              {content.executiveStrategy.headline}
            </p>
            <p className="text-sm leading-relaxed text-ink/90">
              {content.executiveStrategy.summary}
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="font-heading text-lg font-semibold text-brand">
              How the work fits together
            </h3>
            <p className="text-sm leading-relaxed text-ink/90">
              {content.implementationApproach.explanation}
            </p>
          </section>

          <section className="space-y-4">
            <h3 className="font-heading text-lg font-semibold text-brand">
              Workstream explanations
            </h3>
            {activeWorkstreams.map((ws) => {
              const sourceKey = workstreamSourceKey(ws.workstreamType);
              const ai = aiByWorkstream.get(sourceKey);
              return (
                <div
                  key={ws.workstreamType}
                  className="space-y-3 rounded-xl border border-border/80 px-4 py-3"
                >
                  <div className="flex flex-wrap items-baseline gap-2">
                    <p className="font-medium text-ink">
                      {ai?.clientTitle ?? ws.title}
                    </p>
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted">
                      {ws.priority}
                    </span>
                  </div>
                  <p className="text-xs text-muted">
                    Capabilities:{" "}
                    {ws.capabilities
                      .map((cap) => getServiceCapabilityDisplayName(cap))
                      .join(" · ")}
                  </p>

                  {ws.evidence.length > 0 ? (
                    <div>
                      <p className="text-xs font-medium text-brand">
                        Deterministic evidence
                      </p>
                      <ul className="mt-1 list-disc space-y-0.5 pl-5 text-xs text-muted">
                        {ws.evidence.map((item) => (
                          <li key={`${item.type}:${item.sourceKey}`}>
                            {formatEvidenceLine(item)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {ai ? (
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-brand">
                        AI explanation
                      </p>
                      <p className="text-sm leading-relaxed text-ink/90">
                        {ai.explanation}
                      </p>
                      <p className="text-sm leading-relaxed text-ink/90">
                        {ai.businessRationale}
                      </p>
                    </div>
                  ) : null}

                  {ws.actions.length > 0 ? (
                    <div>
                      <p className="text-xs font-medium text-brand">
                        Recommended actions
                      </p>
                      <ul className="mt-1 space-y-2">
                        {ws.actions.map((action) => {
                          const actionKey = actionSourceKey(
                            ws.workstreamType,
                            action.id,
                          );
                          const actionAi = ai?.actionExplanations.find(
                            (row) => row.sourceKey === actionKey,
                          );
                          return (
                            <li key={action.id} className="text-sm text-ink/90">
                              <span>{action.label}</span>
                              {actionAi ? (
                                <p className="mt-0.5 text-xs text-muted">
                                  AI context: {actionAi.explanation}
                                </p>
                              ) : null}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ) : null}

                  {ws.preservationConstraints.length > 0 ? (
                    <div>
                      <p className="text-xs font-medium text-brand">
                        Preservation
                      </p>
                      <ul className="mt-1 space-y-2">
                        {ws.preservationConstraints.map((constraint) => {
                          const pKey = preservationSourceKey(
                            constraint.category,
                          );
                          const note = ai?.preservationNotes.find(
                            (row) => row.sourceKey === pKey,
                          );
                          return (
                            <li
                              key={constraint.category}
                              className="text-sm text-ink/90"
                            >
                              <span>{constraint.statement}</span>
                              {note ? (
                                <p className="mt-0.5 text-xs text-muted">
                                  AI explanation: {note.explanation}
                                </p>
                              ) : null}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </section>

          <section className="space-y-3">
            <h3 className="font-heading text-lg font-semibold text-brand">
              Recommended sequencing
            </h3>
            <p className="text-xs text-muted">
              Implementation sequencing only — not a contractual schedule,
              hours estimate, or guaranteed timeline.
            </p>
            {content.sequencing.map((phase) => (
              <div
                key={`${phase.phase}:${phase.objective}`}
                className="rounded-xl border border-border/80 px-4 py-3"
              >
                <p className="font-medium text-ink">{phase.phase}</p>
                <p className="mt-1 text-sm text-ink/90">{phase.objective}</p>
                <p className="mt-2 text-sm leading-relaxed text-ink/90">
                  {phase.explanation}
                </p>
              </div>
            ))}
          </section>

          {content.implementationConsiderations.length > 0 ? (
            <section className="space-y-3">
              <h3 className="font-heading text-lg font-semibold text-brand">
                Implementation considerations
              </h3>
              {content.implementationConsiderations.map((item) => (
                <div
                  key={`${item.title}:${item.explanation.slice(0, 40)}`}
                  className="rounded-xl border border-border/80 px-4 py-3"
                >
                  <p className="font-medium text-ink">{item.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-ink/90">
                    {item.explanation}
                  </p>
                </div>
              ))}
            </section>
          ) : null}

          {content.internalTalkingPoints.length > 0 ? (
            <section className="space-y-2 rounded-xl border border-dashed border-border px-4 py-3">
              <h3 className="font-heading text-base font-semibold text-brand">
                Internal talking points
              </h3>
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">
                Internal only
              </p>
              <p className="text-xs text-muted">
                Not for client-facing surfaces.
              </p>
              <ul className="list-disc space-y-1 pl-5 text-sm text-ink/90">
                {content.internalTalkingPoints.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </section>
          ) : null}

          <p className="text-xs leading-relaxed text-muted">
            This strategy explains a deterministic Implementation Plan. It does
            not change priorities, capabilities, or recommended actions, and it
            is not a proposal, price quote, or outcome guarantee.
          </p>
        </div>
      ) : null}
    </div>
  );
}
