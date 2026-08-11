"use client";

import {
  useRef,
  useState,
  useTransition,
} from "react";
import {
  CalendarClock,
  CheckCircle2,
  LoaderCircle,
  Mail,
  MessageSquarePlus,
  NotebookPen,
  Phone,
  Save,
  Users,
} from "lucide-react";

import { addLeadActivity } from "@/app/reports/actions";
import {
  Button,
  Card,
} from "@/components/ui";

interface LeadManualActivityPanelProps {
  leadId: string;
  reportId: string;
}

type ManualActivityType =
  | "CALL"
  | "EMAIL"
  | "MEETING"
  | "FOLLOW_UP"
  | "NOTE";

const ACTIVITY_OPTIONS: {
  value: ManualActivityType;
  label: string;
  description: string;
  icon: typeof Phone;
}[] = [
  {
    value: "CALL",
    label: "Call",
    description:
      "Phone call, voicemail, or call attempt.",
    icon: Phone,
  },
  {
    value: "EMAIL",
    label: "Email",
    description:
      "Email sent, received, or discussed.",
    icon: Mail,
  },
  {
    value: "MEETING",
    label: "Meeting",
    description:
      "Discovery call, consultation, or meeting.",
    icon: Users,
  },
  {
    value: "FOLLOW_UP",
    label: "Follow-Up",
    description:
      "Reminder, next step, or future outreach.",
    icon: CalendarClock,
  },
  {
    value: "NOTE",
    label: "Note",
    description:
      "General sales or relationship note.",
    icon: NotebookPen,
  },
];

export function LeadManualActivityPanel({
  leadId,
  reportId,
}: LeadManualActivityPanelProps) {
  const formRef =
    useRef<HTMLFormElement>(
      null,
    );

  const [
    isPending,
    startTransition,
  ] = useTransition();

  const [
    activityType,
    setActivityType,
  ] =
    useState<ManualActivityType>(
      "CALL",
    );

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
          await addLeadActivity(
            leadId,
            reportId,
            formData,
          );

        if (
          !result.success
        ) {
          setError(
            result.message ??
              "Could not save activity.",
          );

          return;
        }

        setMessage(
          result.message ??
            "Activity added.",
        );

        formRef.current?.reset();

        setActivityType(
          "CALL",
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
          <MessageSquarePlus
            aria-hidden="true"
            className="size-5"
          />
        </span>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-blue">
            Log Activity
          </p>

          <h2 className="mt-2 font-heading text-xl font-semibold text-brand">
            Record what happened.
          </h2>

          <p className="mt-2 text-sm leading-6 text-muted">
            Add permanent call, email, meeting, follow-up, or general notes to the opportunity timeline.
          </p>
        </div>
      </div>

      <form
        ref={formRef}
        action={handleSubmit}
        className="mt-6"
      >
        <input
          type="hidden"
          name="activityType"
          value={
            activityType
          }
        />

        <p className="text-sm font-semibold text-brand">
          Activity type
        </p>

        <div className="mt-3 grid grid-cols-2 gap-2">
          {ACTIVITY_OPTIONS.map(
            (option) => {
              const Icon =
                option.icon;

              const selected =
                activityType ===
                option.value;

              return (
                <button
                  key={
                    option.value
                  }
                  type="button"
                  disabled={
                    isPending
                  }
                  onClick={() =>
                    setActivityType(
                      option.value,
                    )
                  }
                  className={`rounded-xl border p-3 text-left transition ${
                    selected
                      ? "border-brand-blue bg-brand-blue/[0.06] shadow-sm"
                      : "border-border bg-white hover:border-brand-blue/20 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon
                      aria-hidden="true"
                      className={`size-4 ${
                        selected
                          ? "text-brand-blue"
                          : "text-muted"
                      }`}
                    />

                    <span className="text-sm font-semibold text-brand">
                      {
                        option.label
                      }
                    </span>
                  </div>

                  <p className="mt-1.5 text-xs leading-5 text-muted">
                    {
                      option.description
                    }
                  </p>
                </button>
              );
            },
          )}
        </div>

        <div className="mt-5">
          <label
            htmlFor="manual-activity-text"
            className="text-sm font-semibold text-brand"
          >
            Activity notes
          </label>

          <textarea
            id="manual-activity-text"
            name="activityText"
            rows={5}
            required
            maxLength={4000}
            disabled={isPending}
            placeholder="Example: Called owner. Left voicemail and sent follow-up email with audit link."
            className="mt-2 w-full resize-y rounded-xl border border-border bg-white px-3 py-3 text-sm leading-6 text-brand outline-none transition placeholder:text-muted focus:border-brand-blue"
          />
        </div>

        {error ? (
          <div
            role="alert"
            className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
          </div>
        ) : null}

        {message ? (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
            <CheckCircle2
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0"
            />

            {message}
          </div>
        ) : null}

        <Button
          type="submit"
          className="mt-5 w-full"
          disabled={isPending}
        >
          {isPending ? (
            <>
              <LoaderCircle
                aria-hidden="true"
                className="size-4 animate-spin"
              />

              Saving Activity…
            </>
          ) : (
            <>
              <Save
                aria-hidden="true"
                className="size-4"
              />

              Add Activity
            </>
          )}
        </Button>
      </form>
    </Card>
  );
}