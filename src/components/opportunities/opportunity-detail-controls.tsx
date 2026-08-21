"use client";

import { useState, useTransition } from "react";
import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";

import {
  addOpportunityNoteAction,
  changeOpportunityStageAction,
  refreshOpportunityCapabilitiesAction,
  saveOpportunityNextActionAction,
} from "@/app/reports/opportunities/actions";
import { Button } from "@/components/ui";
import {
  OPPORTUNITY_LOST_REASONS,
  OPPORTUNITY_STAGES,
  opportunityLostReasonLabel,
  opportunityStageLabel,
  type OpportunityLostReason,
  type OpportunityStage,
} from "@/lib/commercialization/opportunities/constants";

export interface OpportunityDetailControlsProps {
  opportunityId: string;
  stage: OpportunityStage;
  nextAction: string | null;
  nextActionAtIso: string | null;
}

export function OpportunityDetailControls({
  opportunityId,
  stage,
  nextAction,
  nextActionAtIso,
}: OpportunityDetailControlsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [selectedStage, setSelectedStage] = useState<OpportunityStage>(stage);
  const [lostReason, setLostReason] = useState<OpportunityLostReason>("NO_FIT");
  const [lostNote, setLostNote] = useState("");
  const [actionText, setActionText] = useState(nextAction ?? "");
  const [actionDate, setActionDate] = useState(
    nextActionAtIso ? nextActionAtIso.slice(0, 10) : "",
  );
  const [note, setNote] = useState("");

  function run(action: () => Promise<{ success: boolean; message?: string }>) {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await action();
      if (!result.success) {
        setError(result.message ?? "Action failed.");
        return;
      }
      setMessage(result.message ?? "Saved.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h3 className="font-heading text-lg font-semibold text-brand">
          Next action
        </h3>
        <label className="block space-y-1 text-sm">
          <span className="text-muted">Action</span>
          <input
            className="w-full rounded-lg border border-border bg-white px-3 py-2"
            value={actionText}
            maxLength={280}
            onChange={(event) => setActionText(event.target.value)}
            placeholder="e.g. Contact owner about Competitive Growth Analysis"
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="text-muted">Due date</span>
          <input
            type="date"
            className="w-full rounded-lg border border-border bg-white px-3 py-2"
            value={actionDate}
            onChange={(event) => setActionDate(event.target.value)}
          />
        </label>
        <Button
          type="button"
          disabled={isPending}
          onClick={() =>
            run(() =>
              saveOpportunityNextActionAction(
                opportunityId,
                actionText,
                actionDate ? `${actionDate}T12:00:00.000Z` : null,
              ),
            )
          }
        >
          {isPending ? (
            <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
          ) : null}
          Save next action
        </Button>
      </section>

      <section className="space-y-3">
        <h3 className="font-heading text-lg font-semibold text-brand">
          Pipeline controls
        </h3>
        <label className="block space-y-1 text-sm">
          <span className="text-muted">Stage</span>
          <select
            className="w-full rounded-lg border border-border bg-white px-3 py-2"
            value={selectedStage}
            onChange={(event) =>
              setSelectedStage(event.target.value as OpportunityStage)
            }
          >
            {OPPORTUNITY_STAGES.map((value) => (
              <option key={value} value={value}>
                {opportunityStageLabel(value)}
              </option>
            ))}
          </select>
        </label>

        {selectedStage === "LOST" ? (
          <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <label className="block space-y-1 text-sm">
              <span className="text-amber-900">Lost reason (required)</span>
              <select
                className="w-full rounded-lg border border-border bg-white px-3 py-2"
                value={lostReason}
                onChange={(event) =>
                  setLostReason(event.target.value as OpportunityLostReason)
                }
              >
                {OPPORTUNITY_LOST_REASONS.map((value) => (
                  <option key={value} value={value}>
                    {opportunityLostReasonLabel(value)}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1 text-sm">
              <span className="text-amber-900">Optional note</span>
              <textarea
                className="min-h-20 w-full rounded-lg border border-border bg-white px-3 py-2"
                value={lostNote}
                maxLength={1000}
                onChange={(event) => setLostNote(event.target.value)}
              />
            </label>
          </div>
        ) : null}

        {(selectedStage === "WON" || selectedStage === "LOST") &&
        selectedStage !== stage ? (
          <p className="text-sm text-muted">
            Confirm carefully: marking {opportunityStageLabel(selectedStage)} is
            an explicit commercial outcome. Client conversion is not automatic
            in V1.
          </p>
        ) : null}

        <Button
          type="button"
          disabled={isPending || selectedStage === stage}
          onClick={() =>
            run(() =>
              changeOpportunityStageAction(opportunityId, selectedStage, {
                lostReason:
                  selectedStage === "LOST" ? lostReason : undefined,
                lostNote: selectedStage === "LOST" ? lostNote : undefined,
              }),
            )
          }
        >
          Update stage
        </Button>
      </section>

      <section className="space-y-3">
        <h3 className="font-heading text-lg font-semibold text-brand">
          Recommended capabilities
        </h3>
        <p className="text-sm text-muted">
          Capabilities are snapshotted. Rebuilding an Implementation Plan does
          not change this Opportunity until you refresh explicitly.
        </p>
        <Button
          type="button"
          variant="outline"
          disabled={isPending}
          onClick={() =>
            run(() => refreshOpportunityCapabilitiesAction(opportunityId))
          }
        >
          Refresh from current Implementation Plan
        </Button>
      </section>

      <section className="space-y-3">
        <h3 className="font-heading text-lg font-semibold text-brand">
          Internal note
        </h3>
        <textarea
          className="min-h-24 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm"
          value={note}
          maxLength={4000}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Internal only — not shown on public reports"
        />
        <Button
          type="button"
          variant="outline"
          disabled={isPending || !note.trim()}
          onClick={() => {
            const text = note;
            run(async () => {
              const result = await addOpportunityNoteAction(
                opportunityId,
                text,
              );
              if (result.success) {
                setNote("");
              }
              return result;
            });
          }}
        >
          Add note
        </Button>
      </section>

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
