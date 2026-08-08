"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  Globe2,
  Search,
  SlidersHorizontal,
  Target,
  Zap,
} from "lucide-react";

import { ReportDeleteButton } from "@/components/website-audit/report-delete-button";
import { StatBadge } from "@/components/website-audit/report-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

type SortOption =
  | "newest"
  | "oldest"
  | "score-high"
  | "score-low"
  | "opportunity-high"
  | "opportunity-low";

const GRADE_FILTERS: {
  value: GradeFilter;
  label: string;
}[] = [
  { value: "all", label: "All Grades" },
  { value: "a", label: "A" },
  { value: "b", label: "B" },
  { value: "c", label: "C" },
  { value: "d-f", label: "D / F" },
];

const ISSUE_FILTERS: {
  value: IssueFilter;
  label: string;
}[] = [
  { value: "all", label: "All Sites" },
  {
    value: "critical",
    label: "Has Critical Issues",
  },
  {
    value: "clean",
    label: "No Critical Issues",
  },
];

const SORT_OPTIONS: {
  value: SortOption;
  label: string;
}[] = [
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
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
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
  if (grade.startsWith("A")) {
    return "success";
  }

  if (grade.startsWith("B")) {
    return "primary";
  }

  if (grade.startsWith("C")) {
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
  if (filter === "all") {
    return true;
  }

  if (filter === "a") {
    return grade.startsWith("A");
  }

  if (filter === "b") {
    return grade.startsWith("B");
  }

  if (filter === "c") {
    return grade.startsWith("C");
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
  if (filter === "all") {
    return true;
  }

  if (filter === "critical") {
    return report.criticalIssues > 0;
  }

  return report.criticalIssues === 0;
}

function sortReports(
  reports: AuditReportSummary[],
  sort: SortOption,
): AuditReportSummary[] {
  return [...reports].sort((a, b) => {
    if (sort === "newest") {
      return (
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime()
      );
    }

    if (sort === "oldest") {
      return (
        new Date(a.createdAt).getTime() -
        new Date(b.createdAt).getTime()
      );
    }

    if (sort === "score-high") {
      return (
        b.overallScore -
        a.overallScore
      );
    }

    if (sort === "score-low") {
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
  });
}

export function ReportsDashboardClient({
  reports,
}: ReportsDashboardClientProps) {
  const [search, setSearch] =
    useState("");

  const [gradeFilter, setGradeFilter] =
    useState<GradeFilter>("all");

  const [issueFilter, setIssueFilter] =
    useState<IssueFilter>("all");

  const [sort, setSort] =
    useState<SortOption>("newest");

  const visibleReports = useMemo(() => {
    const normalizedSearch =
      search.trim().toLowerCase();

    const filtered =
      reports.filter((report) => {
        const matchesSearch =
          normalizedSearch.length === 0 ||
          report.hostname
            .toLowerCase()
            .includes(
              normalizedSearch,
            ) ||
          report.website
            .toLowerCase()
            .includes(
              normalizedSearch,
            );

        return (
          matchesSearch &&
          matchesGrade(
            report.grade,
            gradeFilter,
          ) &&
          matchesIssueFilter(
            report,
            issueFilter,
          )
        );
      });

    return sortReports(
      filtered,
      sort,
    );
  }, [
    reports,
    search,
    gradeFilter,
    issueFilter,
    sort,
  ]);

  function resetFilters(): void {
    setSearch("");
    setGradeFilter("all");
    setIssueFilter("all");
    setSort("newest");
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-background p-5">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <SlidersHorizontal
            aria-hidden="true"
            className="size-4 text-primary"
          />

          Search and filter
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_220px]">
          <div className="relative">
            <Search
              aria-hidden="true"
              className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            />

            <Input
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value,
                )
              }
              placeholder="Search by domain or website URL..."
              className="pl-10"
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
            className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground"
            aria-label="Sort reports"
          >
            {SORT_OPTIONS.map(
              (option) => (
                <option
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </option>
              ),
            )}
          </select>
        </div>

        <div className="mt-5">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Grade
          </p>

          <div className="flex flex-wrap gap-2">
            {GRADE_FILTERS.map(
              (filter) => (
                <Button
                  key={filter.value}
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
                  {filter.label}
                </Button>
              ),
            )}
          </div>
        </div>

        <div className="mt-5">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Critical issues
          </p>

          <div className="flex flex-wrap gap-2">
            {ISSUE_FILTERS.map(
              (filter) => (
                <Button
                  key={filter.value}
                  type="button"
                  size="sm"
                  variant={
                    issueFilter ===
                    filter.value
                      ? "secondary"
                      : "ghost"
                  }
                  onClick={() =>
                    setIssueFilter(
                      filter.value,
                    )
                  }
                >
                  {filter.label}
                </Button>
              ),
            )}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <p className="text-xs text-muted-foreground">
            Showing{" "}
            {visibleReports.length} of{" "}
            {reports.length} reports
          </p>

          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={resetFilters}
          >
            Reset filters
          </Button>
        </div>
      </div>

      {visibleReports.length > 0 ? (
        <div className="space-y-4">
          {visibleReports.map(
            (report) => (
              <article
                key={report.id}
                className="rounded-2xl border border-border bg-background p-5 transition-shadow hover:shadow-md sm:p-6"
              >
                <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap gap-2">
                      <StatBadge
                        label={report.grade}
                        tone={getGradeTone(
                          report.grade,
                        )}
                      />

                      <StatBadge
                        label={`${report.overallScore}/100`}
                        tone="default"
                      />

                      <StatBadge
                        label={`${report.opportunityScore}/100 opportunity`}
                        tone="primary"
                      />
                    </div>

                    <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                      <Globe2
                        aria-hidden="true"
                        className="size-4"
                      />

                      {report.hostname}
                    </div>

                    <h2 className="mt-1 break-all text-xl font-semibold tracking-tight text-foreground">
                      {report.website}
                    </h2>

                    <div className="mt-4 flex flex-wrap gap-x-6 gap-y-3 text-sm text-muted-foreground">
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
                          className="size-4"
                        />

                        {
                          report.criticalIssues
                        }{" "}
                        critical
                      </span>

                      <span className="inline-flex items-center gap-2">
                        <Zap
                          aria-hidden="true"
                          className="size-4"
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

                  <div className="flex flex-col gap-3 sm:flex-row xl:items-center">
                    <Button
                      nativeButton={false}
                      render={
                        <Link
                          href={`/report/${report.id}`}
                        />
                      }
                    >
                      Open report

                      <ArrowRight
                        aria-hidden="true"
                        className="ml-2 size-4"
                      />
                    </Button>

                    <ReportDeleteButton
                      reportId={report.id}
                      hostname={
                        report.hostname
                      }
                    />
                  </div>
                </div>
              </article>
            ),
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border bg-background p-8 text-center">
          <Search
            aria-hidden="true"
            className="mx-auto size-6 text-primary"
          />

          <h2 className="mt-4 text-lg font-semibold text-foreground">
            No matching reports
          </h2>

          <p className="mt-2 text-sm text-muted-foreground">
            Try changing your search,
            filters, or sort options.
          </p>

          <Button
            type="button"
            className="mt-5"
            variant="outline"
            onClick={resetFilters}
          >
            Clear filters
          </Button>
        </div>
      )}
    </div>
  );
}