"use client";

import {
  useState,
  useTransition,
} from "react";
import {
  CalendarClock,
  CheckCircle2,
  LoaderCircle,
  NotebookPen,
  Save,
  Target,
} from "lucide-react";

import { updateLeadPipeline } from "@/app/reports/actions";
import {
  Button,
  Card,
} from "@/components/ui";

interface LeadPipelinePanelProps {
  leadId: string;

  reportId: string;

  status:
    | "NEW"
    | "CONTACTED"
    | "QUALIFIED"
    | "PROPOSAL"
    | "WON"
    | "LOST";

  followUpAt:
    | string
    | null;

  notes:
    | string
    | null;
}

const STATUS_OPTIONS = [
  {
    value: "NEW",
    label: "New",
  },
  {
    value: "CONTACTED",
    label: "Contacted",
  },
  {
    value: "QUALIFIED",
    label: "Qualified",
  },
  {
    value: "PROPOSAL",
    label: "Proposal",
  },
  {
    value: "WON",
    label: "Won",
  },
  {
    value: "LOST",
    label: "Lost",
  },
] as const;

function formatDateInput(
  value: string | null,
): string {
  if (!value) {
    return "";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "";
  }

  return date
    .toISOString()
    .slice(0, 10);
}

export function LeadPipelinePanel({
  leadId,
  reportId,
  status,
  followUpAt,
  notes,
}: LeadPipelinePanelProps) {
  const [
    isPending,
    startTransition,
  ] = useTransition();

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
          await updateLeadPipeline(
            leadId,
            reportId,
            formData,
          );

        if (
          !result.success
        ) {
          setError(
            result.message ??
              "Could not update lead.",
          );

          return;
        }

        setMessage(
          result.message ??
            "Lead updated.",
        );
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
          <Target
            aria-hidden="true"
            className="size-5"
          />
        </span>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-blue">
            Sales Pipeline
          </p>

          <h2 className="mt-2 font-heading text-xl font-semibold text-brand">
            Manage this opportunity.
          </h2>

          <p className="mt-2 text-sm leading-6 text-muted">
            Track where the lead is in the sales process and what needs to happen next.
          </p>
        </div>
      </div>

      <form
        action={handleSubmit}
        className="mt-6 space-y-5"
      >
        <div>
          <label
            htmlFor="lead-status"
            className="text-sm font-semibold text-brand"
          >
            Pipeline status
          </label>

          <select
            id="lead-status"
            name="status"
            defaultValue={
              status
            }
            disabled={isPending}
            className="mt-2 h-11 w-full rounded-xl border border-border bg-white px-3 text-sm text-brand outline-none transition focus:border-brand-blue"
          >
            {STATUS_OPTIONS.map(
              (option) => (
                <option
                  key={
                    option.value
                  }
                  value={
                    option.value
                  }
                >
                  {
                    option.label
                  }
                </option>
              ),
            )}
          </select>
        </div>

        <div>
          <label
            htmlFor="lead-follow-up"
            className="flex items-center gap-2 text-sm font-semibold text-brand"
          >
            <CalendarClock
              aria-hidden="true"
              className="size-4 text-brand-blue"
            />

            Follow-up date
          </label>

          <input
            id="lead-follow-up"
            name="followUpAt"
            type="date"
            defaultValue={formatDateInput(
              followUpAt,
            )}
            disabled={isPending}
            className="mt-2 h-11 w-full rounded-xl border border-border bg-white px-3 text-sm text-brand outline-none transition focus:border-brand-blue"
          />
        </div>

        <div>
          <label
            htmlFor="lead-notes"
            className="flex items-center gap-2 text-sm font-semibold text-brand"
          >
            <NotebookPen
              aria-hidden="true"
              className="size-4 text-brand-blue"
            />

            Internal notes
          </label>

          <textarea
            id="lead-notes"
            name="notes"
            defaultValue={
              notes ?? ""
            }
            disabled={isPending}
            rows={6}
            placeholder="Add call notes, qualification details, objections, next steps, proposal details, or anything else useful..."
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

              Saving…
            </>
          ) : (
            <>
              <Save
                aria-hidden="true"
                className="size-4"
              />

              Save Pipeline
            </>
          )}
        </Button>
      </form>
    </Card>
  );
}