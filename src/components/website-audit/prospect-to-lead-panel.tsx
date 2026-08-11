"use client";

import {
  useRef,
  useState,
  useTransition,
} from "react";
import {
  Building2,
  CalendarClock,
  CheckCircle2,
  LoaderCircle,
  Mail,
  Phone,
  UserPlus,
} from "lucide-react";

import { convertProspectToLead } from "@/app/reports/prospect-actions";
import {
  Button,
  Card,
} from "@/components/ui";

interface ProspectToLeadPanelProps {
  reportId: string;
  hostname: string;
}

export function ProspectToLeadPanel({
  reportId,
  hostname,
}: ProspectToLeadPanelProps) {
  const formRef =
    useRef<HTMLFormElement>(
      null,
    );

  const [
    isPending,
    startTransition,
  ] =
    useTransition();

  const [
    message,
    setMessage,
  ] =
    useState<string | null>(
      null,
    );

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null,
    );

  function handleSubmit(
    formData: FormData,
  ): void {
    setMessage(null);
    setError(null);

    startTransition(
      async () => {
        const result =
          await convertProspectToLead(
            reportId,
            formData,
          );

        if (
          !result.success
        ) {
          setError(
            result.message ??
              "Could not convert prospect.",
          );

          return;
        }

        setMessage(
          result.message ??
            "Prospect converted to lead.",
        );

        formRef.current?.reset();
      },
    );
  }

  return (
    <Card
      variant="elevated"
      padding="lg"
    >
      <div className="flex items-start gap-4">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-brand-blue/10 bg-brand-blue/[0.07] text-brand-blue">
          <UserPlus
            aria-hidden="true"
            className="size-5"
          />
        </span>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-blue">
            Convert Prospect
          </p>

          <h2 className="mt-2 font-heading text-xl font-semibold text-brand">
            Add this business to the pipeline.
          </h2>

          <p className="mt-2 text-sm leading-6 text-muted">
            Create a lead from the audit for{" "}
            <strong className="font-semibold text-brand">
              {hostname}
            </strong>
            .
          </p>
        </div>
      </div>

      <form
        ref={formRef}
        action={handleSubmit}
        className="mt-6 space-y-5"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="prospect-first-name"
              className="text-sm font-semibold text-brand"
            >
              First name
            </label>

            <input
              id="prospect-first-name"
              name="firstName"
              type="text"
              required
              disabled={isPending}
              className="mt-2 h-11 w-full rounded-xl border border-border bg-white px-3 text-sm text-brand outline-none transition focus:border-brand-blue"
            />
          </div>

          <div>
            <label
              htmlFor="prospect-last-name"
              className="text-sm font-semibold text-brand"
            >
              Last name
            </label>

            <input
              id="prospect-last-name"
              name="lastName"
              type="text"
              required
              disabled={isPending}
              className="mt-2 h-11 w-full rounded-xl border border-border bg-white px-3 text-sm text-brand outline-none transition focus:border-brand-blue"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="prospect-email"
            className="flex items-center gap-2 text-sm font-semibold text-brand"
          >
            <Mail
              aria-hidden="true"
              className="size-4 text-brand-blue"
            />

            Email
          </label>

          <input
            id="prospect-email"
            name="email"
            type="email"
            required
            disabled={isPending}
            className="mt-2 h-11 w-full rounded-xl border border-border bg-white px-3 text-sm text-brand outline-none transition focus:border-brand-blue"
          />
        </div>

        <div>
          <label
            htmlFor="prospect-phone"
            className="flex items-center gap-2 text-sm font-semibold text-brand"
          >
            <Phone
              aria-hidden="true"
              className="size-4 text-brand-blue"
            />

            Phone
          </label>

          <input
            id="prospect-phone"
            name="phone"
            type="tel"
            disabled={isPending}
            className="mt-2 h-11 w-full rounded-xl border border-border bg-white px-3 text-sm text-brand outline-none transition focus:border-brand-blue"
          />
        </div>

        <div>
          <label
            htmlFor="prospect-company"
            className="flex items-center gap-2 text-sm font-semibold text-brand"
          >
            <Building2
              aria-hidden="true"
              className="size-4 text-brand-blue"
            />

            Company
          </label>

          <input
            id="prospect-company"
            name="company"
            type="text"
            disabled={isPending}
            placeholder={hostname}
            className="mt-2 h-11 w-full rounded-xl border border-border bg-white px-3 text-sm text-brand outline-none transition placeholder:text-muted focus:border-brand-blue"
          />
        </div>

        <div>
          <label
            htmlFor="prospect-follow-up"
            className="flex items-center gap-2 text-sm font-semibold text-brand"
          >
            <CalendarClock
              aria-hidden="true"
              className="size-4 text-brand-blue"
            />

            Initial follow-up
          </label>

          <input
            id="prospect-follow-up"
            name="followUpAt"
            type="date"
            disabled={isPending}
            className="mt-2 h-11 w-full rounded-xl border border-border bg-white px-3 text-sm text-brand outline-none transition focus:border-brand-blue"
          />
        </div>

        <div>
          <label
            htmlFor="prospect-notes"
            className="text-sm font-semibold text-brand"
          >
            Internal notes
          </label>

          <textarea
            id="prospect-notes"
            name="notes"
            rows={5}
            maxLength={4000}
            disabled={isPending}
            placeholder="Why this prospect looks interesting, who the decision maker is, what you found, or what you want to discuss first..."
            className="mt-2 w-full resize-y rounded-xl border border-border bg-white px-3 py-3 text-sm leading-6 text-brand outline-none transition placeholder:text-muted focus:border-brand-blue"
          />
        </div>

        {error ? (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
          </div>
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

        <Button
          type="submit"
          className="w-full"
          disabled={isPending}
        >
          {isPending ? (
            <>
              <LoaderCircle
                aria-hidden="true"
                className="size-4 animate-spin"
              />

              Creating Lead…
            </>
          ) : (
            <>
              <UserPlus
                aria-hidden="true"
                className="size-4"
              />

              Convert to Lead
            </>
          )}
        </Button>
      </form>
    </Card>
  );
}