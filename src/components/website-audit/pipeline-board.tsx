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
  Building2,
  CalendarClock,
  CheckCircle2,
  Filter,
  Globe2,
  GripVertical,
  LoaderCircle,
  Mail,
  RotateCcw,
  Search,
  Target,
  UserRound,
} from "lucide-react";

import { updateLeadBoardStatus } from "@/app/reports/actions";
import {
  Button,
  Card,
  Input,
} from "@/components/ui";
import type {
  AuditLeadStatus,
  AuditReportSummary,
} from "@/lib/website-audit/storage";

interface PipelineBoardProps {
  reports: AuditReportSummary[];
}

interface PipelineColumn {
  status: AuditLeadStatus;
  label: string;
  description: string;
}

type BoardFilter =
  | "all"
  | "overdue"
  | "due-today"
  | "no-follow-up"
  | "high-opportunity";

const PIPELINE_COLUMNS: PipelineColumn[] =
  [
    {
      status: "NEW",
      label: "New",
      description:
        "Fresh leads that need first contact.",
    },
    {
      status: "CONTACTED",
      label: "Contacted",
      description:
        "Initial outreach has been made.",
    },
    {
      status: "QUALIFIED",
      label: "Qualified",
      description:
        "Confirmed fit and active interest.",
    },
    {
      status: "PROPOSAL",
      label: "Proposal",
      description:
        "Pricing or scope has been presented.",
    },
    {
      status: "WON",
      label: "Won",
      description:
        "Converted into a customer.",
    },
    {
      status: "LOST",
      label: "Lost",
      description:
        "Closed without conversion.",
    },
  ];

const BOARD_FILTERS: {
  value: BoardFilter;
  label: string;
}[] = [
  {
    value: "all",
    label: "All Leads",
  },
  {
    value: "overdue",
    label: "Overdue",
  },
  {
    value: "due-today",
    label: "Due Today",
  },
  {
    value: "no-follow-up",
    label: "No Follow-Up",
  },
  {
    value: "high-opportunity",
    label: "High Opportunity",
  },
];

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

function isOverdue(
  report: AuditReportSummary,
): boolean {
  const followUp =
    report.lead
      ?.followUpAt;

  if (
    !followUp ||
    isClosed(report)
  ) {
    return false;
  }

  const date =
    new Date(
      followUp,
    );

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return false;
  }

  return (
    date <
    startOfToday()
  );
}

function isDueToday(
  report: AuditReportSummary,
): boolean {
  const followUp =
    report.lead
      ?.followUpAt;

  if (
    !followUp ||
    isClosed(report)
  ) {
    return false;
  }

  const date =
    new Date(
      followUp,
    );

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return false;
  }

  return (
    date >=
      startOfToday() &&
    date <=
      endOfToday()
  );
}

function hasNoFollowUp(
  report: AuditReportSummary,
): boolean {
  return Boolean(
    report.lead &&
      !report.lead
        .followUpAt &&
      !isClosed(report),
  );
}

function isHighOpportunity(
  report: AuditReportSummary,
): boolean {
  return (
    report.opportunityScore >=
    70
  );
}

function matchesSearch(
  report: AuditReportSummary,
  search: string,
): boolean {
  if (!search) {
    return true;
  }

  const fields = [
    report.hostname,
    report.website,
    report.lead
      ?.firstName,
    report.lead
      ?.lastName,
    report.lead
      ?.email,
    report.lead
      ?.phone,
    report.lead
      ?.company,
    report.lead
      ?.notes,
  ];

  return fields.some(
    (field) =>
      field
        ?.toLowerCase()
        .includes(search),
  );
}

function matchesBoardFilter(
  report: AuditReportSummary,
  filter: BoardFilter,
): boolean {
  if (
    filter === "all"
  ) {
    return true;
  }

  if (
    filter === "overdue"
  ) {
    return isOverdue(
      report,
    );
  }

  if (
    filter ===
    "due-today"
  ) {
    return isDueToday(
      report,
    );
  }

  if (
    filter ===
    "no-follow-up"
  ) {
    return hasNoFollowUp(
      report,
    );
  }

  return isHighOpportunity(
    report,
  );
}

function getStageReports(
  reports: AuditReportSummary[],
  status: AuditLeadStatus,
): AuditReportSummary[] {
  return reports
    .filter(
      (report) =>
        report.lead
          ?.status ===
        status,
    )
    .sort(
      (a, b) => {
        const aOverdue =
          isOverdue(a);

        const bOverdue =
          isOverdue(b);

        if (
          aOverdue !==
          bOverdue
        ) {
          return aOverdue
            ? -1
            : 1;
        }

        const aDueToday =
          isDueToday(a);

        const bDueToday =
          isDueToday(b);

        if (
          aDueToday !==
          bDueToday
        ) {
          return aDueToday
            ? -1
            : 1;
        }

        const aFollowUp =
          a.lead
            ?.followUpAt
            ? new Date(
                a.lead.followUpAt,
              ).getTime()
            : Number.POSITIVE_INFINITY;

        const bFollowUp =
          b.lead
            ?.followUpAt
            ? new Date(
                b.lead.followUpAt,
              ).getTime()
            : Number.POSITIVE_INFINITY;

        if (
          aFollowUp !==
          bFollowUp
        ) {
          return (
            aFollowUp -
            bFollowUp
          );
        }

        return (
          b.opportunityScore -
          a.opportunityScore
        );
      },
    );
}

function updateReportStatus(
  reports: AuditReportSummary[],
  reportId: string,
  status: AuditLeadStatus,
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

          status,

          contacted:
            status !==
            "NEW",
        },
      };
    },
  );
}

export function PipelineBoard({
  reports,
}: PipelineBoardProps) {
  const [
    localReports,
    setLocalReports,
  ] =
    useState(
      reports,
    );

  const [
    search,
    setSearch,
  ] =
    useState("");

  const [
    boardFilter,
    setBoardFilter,
  ] =
    useState<BoardFilter>(
      "all",
    );

  const [
    draggedReportId,
    setDraggedReportId,
  ] =
    useState<string | null>(
      null,
    );

  const [
    activeDropStatus,
    setActiveDropStatus,
  ] =
    useState<AuditLeadStatus | null>(
      null,
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

  const [
    isPending,
    startTransition,
  ] =
    useTransition();

  const normalizedSearch =
    search
      .trim()
      .toLowerCase();

  const filteredReports =
    useMemo(
      () =>
        localReports.filter(
          (report) =>
            matchesSearch(
              report,
              normalizedSearch,
            ) &&
            matchesBoardFilter(
              report,
              boardFilter,
            ),
        ),
      [
        localReports,
        normalizedSearch,
        boardFilter,
      ],
    );

  const filteredLeads =
    useMemo(
      () =>
        filteredReports.filter(
          (report) =>
            report.lead !==
            null,
        ),
      [
        filteredReports,
      ],
    );

  const prospects =
    useMemo(
      () =>
        filteredReports.filter(
          (report) =>
            report.lead ===
            null,
        ),
      [
        filteredReports,
      ],
    );

  const totalLeads =
    localReports.filter(
      (report) =>
        report.lead !==
        null,
    ).length;

  const visibleLeadCount =
    filteredLeads.length;

  const overdueCount =
    localReports.filter(
      (report) =>
        isOverdue(
          report,
        ),
    ).length;

  const dueTodayCount =
    localReports.filter(
      (report) =>
        isDueToday(
          report,
        ),
    ).length;

  const highOpportunityCount =
    localReports.filter(
      (report) =>
        report.lead &&
        isHighOpportunity(
          report,
        ),
    ).length;

  const hasFilters =
    Boolean(
      normalizedSearch ||
        boardFilter !==
          "all",
    );

  function resetFilters(): void {
    setSearch("");

    setBoardFilter(
      "all",
    );
  }

  function moveReport(
    reportId: string,
    nextStatus: AuditLeadStatus,
  ): void {
    const report =
      localReports.find(
        (item) =>
          item.id ===
          reportId,
      );

    if (
      !report?.lead ||
      report.lead.status ===
        nextStatus
    ) {
      setDraggedReportId(
        null,
      );

      setActiveDropStatus(
        null,
      );

      return;
    }

    const previousStatus =
      report.lead.status;

    setError(null);
    setMessage(null);

    setLocalReports(
      (current) =>
        updateReportStatus(
          current,
          reportId,
          nextStatus,
        ),
    );

    setDraggedReportId(
      null,
    );

    setActiveDropStatus(
      null,
    );

    startTransition(
      async () => {
        const result =
          await updateLeadBoardStatus(
            report.lead!.id,
            report.id,
            nextStatus,
          );

        if (
          !result.success
        ) {
          setLocalReports(
            (current) =>
              updateReportStatus(
                current,
                reportId,
                previousStatus,
              ),
          );

          setError(
            result.message ??
              "Could not move lead.",
          );

          return;
        }

        setMessage(
          result.message ??
            "Pipeline updated.",
        );
      },
    );
  }

  return (
    <div className="space-y-6">
      <Card
        variant="elevated"
        padding="lg"
      >
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-brand-blue">
              <Filter
                aria-hidden="true"
                className="size-4"
              />

              Board Controls
            </div>

            <h3 className="mt-2 font-heading text-xl font-semibold text-brand">
              Focus the pipeline.
            </h3>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
              Search the board or isolate leads that need attention without leaving the Kanban view.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            <BoardStat
              label="Visible"
              value={`${visibleLeadCount}/${totalLeads}`}
            />

            <BoardStat
              label="Overdue"
              value={String(
                overdueCount,
              )}
            />

            <BoardStat
              label="Due Today"
              value={String(
                dueTodayCount,
              )}
            />

            <BoardStat
              label="High Opportunity"
              value={String(
                highOpportunityCount,
              )}
            />
          </div>
        </div>

        <div className="relative mt-6">
          <Search
            aria-hidden="true"
            className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted"
          />

          <Input
            value={
              search
            }
            onChange={(
              event,
            ) =>
              setSearch(
                event.target
                  .value,
              )
            }
            placeholder="Search name, company, email, website, phone, or notes..."
            className="h-11 pl-11"
          />
        </div>

        <div className="mt-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted">
            Quick Filters
          </p>

          <div className="flex flex-wrap gap-2">
            {BOARD_FILTERS.map(
              (filter) => (
                <Button
                  key={
                    filter.value
                  }
                  type="button"
                  size="sm"
                  variant={
                    boardFilter ===
                    filter.value
                      ? "default"
                      : "outline"
                  }
                  onClick={() =>
                    setBoardFilter(
                      filter.value,
                    )
                  }
                >
                  {
                    filter.label
                  }

                  {filter.value ===
                    "overdue" &&
                  overdueCount >
                    0 ? (
                    <span className="ml-1 rounded-full bg-white/15 px-1.5 py-0.5 text-[10px]">
                      {
                        overdueCount
                      }
                    </span>
                  ) : null}

                  {filter.value ===
                    "due-today" &&
                  dueTodayCount >
                    0 ? (
                    <span className="ml-1 rounded-full bg-white/15 px-1.5 py-0.5 text-[10px]">
                      {
                        dueTodayCount
                      }
                    </span>
                  ) : null}
                </Button>
              ),
            )}
          </div>
        </div>

        {hasFilters ? (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
            <p className="text-xs text-muted">
              Showing{" "}
              {
                visibleLeadCount
              }{" "}
              matching lead
              {visibleLeadCount ===
              1
                ? ""
                : "s"}
              .
            </p>

            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={
                resetFilters
              }
            >
              <RotateCcw
                aria-hidden="true"
                className="size-4"
              />

              Clear Filters
            </Button>
          </div>
        ) : null}
      </Card>

      {(message ||
        error ||
        isPending) ? (
        <div
          className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm ${
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
              : "Updating pipeline…"}
        </div>
      ) : null}

      {prospects.length >
      0 ? (
        <Card
          variant="elevated"
          padding="lg"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                <Globe2
                  aria-hidden="true"
                  className="size-4"
                />

                Prospects
              </div>

              <h3 className="mt-2 font-heading text-xl font-semibold text-brand">
                Audited sites without captured leads.
              </h3>

              <p className="mt-2 text-sm leading-6 text-muted">
                These audits sit outside the formal sales pipeline until contact information is captured.
              </p>
            </div>

            <span className="rounded-full border border-border bg-slate-50 px-3 py-1.5 text-xs font-semibold text-muted">
              {
                prospects.length
              }{" "}
              prospects
            </span>
          </div>

          <div className="mt-5 flex gap-3 overflow-x-auto pb-2">
            {prospects
              .slice(
                0,
                8,
              )
              .map(
                (
                  report,
                ) => (
                  <Link
                    key={
                      report.id
                    }
                    href={`/reports/${report.id}`}
                    className="group min-w-[260px] rounded-xl border border-border bg-slate-50/60 p-4 transition hover:border-brand-blue/20 hover:bg-brand-blue/[0.035]"
                  >
                    <p className="truncate font-heading font-semibold text-brand">
                      {
                        report.hostname
                      }
                    </p>

                    <p className="mt-2 text-xs leading-5 text-muted">
                      Website{" "}
                      {
                        report.overallScore
                      }
                      /100 · Opportunity{" "}
                      {
                        report.opportunityScore
                      }
                      /100
                    </p>

                    <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                      <span className="text-xs text-muted">
                        {
                          report.criticalIssues
                        }{" "}
                        critical
                      </span>

                      <ArrowRight
                        aria-hidden="true"
                        className="size-4 text-slate-300 transition-transform group-hover:translate-x-1 group-hover:text-brand-blue"
                      />
                    </div>
                  </Link>
                ),
              )}
          </div>
        </Card>
      ) : null}

      {visibleLeadCount >
      0 ? (
        <>
          <div className="rounded-xl border border-brand-blue/10 bg-brand-blue/[0.035] px-4 py-3 text-xs leading-5 text-muted">
            Drag cards between columns on desktop, or use the{" "}
            <strong className="font-semibold text-brand">
              Move to
            </strong>{" "}
            selector on any device.
          </div>

          <div className="overflow-x-auto pb-4">
            <div className="grid min-w-[1500px] grid-cols-6 gap-4">
              {PIPELINE_COLUMNS.map(
                (column) => {
                  const stageReports =
                    getStageReports(
                      filteredLeads,
                      column.status,
                    );

                  const isActive =
                    activeDropStatus ===
                    column.status;

                  return (
                    <section
                      key={
                        column.status
                      }
                      onDragOver={(
                        event,
                      ) => {
                        event.preventDefault();

                        setActiveDropStatus(
                          column.status,
                        );
                      }}
                      onDragLeave={() =>
                        setActiveDropStatus(
                          null,
                        )
                      }
                      onDrop={(
                        event,
                      ) => {
                        event.preventDefault();

                        const reportId =
                          event.dataTransfer.getData(
                            "text/plain",
                          ) ||
                          draggedReportId;

                        if (reportId) {
                          moveReport(
                            reportId,
                            column.status,
                          );
                        }
                      }}
                      className={`rounded-2xl border p-3 transition ${
                        isActive
                          ? "border-brand-blue bg-brand-blue/[0.07] shadow-sm"
                          : "border-border bg-slate-100/70"
                      }`}
                    >
                      <div className="px-1 pb-3">
                        <div className="flex items-center justify-between gap-3">
                          <h3 className="font-heading text-base font-semibold text-brand">
                            {
                              column.label
                            }
                          </h3>

                          <span className="flex size-7 items-center justify-center rounded-full border border-border bg-white text-xs font-semibold text-muted">
                            {
                              stageReports.length
                            }
                          </span>
                        </div>

                        <p className="mt-1 text-xs leading-5 text-muted">
                          {
                            column.description
                          }
                        </p>
                      </div>

                      <div className="space-y-3">
                        {stageReports.length >
                        0 ? (
                          stageReports.map(
                            (
                              report,
                            ) => (
                              <PipelineCard
                                key={
                                  report.id
                                }
                                report={
                                  report
                                }
                                disabled={
                                  isPending
                                }
                                onDragStart={() =>
                                  setDraggedReportId(
                                    report.id,
                                  )
                                }
                                onDragEnd={() => {
                                  setDraggedReportId(
                                    null,
                                  );

                                  setActiveDropStatus(
                                    null,
                                  );
                                }}
                                onMove={(
                                  status,
                                ) =>
                                  moveReport(
                                    report.id,
                                    status,
                                  )
                                }
                              />
                            ),
                          )
                        ) : (
                          <div
                            className={`rounded-xl border border-dashed p-5 text-center transition ${
                              isActive
                                ? "border-brand-blue/40 bg-white"
                                : "border-border bg-white/60"
                            }`}
                          >
                            <p className="text-xs text-muted">
                              {isActive
                                ? "Drop lead here."
                                : hasFilters
                                  ? "No matching leads."
                                  : "No leads in this stage."}
                            </p>
                          </div>
                        )}
                      </div>
                    </section>
                  );
                },
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="rounded-2xl border border-dashed border-border bg-white p-10 text-center">
          <Search
            aria-hidden="true"
            className="mx-auto size-7 text-brand-blue"
          />

          <h3 className="mt-4 font-heading text-xl font-semibold text-brand">
            No matching leads
          </h3>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
            No pipeline opportunities match the current board search and filters.
          </p>

          <Button
            type="button"
            variant="outline"
            className="mt-5"
            onClick={
              resetFilters
            }
          >
            <RotateCcw
              aria-hidden="true"
              className="size-4"
            />

            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
}

interface PipelineCardProps {
  report: AuditReportSummary;

  disabled: boolean;

  onDragStart: () => void;

  onDragEnd: () => void;

  onMove: (
    status: AuditLeadStatus,
  ) => void;
}

function PipelineCard({
  report,
  disabled,
  onDragStart,
  onDragEnd,
  onMove,
}: PipelineCardProps) {
  const lead =
    report.lead;

  if (!lead) {
    return null;
  }

  const overdue =
    isOverdue(
      report,
    );

  const dueToday =
    isDueToday(
      report,
    );

  return (
    <article
      draggable={
        !disabled
      }
      onDragStart={(
        event,
      ) => {
        event.dataTransfer.effectAllowed =
          "move";

        event.dataTransfer.setData(
          "text/plain",
          report.id,
        );

        onDragStart();
      }}
      onDragEnd={
        onDragEnd
      }
      className="rounded-xl border border-border bg-white p-4 shadow-sm transition hover:border-brand-blue/20 hover:shadow-md"
    >
      <div className="flex items-start gap-2">
        <span
          title="Drag to another stage"
          className="mt-0.5 cursor-grab text-slate-300 active:cursor-grabbing"
        >
          <GripVertical
            aria-hidden="true"
            className="size-4"
          />
        </span>

        <div className="min-w-0 flex-1">
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
                  <div className="mt-2 flex items-center gap-2 text-xs text-muted">
                    <Building2
                      aria-hidden="true"
                      className="size-3.5 shrink-0"
                    />

                    <span className="truncate">
                      {
                        lead.company
                      }
                    </span>
                  </div>
                ) : null}
              </div>

              <span className="shrink-0 rounded-full border border-brand-blue/15 bg-brand-blue/[0.06] px-2 py-1 text-[10px] font-semibold text-brand-blue">
                {
                  report.opportunityScore
                }
              </span>
            </div>

            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 text-xs text-muted">
                <Globe2
                  aria-hidden="true"
                  className="size-3.5 shrink-0"
                />

                <span className="truncate">
                  {
                    report.hostname
                  }
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted">
                <Mail
                  aria-hidden="true"
                  className="size-3.5 shrink-0"
                />

                <span className="truncate">
                  {
                    lead.email
                  }
                </span>
              </div>

              {lead.followUpAt ? (
                <div
                  className={`flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs ${
                    overdue
                      ? "bg-red-50 text-red-700"
                      : dueToday
                        ? "bg-amber-50 text-amber-700"
                        : "bg-slate-50 text-muted"
                  }`}
                >
                  {overdue ? (
                    <AlertTriangle
                      aria-hidden="true"
                      className="size-3.5 shrink-0"
                    />
                  ) : (
                    <CalendarClock
                      aria-hidden="true"
                      className="size-3.5 shrink-0"
                    />
                  )}

                  <span>
                    {overdue
                      ? "Overdue · "
                      : dueToday
                        ? "Due today · "
                        : "Follow up · "}

                    {formatDate(
                      lead.followUpAt,
                    )}
                  </span>
                </div>
              ) : (
                !isClosed(
                  report,
                ) && (
                  <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-2.5 py-2 text-xs text-muted">
                    <CalendarClock
                      aria-hidden="true"
                      className="size-3.5 shrink-0"
                    />

                    No follow-up scheduled
                  </div>
                )
              )}
            </div>

            <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-3">
              <div className="flex items-center gap-1.5 text-xs text-muted">
                <Target
                  aria-hidden="true"
                  className="size-3.5"
                />

                {
                  report.opportunityScore
                }
                /100
              </div>

              <ArrowRight
                aria-hidden="true"
                className="size-4 text-slate-300 transition-transform group-hover:translate-x-1 group-hover:text-brand-blue"
              />
            </div>
          </Link>

          <div className="mt-3 border-t border-border pt-3">
            <label
              htmlFor={`move-${report.id}`}
              className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted"
            >
              Move to
            </label>

            <select
              id={`move-${report.id}`}
              value={
                lead.status
              }
              disabled={
                disabled
              }
              onChange={(
                event,
              ) =>
                onMove(
                  event.target
                    .value as AuditLeadStatus,
                )
              }
              className="mt-1.5 h-9 w-full rounded-lg border border-border bg-white px-2 text-xs text-brand outline-none transition focus:border-brand-blue disabled:cursor-not-allowed disabled:opacity-60"
            >
              {PIPELINE_COLUMNS.map(
                (
                  column,
                ) => (
                  <option
                    key={
                      column.status
                    }
                    value={
                      column.status
                    }
                  >
                    {
                      column.label
                    }
                  </option>
                ),
              )}
            </select>
          </div>
        </div>
      </div>
    </article>
  );
}

function BoardStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-slate-50 px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted">
        {label}
      </p>

      <p className="mt-1 font-heading text-sm font-semibold text-brand">
        {value}
      </p>
    </div>
  );
}