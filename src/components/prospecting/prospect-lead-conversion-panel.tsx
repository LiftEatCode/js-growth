"use client";

import { useState, useTransition } from "react";
import { LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  convertProspectingProspectToLead,
  type ConversionActionResult,
} from "@/app/reports/prospecting/conversion-actions";
import { Button } from "@/components/ui";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface ProspectLeadConversionPanelProps {
  campaignId: string;
  prospectId: string;
  businessName: string;
  canConvert: boolean;
  convertedLeadId: string | null;
  leadReportId: string | null;
  defaultFirstName: string;
  defaultLastName: string;
  defaultEmail: string;
  defaultPhone: string;
  existingLead: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    company: string | null;
  } | null;
}

export function ProspectLeadConversionPanel({
  campaignId,
  prospectId,
  businessName,
  canConvert,
  convertedLeadId,
  leadReportId,
  defaultFirstName,
  defaultLastName,
  defaultEmail,
  defaultPhone,
  existingLead,
}: ProspectLeadConversionPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  if (convertedLeadId) {
    return (
      <div className="space-y-3">
        <h2 className="font-heading text-xl font-semibold text-brand">
          Lead conversion
        </h2>
        <p className="text-sm text-brand">Converted to Lead</p>
        {leadReportId ? (
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href={`/reports/${leadReportId}`} />}
          >
            Open lead workspace
          </Button>
        ) : (
          <p className="text-sm text-muted">
            Lead ID {convertedLeadId}. Open the lead from the reports board.
          </p>
        )}
      </div>
    );
  }

  if (!canConvert) {
    return (
      <div className="space-y-3">
        <h2 className="font-heading text-xl font-semibold text-brand">
          Lead conversion
        </h2>
        <p className="text-sm text-muted">
          Convert to Lead becomes available after a sent message receives a
          Replied or Interested outcome.
        </p>
      </div>
    );
  }

  function run(action: () => Promise<ConversionActionResult>) {
    setError(null);
    setMessage(null);

    startTransition(async () => {
      const result = await action();

      if (!result.success) {
        setError(result.message ?? "Conversion failed.");
        router.refresh();
        return;
      }

      setMessage(result.message ?? "Converted.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <h2 className="font-heading text-xl font-semibold text-brand">
        Convert to Lead
      </h2>
      <p className="text-sm leading-6 text-muted">
        Create or link a lead in the existing inbound pipeline. Historical
        prospecting records are preserved.
      </p>

      {existingLead ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-brand">
          <p className="font-semibold">Existing lead found</p>
          <p className="mt-1">
            {existingLead.firstName} {existingLead.lastName} · {existingLead.email}
            {existingLead.company ? ` · ${existingLead.company}` : ""}
          </p>
          <Button
            type="button"
            className="mt-3"
            variant="outline"
            disabled={isPending}
            onClick={() =>
              run(() =>
                convertProspectingProspectToLead({
                  campaignId,
                  prospectId,
                  formData: new FormData(),
                  linkExistingLeadId: existingLead.id,
                }),
              )
            }
          >
            Link to existing lead
          </Button>
        </div>
      ) : null}

      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          run(() =>
            convertProspectingProspectToLead({
              campaignId,
              prospectId,
              formData: new FormData(event.currentTarget),
            }),
          );
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="lead-first-name"
              className="text-xs font-semibold uppercase tracking-[0.08em] text-muted"
            >
              First name
            </label>
            <Input
              id="lead-first-name"
              name="firstName"
              className="mt-1"
              defaultValue={defaultFirstName}
              required={!existingLead}
            />
          </div>
          <div>
            <label
              htmlFor="lead-last-name"
              className="text-xs font-semibold uppercase tracking-[0.08em] text-muted"
            >
              Last name
            </label>
            <Input
              id="lead-last-name"
              name="lastName"
              className="mt-1"
              defaultValue={defaultLastName}
              required={!existingLead}
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="lead-email"
            className="text-xs font-semibold uppercase tracking-[0.08em] text-muted"
          >
            Email
          </label>
          <Input
            id="lead-email"
            name="email"
            type="email"
            className="mt-1"
            defaultValue={defaultEmail}
            required={!existingLead}
          />
        </div>

        <div>
          <label
            htmlFor="lead-phone"
            className="text-xs font-semibold uppercase tracking-[0.08em] text-muted"
          >
            Phone (optional)
          </label>
          <Input
            id="lead-phone"
            name="phone"
            className="mt-1"
            defaultValue={defaultPhone}
          />
        </div>

        <div>
          <label
            htmlFor="lead-company"
            className="text-xs font-semibold uppercase tracking-[0.08em] text-muted"
          >
            Company
          </label>
          <Input
            id="lead-company"
            name="company"
            className="mt-1"
            defaultValue={businessName}
          />
        </div>

        <div>
          <label
            htmlFor="lead-notes"
            className="text-xs font-semibold uppercase tracking-[0.08em] text-muted"
          >
            Notes (optional)
          </label>
          <Textarea
            id="lead-notes"
            name="notes"
            className="mt-1 min-h-24"
            placeholder="Internal notes for the inbound lead pipeline."
          />
        </div>

        <Button type="submit" disabled={isPending || Boolean(existingLead)}>
          {isPending ? (
            <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
          ) : null}
          Convert to Lead
        </Button>
      </form>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      {message ? <p className="text-sm text-brand">{message}</p> : null}
    </div>
  );
}
