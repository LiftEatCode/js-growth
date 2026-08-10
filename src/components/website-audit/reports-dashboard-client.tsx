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
  CalendarDays,
  CheckCircle2,
  ExternalLink,
  Globe2,
  Mail,
  Phone,
  Search,
  SlidersHorizontal,
  Target,
  UserRound,
  UserRoundCheck,
  Users,
  Zap,
} from "lucide-react";

import { updateLeadContacted } from "@/app/reports/actions";
import { ReportDeleteButton } from "@/components/website-audit/report-delete-button";
import { StatBadge } from "@/components/website-audit/report-ui";
import {
  Button,
  Card,
  Input,
} from "@/components/ui";
import type { AuditReportSummary } from "@/lib/website-audit/storage";

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

type LeadFilter =
  | "all"
  | "leads"
  | "prospects"
  | "contacted"
  | "not-contacted";

type SortOption =
  | "newest"
  | "oldest"
  | "score-high"
  | "score-low"
  | "opportunity-high"
  | "opportunity-low"
  | "sales-priority";

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
    label: "Has Critical Issues",
  },
  {
    value: "clean",
    label: "No Critical Issues",
  },
];

const LEAD_FILTERS: {
  value: LeadFilter;
  label: string;
}[] = [
  {
    value: "all",
    label: "All Reports",
  },
  {
    value: "leads",
    label: "Captured Leads",
  },
  {
    value: "prospects",
    label: "Prospects Only",
  },
  {
    value: "not-contacted",
    label: "Needs Follow-Up",
  },
  {
    value: "contacted",
    label: "Contacted",
  },
];

const SORT_OPTIONS: {
  value: SortOption;
  label: string;
}[] = [
  {
    value: "sales-priority",
    label: "Sales priority",
  },
  {
    value: "newest",
    label: "Newest first",
  },
  {
    value: "oldest",
    label: "Oldest first",
  },
  {
    value: "score-high",
    label: "Highest score",
  },
  {
    value: "score-low",
    label: "Lowest score",
  },
  {
    value: "opportunity-high",
    label: "Highest opportunity",
  },
  {
    value: "opportunity-low",
    label: "Lowest opportunity",
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
      timeStyle: "short",
    },
  ).format(date);
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
    grade.startsWith("A")
  ) {
    return "success";
  }

  if (
    grade.startsWith("B")
  ) {
    return "primary";
  }

  if (
    grade.startsWith("C")
  ) {
    return "warning";
  }

  if (
    grade.startsWith("D") ||
    grade.startsWith("F")
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
    grade.startsWith("D") ||
    grade.startsWith("F")
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

function matchesLeadFilter(
  report: AuditReportSummary,
  filter: LeadFilter,
): boolean {
  if (
    filter === "all"
  ) {
    return true;
  }

  if (
    filter === "leads"
  ) {
    return (
      report.lead !== null
    );
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
    "contacted"
  ) {
    return (
      report.lead?.contacted ===
      true
    );
  }

  return (
    report.lead !== null &&
    !report.lead.contacted
  );
}

function getSalesPriorityScore(
  report: AuditReportSummary,
): number {
  const leadScore =
    report.lead
      ? report.lead.contacted
        ? 20
        : 50
      : 0;

  const opportunityScore =
    report.opportunityScore;

  const weakSiteScore =
    Math.max(
      0,
      80 -
        report.overallScore,
    );

  const criticalScore =
    report.criticalIssues *
    8;

  const quickWinScore =
    report.quickWins * 2;

  return (
    leadScore +
    opportunityScore +
    weakSiteScore +
    criticalScore +
    quickWinScore
  );
}

function sortReports(
  reports: AuditReportSummary[],
  sort: SortOption,
): AuditReportSummary[] {
  return [...reports].sort(
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
        sort === "newest"
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
        sort === "oldest"
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
    report.lead?.firstName,
    report.lead?.lastName,
    report.lead?.email,
    report.lead?.company,
    report.lead?.phone,
  ];

  return fields.some(
    (field) =>
      field
        ?.toLowerCase()
        .includes(search),
  );
}

export function ReportsDashboardClient({
  reports,
}: ReportsDashboardClientProps) {
  const [
    search,
    setSearch,
  ] = useState("");

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
    leadFilter,
    setLeadFilter,
  ] =
    useState<LeadFilter>(
      "all",
    );

  const [
    sort,
    setSort,
  ] =
    useState<SortOption>(
      "sales-priority",
    );

  const [
    localReports,
    setLocalReports,
  ] =
    useState(reports);

  const visibleReports =
    useMemo(() => {
      const normalizedSearch =
        search
          .trim()
          .toLowerCase();

      const filtered =
        localReports.filter(
          (report) =>
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
            matchesLeadFilter(
              report,
              leadFilter,
            ),
        );

      return sortReports(
        filtered,
        sort,
      );
    }, [
      localReports,
      search,
      gradeFilter,
      issueFilter,
      leadFilter,
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
    setLeadFilter(
      "all",
    );
    setSort(
      "sales-priority",
    );
  }

  function updateLocalLeadStatus(
    leadId: string,
    contacted: boolean,
  ): void {
    setLocalReports(
      (currentReports) =>
        currentReports.map(
          (report) => {
            if (
              report.lead?.id !==
              leadId
            ) {
              return report;
            }

            return {
              ...report,

              lead: {
                ...report.lead,
                contacted,
              },
            };
          },
        ),
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

              Report Filters
            </div>

            <h3 className="mt-2 font-heading text-xl font-semibold text-brand">
              Find the right opportunity quickly.
            </h3>

            <p className="mt-2 text-sm leading-6 text-muted">
              Search websites,
              contacts, companies, or
              email addresses and
              narrow the list by lead
              state or audit health.
            </p>
          </div>

          <div className="rounded-full border border-border bg-slate-50 px-3 py-1.5 text-xs font-medium text-muted">
            {visibleReports.length} of{" "}
            {localReports.length} reports
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_230px]">
          <div className="relative">
            <Search
              aria-hidden="true"
              className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted"
            />

            <Input
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value,
                )
              }
              placeholder="Search website, company, contact, email..."
              className="h-11 pl-11"
            />
          </div>

          <select
            value={sort}
            onChange={(event) =>
              setSort(
                event.target
                  .value as SortOption,
              )
            }
            className="h-11 rounded-xl border border-border bg-white px-3 text-sm text-brand outline-none transition focus:border-brand-blue"
            aria-label="Sort reports"
          >
            {SORT_OPTIONS.map(
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

        <div className="mt-6 grid gap-6 xl:grid-cols-3">
          <FilterGroup label="Lead Status">
            {LEAD_FILTERS.map(
              (filter) => (
                <Button
                  key={
                    filter.value
                  }
                  type="button"
                  size="sm"
                  variant={
                    leadFilter ===
                    filter.value
                      ? "default"
                      : "outline"
                  }
                  onClick={() =>
                    setLeadFilter(
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

          <FilterGroup label="Website Grade">
            {GRADE_FILTERS.map(
              (filter) => (
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
              (filter) => (
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
            Sales priority favors
            engaged leads, high
            opportunity scores, weak
            website health, critical
            issues, and quick wins.
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
            (report) => (
              <ReportCard
                key={report.id}
                report={report}
                onLeadStatusChange={
                  updateLocalLeadStatus
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
            No matching reports
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
            Try changing the search,
            lead status, grade, or
            critical-issue filters.
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

interface ReportCardProps {
  report: AuditReportSummary;
  onLeadStatusChange: (
    leadId: string,
    contacted: boolean,
  ) => void;
}

function ReportCard({
  report,
  onLeadStatusChange,
}: ReportCardProps) {
  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="grid xl:grid-cols-[1fr_360px]">
        <div className="p-5 sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
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
                    label={
                      report.lead
                        .contacted
                        ? "Contacted"
                        : "Needs follow-up"
                    }
                    tone={
                      report.lead
                        .contacted
                        ? "success"
                        : "warning"
                    }
                  />
                ) : (
                  <StatBadge
                    label="Prospect"
                  />
                )}
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
                {report.website}
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
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 border-t border-border pt-5 sm:flex-row">
            <Button
              nativeButton={false}
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
              nativeButton={false}
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
            <LeadPanel
              lead={
                report.lead
              }
              onStatusChange={
                onLeadStatusChange
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

interface LeadPanelProps {
  lead: NonNullable<
    AuditReportSummary["lead"]
  >;
  onStatusChange: (
    leadId: string,
    contacted: boolean,
  ) => void;
}

function LeadPanel({
  lead,
  onStatusChange,
}: LeadPanelProps) {
  const [
    isPending,
    startTransition,
  ] = useTransition();

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null,
    );

  function handleStatusChange(): void {
    setError(null);

    const nextContacted =
      !lead.contacted;

    startTransition(
      async () => {
        const result =
          await updateLeadContacted(
            lead.id,
            nextContacted,
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

        onStatusChange(
          lead.id,
          result.contacted ??
            nextContacted,
        );
      },
    );
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
            {lead.firstName}{" "}
            {lead.lastName}
          </h3>
        </div>

        <span
          className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] ${
            lead.contacted
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-amber-200 bg-amber-50 text-amber-700"
          }`}
        >
          {lead.contacted
            ? "Contacted"
            : "Follow Up"}
        </span>
      </div>

      <div className="mt-5 space-y-3">
        {lead.company ? (
          <LeadDetail
            icon={Building2}
            value={
              lead.company
            }
          />
        ) : null}

        <LeadDetail
          icon={Mail}
          value={lead.email}
          href={`mailto:${lead.email}`}
        />

        {lead.phone ? (
          <LeadDetail
            icon={Phone}
            value={lead.phone}
            href={`tel:${lead.phone}`}
          />
        ) : null}

        <LeadDetail
          icon={CalendarDays}
          value={`Captured ${formatDate(
            lead.createdAt,
          )}`}
        />
      </div>

      {error ? (
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs leading-5 text-red-700">
          <AlertCircle
            aria-hidden="true"
            className="mt-0.5 size-4 shrink-0"
          />

          {error}
        </div>
      ) : null}

      <Button
        type="button"
        size="sm"
        variant={
          lead.contacted
            ? "outline"
            : "default"
        }
        className="mt-5 w-full"
        disabled={isPending}
        onClick={
          handleStatusChange
        }
      >
        {lead.contacted ? (
          <>
            <UserRound
              aria-hidden="true"
              className="size-4"
            />

            Mark Not Contacted
          </>
        ) : (
          <>
            <CheckCircle2
              aria-hidden="true"
              className="size-4"
            />

            Mark Contacted
          </>
        )}
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

        Prospect Only
      </div>

      <h3 className="mt-2 font-heading text-lg font-semibold text-brand">
        No lead captured yet.
      </h3>

      <p className="mt-3 text-sm leading-6 text-muted">
        This audit exists in the
        report library, but nobody
        has submitted the professional
        report form for it yet.
      </p>

      <div className="mt-5 rounded-xl border border-brand-blue/10 bg-brand-blue/[0.04] p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-blue">
          Sales Opportunity
        </p>

        <p className="mt-2 text-sm leading-6 text-muted">
          Use the audit results to
          evaluate whether this site
          is worth proactive outreach.
        </p>
      </div>
    </div>
  );
}

interface LeadDetailProps {
  icon: typeof Mail;
  value: string;
  href?: string;
}

function LeadDetail({
  icon: Icon,
  value,
  href,
}: LeadDetailProps) {
  const content = (
    <>
      <Icon
        aria-hidden="true"
        className="size-4 shrink-0 text-brand-blue"
      />

      <span className="min-w-0 break-words">
        {value}
      </span>
    </>
  );

  if (href) {
    return (
      <a
        href={href}
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
  children: React.ReactNode;
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