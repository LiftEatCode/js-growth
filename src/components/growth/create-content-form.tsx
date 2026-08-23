"use client";

import { useActionState, useEffect, useId, useRef } from "react";
import { LoaderCircle } from "lucide-react";

import {
  createGrowthContentAction,
  type CreateContentState,
} from "@/app/reports/growth/actions";
import { Button } from "@/components/ui";
import {
  FACEBOOK_CONTENT_FORMATS,
  FACEBOOK_CONTENT_JOBS,
  FACEBOOK_CONTENT_PILLARS,
  FACEBOOK_PUBLISHER_TYPES,
} from "@/lib/growth/facebook-growth";

const initialState: CreateContentState = {
  success: false,
  message: "",
};

export function CreateGrowthContentForm() {
  const [state, formAction, isPending] = useActionState(
    createGrowthContentAction,
    initialState,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const statusId = useId();
  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
    }
  }, [state.success, state.message]);

  const submitLabel = isPending ? "Saving..." : "Record Facebook Content";

  return (
    <form
      ref={formRef}
      action={formAction}
      className="space-y-4 rounded-2xl border border-border bg-white p-6"
      aria-busy={isPending}
    >
      <p className="text-sm font-semibold text-brand">
        Record Facebook content (manual ledger)
      </p>
      <p className="text-xs leading-5 text-muted">
        One Facebook post = one canonical record. Leave metric fields blank when
        Insights values are unknown — blank means NOT_CAPTURED, not zero. Update
        the same record at ~72h / ~7d; do not resubmit create for metric
        maturity.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <label className="block space-y-1 text-sm">
          <span className="font-medium">Publisher</span>
          <select
            name="publisherType"
            required
            defaultValue="COMPANY"
            disabled={isPending}
            className="flex h-10 w-full rounded-xl border border-border px-3 disabled:opacity-60"
          >
            {FACEBOOK_PUBLISHER_TYPES.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1 text-sm">
          <span className="font-medium">Published date</span>
          <input
            type="date"
            name="publishedAt"
            required
            defaultValue={today}
            disabled={isPending}
            className="flex h-10 w-full rounded-xl border border-border px-3 disabled:opacity-60"
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="font-medium">Primary job</span>
          <select
            name="contentJob"
            required
            defaultValue="AUTHORITY"
            disabled={isPending}
            className="flex h-10 w-full rounded-xl border border-border px-3 disabled:opacity-60"
          >
            {FACEBOOK_CONTENT_JOBS.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1 text-sm">
          <span className="font-medium">Pillar</span>
          <select
            name="contentPillar"
            required
            defaultValue="WEBSITE_AUDITS"
            disabled={isPending}
            className="flex h-10 w-full rounded-xl border border-border px-3 disabled:opacity-60"
          >
            {FACEBOOK_CONTENT_PILLARS.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1 text-sm">
          <span className="font-medium">Format</span>
          <select
            name="contentFormat"
            required
            defaultValue="PHOTO"
            disabled={isPending}
            className="flex h-10 w-full rounded-xl border border-border px-3 disabled:opacity-60"
          >
            {FACEBOOK_CONTENT_FORMATS.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1 text-sm">
          <span className="font-medium">Content slug</span>
          <input
            name="contentSlug"
            required
            placeholder="seo_mistakes_001"
            pattern="[a-z0-9][a-z0-9_-]*"
            disabled={isPending}
            className="flex h-10 w-full rounded-xl border border-border px-3 disabled:opacity-60"
          />
        </label>
      </div>

      <label className="block space-y-1 text-sm">
        <span className="font-medium">Title</span>
        <input
          name="title"
          required
          maxLength={200}
          placeholder="Short internal label for the post"
          disabled={isPending}
          className="flex h-10 w-full rounded-xl border border-border px-3 disabled:opacity-60"
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1 text-sm">
          <span className="font-medium">Campaign (optional)</span>
          <input
            name="campaign"
            placeholder="page_organic or founder_content"
            disabled={isPending}
            className="flex h-10 w-full rounded-xl border border-border px-3 disabled:opacity-60"
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="font-medium">Post URL (optional)</span>
          <input
            name="postUrl"
            type="url"
            placeholder="https://www.facebook.com/..."
            disabled={isPending}
            className="flex h-10 w-full rounded-xl border border-border px-3 disabled:opacity-60"
          />
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {(
          [
            ["fbViews", "Views"],
            ["fbReach", "Reach"],
            ["fbEngagements", "Engagements"],
            ["fbReactions", "Reactions"],
            ["fbComments", "Comments"],
            ["fbShares", "Shares"],
            ["fbPageVisits", "Page visits"],
            ["fbFollowersGained", "Followers gained"],
            ["fbLinkClicks", "Link clicks"],
          ] as const
        ).map(([name, label]) => (
          <label key={name} className="block space-y-1 text-sm">
            <span className="font-medium">{label}</span>
            <input
              name={name}
              type="number"
              min={0}
              step={1}
              disabled={isPending}
              className="flex h-10 w-full rounded-xl border border-border px-3 disabled:opacity-60"
            />
          </label>
        ))}
      </div>

      <label className="block space-y-1 text-sm">
        <span className="font-medium">Notes</span>
        <textarea
          name="notes"
          rows={3}
          maxLength={2000}
          disabled={isPending}
          className="w-full rounded-xl border border-border px-3 py-2 text-sm disabled:opacity-60"
        />
      </label>

      <Button
        type="submit"
        disabled={isPending}
        aria-describedby={statusId}
      >
        {isPending ? (
          <>
            <LoaderCircle
              aria-hidden="true"
              className="size-4 animate-spin"
            />
            Saving...
          </>
        ) : state.success ? (
          "Saved"
        ) : (
          submitLabel
        )}
      </Button>

      <p
        id={statusId}
        role="status"
        aria-live="polite"
        className={`text-sm ${
          state.success
            ? "text-green-700"
            : state.message
              ? "text-red-600"
              : "text-muted"
        }`}
      >
        {isPending
          ? "Saving content record…"
          : state.message
            ? state.message
            : "Ready to record one canonical content item."}
      </p>
    </form>
  );
}
