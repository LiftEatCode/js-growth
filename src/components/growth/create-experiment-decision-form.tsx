"use client";

import { useActionState, useId } from "react";
import { LoaderCircle } from "lucide-react";

import {
  createGrowthExperimentDecisionAction,
  type CreateExperimentDecisionState,
} from "@/app/reports/growth/actions";
import { Button } from "@/components/ui";
import {
  FACEBOOK_EXPERIMENT_SEQUENCE,
  GROWTH_EXPERIMENT_DECISIONS,
} from "@/lib/growth/facebook-execution";

const initialState: CreateExperimentDecisionState = {
  success: false,
  message: "",
};

export function CreateExperimentDecisionForm() {
  const [state, formAction, isPending] = useActionState(
    createGrowthExperimentDecisionAction,
    initialState,
  );
  const statusId = useId();

  return (
    <form
      action={formAction}
      className="space-y-3 rounded-2xl border border-border bg-white p-6"
      aria-busy={isPending}
    >
      <p className="text-sm font-semibold text-brand">
        Record experiment observation
      </p>
      <p className="text-xs text-muted">
        Do not claim statistical significance from tiny samples. Current:{" "}
        {FACEBOOK_EXPERIMENT_SEQUENCE.current} → next{" "}
        {FACEBOOK_EXPERIMENT_SEQUENCE.next}.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block space-y-1 text-sm">
          <span className="font-medium">Experiment ID</span>
          <input
            name="experimentId"
            required
            defaultValue={FACEBOOK_EXPERIMENT_SEQUENCE.current}
            pattern="[0-9]{4}-[0-9]{3}"
            disabled={isPending}
            className="flex h-10 w-full rounded-xl border border-border px-3 disabled:opacity-60"
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="font-medium">Decision</span>
          <select
            name="decision"
            required
            defaultValue="INCONCLUSIVE"
            disabled={isPending}
            className="flex h-10 w-full rounded-xl border border-border px-3 disabled:opacity-60"
          >
            {GROWTH_EXPERIMENT_DECISIONS.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="block space-y-1 text-sm">
        <span className="font-medium">Hypothesis</span>
        <input
          name="hypothesis"
          disabled={isPending}
          className="flex h-10 w-full rounded-xl border border-border px-3 disabled:opacity-60"
        />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block space-y-1 text-sm">
          <span className="font-medium">Primary metric</span>
          <input
            name="primaryMetric"
            disabled={isPending}
            className="flex h-10 w-full rounded-xl border border-border px-3 disabled:opacity-60"
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="font-medium">Secondary metrics</span>
          <input
            name="secondaryMetrics"
            disabled={isPending}
            className="flex h-10 w-full rounded-xl border border-border px-3 disabled:opacity-60"
          />
        </label>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block space-y-1 text-sm">
          <span className="font-medium">Sample size</span>
          <input
            name="sampleSize"
            type="number"
            min={0}
            step={1}
            disabled={isPending}
            className="flex h-10 w-full rounded-xl border border-border px-3 disabled:opacity-60"
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="font-medium">Confidence</span>
          <select
            name="confidence"
            defaultValue="LOW"
            disabled={isPending}
            className="flex h-10 w-full rounded-xl border border-border px-3 disabled:opacity-60"
          >
            <option value="LOW">LOW</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="HIGH">HIGH</option>
          </select>
        </label>
      </div>
      <label className="block space-y-1 text-sm">
        <span className="font-medium">Observations</span>
        <textarea
          name="observations"
          required
          rows={3}
          maxLength={4000}
          disabled={isPending}
          className="w-full rounded-xl border border-border px-3 py-2 text-sm disabled:opacity-60"
        />
      </label>
      <label className="block space-y-1 text-sm">
        <span className="font-medium">Result</span>
        <textarea
          name="result"
          rows={2}
          maxLength={2000}
          disabled={isPending}
          className="w-full rounded-xl border border-border px-3 py-2 text-sm disabled:opacity-60"
        />
      </label>

      <Button type="submit" disabled={isPending} aria-describedby={statusId}>
        {isPending ? (
          <>
            <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
            Saving...
          </>
        ) : (
          "Save experiment decision"
        )}
      </Button>
      <p
        id={statusId}
        role="status"
        aria-live="polite"
        className={`text-sm ${state.success ? "text-green-700" : state.message ? "text-red-600" : "text-muted"}`}
      >
        {isPending ? "Saving…" : state.message || "Ready."}
      </p>
    </form>
  );
}
