"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, LoaderCircle } from "lucide-react";

import {
  skipCampaignProspect,
  updateCampaignProspect,
} from "@/app/reports/prospecting/actions";
import { Button, Card } from "@/components/ui";

const fieldClassName =
  "mt-2 h-11 w-full rounded-xl border border-border bg-white px-3 text-sm text-brand outline-none transition focus:border-brand-blue";

const labelClassName = "text-sm font-semibold text-brand";

interface ProspectEditorProps {
  campaignId: string;
  prospectId: string;
  businessName: string;
  website: string | null;
  hostname: string | null;
  industry: string | null;
  city: string | null;
  state: string | null;
  address: string | null;
  phone: string | null;
  notes: string | null;
  skipReason: string | null;
}

export function ProspectEditor({
  campaignId,
  prospectId,
  businessName,
  website,
  hostname,
  industry,
  city,
  state,
  address,
  phone,
  notes,
  skipReason,
}: ProspectEditorProps) {
  const [isSaving, startSave] = useTransition();
  const [isSkipping, startSkip] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [skipError, setSkipError] = useState<string | null>(null);

  function handleSave(formData: FormData) {
    setMessage(null);
    setError(null);

    startSave(async () => {
      const result = await updateCampaignProspect(
        campaignId,
        prospectId,
        formData,
      );

      if (!result.success) {
        setError(result.message ?? "The prospect could not be updated.");
        return;
      }

      setMessage(result.message ?? "Prospect updated.");
    });
  }

  function handleSkip(formData: FormData) {
    setSkipError(null);
    setMessage(null);

    startSkip(async () => {
      const result = await skipCampaignProspect(
        campaignId,
        prospectId,
        formData,
      );

      if (!result.success) {
        setSkipError(result.message ?? "The prospect could not be skipped.");
        return;
      }

      setMessage(result.message ?? "Prospect skipped.");
    });
  }

  return (
    <div className="space-y-6">
      <Card variant="elevated" padding="lg">
        <h2 className="font-heading text-xl font-semibold text-brand">
          Business details
        </h2>
        <p className="mt-2 text-sm text-muted">
          This is a discovered business, not a Lead. Conversion is deferred.
        </p>

        <form action={handleSave} className="mt-6 space-y-5">
          <div>
            <label htmlFor="edit-business-name" className={labelClassName}>
              Business name
            </label>
            <input
              id="edit-business-name"
              name="businessName"
              type="text"
              required
              defaultValue={businessName}
              disabled={isSaving}
              className={fieldClassName}
            />
          </div>

          <div>
            <label htmlFor="edit-website" className={labelClassName}>
              Website
            </label>
            <input
              id="edit-website"
              name="website"
              type="text"
              defaultValue={website ?? ""}
              disabled={isSaving}
              className={fieldClassName}
            />
          </div>

          <div>
            <p className={labelClassName}>Normalized hostname</p>
            <p className="mt-2 rounded-xl border border-border bg-slate-50 px-3 py-2.5 text-sm text-brand">
              {hostname || "None — add a public website to generate one."}
            </p>
          </div>

          <div>
            <label htmlFor="edit-industry" className={labelClassName}>
              Industry
            </label>
            <input
              id="edit-industry"
              name="industry"
              type="text"
              defaultValue={industry ?? ""}
              disabled={isSaving}
              className={fieldClassName}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="edit-city" className={labelClassName}>
                City
              </label>
              <input
                id="edit-city"
                name="city"
                type="text"
                defaultValue={city ?? ""}
                disabled={isSaving}
                className={fieldClassName}
              />
            </div>
            <div>
              <label htmlFor="edit-state" className={labelClassName}>
                State
              </label>
              <input
                id="edit-state"
                name="state"
                type="text"
                defaultValue={state ?? ""}
                disabled={isSaving}
                className={fieldClassName}
              />
            </div>
          </div>

          <div>
            <label htmlFor="edit-address" className={labelClassName}>
              Address
            </label>
            <input
              id="edit-address"
              name="address"
              type="text"
              defaultValue={address ?? ""}
              disabled={isSaving}
              className={fieldClassName}
            />
          </div>

          <div>
            <label htmlFor="edit-phone" className={labelClassName}>
              Phone
            </label>
            <input
              id="edit-phone"
              name="phone"
              type="text"
              defaultValue={phone ?? ""}
              disabled={isSaving}
              className={fieldClassName}
            />
          </div>

          <div>
            <label htmlFor="edit-notes" className={labelClassName}>
              Notes
            </label>
            <textarea
              id="edit-notes"
              name="notes"
              rows={4}
              defaultValue={notes ?? ""}
              disabled={isSaving}
              className="mt-2 w-full rounded-xl border border-border bg-white px-3 py-2 text-sm text-brand outline-none transition focus:border-brand-blue"
            />
          </div>

          {error ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          {message ? (
            <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
              <CheckCircle2
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0"
              />
              {message}
            </div>
          ) : null}

          <Button type="submit" disabled={isSaving || isSkipping}>
            {isSaving ? (
              <LoaderCircle
                aria-hidden="true"
                className="size-4 animate-spin"
              />
            ) : null}
            Save
          </Button>
        </form>
      </Card>

      <Card variant="elevated" padding="lg">
        <h2 className="font-heading text-xl font-semibold text-brand">
          Skip prospect
        </h2>
        <p className="mt-2 text-sm text-muted">
          Skip when the business is a poor fit. A reason is required so later
          campaigns do not rediscover it blindly.
        </p>

        <form action={handleSkip} className="mt-6 space-y-4">
          <div>
            <label htmlFor="skip-reason" className={labelClassName}>
              Skip reason
            </label>
            <textarea
              id="skip-reason"
              name="skipReason"
              required
              minLength={3}
              rows={3}
              defaultValue={skipReason ?? ""}
              disabled={isSkipping}
              placeholder="Already a customer, no public website, wrong industry..."
              className="mt-2 w-full rounded-xl border border-border bg-white px-3 py-2 text-sm text-brand outline-none transition focus:border-brand-blue"
            />
          </div>

          {skipError ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {skipError}
            </p>
          ) : null}

          <Button
            type="submit"
            variant="outline"
            disabled={isSaving || isSkipping}
          >
            {isSkipping ? (
              <LoaderCircle
                aria-hidden="true"
                className="size-4 animate-spin"
              />
            ) : null}
            Skip prospect
          </Button>
        </form>
      </Card>
    </div>
  );
}
