"use client";

import { useState, useTransition } from "react";
import { LoaderCircle, Search } from "lucide-react";
import { useRouter } from "next/navigation";

import {
  rejectProspectCompetitor,
  setProspectCompetitorSelection,
  startProspectCompetitorDiscovery,
} from "@/app/reports/prospecting/competitor-actions";
import { Button } from "@/components/ui";
import {
  competitorDistanceLabel,
  competitorMatchSummary,
  competitorStatusLabel,
  competitorValidationLabelText,
} from "@/lib/competitive-intelligence/labels";
import type {
  CompetitorStatusValue,
  CompetitorValidationLabel,
  GeographyMode,
} from "@/lib/competitive-intelligence/types";

export interface CompetitiveLandscapeRow {
  id: string;
  businessName: string;
  website: string | null;
  city: string | null;
  state: string | null;
  distanceMiles: number | null;
  verticals: string[];
  validationScore: number;
  validationLabel: CompetitorValidationLabel;
  status: CompetitorStatusValue;
  isRecommended: boolean;
  matchedVerticals: string[];
  geographyMode: GeographyMode;
  geographyBand: string;
  hasWebsite: boolean;
  rejectionReasons: string[];
}

interface CompetitiveLandscapePanelProps {
  campaignId: string;
  prospectId: string;
  rows: CompetitiveLandscapeRow[];
}

export function CompetitiveLandscapePanel({
  campaignId,
  prospectId,
  rows,
}: CompetitiveLandscapePanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function run(action: () => Promise<{ success: boolean; message?: string }>) {
    setError(null);
    setMessage(null);

    startTransition(async () => {
      const result = await action();

      if (!result.success) {
        setError(result.message ?? "The competitor action could not be completed.");
        return;
      }

      setMessage(result.message ?? "Updated.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          onClick={() =>
            run(() =>
              startProspectCompetitorDiscovery(campaignId, prospectId, false),
            )
          }
          disabled={isPending}
        >
          {isPending ? (
            <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
          ) : (
            <Search aria-hidden="true" className="size-4" />
          )}
          Discover Competitors
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            run(() =>
              startProspectCompetitorDiscovery(campaignId, prospectId, true),
            )
          }
          disabled={isPending}
        >
          Re-run Discovery
        </Button>
      </div>
      <p className="text-sm text-muted">
        Google Places candidates are validated deterministically. Select up to 3
        competitors. This does not audit competitor websites or create outreach.
      </p>
      {error ? (
        <p className="text-sm text-red-700">{error}</p>
      ) : null}
      {message ? (
        <p className="text-sm text-brand">{message}</p>
      ) : null}
      {rows.length === 0 ? (
        <p className="text-sm text-muted">
          No competitor candidates yet. Run discovery to populate this list.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[48rem] text-left text-sm">
            <thead className="border-b border-border bg-slate-50 text-xs uppercase tracking-[0.08em] text-muted">
              <tr>
                <th className="px-3 py-2 font-semibold">Business</th>
                <th className="px-3 py-2 font-semibold">Location</th>
                <th className="px-3 py-2 font-semibold">Distance</th>
                <th className="px-3 py-2 font-semibold">Verticals</th>
                <th className="px-3 py-2 font-semibold">Score</th>
                <th className="px-3 py-2 font-semibold">Why</th>
                <th className="px-3 py-2 font-semibold">Status</th>
                <th className="px-3 py-2 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-border last:border-b-0">
                  <td className="px-3 py-3">
                    <p className="font-semibold text-brand">{row.businessName}</p>
                    {row.website ? (
                      <p className="mt-1 break-all text-xs text-muted">
                        {row.website}
                      </p>
                    ) : (
                      <p className="mt-1 text-xs text-muted">No public website</p>
                    )}
                    {row.isRecommended ? (
                      <p className="mt-1 text-xs text-brand-blue">Recommended</p>
                    ) : null}
                  </td>
                  <td className="px-3 py-3 text-muted">
                    {[row.city, row.state].filter(Boolean).join(", ") || "—"}
                  </td>
                  <td className="px-3 py-3 text-muted">
                    {competitorDistanceLabel({
                      distanceMiles: row.distanceMiles,
                      geographyMode: row.geographyMode,
                      geographyBand: row.geographyBand,
                    })}
                  </td>
                  <td className="px-3 py-3 text-muted">
                    {row.verticals.join(", ") || "—"}
                  </td>
                  <td className="px-3 py-3">
                    {row.validationScore} ·{" "}
                    {competitorValidationLabelText(row.validationLabel)}
                  </td>
                  <td className="px-3 py-3 text-xs text-muted">
                    {competitorMatchSummary({
                      matchedVerticals: row.matchedVerticals,
                      geographyMode: row.geographyMode,
                      distanceMiles: row.distanceMiles,
                      hasWebsite: row.hasWebsite,
                      rejectionReasons: row.rejectionReasons,
                    })}
                  </td>
                  <td className="px-3 py-3">
                    {competitorStatusLabel(row.status)}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-2">
                      {row.status === "SELECTED" ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={isPending}
                          onClick={() =>
                            run(() =>
                              setProspectCompetitorSelection(
                                campaignId,
                                prospectId,
                                row.id,
                                false,
                              ),
                            )
                          }
                        >
                          Remove
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          size="sm"
                          disabled={isPending || row.validationLabel === "REJECTED"}
                          onClick={() =>
                            run(() =>
                              setProspectCompetitorSelection(
                                campaignId,
                                prospectId,
                                row.id,
                                true,
                              ),
                            )
                          }
                        >
                          Select
                        </Button>
                      )}
                      {row.status !== "REJECTED" ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={isPending}
                          onClick={() =>
                            run(() =>
                              rejectProspectCompetitor(
                                campaignId,
                                prospectId,
                                row.id,
                              ),
                            )
                          }
                        >
                          Reject
                        </Button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
