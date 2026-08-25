"use client";

import { useActionState, useTransition } from "react";

import {
  upsertGbpChecklistAction,
  type GbpChecklistFormState,
} from "@/app/reports/growth/local/actions";
import { Button } from "@/components/ui";
import {
  LOCAL_CHECKLIST_STATUSES,
  LOCAL_FACT_MATCHES,
  type LocalChecklistItemKey,
} from "@/lib/growth/local-growth";

const initialState: GbpChecklistFormState = {
  success: false,
  message: "",
};

export function GbpChecklistItemForm({
  itemKey,
  section,
  status,
  factMatch,
  observation,
  observedValue,
  canonicalHint,
}: {
  itemKey: LocalChecklistItemKey;
  section: string;
  status: string;
  factMatch: string;
  observation: string | null;
  observedValue: string | null;
  canonicalHint?: string | null;
}) {
  const [state, formAction] = useActionState(
    upsertGbpChecklistAction,
    initialState,
  );
  const [pending, startTransition] = useTransition();

  return (
    <form
      data-testid={`gbp-checklist-${itemKey}`}
      className="space-y-2 rounded-xl border border-border p-4"
      action={(fd) => {
        startTransition(() => {
          formAction(fd);
        });
      }}
    >
      <input type="hidden" name="itemKey" value={itemKey} />
      <p className="text-sm font-semibold text-brand">
        {itemKey.replaceAll("_", " ")}
      </p>
      <p className="text-xs text-muted">
        {section}
        {canonicalHint ? ` · Canonical: ${canonicalHint}` : ""}
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="block space-y-1 text-xs">
          <span className="font-medium">Status</span>
          <select
            name="status"
            defaultValue={status}
            className="flex h-9 w-full rounded-lg border border-border px-2"
          >
            {LOCAL_CHECKLIST_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1 text-xs">
          <span className="font-medium">Fact match</span>
          <select
            name="factMatch"
            defaultValue={factMatch}
            className="flex h-9 w-full rounded-lg border border-border px-2"
          >
            {LOCAL_FACT_MATCHES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="block space-y-1 text-xs">
        <span className="font-medium">Observed GBP value</span>
        <input
          type="text"
          name="observedValue"
          defaultValue={observedValue ?? ""}
          className="flex h-9 w-full rounded-lg border border-border px-2"
          placeholder="Does not mutate business facts"
        />
      </label>
      <label className="block space-y-1 text-xs">
        <span className="font-medium">Observation</span>
        <textarea
          name="observation"
          rows={2}
          defaultValue={observation ?? ""}
          className="w-full rounded-lg border border-border px-2 py-1"
          placeholder="No reviewer PII / review text"
        />
      </label>
      <Button type="submit" disabled={pending} size="sm">
        {pending ? "Saving…" : "Save item"}
      </Button>
      {state.message ? (
        <p
          className={`text-xs ${state.success ? "text-green-700" : "text-red-700"}`}
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
