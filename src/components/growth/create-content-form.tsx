"use client";

import { useActionState } from "react";

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
  const [state, formAction] = useActionState(
    createGrowthContentAction,
    initialState,
  );

  const today = new Date().toISOString().slice(0, 10);

  return (
    <form
      action={formAction}
      className="space-y-4 rounded-2xl border border-border bg-white p-6"
    >
      <p className="text-sm font-semibold text-brand">
        Record Facebook content (manual ledger)
      </p>
      <p className="text-xs leading-5 text-muted">
        Leave Facebook metric fields blank when Insights values are unknown —
        blank means NOT_CAPTURED, not zero.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <label className="block space-y-1 text-sm">
          <span className="font-medium">Publisher</span>
          <select
            name="publisherType"
            required
            defaultValue="COMPANY"
            className="flex h-10 w-full rounded-xl border border-border px-3"
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
            className="flex h-10 w-full rounded-xl border border-border px-3"
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="font-medium">Primary job</span>
          <select
            name="contentJob"
            required
            defaultValue="AUTHORITY"
            className="flex h-10 w-full rounded-xl border border-border px-3"
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
            className="flex h-10 w-full rounded-xl border border-border px-3"
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
            className="flex h-10 w-full rounded-xl border border-border px-3"
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
            className="flex h-10 w-full rounded-xl border border-border px-3"
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
          className="flex h-10 w-full rounded-xl border border-border px-3"
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1 text-sm">
          <span className="font-medium">Campaign (optional)</span>
          <input
            name="campaign"
            placeholder="page_organic or founder_content"
            className="flex h-10 w-full rounded-xl border border-border px-3"
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="font-medium">Post URL (optional)</span>
          <input
            name="postUrl"
            type="url"
            placeholder="https://www.facebook.com/..."
            className="flex h-10 w-full rounded-xl border border-border px-3"
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
              className="flex h-10 w-full rounded-xl border border-border px-3"
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
          className="w-full rounded-xl border border-border px-3 py-2 text-sm"
        />
      </label>

      <Button type="submit">Save content record</Button>
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
