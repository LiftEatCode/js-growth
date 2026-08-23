"use client";

import { useActionState } from "react";

import {
  createGrowthSnapshotAction,
  type CreateSnapshotState,
} from "@/app/reports/growth/actions";
import { Button } from "@/components/ui";
import { GROWTH_SNAPSHOT_SOURCES } from "@/lib/growth/snapshot";

const initialState: CreateSnapshotState = {
  success: false,
  message: "",
};

const EXAMPLE_INTERNAL = `{
  "auditsCreated": 0,
  "professionalPurchases": 0,
  "opportunitiesCreated": 0,
  "clientsCreated": 0,
  "notes": "Manual baseline"
}`;

export function CreateGrowthSnapshotForm() {
  const [state, formAction] = useActionState(
    createGrowthSnapshotAction,
    initialState,
  );

  const today = new Date().toISOString().slice(0, 10);
  const start = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  return (
    <form
      action={formAction}
      className="space-y-4 rounded-2xl border border-border bg-white p-6"
    >
      <p className="text-sm font-semibold text-brand">Record baseline snapshot</p>
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block space-y-1 text-sm">
          <span className="font-medium">Source</span>
          <select
            name="source"
            defaultValue="INTERNAL"
            className="flex h-10 w-full rounded-xl border border-border px-3"
          >
            {GROWTH_SNAPSHOT_SOURCES.map((source) => (
              <option key={source} value={source}>
                {source}
              </option>
            ))}
          </select>
        </label>
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
      <label className="block space-y-1 text-sm">
        <span className="font-medium">metricsJson</span>
        <textarea
          name="metricsJson"
          required
          rows={8}
          defaultValue={EXAMPLE_INTERNAL}
          className="w-full rounded-xl border border-border px-3 py-2 font-mono text-xs"
        />
      </label>
      <Button type="submit">Save snapshot</Button>
      {state.message ? (
        <p
          className={`text-sm ${state.success ? "text-green-700" : "text-red-600"}`}
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
