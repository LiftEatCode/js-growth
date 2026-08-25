"use client";

import { useActionState, useRef, useTransition } from "react";

import {
  createGbpSnapshotAction,
  type GbpSnapshotFormState,
} from "@/app/reports/growth/local/actions";
import { Button } from "@/components/ui";

const initialState: GbpSnapshotFormState = {
  success: false,
  message: "",
};

function MetricField({
  name,
  label,
  step,
}: {
  name: string;
  label: string;
  step?: string;
}) {
  return (
    <label className="block space-y-1 text-sm">
      <span className="font-medium">{label}</span>
      <input
        type="number"
        name={name}
        min={0}
        step={step ?? "1"}
        className="flex h-10 w-full rounded-xl border border-border px-3"
        placeholder="blank = NOT_CAPTURED"
      />
    </label>
  );
}

export function GbpSnapshotForm() {
  const [state, formAction] = useActionState(
    createGbpSnapshotAction,
    initialState,
  );
  const [pending, startTransition] = useTransition();
  const locked = useRef(false);
  const idempotencyKey = useRef(
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `gbp-${Date.now()}`,
  );

  const today = new Date().toISOString().slice(0, 10);
  const start = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  return (
    <form
      data-testid="gbp-snapshot-form"
      className="space-y-4 rounded-2xl border border-border bg-white p-6"
      action={(fd) => {
        if (locked.current || pending) return;
        locked.current = true;
        fd.set("idempotencyKey", idempotencyKey.current);
        startTransition(async () => {
          await formAction(fd);
          locked.current = false;
          idempotencyKey.current =
            typeof crypto !== "undefined" && crypto.randomUUID
              ? crypto.randomUUID()
              : `gbp-${Date.now()}`;
        });
      }}
    >
      <p className="text-sm font-semibold text-brand">
        Manual GBP snapshot
      </p>
      <p className="text-xs text-muted" data-testid="gbp-snapshot-blank-hint">
        Blank = NOT_CAPTURED. Enter 0 only when Google Insights shows an
        observed zero. Do not invent metrics. Provenance: MANUAL (FUTURE_GBP_API
        later).
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1 text-sm">
          <span className="font-medium">Period start</span>
          <input
            type="date"
            name="periodStart"
            required
            defaultValue={start}
            className="flex h-10 w-full rounded-xl border border-border px-3"
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="font-medium">Period end</span>
          <input
            type="date"
            name="periodEnd"
            required
            defaultValue={today}
            className="flex h-10 w-full rounded-xl border border-border px-3"
          />
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <MetricField name="profileViews" label="Profile views (total)" />
        <MetricField name="searchViews" label="Search views" />
        <MetricField name="mapsViews" label="Maps views" />
        <MetricField name="websiteClicks" label="Website clicks" />
        <MetricField name="callClicks" label="Calls (call clicks)" />
        <MetricField name="directionRequests" label="Directions" />
        <MetricField name="messages" label="Messages" />
        <MetricField name="bookings" label="Bookings" />
        <MetricField name="reviewCount" label="Total reviews" />
        <MetricField
          name="averageRating"
          label="Average rating (0–5)"
          step="0.1"
        />
        <MetricField name="newReviews" label="New reviews (period)" />
        <MetricField name="unansweredReviews" label="Unanswered reviews" />
        <MetricField name="photoCount" label="Photo count" />
      </div>
      <label className="block space-y-1 text-sm">
        <span className="font-medium">Notes</span>
        <textarea
          name="notes"
          rows={3}
          className="w-full rounded-xl border border-border px-3 py-2"
          placeholder="Operator notes only — no reviewer PII or review text"
        />
      </label>
      <label className="block space-y-1 text-sm">
        <span className="font-medium">Corrects snapshot id (optional)</span>
        <input
          type="text"
          name="correctsSnapshotId"
          className="flex h-10 w-full rounded-xl border border-border px-3"
          placeholder="Append-only correction reference — never silent overwrite"
        />
      </label>
      <Button type="submit" disabled={pending || locked.current}>
        {pending ? "Saving…" : "Save GBP snapshot"}
      </Button>
      {state.message ? (
        <p
          className={`text-sm ${state.success ? "text-green-700" : "text-red-700"}`}
          data-testid="gbp-snapshot-message"
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
