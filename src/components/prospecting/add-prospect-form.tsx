"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, LoaderCircle } from "lucide-react";

import { addCampaignProspect } from "@/app/reports/prospecting/actions";
import { Button } from "@/components/ui";
import type { DuplicateWarning } from "@/lib/prospecting/duplicates";
import { DUPLICATE_WARNING_NOTICE } from "@/lib/prospecting/constants";

const fieldClassName =
  "mt-2 h-11 w-full rounded-xl border border-border bg-white px-3 text-sm text-brand outline-none transition focus:border-brand-blue";

const labelClassName = "text-sm font-semibold text-brand";

interface AddProspectFormProps {
  campaignId: string;
  campaignIndustries: string[];
}

export function AddProspectForm({
  campaignId,
  campaignIndustries,
}: AddProspectFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] =
    useState<DuplicateWarning | null>(null);

  function submit(formData: FormData, confirmDuplicate: boolean) {
    setError(null);

    if (confirmDuplicate) {
      formData.set("confirmDuplicate", "true");
    }

    startTransition(async () => {
      const result = await addCampaignProspect(campaignId, formData);

      if (result.duplicateWarning && !confirmDuplicate) {
        setDuplicateWarning(result.duplicateWarning);
        setError(result.message ?? "A matching hostname already exists.");
        return;
      }

      if (!result.success || !result.prospectId) {
        setError(result.message ?? "The prospect could not be added.");
        return;
      }

      router.push(
        `/reports/prospecting/${campaignId}/prospects/${result.prospectId}`,
      );
    });
  }

  return (
    <form
      action={(formData) => submit(formData, duplicateWarning !== null)}
      className="space-y-5"
    >
      <div>
        <label htmlFor="prospect-business-name" className={labelClassName}>
          Business name
        </label>
        <input
          id="prospect-business-name"
          name="businessName"
          type="text"
          required
          maxLength={160}
          disabled={isPending}
          className={fieldClassName}
        />
      </div>

      <div>
        <label htmlFor="prospect-website" className={labelClassName}>
          Website
        </label>
        <input
          id="prospect-website"
          name="website"
          type="text"
          disabled={isPending}
          placeholder="https://example.com"
          className={fieldClassName}
        />
        <p className="mt-2 text-xs text-muted">
          Public websites only. Localhost and private network addresses are
          rejected. The hostname is stored without www or path.
        </p>
      </div>

      <div>
        <label htmlFor="prospect-industry" className={labelClassName}>
          Industry
        </label>
        <input
          id="prospect-industry"
          name="industry"
          type="text"
          list="campaign-industries"
          maxLength={80}
          disabled={isPending}
          className={fieldClassName}
        />
        {campaignIndustries.length > 0 ? (
          <datalist id="campaign-industries">
            {campaignIndustries.map((industry) => (
              <option key={industry} value={industry} />
            ))}
          </datalist>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="prospect-city" className={labelClassName}>
            City
          </label>
          <input
            id="prospect-city"
            name="city"
            type="text"
            maxLength={80}
            disabled={isPending}
            className={fieldClassName}
          />
        </div>
        <div>
          <label htmlFor="prospect-state" className={labelClassName}>
            State
          </label>
          <input
            id="prospect-state"
            name="state"
            type="text"
            maxLength={40}
            disabled={isPending}
            className={fieldClassName}
          />
        </div>
      </div>

      <div>
        <label htmlFor="prospect-address" className={labelClassName}>
          Address
        </label>
        <input
          id="prospect-address"
          name="address"
          type="text"
          maxLength={240}
          disabled={isPending}
          className={fieldClassName}
        />
      </div>

      <div>
        <label htmlFor="prospect-phone" className={labelClassName}>
          Phone
        </label>
        <input
          id="prospect-phone"
          name="phone"
          type="text"
          maxLength={40}
          disabled={isPending}
          className={fieldClassName}
        />
      </div>

      <div>
        <label htmlFor="prospect-notes" className={labelClassName}>
          Notes
        </label>
        <textarea
          id="prospect-notes"
          name="notes"
          rows={4}
          maxLength={4000}
          disabled={isPending}
          className="mt-2 w-full rounded-xl border border-border bg-white px-3 py-2 text-sm text-brand outline-none transition focus:border-brand-blue"
        />
      </div>

      {duplicateWarning ? (
        <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          <p className="flex items-start gap-2 font-semibold">
            <AlertTriangle
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0"
            />
            Hostname {duplicateWarning.hostname} already exists
          </p>
          <ul className="list-disc space-y-1 pl-5">
            {duplicateWarning.matches.map((match) => (
              <li key={`${match.kind}-${match.id}`}>
                {match.kind}: {match.label}
                {match.detail ? ` — ${match.detail}` : ""}
              </li>
            ))}
          </ul>
          <p className="text-xs leading-5 text-amber-900">
            {DUPLICATE_WARNING_NOTICE}
          </p>
        </div>
      ) : null}

      {error && !duplicateWarning ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <Button type="submit" disabled={isPending}>
        {isPending ? (
          <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
        ) : null}
        {duplicateWarning ? "Add anyway" : "Add prospect"}
      </Button>
    </form>
  );
}
