"use client";

import { useActionState, useId } from "react";
import { LoaderCircle } from "lucide-react";

import {
  updateGrowthContentMetricsAction,
  type UpdateContentMetricsState,
} from "@/app/reports/growth/actions";
import { Button } from "@/components/ui";
import { FACEBOOK_CONTENT_METRIC_CHECKPOINTS } from "@/lib/growth/facebook-execution";

const initialState: UpdateContentMetricsState = {
  success: false,
  message: "",
};

type Props = {
  contentRecordId: string;
  title: string;
  utmContent: string;
  defaultCheckpoint?: string;
  defaults?: {
    fbViews?: number | null;
    fbReach?: number | null;
    fbEngagements?: number | null;
    fbReactions?: number | null;
    fbComments?: number | null;
    fbShares?: number | null;
    fbPageVisits?: number | null;
    fbFollowersGained?: number | null;
    fbLinkClicks?: number | null;
    notes?: string | null;
  };
};

export function EditGrowthContentMetricsForm({
  contentRecordId,
  title,
  utmContent,
  defaultCheckpoint = "HOURS_72",
  defaults = {},
}: Props) {
  const [state, formAction, isPending] = useActionState(
    updateGrowthContentMetricsAction,
    initialState,
  );
  const statusId = useId();

  return (
    <form
      action={formAction}
      className="space-y-3 rounded-xl border border-border bg-slate-50/80 p-4"
      aria-busy={isPending}
    >
      <input type="hidden" name="contentRecordId" value={contentRecordId} />
      <p className="text-sm font-semibold text-brand">{title}</p>
      <p className="font-mono text-xs text-muted">{utmContent}</p>
      <p className="text-xs leading-5 text-muted">
        Updates the same canonical record. Blank = NOT_CAPTURED; 0 = observed
        zero. Choose a checkpoint to store history (72h / 7d).
      </p>

      <label className="block space-y-1 text-sm">
        <span className="font-medium">Checkpoint</span>
        <select
          name="checkpoint"
          defaultValue={defaultCheckpoint}
          disabled={isPending}
          className="flex h-10 w-full rounded-xl border border-border bg-white px-3 disabled:opacity-60"
        >
          <option value="">Latest only (no checkpoint row)</option>
          {FACEBOOK_CONTENT_METRIC_CHECKPOINTS.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </label>

      <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {(
          [
            ["fbViews", "Views", defaults.fbViews],
            ["fbReach", "Reach", defaults.fbReach],
            ["fbEngagements", "Engagements", defaults.fbEngagements],
            ["fbReactions", "Reactions", defaults.fbReactions],
            ["fbComments", "Comments", defaults.fbComments],
            ["fbShares", "Shares", defaults.fbShares],
            ["fbPageVisits", "Page visits", defaults.fbPageVisits],
            ["fbFollowersGained", "Followers gained", defaults.fbFollowersGained],
            ["fbLinkClicks", "Link clicks", defaults.fbLinkClicks],
          ] as const
        ).map(([name, label, value]) => (
          <label key={name} className="block space-y-1 text-sm">
            <span className="font-medium">{label}</span>
            <input
              name={name}
              type="number"
              min={0}
              step={1}
              defaultValue={value ?? undefined}
              disabled={isPending}
              className="flex h-10 w-full rounded-xl border border-border bg-white px-3 disabled:opacity-60"
            />
          </label>
        ))}
      </div>

      <label className="block space-y-1 text-sm">
        <span className="font-medium">Notes</span>
        <textarea
          name="notes"
          rows={2}
          maxLength={2000}
          defaultValue={defaults.notes ?? undefined}
          disabled={isPending}
          className="w-full rounded-xl border border-border bg-white px-3 py-2 text-sm disabled:opacity-60"
        />
      </label>

      <Button type="submit" disabled={isPending} aria-describedby={statusId}>
        {isPending ? (
          <>
            <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
            Saving...
          </>
        ) : (
          "Record metrics"
        )}
      </Button>
      <p
        id={statusId}
        role="status"
        aria-live="polite"
        className={`text-sm ${state.success ? "text-green-700" : state.message ? "text-red-600" : "text-muted"}`}
      >
        {isPending
          ? "Saving metrics…"
          : state.message || "Edit metrics without creating a new content row."}
      </p>
    </form>
  );
}
