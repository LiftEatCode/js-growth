"use client";

import Link from "next/link";
import {
  useMemo,
  useState,
} from "react";
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CalendarClock,
  CalendarDays,
  ExternalLink,
  Globe2,
  Mail,
  Phone,
  Search,
  SlidersHorizontal,
  Target,
  UserRoundCheck,
  Users,
  Zap,
} from "lucide-react";

import { ReportDeleteButton } from "@/components/website-audit/report-delete-button";
import { StatBadge } from "@/components/website-audit/report-ui";
import {
  Button,
  Card,
  Input,
} from "@/components/ui";
import type {
  AuditLeadStatus,
  AuditReportSummary,
} from "@/lib/website-audit/storage";

interface ReportsDashboardClientProps {
  reports: AuditReportSummary[];
}

type GradeFilter =
  | "all"
  | "a"
  | "b"
  | "c"
  | "d-f";

type IssueFilter =
  | "all"
  | "critical"
  | "clean";

type PipelineFilter =
  | "all"
  | "prospects"
  | "NEW"
  | "CONTACTED"
  | "QUALIFIED"
  | "PROPOSAL"
  | "WON"
  | "LOST"
  | "follow-up-due"
  | "overdue";

type SortOption =
  | "sales-priority"
  | "newest"
  | "oldest"
  | "score-high"
  | "score-low"
  | "opportunity-high"
  | "opportunity-low"
  | "follow-up";

const GRADE_FILTERS: {
  value: GradeFilter;
  label: string;
}[] = [
  {
    value: "all",
    label: "All Grades",
  },
  {
    value: "a",
    label: "A",
  },
  {
    value: "b",
    label: "B",
  },
  {
    value: "c",
    label: "C",
  },
  {
    value: "d-f",
    label: "D / F",
  },
];

const ISSUE_FILTERS: {
  value: IssueFilter;
  label: string;
}[] = [
  {
    value: "all",
    label: "All Sites",
  },
  {
    value: "critical",
    label:
      "Has Critical Issues",
  },
  {
    value: "clean",
    label:
      "No Critical Issues",
  },
];

const PIPELINE_FILTERS: {
  value: PipelineFilter;
  label: string;
}[] = [
  {
    value: "all",
    label: "All",
  },
  {
    value: "prospects",
    label: "Prospects",
  },
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
  {
    value:
      "follow-up-due",
    label: "Follow-Up Due",
  },
  {
    value: "overdue",
    label: "Overdue",
  },
];

const SORT_OPTIONS: {
  value: SortOption;
  label: string;
}[] = [
  {
    value:
      "sales-priority",
    label:
      "Sales priority",
  },
  {
    value: "follow-up",
    label:
      "Follow-up date",
  },
  {
    value: "newest",
    label:
      "Newest first",
  },
  {
    value: "oldest",
    label:
      "Oldest first",
  },
  {
    value:
      "score-high",
    label:
      "Highest score",
  },
  {
    value:
      "score-low",
    label:
      "Lowest score",
  },
  {
    value:
      "opportunity-high",
    label:
      "Highest opportunity",
  },
  {
    value:
      "opportunity-low",
    label:
      "Lowest opportunity",
  },
];

const CLOSED_STATUSES: AuditLeadStatus[] =
  [
    "WON",
    "LOST",
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
      dateStyle:
        "medium",
      timeStyle:
        "short",
    },
  ).format(date);
}

function formatFollowUpDate(
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
      dateStyle:
        "medium",
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
  return Boolean(
    report.lead &&
      CLOSED_STATUSES.includes(
        report.lead.status,
      ),
  );
}

function isFollowUpDue(
  report: AuditReportSummary,
): boolean {
  if (
    !report.lead
      ?.followUpAt ||
    isClosed(report)
  ) {
    return false;
  }

  const date =
    new Date(
      report.lead
        .followUpAt,
    );

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return false;
  }

  return (
    date <=
    endOfToday()
  );
}

function isOverdue(
  report: AuditReportSummary,
): boolean {
  if (
    !report.lead
      ?.followUpAt ||
    isClosed(report)
  ) {
    return false;
  }

  const date =
    new Date(
      report.lead
        .followUpAt,
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

function getPipelineLabel(
  status: AuditLeadStatus,
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

function getPipelineTone(
  status: AuditLeadStatus,
):
  | "default"
  | "primary"
  | "warning"
  | "success"
  | "danger" {
  if (
    status === "NEW"
  ) {
    return "warning";
  }

  if (
    status ===
      "CONTACTED" ||
    status ===
      "QUALIFIED"
  ) {
    return "primary";
  }

  if (
    status ===
    "PROPOSAL"
  ) {
    return "warning";
  }

  if (
    status === "WON"
  ) {
    return "success";
  }

  return "danger";
}

function getGradeTone(
  grade: string,
):
  | "success"
  | "primary"
  | "warning"
  | "danger"
  | "default" {
  if (
    grade.startsWith(
      "A",
    )
  ) {
    return "success";
  }

  if (
    grade.startsWith(
      "B",
    )
  ) {
    return "primary";
  }

  if (
    grade.startsWith(
      "C",
    )
  ) {
    return "warning";
  }

  if (
    grade.startsWith(
      "D",
    ) ||
    grade.startsWith(
      "F",
    )
  ) {
    return "danger";
  }

  return "default";
}

function matchesGrade(
  grade: string,
  filter: GradeFilter,
): boolean {
  if (
    filter === "all"
  ) {
    return true;
  }

  if (
    filter === "a"
  ) {
    return grade.startsWith(
      "A",
    );
  }

  if (
    filter === "b"
  ) {
    return grade.startsWith(
      "B",
    );
  }

  if (
    filter === "c"
  ) {
    return grade.startsWith(
      "C",
    );
  }

  return (
    grade.startsWith(
      "D",
    ) ||
    grade.startsWith(
      "F",
    )
  );
}

function matchesIssueFilter(
  report: AuditReportSummary,
  filter: IssueFilter,
): boolean {
  if (
    filter === "all"
  ) {
    return true;
  }

  if (
    filter ===
    "critical"
  ) {
    return (
      report.criticalIssues >
      0
    );
  }

  return (
    report.criticalIssues ===
    0
  );
}

function matchesPipelineFilter(
  report: AuditReportSummary,
  filter: PipelineFilter,
): boolean {
  if (
    filter === "all"
  ) {
    return true;
  }

  if (
    filter ===
    "prospects"
  ) {
    return (
      report.lead === null
    );
  }

  if (
    filter ===
    "follow-up-due"
  ) {
    return isFollowUpDue(
      report,
    );
  }

  if (
    filter === "overdue"
  ) {
    return isOverdue(
      report,
    );
  }

  return (
    report.lead
      ?.status ===
    filter
  );
}

function getSalesPriorityScore(
  report: AuditReportSummary,
): number {
  const stageWeight: Record<
    AuditLeadStatus,
    number
  > = {
    NEW: 60,
    CONTACTED: 45,
    QUALIFIED: 80,
    PROPOSAL: 90,
    WON: -100,
    LOST: -150,
  };

  const leadWeight =
    report.lead
      ? stageWeight[
          report.lead
            .status
        ]
      : 10;

  const followUpWeight =
    isOverdue(report)
      ? 70
      : isFollowUpDue(
            report,
          )
        ? 45
        : 0;

  return (
    leadWeight +
    followUpWeight +
    report.opportunityScore +
    Math.max(
      0,
      80 -
        report.overallScore,
    ) +
    report.criticalIssues *
      8 +
    report.quickWins * 2
  );
}

function sortReports(
  reports: AuditReportSummary[],
  sort: SortOption,
): AuditReportSummary[] {
  return [
    ...reports,
  ].sort(
    (a, b) => {
      if (
        sort ===
        "sales-priority"
      ) {
        return (
          getSalesPriorityScore(
            b,
          ) -
          getSalesPriorityScore(
            a,
          )
        );
      }

      if (
        sort ===
        "follow-up"
      ) {
        const aTime =
          a.lead
            ?.followUpAt
            ? new Date(
                a.lead.followUpAt,
              ).getTime()
            : Number.POSITIVE_INFINITY;

        const bTime =
          b.lead
            ?.followUpAt
            ? new Date(
                b.lead.followUpAt,
              ).getTime()
            : Number.POSITIVE_INFINITY;

        return (
          aTime -
          bTime
        );
      }

      if (
        sort ===
        "newest"
      ) {
        return (
          new Date(
            b.createdAt,
          ).getTime() -
          new Date(
            a.createdAt,
          ).getTime()
        );
      }

      if (
        sort ===
        "oldest"
      ) {
        return (
          new Date(
            a.createdAt,
          ).getTime() -
          new Date(
            b.createdAt,
          ).getTime()
        );
      }

      if (
        sort ===
        "score-high"
      ) {
        return (
          b.overallScore -
          a.overallScore
        );
      }

      if (
        sort ===
        "score-low"
      ) {
        return (
          a.overallScore -
          b.overallScore
        );
      }

      if (
        sort ===
        "opportunity-high"
      ) {
        return (
          b.opportunityScore -
          a.opportunityScore
        );
      }

      return (
        a.opportunityScore -
        b.opportunityScore
      );
    },
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
      ?.company,
    report.lead
      ?.phone,
    report.lead
      ?.notes,
  ];

  return fields.some(
    (field) =>
      field
        ?.toLowerCase()
        .includes(
          search,
        ),
  );
}

export function ReportsDashboardClient({
  reports,
}: ReportsDashboardClientProps) {
  const [
    search,
    setSearch,
  ] =
    useState("");

  const [
    gradeFilter,
    setGradeFilter,
  ] =
    useState<GradeFilter>(
      "all",
    );

  const [
    issueFilter,
    setIssueFilter,
  ] =
    useState<IssueFilter>(
      "all",
    );

  const [
    pipelineFilter,
    setPipelineFilter,
  ] =
    useState<PipelineFilter>(
      "all",
    );

  const [
    sort,
    setSort,
  ] =
    useState<SortOption>(
      "sales-priority",
    );

  const visibleReports =
    useMemo(() => {
      const normalizedSearch =
        search
          .trim()
          .toLowerCase();

      const filtered =
        reports.filter(
          (
            report,
          ) =>
            matchesSearch(
              report,
              normalizedSearch,
            ) &&
            matchesGrade(
              report.grade,
              gradeFilter,
            ) &&
            matchesIssueFilter(
              report,
              issueFilter,
            ) &&
            matchesPipelineFilter(
              report,
              pipelineFilter,
            ),
        );

      return sortReports(
        filtered,
        sort,
      );
    }, [
      reports,
      search,
      gradeFilter,
      issueFilter,
      pipelineFilter,
      sort,
    ]);

  function resetFilters(): void {
    setSearch("");

    setGradeFilter(
      "all",
    );

    setIssueFilter(
      "all",
    );

    setPipelineFilter(
      "all",
    );

    setSort(
      "sales-priority",
    );
  }

  return (
    <div className="space-y-6">
      <Card
        variant="elevated"
        padding="lg"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-brand-blue">
              <SlidersHorizontal
                aria-hidden="true"
                className="size-4"
              />

              Pipeline Filters
            </div>

            <h3 className="mt-2 font-heading text-xl font-semibold text-brand">
              Find the right opportunity quickly.
            </h3>

            <p className="mt-2 text-sm leading-6 text-muted">
              Search websites, contacts, companies, emails, or internal notes and filter by pipeline stage, follow-up state, grade, or audit health.
            </p>
          </div>

          <div className="rounded-full border border-border bg-slate-50 px-3 py-1.5 text-xs font-medium text-muted">
            {
              visibleReports.length
            }{" "}
            of{" "}
            {
              reports.length
            }{" "}
            reports
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_230px]">
          <div className="relative">
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
                  event
                    .target
                    .value,
                )
              }
              placeholder="Search website, company, contact, email, notes..."
              className="h-11 pl-11"
            />
          </div>

          <select
            value={
              sort
            }
            onChange={(
              event,
            ) =>
              setSort(
                event
                  .target
                  .value as SortOption,
              )
            }
            className="h-11 rounded-xl border border-border bg-white px-3 text-sm text-brand outline-none transition focus:border-brand-blue"
            aria-label="Sort reports"
          >
            {SORT_OPTIONS.map(
              (
                option,
              ) => (
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

        <div className="mt-6">
          <FilterGroup label="Pipeline">
            {PIPELINE_FILTERS.map(
              (
                filter,
              ) => (
                <Button
                  key={
                    filter.value
                  }
                  type="button"
                  size="sm"
                  variant={
                    pipelineFilter ===
                    filter.value
                      ? "default"
                      : "outline"
                  }
                  onClick={() =>
                    setPipelineFilter(
                      filter.value,
                    )
                  }
                >
                  {
                    filter.label
                  }
                </Button>
              ),
            )}
          </FilterGroup>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <FilterGroup label="Website Grade">
            {GRADE_FILTERS.map(
              (
                filter,
              ) => (
                <Button
                  key={
                    filter.value
                  }
                  type="button"
                  size="sm"
                  variant={
                    gradeFilter ===
                    filter.value
                      ? "default"
                      : "outline"
                  }
                  onClick={() =>
                    setGradeFilter(
                      filter.value,
                    )
                  }
                >
                  {
                    filter.label
                  }
                </Button>
              ),
            )}
          </FilterGroup>

          <FilterGroup label="Critical Issues">
            {ISSUE_FILTERS.map(
              (
                filter,
              ) => (
                <Button
                  key={
                    filter.value
                  }
                  type="button"
                  size="sm"
                  variant={
                    issueFilter ===
                    filter.value
                      ? "default"
                      : "outline"
                  }
                  onClick={() =>
                    setIssueFilter(
                      filter.value,
                    )
                  }
                >
                  {
                    filter.label
                  }
                </Button>
              ),
            )}
          </FilterGroup>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
          <p className="text-xs leading-5 text-muted">
            Sales priority favors qualified opportunities, proposals, due follow-ups, high opportunity scores, weak website health, critical issues, and quick wins.
          </p>

          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={
              resetFilters
            }
          >
            Reset Filters
          </Button>
        </div>
      </Card>

      {visibleReports.length >
      0 ? (
        <div className="space-y-5">
          {visibleReports.map(
            (
              report,
            ) => (
              <ReportCard
                key={
                  report.id
                }
                report={
                  report
                }
              />
            ),
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border bg-white p-10 text-center">
          <Search
            aria-hidden="true"
            className="mx-auto size-7 text-brand-blue"
          />

          <h2 className="mt-4 font-heading text-xl font-semibold text-brand">
            No matching opportunities
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
            Try changing the search, pipeline stage, grade, follow-up state, or critical-issue filters.
          </p>

          <Button
            type="button"
            className="mt-5"
            variant="outline"
            onClick={
              resetFilters
            }
          >
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
}

function ReportCard({
  report,
}: {
  report: AuditReportSummary;
}) {
  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="grid xl:grid-cols-[1fr_360px]">
        <div className="p-5 sm:p-6">
          <div className="flex flex-wrap gap-2">
            <StatBadge
              label={
                report.grade
              }
              tone={getGradeTone(
                report.grade,
              )}
            />

            <StatBadge
              label={`${report.overallScore}/100 website`}
            />

            <StatBadge
              label={`${report.opportunityScore}/100 opportunity`}
              tone="primary"
            />

            {report.lead ? (
              <StatBadge
                label={getPipelineLabel(
                  report.lead
                    .status,
                )}
                tone={getPipelineTone(
                  report.lead
                    .status,
                )}
              />
            ) : (
              <StatBadge
                label="Prospect"
              />
            )}

            {isOverdue(
              report,
            ) ? (
              <StatBadge
                label="Follow-up overdue"
                tone="danger"
              />
            ) : isFollowUpDue(
                report,
              ) ? (
              <StatBadge
                label="Follow-up due"
                tone="warning"
              />
            ) : null}
          </div>

          <div className="mt-5 flex items-center gap-2 text-sm text-muted">
            <Globe2
              aria-hidden="true"
              className="size-4 text-brand-blue"
            />

            {
              report.hostname
            }
          </div>

          <h2 className="mt-1 break-all font-heading text-xl font-semibold tracking-tight text-brand sm:text-2xl">
            {
              report.website
            }
          </h2>

          <div className="mt-5 flex flex-wrap gap-x-6 gap-y-3 text-sm text-muted">
            <span className="inline-flex items-center gap-2">
              <CalendarDays
                aria-hidden="true"
                className="size-4"
              />

              {formatDate(
                report.createdAt,
              )}
            </span>

            <span className="inline-flex items-center gap-2">
              <AlertTriangle
                aria-hidden="true"
                className={
                  report.criticalIssues >
                  0
                    ? "size-4 text-red-500"
                    : "size-4"
                }
              />

              {
                report.criticalIssues
              }{" "}
              critical
            </span>

            <span className="inline-flex items-center gap-2">
              <Zap
                aria-hidden="true"
                className="size-4 text-brand-blue"
              />

              {
                report.quickWins
              }{" "}
              quick wins
            </span>

            <span className="inline-flex items-center gap-2">
              <Target
                aria-hidden="true"
                className="size-4"
              />

              {
                report.opportunityScore
              }{" "}
              opportunity
            </span>
          </div>

          <div className="mt-6 flex flex-col gap-3 border-t border-border pt-5 sm:flex-row">
            <Button
              nativeButton={
                false
              }
              render={
                <Link
                  href={`/reports/${report.id}`}
                />
              }
            >
              Open Workspace

              <ArrowRight
                aria-hidden="true"
                className="ml-1 size-4"
              />
            </Button>

            <Button
              variant="outline"
              nativeButton={
                false
              }
              render={
                <a
                  href={
                    report.website
                  }
                  target="_blank"
                  rel="noreferrer"
                />
              }
            >
              Visit Website

              <ExternalLink
                aria-hidden="true"
                className="ml-1 size-4"
              />
            </Button>

            <ReportDeleteButton
              reportId={
                report.id
              }
              hostname={
                report.hostname
              }
            />
          </div>
        </div>

        <div className="border-t border-border bg-slate-50/60 p-5 sm:p-6 xl:border-l xl:border-t-0">
          {report.lead ? (
            <LeadSummaryPanel
              report={
                report
              }
            />
          ) : (
            <ProspectPanel />
          )}
        </div>
      </div>
    </article>
  );
}

function LeadSummaryPanel({
  report,
}: {
  report: AuditReportSummary;
}) {
  const lead =
    report.lead;

  if (!lead) {
    return null;
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-brand-blue">
            <UserRoundCheck
              aria-hidden="true"
              className="size-4"
            />

            Captured Lead
          </div>

          <h3 className="mt-2 font-heading text-lg font-semibold text-brand">
            {
              lead.firstName
            }{" "}
            {
              lead.lastName
            }
          </h3>
        </div>

        <StatBadge
          label={getPipelineLabel(
            lead.status,
          )}
          tone={getPipelineTone(
            lead.status,
          )}
        />
      </div>

      <div className="mt-5 space-y-3">
        {lead.company ? (
          <LeadDetail
            icon={
              Building2
            }
            value={
              lead.company
            }
          />
        ) : null}

        <LeadDetail
          icon={
            Mail
          }
          value={
            lead.email
          }
          href={`mailto:${lead.email}`}
        />

        {lead.phone ? (
          <LeadDetail
            icon={
              Phone
            }
            value={
              lead.phone
            }
            href={`tel:${lead.phone}`}
          />
        ) : null}

        {lead.followUpAt ? (
          <LeadDetail
            icon={
              CalendarClock
            }
            value={`Follow up ${formatFollowUpDate(
              lead.followUpAt,
            )}`}
            emphasis={
              isFollowUpDue(
                report,
              )
            }
          />
        ) : (
          <LeadDetail
            icon={
              CalendarClock
            }
            value="No follow-up scheduled"
          />
        )}
      </div>

      {lead.notes ? (
        <div className="mt-5 rounded-xl border border-border bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
            Latest notes
          </p>

          <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-sm leading-6 text-muted">
            {
              lead.notes
            }
          </p>
        </div>
      ) : null}

      <Button
        size="sm"
        className="mt-5 w-full"
        nativeButton={
          false
        }
        render={
          <Link
            href={`/reports/${report.id}`}
          />
        }
      >
        Manage Opportunity

        <ArrowRight
          aria-hidden="true"
          className="ml-1 size-4"
        />
      </Button>
    </div>
  );
}

function ProspectPanel() {
  return (
    <div>
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted">
        <Users
          aria-hidden="true"
          className="size-4"
        />

        Prospect
      </div>

      <h3 className="mt-2 font-heading text-lg font-semibold text-brand">
        No lead captured yet.
      </h3>

      <p className="mt-3 text-sm leading-6 text-muted">
        This website has been audited, but nobody has submitted contact information for the professional report.
      </p>

      <div className="mt-5 rounded-xl border border-brand-blue/10 bg-brand-blue/[0.04] p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-blue">
          Outreach Opportunity
        </p>

        <p className="mt-2 text-sm leading-6 text-muted">
          Review the audit and decide whether this site is worth proactive outreach.
        </p>
      </div>
    </div>
  );
}

interface LeadDetailProps {
  icon:
    typeof Mail;

  value: string;

  href?: string;

  emphasis?: boolean;
}

function LeadDetail({
  icon: Icon,
  value,
  href,
  emphasis = false,
}: LeadDetailProps) {
  const content = (
    <>
      <Icon
        aria-hidden="true"
        className={`size-4 shrink-0 ${
          emphasis
            ? "text-amber-600"
            : "text-brand-blue"
        }`}
      />

      <span
        className={`min-w-0 break-words ${
          emphasis
            ? "font-medium text-amber-700"
            : ""
        }`}
      >
        {value}
      </span>
    </>
  );

  if (href) {
    return (
      <a
        href={
          href
        }
        className="flex items-start gap-3 text-sm leading-6 text-muted transition hover:text-brand-blue"
      >
        {content}
      </a>
    );
  }

  return (
    <div className="flex items-start gap-3 text-sm leading-6 text-muted">
      {content}
    </div>
  );
}

interface FilterGroupProps {
  label: string;

  children:
    React.ReactNode;
}

function FilterGroup({
  label,
  children,
}: FilterGroupProps) {
  return (
    <div>
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted">
        {label}
      </p>

      <div className="flex flex-wrap gap-2">
        {children}
      </div>
    </div>
  );
}