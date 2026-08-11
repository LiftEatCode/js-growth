"use client";

import {
  useState,
  useTransition,
} from "react";
import {
  Building2,
  CheckCircle2,
  LoaderCircle,
  Mail,
  Pencil,
  Phone,
  Save,
  UserRound,
  X,
} from "lucide-react";

import { updateLeadDetails } from "@/app/reports/lead-actions";
import {
  Button,
  Card,
} from "@/components/ui";

interface LeadDetailsEditorProps {
  leadId: string;
  reportId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  company: string | null;
}

export function LeadDetailsEditor({
  leadId,
  reportId,
  firstName,
  lastName,
  email,
  phone,
  company,
}: LeadDetailsEditorProps) {
  const [
    editing,
    setEditing,
  ] =
    useState(false);

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
          await updateLeadDetails(
            leadId,
            reportId,
            formData,
          );

        if (
          !result.success
        ) {
          setError(
            result.message ??
              "Could not update lead details.",
          );

          return;
        }

        setMessage(
          result.message ??
            "Lead details updated.",
        );

        setEditing(false);
      },
    );
  }

  if (!editing) {
    return (
      <Card
        variant="elevated"
        padding="lg"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-brand-blue/10 bg-brand-blue/[0.07] text-brand-blue">
              <UserRound
                aria-hidden="true"
                className="size-5"
              />
            </span>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-blue">
                Lead Details
              </p>

              <h2 className="mt-2 font-heading text-xl font-semibold text-brand">
                Contact information.
              </h2>
            </div>
          </div>

          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              setMessage(null);
              setError(null);
              setEditing(true);
            }}
          >
            <Pencil
              aria-hidden="true"
              className="size-4"
            />

            Edit
          </Button>
        </div>

        <div className="mt-6 space-y-4">
          <DetailRow
            icon={UserRound}
            label="Name"
            value={`${firstName} ${lastName}`}
          />

          <DetailRow
            icon={Mail}
            label="Email"
            value={email}
            href={`mailto:${email}`}
          />

          <DetailRow
            icon={Phone}
            label="Phone"
            value={
              phone ||
              "Not provided"
            }
            href={
              phone
                ? `tel:${phone}`
                : undefined
            }
          />

          <DetailRow
            icon={Building2}
            label="Company"
            value={
              company ||
              "Not provided"
            }
          />
        </div>

        {message ? (
          <div className="mt-5 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
            <CheckCircle2
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0"
            />

            {message}
          </div>
        ) : null}
      </Card>
    );
  }

  return (
    <Card
      variant="elevated"
      padding="lg"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-brand-blue/10 bg-brand-blue/[0.07] text-brand-blue">
            <Pencil
              aria-hidden="true"
              className="size-5"
            />
          </span>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-blue">
              Edit Lead
            </p>

            <h2 className="mt-2 font-heading text-xl font-semibold text-brand">
              Update contact information.
            </h2>
          </div>
        </div>

        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={isPending}
          onClick={() => {
            setEditing(false);
            setError(null);
            setMessage(null);
          }}
        >
          <X
            aria-hidden="true"
            className="size-4"
          />

          Cancel
        </Button>
      </div>

      <form
        action={handleSubmit}
        className="mt-6 space-y-5"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor={`lead-first-name-${leadId}`}
              className="text-sm font-semibold text-brand"
            >
              First name
            </label>

            <input
              id={`lead-first-name-${leadId}`}
              name="firstName"
              type="text"
              required
              defaultValue={firstName}
              disabled={isPending}
              className="mt-2 h-11 w-full rounded-xl border border-border bg-white px-3 text-sm text-brand outline-none transition focus:border-brand-blue"
            />
          </div>

          <div>
            <label
              htmlFor={`lead-last-name-${leadId}`}
              className="text-sm font-semibold text-brand"
            >
              Last name
            </label>

            <input
              id={`lead-last-name-${leadId}`}
              name="lastName"
              type="text"
              required
              defaultValue={lastName}
              disabled={isPending}
              className="mt-2 h-11 w-full rounded-xl border border-border bg-white px-3 text-sm text-brand outline-none transition focus:border-brand-blue"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor={`lead-email-${leadId}`}
            className="flex items-center gap-2 text-sm font-semibold text-brand"
          >
            <Mail
              aria-hidden="true"
              className="size-4 text-brand-blue"
            />

            Email
          </label>

          <input
            id={`lead-email-${leadId}`}
            name="email"
            type="email"
            required
            defaultValue={email}
            disabled={isPending}
            className="mt-2 h-11 w-full rounded-xl border border-border bg-white px-3 text-sm text-brand outline-none transition focus:border-brand-blue"
          />
        </div>

        <div>
          <label
            htmlFor={`lead-phone-${leadId}`}
            className="flex items-center gap-2 text-sm font-semibold text-brand"
          >
            <Phone
              aria-hidden="true"
              className="size-4 text-brand-blue"
            />

            Phone
          </label>

          <input
            id={`lead-phone-${leadId}`}
            name="phone"
            type="tel"
            defaultValue={
              phone ??
              ""
            }
            disabled={isPending}
            className="mt-2 h-11 w-full rounded-xl border border-border bg-white px-3 text-sm text-brand outline-none transition focus:border-brand-blue"
          />
        </div>

        <div>
          <label
            htmlFor={`lead-company-${leadId}`}
            className="flex items-center gap-2 text-sm font-semibold text-brand"
          >
            <Building2
              aria-hidden="true"
              className="size-4 text-brand-blue"
            />

            Company
          </label>

          <input
            id={`lead-company-${leadId}`}
            name="company"
            type="text"
            defaultValue={
              company ??
              ""
            }
            disabled={isPending}
            className="mt-2 h-11 w-full rounded-xl border border-border bg-white px-3 text-sm text-brand outline-none transition focus:border-brand-blue"
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

              Saving Changes…
            </>
          ) : (
            <>
              <Save
                aria-hidden="true"
                className="size-4"
              />

              Save Lead Details
            </>
          )}
        </Button>
      </form>
    </Card>
  );
}

interface DetailRowProps {
  icon:
    typeof Mail;

  label: string;

  value: string;

  href?: string;
}

function DetailRow({
  icon: Icon,
  label,
  value,
  href,
}: DetailRowProps) {
  const content = (
    <>
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-slate-50 text-brand-blue">
        <Icon
          aria-hidden="true"
          className="size-4"
        />
      </span>

      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-[0.1em] text-muted">
          {label}
        </p>

        <p className="mt-1 break-words text-sm font-medium text-brand">
          {value}
        </p>
      </div>
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        className="flex items-start gap-3 transition hover:opacity-75"
      >
        {content}
      </a>
    );
  }

  return (
    <div className="flex items-start gap-3">
      {content}
    </div>
  );
}