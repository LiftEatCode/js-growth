"use client";

import { Fragment, useState, useTransition } from "react";
import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";

import { generateCompetitiveComparison } from "@/app/reports/prospecting/competitive-comparison-actions";
import { Button } from "@/components/ui";
import {
  competitivePositionLabel,
  formatSignedGap,
  opportunityPriorityLabel,
} from "@/lib/competitive-intelligence/comparison/labels";
import type { CompetitiveComparison } from "@/lib/competitive-intelligence/comparison/types";

export interface CompetitiveComparisonPanelProps {
  campaignId: string;
  prospectId: string;
  snapshot: {
    id: string;
    createdAtLabel: string;
    comparison: CompetitiveComparison;
  } | null;
  stale: boolean;
  staleReasons: string[];
  canGenerate: boolean;
  generateBlocker: string | null;
  skippedCompetitors: Array<{
    prospectCompetitorId: string;
    businessName: string;
    reason: string;
  }>;
}

export function CompetitiveComparisonPanel({
  campaignId,
  prospectId,
  snapshot,
  stale,
  staleReasons,
  canGenerate,
  generateBlocker,
  skippedCompetitors,
}: CompetitiveComparisonPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const comparison = snapshot?.comparison ?? null;

  function runGenerate() {
    setError(null);
    setMessage(null);

    startTransition(async () => {
      const result = await generateCompetitiveComparison(campaignId, prospectId);

      if (!result.success) {
        setError(result.message ?? "Comparison could not be generated.");
        return;
      }

      setMessage(result.message ?? "Comparison generated.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          onClick={runGenerate}
          disabled={isPending || !canGenerate}
        >
          {isPending ? (
            <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
          ) : null}
          {snapshot ? "Rebuild Comparison" : "Generate Comparison"}
        </Button>
        {snapshot ? (
          <p className="text-sm text-muted">
            Snapshot {stale ? "Stale" : "Current"} · {snapshot.createdAtLabel}
          </p>
        ) : null}
      </div>

      <p className="text-sm text-muted">
        Deterministic comparison of this prospect&apos;s Website Growth Audit against
        selected competitors&apos; COMPLETED audits. No crawling, Places, OpenAI, or
        outreach. Rebuild creates a new historical snapshot.
      </p>

      {generateBlocker ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {generateBlocker}
        </p>
      ) : null}

      {stale && staleReasons.length > 0 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="font-semibold">This comparison is stale.</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {staleReasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {skippedCompetitors.length > 0 ? (
        <div className="rounded-xl border border-border px-4 py-3 text-sm text-muted">
          <p className="font-semibold text-brand">Selected competitors not compared</p>
          <ul className="mt-2 space-y-1">
            {skippedCompetitors.map((row) => (
              <li key={row.prospectCompetitorId}>
                {row.businessName}: {row.reason}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      {message ? <p className="text-sm text-brand">{message}</p> : null}

      {!comparison ? (
        <p className="text-sm text-muted">
          No comparison snapshot yet. Audit selected competitors, then generate a
          comparison.
        </p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-border px-4 py-3">
              <p className="text-xs uppercase tracking-[0.08em] text-muted">
                Your Website Growth Score
              </p>
              <p className="mt-1 text-2xl font-semibold text-brand">
                {comparison.overall.targetScore}
              </p>
            </div>
            <div className="rounded-xl border border-border px-4 py-3">
              <p className="text-xs uppercase tracking-[0.08em] text-muted">
                Competitor average
              </p>
              <p className="mt-1 text-2xl font-semibold text-brand">
                {comparison.overall.competitorAverage}
              </p>
              <p className="mt-1 text-xs text-muted">
                Based on {comparison.overall.competitorsCompared} audited competitor
                {comparison.overall.competitorsCompared === 1 ? "" : "s"}
              </p>
            </div>
            <div className="rounded-xl border border-border px-4 py-3">
              <p className="text-xs uppercase tracking-[0.08em] text-muted">
                Competitive gap
              </p>
              <p className="mt-1 text-2xl font-semibold text-brand">
                {formatSignedGap(comparison.overall.gapVsAverage)}
              </p>
              <p className="mt-1 text-xs text-muted">
                {competitivePositionLabel(comparison.overall.position)}
              </p>
            </div>
            <div className="rounded-xl border border-border px-4 py-3">
              <p className="text-xs uppercase tracking-[0.08em] text-muted">
                Market position
              </p>
              <p className="mt-1 text-2xl font-semibold text-brand">
                {comparison.overall.targetRank} of{" "}
                {comparison.overall.participantCount}
              </p>
              <p className="mt-1 text-xs text-muted">
                vs leader {formatSignedGap(comparison.overall.gapVsLeader)}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[40rem] text-left text-sm">
              <thead className="border-b border-border bg-slate-50 text-xs uppercase tracking-[0.08em] text-muted">
                <tr>
                  <th className="px-3 py-2 font-semibold">Category</th>
                  <th className="px-3 py-2 font-semibold">Your score</th>
                  <th className="px-3 py-2 font-semibold">Competitor avg</th>
                  <th className="px-3 py-2 font-semibold">Best</th>
                  <th className="px-3 py-2 font-semibold">Gap</th>
                  <th className="px-3 py-2 font-semibold">Rank</th>
                  <th className="px-3 py-2 font-semibold">Position</th>
                </tr>
              </thead>
              <tbody>
                {comparison.categories.map((row) => (
                  <Fragment key={row.category}>
                    <tr className="border-b border-border last:border-b-0">
                      <td className="px-3 py-3">
                        <button
                          type="button"
                          className="font-semibold text-brand underline-offset-2 hover:underline"
                          onClick={() =>
                            setExpandedCategory((current) =>
                              current === row.category ? null : row.category,
                            )
                          }
                        >
                          {row.label}
                        </button>
                      </td>
                      <td className="px-3 py-3">{row.targetScore}</td>
                      <td className="px-3 py-3">{row.competitorAverage}</td>
                      <td className="px-3 py-3">{row.competitorBest}</td>
                      <td className="px-3 py-3">
                        {formatSignedGap(row.gapVsAverage)}
                      </td>
                      <td className="px-3 py-3">
                        {row.targetRank}/{row.participantCount}
                      </td>
                      <td className="px-3 py-3">
                        {competitivePositionLabel(row.position)}
                      </td>
                    </tr>
                    {expandedCategory === row.category ? (
                      <tr className="bg-slate-50">
                        <td colSpan={7} className="px-3 py-3 text-xs text-muted">
                          <div className="flex flex-wrap gap-3">
                            {row.competitorBreakdown.map((competitor) => (
                              <span key={competitor.prospectCompetitorId}>
                                {competitor.businessName}: {competitor.score}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-border px-4 py-4">
              <h3 className="font-heading text-lg font-semibold text-brand">
                Biggest opportunities
              </h3>
              {comparison.opportunities.length === 0 ? (
                <p className="mt-3 text-sm text-muted">No prioritized gaps.</p>
              ) : (
                <ul className="mt-3 space-y-3">
                  {comparison.opportunities.map((row) => (
                    <li
                      key={row.id}
                      className="rounded-xl border border-border px-3 py-3"
                    >
                      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
                        {opportunityPriorityLabel(row.priority)}
                        {row.category ? ` · ${row.category}` : ""}
                      </p>
                      <p className="mt-1 font-semibold text-brand">{row.title}</p>
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-muted">
                        {row.evidence.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-xl border border-border px-4 py-4">
              <h3 className="font-heading text-lg font-semibold text-brand">
                Competitive advantages
              </h3>
              {comparison.advantages.length === 0 ? (
                <p className="mt-3 text-sm text-muted">No material advantages detected.</p>
              ) : (
                <ul className="mt-3 space-y-3">
                  {comparison.advantages.map((row) => (
                    <li
                      key={row.id}
                      className="rounded-xl border border-border px-3 py-3"
                    >
                      <p className="font-semibold text-brand">{row.title}</p>
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-muted">
                        {row.evidence.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-border px-4 py-4">
            <h3 className="font-heading text-lg font-semibold text-brand">
              Competitors included
            </h3>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              {comparison.competitorsCompared.map((row) => (
                <li key={row.prospectCompetitorId}>
                  <span className="font-semibold text-brand">{row.businessName}</span>
                  {" · "}Website Growth Score {row.websiteGrowthScore}
                  {" · "}Relevance {row.competitiveRelevanceScore}
                  {row.distanceMiles !== null
                    ? ` · ${row.distanceMiles} mi`
                    : ""}
                </li>
              ))}
            </ul>
            {comparison.notes.map((note) => (
              <p key={note} className="mt-3 text-xs text-muted">
                {note}
              </p>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
