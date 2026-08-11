"use client";

import Link from "next/link";
import {
  useMemo,
  useState,
  useTransition,
} from "react";
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  Check,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  RotateCcw,
  UserRound,
} from "lucide-react";

import { completeLeadFollowUp } from "@/app/reports/actions";
import {
  Button,
  Card,
} from "@/components/ui";
import type { AuditReportSummary } from "@/lib/website-audit/storage";

interface FollowUpCommandCenterProps {
  reports: AuditReportSummary[];
}

type FollowUpBucket =
  | "overdue"
  | "today"
  | "upcoming";

function startOfToday(): Date {
  const date =
    new Date();

  date.setHours(
    0,
    0,
    0,
    0,
  );

  return date;
}

function endOfToday(): Date {
  const date =
    new Date();

  date.setHours(
    23,
    59,
    59,
    999,
  );

  return date;
}

function isClosed(
  report: AuditReportSummary,
): boolean {
  return (
    report.lead?.status ===
      "WON" ||
    report.lead?.status ===
      "LOST"
  );
}

function getFollowUpBucket(
  report: AuditReportSummary,
): FollowUpBucket | null {
  const followUp =
    report.lead?.followUpAt;

  if (
    !followUp ||
    isClosed(report)
  ) {
    return null;
  }

  const date =
    new Date(followUp);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return null;
  }

  if (
    date <
    startOfToday()
  ) {
    return "overdue";
  }

  if (
    date <=
    endOfToday()
  ) {
    return "today";
  }

  return "upcoming";
}

function formatDate(
  value: string,
): string {
  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "Unknown date";
  }

  return new Intl.DateTimeFormat(
    "en-US",
    {
      dateStyle: "medium",
    },
  ).format(date);
}

function getPipelineLabel(
  status:
    | "NEW"
    | "CONTACTED"
    | "QUALIFIED"
    | "PROPOSAL"
    | "WON"
    | "LOST",
): string {
  if (
    status === "NEW"
  ) {
    return "New";
  }

  if (
    status ===
    "CONTACTED"
  ) {
    return "Contacted";
  }

  if (
    status ===
    "QUALIFIED"
  ) {
    return "Qualified";
  }

  if (
    status ===
    "PROPOSAL"
  ) {
    return "Proposal";
  }

  if (
    status === "WON"
  ) {
    return "Won";
  }

  return "Lost";
}

function sortByFollowUp(
  reports: AuditReportSummary[],
): AuditReportSummary[] {
  return [
    ...reports,
  ].sort(
    (a, b) => {
      const aTime =
        a.lead?.followUpAt
          ? new Date(
              a.lead.followUpAt,
            ).getTime()
          : Number.POSITIVE_INFINITY;

      const bTime =
        b.lead?.followUpAt
          ? new Date(
              b.lead.followUpAt,
            ).getTime()
          : Number.POSITIVE_INFINITY;

      return (
        aTime -
        bTime
      );
    },
  );
}

function updateFollowUp(
  reports: AuditReportSummary[],
  reportId: string,
  nextFollowUpAt:
    | string
    | null,
): AuditReportSummary[] {
  return reports.map(
    (report) => {
      if (
        report.id !==
          reportId ||
        !report.lead
      ) {
        return report;
      }

      return {
        ...report,

        lead: {
          ...report.lead,

          followUpAt:
            nextFollowUpAt,
        },
      };
    },
  );
}

export function FollowUpCommandCenter({
  reports,
}: FollowUpCommandCenterProps) {
  const [
    localReports,
    setLocalReports,
  ] =
    useState(
      reports,
    );

  const [
    expandedReportId,
    setExpandedReportId,
  ] =
    useState<string | null>(
      null,
    );

  const [
    nextDate,
    setNextDate,
  ] =
    useState("");

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

  const [
    isPending,
    startTransition,
  ] =
    useTransition();

  const activeFollowUps =
    useMemo(
      () =>
        localReports.filter(
          (report) =>
            Boolean(
              report.lead
                ?.followUpAt,
            ) &&
            !isClosed(
              report,
            ),
        ),
      [
        localReports,
      ],
    );

  const overdue =
    useMemo(
      () =>
        sortByFollowUp(
          activeFollowUps.filter(
            (report) =>
              getFollowUpBucket(
                report,
              ) ===
              "overdue",
          ),
        ),
      [
        activeFollowUps,
      ],
    );

  const today =
    useMemo(
      () =>
        sortByFollowUp(
          activeFollowUps.filter(
            (report) =>
              getFollowUpBucket(
                report,
              ) ===
              "today",
          ),
        ),
      [
        activeFollowUps,
      ],
    );

  const upcoming =
    useMemo(
      () =>
        sortByFollowUp(
          activeFollowUps.filter(
            (report) =>
              getFollowUpBucket(
                report,
              ) ===
              "upcoming",
          ),
        ).slice(
          0,
          5,
        ),
      [
        activeFollowUps,
      ],
    );

  const totalDue =
    overdue.length +
    today.length;

  function handleComplete(
    report: AuditReportSummary,
    scheduledNextDate:
      | string
      | null,
  ): void {
    const lead =
      report.lead;

    if (!lead) {
      return;
    }

    const previousFollowUp =
      lead.followUpAt;

    setError(null);
    setMessage(null);

    let optimisticNext:
      | string
      | null = null;

    if (
      scheduledNextDate
    ) {
      const parsed =
        new Date(
          `${scheduledNextDate}T12:00:00`,
        );

      if (
        Number.isNaN(
          parsed.getTime(),
        )
      ) {
        setError(
          "Enter a valid next follow-up date.",
        );

        return;
      }

      optimisticNext =
        parsed.toISOString();
    }

    setLocalReports(
      (current) =>
        updateFollowUp(
          current,
          report.id,
          optimisticNext,
        ),
    );

    setExpandedReportId(
      null,
    );

    setNextDate("");

    startTransition(
      async () => {
        const result =
          await completeLeadFollowUp(
            lead.id,
            report.id,
            scheduledNextDate,
          );

        if (
          !result.success
        ) {
          setLocalReports(
            (current) =>
              updateFollowUp(
                current,
                report.id,
                previousFollowUp,
              ),
          );

          setError(
            result.message ??
              "Could not complete follow-up.",
          );

          return;
        }

        setLocalReports(
          (current) =>
            updateFollowUp(
              current,
              report.id,
              result.nextFollowUpAt ??
                null,
            ),
        );

        setMessage(
          result.message ??
            "Follow-up completed.",
        );
      },
    );
  }

  return (
    <Card
      variant="elevated"
      padding="lg"
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-brand-blue">
            <CalendarClock
              aria-hidden="true"
              className="size-4"
            />

            Follow-Up Command Center
          </div>

          <h2 className="mt-3 font-heading text-2xl font-semibold tracking-tight text-brand">
            Who needs attention next?
          </h2>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
            Complete follow-ups, schedule the next touchpoint, and keep the pipeline moving without opening each lead individually.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <SummaryPill
            label="Overdue"
            value={String(
              overdue.length,
            )}
            tone="danger"
          />

          <SummaryPill
            label="Due Today"
            value={String(
              today.length,
            )}
            tone="warning"
          />

          <SummaryPill
            label="Upcoming"
            value={String(
              upcoming.length,
            )}
            tone="default"
          />
        </div>
      </div>

      {(message ||
        error ||
        isPending) ? (
        <div
          className={`mt-6 flex items-center gap-3 rounded-xl border px-4 py-3 text-sm ${
            error
              ? "border-red-200 bg-red-50 text-red-700"
              : message
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-brand-blue/15 bg-brand-blue/[0.05] text-brand-blue"
          }`}
        >
          {error ? (
            <AlertCircle
              aria-hidden="true"
              className="size-4 shrink-0"
            />
          ) : message ? (
            <CheckCircle2
              aria-hidden="true"
              className="size-4 shrink-0"
            />
          ) : (
            <LoaderCircle
              aria-hidden="true"
              className="size-4 shrink-0 animate-spin"
            />
          )}

          {error
            ? error
            : message
              ? message
              : "Updating follow-up…"}
        </div>
      ) : null}

      {activeFollowUps.length >
      0 ? (
        <div className="mt-7 grid gap-5 xl:grid-cols-3">
          <FollowUpColumn
            title="Overdue"
            description="Needs attention immediately."
            icon={
              AlertTriangle
            }
            reports={
              overdue
            }
            emptyText="No overdue follow-ups."
            tone="danger"
            disabled={
              isPending
            }
            expandedReportId={
              expandedReportId
            }
            nextDate={
              nextDate
            }
            onNextDateChange={
              setNextDate
            }
            onToggleSchedule={(
              reportId,
            ) => {
              setError(null);
              setMessage(null);
              setNextDate("");

              setExpandedReportId(
                (
                  current,
                ) =>
                  current ===
                  reportId
                    ? null
                    : reportId,
              );
            }}
            onComplete={
              handleComplete
            }
          />

          <FollowUpColumn
            title="Today"
            description="Scheduled for today."
            icon={
              Clock3
            }
            reports={
              today
            }
            emptyText="Nothing due today."
            tone="warning"
            disabled={
              isPending
            }
            expandedReportId={
              expandedReportId
            }
            nextDate={
              nextDate
            }
            onNextDateChange={
              setNextDate
            }
            onToggleSchedule={(
              reportId,
            ) => {
              setError(null);
              setMessage(null);
              setNextDate("");

              setExpandedReportId(
                (
                  current,
                ) =>
                  current ===
                  reportId
                    ? null
                    : reportId,
              );
            }}
            onComplete={
              handleComplete
            }
          />

          <FollowUpColumn
            title="Upcoming"
            description="Next scheduled follow-ups."
            icon={
              CheckCircle2
            }
            reports={
              upcoming
            }
            emptyText="No upcoming follow-ups."
            tone="default"
            disabled={
              isPending
            }
            expandedReportId={
              expandedReportId
            }
            nextDate={
              nextDate
            }
            onNextDateChange={
              setNextDate
            }
            onToggleSchedule={(
              reportId,
            ) => {
              setError(null);
              setMessage(null);
              setNextDate("");

              setExpandedReportId(
                (
                  current,
                ) =>
                  current ===
                  reportId
                    ? null
                    : reportId,
              );
            }}
            onComplete={
              handleComplete
            }
          />
        </div>
      ) : (
        <div className="mt-7 rounded-xl border border-dashed border-border bg-slate-50/60 p-8 text-center">
          <CalendarClock
            aria-hidden="true"
            className="mx-auto size-7 text-brand-blue"
          />

          <p className="mt-3 font-heading font-semibold text-brand">
            No follow-ups scheduled.
          </p>

          <p className="mt-2 text-sm text-muted">
            Add follow-up dates inside a lead workspace and they will appear here automatically.
          </p>
        </div>
      )}

      {totalDue >
      0 ? (
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-medium text-amber-800">
            You have{" "}
            {
              totalDue
            }{" "}
            lead
            {totalDue === 1
              ? ""
              : "s"}{" "}
            requiring attention today.
          </p>
        </div>
      ) : null}
    </Card>
  );
}

interface FollowUpColumnProps {
  title: string;

  description: string;

  icon:
    typeof CalendarClock;

  reports:
    AuditReportSummary[];

  emptyText: string;

  tone:
    | "danger"
    | "warning"
    | "default";

  disabled: boolean;

  expandedReportId:
    | string
    | null;

  nextDate: string;

  onNextDateChange: (
    value: string,
  ) => void;

  onToggleSchedule: (
    reportId: string,
  ) => void;

  onComplete: (
    report:
      AuditReportSummary,
    nextDate:
      | string
      | null,
  ) => void;
}

function FollowUpColumn({
  title,
  description,
  icon: Icon,
  reports,
  emptyText,
  tone,
  disabled,
  expandedReportId,
  nextDate,
  onNextDateChange,
  onToggleSchedule,
  onComplete,
}: FollowUpColumnProps) {
  const headerClasses =
    tone === "danger"
      ? "text-red-700"
      : tone === "warning"
        ? "text-amber-700"
        : "text-brand-blue";

  return (
    <section className="rounded-2xl border border-border bg-slate-50/60 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div
            className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] ${headerClasses}`}
          >
            <Icon
              aria-hidden="true"
              className="size-4"
            />

            {title}
          </div>

          <p className="mt-1 text-xs leading-5 text-muted">
            {description}
          </p>
        </div>

        <span className="flex size-7 items-center justify-center rounded-full border border-border bg-white text-xs font-semibold text-muted">
          {
            reports.length
          }
        </span>
      </div>

      <div className="mt-4 space-y-3">
        {reports.length >
        0 ? (
          reports.map(
            (report) => (
              <FollowUpCard
                key={
                  report.id
                }
                report={
                  report
                }
                disabled={
                  disabled
                }
                expanded={
                  expandedReportId ===
                  report.id
                }
                nextDate={
                  nextDate
                }
                onNextDateChange={
                  onNextDateChange
                }
                onToggleSchedule={() =>
                  onToggleSchedule(
                    report.id,
                  )
                }
                onComplete={() =>
                  onComplete(
                    report,
                    null,
                  )
                }
                onCompleteAndSchedule={() =>
                  onComplete(
                    report,
                    nextDate,
                  )
                }
              />
            ),
          )
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-white/70 p-4 text-center">
            <p className="text-xs text-muted">
              {
                emptyText
              }
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

interface FollowUpCardProps {
  report:
    AuditReportSummary;

  disabled: boolean;

  expanded: boolean;

  nextDate: string;

  onNextDateChange: (
    value: string,
  ) => void;

  onToggleSchedule:
    () => void;

  onComplete:
    () => void;

  onCompleteAndSchedule:
    () => void;
}

function FollowUpCard({
  report,
  disabled,
  expanded,
  nextDate,
  onNextDateChange,
  onToggleSchedule,
  onComplete,
  onCompleteAndSchedule,
}: FollowUpCardProps) {
  const lead =
    report.lead;

  if (
    !lead ||
    !lead.followUpAt
  ) {
    return null;
  }

  return (
    <article className="rounded-xl border border-border bg-white p-4 shadow-sm">
      <Link
        href={`/reports/${report.id}`}
        className="group block"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <UserRound
                aria-hidden="true"
                className="size-4 shrink-0 text-brand-blue"
              />

              <p className="truncate font-heading text-sm font-semibold text-brand">
                {
                  lead.firstName
                }{" "}
                {
                  lead.lastName
                }
              </p>
            </div>

            {lead.company ? (
              <p className="mt-1 truncate text-xs text-muted">
                {
                  lead.company
                }
              </p>
            ) : null}
          </div>

          <span className="shrink-0 rounded-full border border-brand-blue/15 bg-brand-blue/[0.06] px-2 py-1 text-[10px] font-semibold text-brand-blue">
            {
              getPipelineLabel(
                lead.status,
              )
            }
          </span>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3 border-t border-border pt-3">
          <span className="text-xs font-medium text-muted">
            {formatDate(
              lead.followUpAt,
            )}
          </span>

          <ArrowRight
            aria-hidden="true"
            className="size-4 text-slate-300 transition-transform group-hover:translate-x-1 group-hover:text-brand-blue"
          />
        </div>
      </Link>

      <div className="mt-4 grid gap-2 border-t border-border pt-4 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
        <Button
          type="button"
          size="sm"
          disabled={
            disabled
          }
          onClick={
            onComplete
          }
        >
          <Check
            aria-hidden="true"
            className="size-4"
          />

          Complete
        </Button>

        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={
            disabled
          }
          onClick={
            onToggleSchedule
          }
        >
          <CalendarClock
            aria-hidden="true"
            className="size-4"
          />

          {expanded
            ? "Cancel"
            : "Schedule Next"}
        </Button>
      </div>

      {expanded ? (
        <div className="mt-3 rounded-xl border border-brand-blue/10 bg-brand-blue/[0.035] p-3">
          <label
            htmlFor={`next-follow-up-${report.id}`}
            className="text-xs font-semibold uppercase tracking-[0.1em] text-brand"
          >
            Next follow-up
          </label>

          <input
            id={`next-follow-up-${report.id}`}
            type="date"
            value={
              nextDate
            }
            disabled={
              disabled
            }
            onChange={(
              event,
            ) =>
              onNextDateChange(
                event.target
                  .value,
              )
            }
            className="mt-2 h-10 w-full rounded-lg border border-border bg-white px-3 text-sm text-brand outline-none transition focus:border-brand-blue"
          />

          <Button
            type="button"
            size="sm"
            className="mt-3 w-full"
            disabled={
              disabled ||
              !nextDate
            }
            onClick={
              onCompleteAndSchedule
            }
          >
            {disabled ? (
              <LoaderCircle
                aria-hidden="true"
                className="size-4 animate-spin"
              />
            ) : (
              <RotateCcw
                aria-hidden="true"
                className="size-4"
              />
            )}

            Complete & Schedule Next
          </Button>
        </div>
      ) : null}
    </article>
  );
}

function SummaryPill({
  label,
  value,
  tone,
}: {
  label: string;

  value: string;

  tone:
    | "danger"
    | "warning"
    | "default";
}) {
  const classes =
    tone === "danger"
      ? "border-red-200 bg-red-50 text-red-700"
      : tone ===
          "warning"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : "border-border bg-slate-50 text-muted";

  return (
    <div
      className={`rounded-xl border px-3 py-2 ${classes}`}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.1em]">
        {label}
      </p>

      <p className="mt-1 font-heading text-lg font-semibold">
        {value}
      </p>
    </div>
  );
}