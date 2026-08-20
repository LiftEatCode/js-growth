"use client";

import { useState, useTransition } from "react";
import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";

import { generateCompetitiveAiInterpretation } from "@/app/reports/prospecting/competitive-interpretation-actions";
import { Button } from "@/components/ui";
import type { CompetitiveComparison } from "@/lib/competitive-intelligence/comparison/types";
import { resolveCompetitiveSourceEvidence } from "@/lib/competitive-intelligence/interpretation/evidence";
import type { CompetitiveInterpretationContent } from "@/lib/competitive-intelligence/interpretation/types";

export interface CompetitiveInterpretationPanelProps {
  campaignId: string;
  prospectId: string;
  comparisonSnapshotId: string | null;
  comparison: CompetitiveComparison | null;
  interpretation: {
    id: string;
    createdAtLabel: string;
    content: CompetitiveInterpretationContent;
  } | null;
  stale: boolean;
  staleReasons: string[];
  canGenerate: boolean;
  generateBlocker: string | null;
  latestFailureMessage: string | null;
  reusableExists: boolean;
}

function EvidenceBlock({
  comparison,
  sourceKey,
}: {
  comparison: CompetitiveComparison;
  sourceKey: string;
}) {
  const evidence = resolveCompetitiveSourceEvidence(comparison, sourceKey);

  if (evidence.lines.length === 0) {
    return null;
  }

  return (
    <div className="mt-2 rounded-lg border border-border/70 bg-surface/40 px-3 py-2 text-xs text-muted">
      <p className="font-medium text-brand">{evidence.title}</p>
      <ul className="mt-1 space-y-0.5">
        {evidence.lines.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </div>
  );
}

export function CompetitiveInterpretationPanel({
  campaignId,
  prospectId,
  comparisonSnapshotId,
  comparison,
  interpretation,
  stale,
  staleReasons,
  canGenerate,
  generateBlocker,
  latestFailureMessage,
  reusableExists,
}: CompetitiveInterpretationPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function runGenerate(force: boolean) {
    setError(null);
    setMessage(null);

    startTransition(async () => {
      const result = await generateCompetitiveAiInterpretation(
        campaignId,
        prospectId,
        {
          force,
          comparisonSnapshotId: comparisonSnapshotId ?? undefined,
        },
      );

      if (!result.success) {
        setError(result.message ?? "Interpretation could not be generated.");
        return;
      }

      setMessage(result.message ?? "Interpretation ready.");
      router.refresh();
    });
  }

  const content = interpretation?.content ?? null;
  const hasInterpretation = Boolean(content);

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
            ? "Regenerate Interpretation"
            : "Generate AI Interpretation"}
        </Button>
        {interpretation ? (
          <p className="text-sm text-muted">
            Interpretation {stale ? "Stale" : "Current"} ·{" "}
            {interpretation.createdAtLabel}
          </p>
        ) : null}
      </div>

      <p className="text-sm text-muted">
        AI explanation of the deterministic competitive comparison. Numbers always
        come from Sprint 11. Generation is explicit — page refresh never calls
        OpenAI. Regenerate creates a new historical row.
      </p>

      {generateBlocker ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {generateBlocker}
        </p>
      ) : null}

      {stale && staleReasons.length > 0 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="font-medium">Interpretation is stale</p>
          <ul className="mt-1 list-disc pl-5">
            {staleReasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
          <p className="mt-2">
            Generate a new interpretation when ready. Prior completed
            interpretations are preserved.
          </p>
        </div>
      ) : null}

      {reusableExists && !hasInterpretation ? (
        <p className="text-sm text-muted">
          A matching completed interpretation already exists for this comparison and
          will be reused unless you regenerate.
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

      {content && comparison ? (
        <div className="space-y-6">
          <section className="space-y-2">
            <h3 className="font-heading text-lg font-semibold text-brand">
              Competitive outlook
            </h3>
            <p className="text-base font-medium text-ink">
              {content.executiveSummary.headline}
            </p>
            <p className="text-sm leading-relaxed text-ink/90">
              {content.executiveSummary.summary}
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="font-heading text-lg font-semibold text-brand">
              What stands out
            </h3>
            <p className="text-sm font-medium text-ink">
              {content.competitivePosition.assessment}
            </p>
            <p className="text-sm leading-relaxed text-ink/90">
              {content.competitivePosition.explanation}
            </p>
            <EvidenceBlock comparison={comparison} sourceKey="overall" />
          </section>

          <section className="space-y-3">
            <h3 className="font-heading text-lg font-semibold text-brand">
              Biggest competitive risks
            </h3>
            {content.risks.map((risk) => (
              <div
                key={`${risk.sourceKey}:${risk.title}`}
                className="rounded-xl border border-border/80 px-4 py-3"
              >
                <p className="font-medium text-ink">{risk.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-ink/90">
                  {risk.explanation}
                </p>
                <EvidenceBlock
                  comparison={comparison}
                  sourceKey={risk.sourceKey}
                />
              </div>
            ))}
          </section>

          <section className="space-y-3">
            <h3 className="font-heading text-lg font-semibold text-brand">
              Competitive advantages
            </h3>
            {content.advantages.map((advantage) => (
              <div
                key={`${advantage.sourceKey}:${advantage.title}`}
                className="rounded-xl border border-border/80 px-4 py-3"
              >
                <p className="font-medium text-ink">{advantage.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-ink/90">
                  {advantage.explanation}
                </p>
                <EvidenceBlock
                  comparison={comparison}
                  sourceKey={advantage.sourceKey}
                />
              </div>
            ))}
          </section>

          <section className="space-y-3">
            <h3 className="font-heading text-lg font-semibold text-brand">
              Recommended priorities
            </h3>
            <ol className="list-decimal space-y-3 pl-5">
              {content.priorities.map((priority) => (
                <li key={`${priority.sourceKey}:${priority.title}`}>
                  <p className="font-medium text-ink">{priority.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-ink/90">
                    {priority.rationale}
                  </p>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted">
                    {priority.recommendedActions.map((action) => (
                      <li key={action}>{action}</li>
                    ))}
                  </ul>
                  <EvidenceBlock
                    comparison={comparison}
                    sourceKey={priority.sourceKey}
                  />
                  {(priority.supportingSourceKeys ?? []).map((key) => (
                    <EvidenceBlock
                      key={key}
                      comparison={comparison}
                      sourceKey={key}
                    />
                  ))}
                </li>
              ))}
            </ol>
          </section>

          <section className="space-y-3">
            <h3 className="font-heading text-lg font-semibold text-brand">
              90-day direction
            </h3>
            <p className="text-xs text-muted">
              Directional guidance only — not a guaranteed timeline, cost estimate, or
              results promise.
            </p>
            {content.ninetyDayPlan.map((phase) => (
              <div
                key={phase.phase}
                className="rounded-xl border border-border/80 px-4 py-3"
              >
                <p className="font-medium text-ink">{phase.phase}</p>
                <p className="mt-1 text-sm text-ink/90">{phase.objective}</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted">
                  {phase.actions.map((action) => (
                    <li key={action}>{action}</li>
                  ))}
                </ul>
              </div>
            ))}
          </section>

          {content.internalTalkingPoints.length > 0 ? (
            <section className="space-y-2 rounded-xl border border-dashed border-border px-4 py-3">
              <h3 className="font-heading text-base font-semibold text-brand">
                Internal talking points
              </h3>
              <p className="text-xs text-muted">
                Internal only — not for client-facing surfaces.
              </p>
              <ul className="list-disc space-y-1 pl-5 text-sm text-ink/90">
                {content.internalTalkingPoints.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </section>
          ) : null}

          <p className="text-xs leading-relaxed text-muted">
            This interpretation explains a deterministic comparison of website audit
            data from the selected competitors. It does not measure business quality,
            revenue, traffic, market share, or actual search rankings.
          </p>
        </div>
      ) : null}
    </div>
  );
}
