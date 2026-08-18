"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";

import { createProspectingCampaign } from "@/app/reports/prospecting/actions";
import { Button } from "@/components/ui";
import {
  DEFAULT_DESIRED_QUALIFIED_COUNT,
  SUGGESTED_INDUSTRIES,
} from "@/lib/prospecting/constants";

const fieldClassName =
  "mt-2 h-11 w-full rounded-xl border border-border bg-white px-3 text-sm text-brand outline-none transition focus:border-brand-blue";

const labelClassName = "text-sm font-semibold text-brand";

export function CampaignForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);

  function toggleIndustry(industry: string) {
    setSelectedIndustries((current) =>
      current.includes(industry)
        ? current.filter((value) => value !== industry)
        : [...current, industry],
    );
  }

  function handleSubmit(formData: FormData) {
    setError(null);

    startTransition(async () => {
      const result = await createProspectingCampaign(formData);

      if (!result.success || !result.campaignId) {
        setError(result.message ?? "The campaign could not be created.");
        return;
      }

      router.push(`/reports/prospecting/${result.campaignId}`);
    });
  }

  return (
    <form action={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="campaign-name" className={labelClassName}>
          Campaign name
        </label>
        <input
          id="campaign-name"
          name="name"
          type="text"
          required
          maxLength={120}
          disabled={isPending}
          placeholder="Magnolia Home Services Outreach"
          className={fieldClassName}
        />
      </div>

      <div>
        <label htmlFor="campaign-location-label" className={labelClassName}>
          Location label
        </label>
        <input
          id="campaign-location-label"
          name="locationLabel"
          type="text"
          maxLength={160}
          disabled={isPending}
          placeholder="Magnolia, TX"
          className={fieldClassName}
        />
        <p className="mt-2 text-xs text-muted">
          Optional if city and state are provided.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="campaign-city" className={labelClassName}>
            City
          </label>
          <input
            id="campaign-city"
            name="city"
            type="text"
            maxLength={80}
            disabled={isPending}
            placeholder="Magnolia"
            className={fieldClassName}
          />
        </div>

        <div>
          <label htmlFor="campaign-state" className={labelClassName}>
            State
          </label>
          <input
            id="campaign-state"
            name="state"
            type="text"
            maxLength={40}
            disabled={isPending}
            placeholder="TX"
            className={fieldClassName}
          />
        </div>

        <div>
          <label htmlFor="campaign-radius" className={labelClassName}>
            Radius (miles)
          </label>
          <input
            id="campaign-radius"
            name="radiusMiles"
            type="number"
            min={1}
            max={500}
            disabled={isPending}
            placeholder="25"
            className={fieldClassName}
          />
        </div>
      </div>

      <fieldset>
        <legend className={labelClassName}>Industries</legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {SUGGESTED_INDUSTRIES.map((industry) => {
            const checked = selectedIndustries.includes(industry);

            return (
              <label
                key={industry}
                className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-sm ${
                  checked
                    ? "border-brand-blue bg-brand-blue/[0.08] text-brand-blue"
                    : "border-border bg-white text-brand"
                }`}
              >
                <input
                  type="checkbox"
                  name="industry"
                  value={industry}
                  checked={checked}
                  onChange={() => toggleIndustry(industry)}
                  disabled={isPending}
                  className="sr-only"
                />
                {industry}
              </label>
            );
          })}
        </div>
        <input
          id="campaign-industries-extra"
          name="industriesExtra"
          type="text"
          disabled={isPending}
          placeholder="Other industries, comma-separated"
          className={fieldClassName}
        />
      </fieldset>

      <div>
        <label htmlFor="campaign-desired-count" className={labelClassName}>
          Desired qualified prospects
        </label>
        <input
          id="campaign-desired-count"
          name="desiredQualifiedCount"
          type="number"
          min={1}
          max={50}
          defaultValue={DEFAULT_DESIRED_QUALIFIED_COUNT}
          disabled={isPending}
          className={fieldClassName}
        />
      </div>

      <div>
        <label htmlFor="campaign-notes" className={labelClassName}>
          Notes
        </label>
        <textarea
          id="campaign-notes"
          name="notes"
          rows={4}
          maxLength={4000}
          disabled={isPending}
          className="mt-2 w-full rounded-xl border border-border bg-white px-3 py-2 text-sm text-brand outline-none transition focus:border-brand-blue"
        />
      </div>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <Button type="submit" disabled={isPending}>
        {isPending ? (
          <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
        ) : null}
        Create campaign
      </Button>
    </form>
  );
}
