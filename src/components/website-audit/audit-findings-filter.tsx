"use client";

import { useMemo, useState } from "react";
import {
  LockKeyhole,
  Search,
  SlidersHorizontal,
} from "lucide-react";

import { FindingCard } from "@/components/website-audit/finding-card";
import { Button } from "@/components/ui/button";
import { getMaximumVisibleFindings } from "@/lib/website-audit/report-mode";
import type {
  AuditCategory,
  AuditFinding,
  ReportMode,
} from "@/lib/website-audit/types";

interface AuditFindingsFilterProps {
  findings: AuditFinding[];
  mode?: ReportMode;
}

type StatusFilter =
  | "all"
  | "critical"
  | "warnings"
  | "quick-wins"
  | "passed";

type CategoryFilter =
  | "all"
  | AuditCategory;

const statusFilters: {
  value: StatusFilter;
  label: string;
}[] = [
  {
    value: "all",
    label: "All",
  },
  {
    value: "critical",
    label: "Critical",
  },
  {
    value: "warnings",
    label: "Warnings",
  },
  {
    value: "quick-wins",
    label: "Quick Wins",
  },
  {
    value: "passed",
    label: "Passed",
  },
];

const categoryFilters: {
  value: CategoryFilter;
  label: string;
}[] = [
  {
    value: "all",
    label: "All Categories",
  },
  {
    value: "technical",
    label: "Technical",
  },
  {
    value: "seo",
    label: "SEO",
  },
  {
    value: "content",
    label: "Content",
  },
  {
    value: "accessibility",
    label: "Accessibility",
  },
  {
    value: "local",
    label: "Local SEO",
  },
  {
    value: "performance",
    label: "Performance",
  },
];

const statusPriority = {
  fail: 0,
  warning: 1,
  pass: 2,
};

const findingPriority = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

function sortFindings(
  findings: AuditFinding[],
): AuditFinding[] {
  return [...findings].sort((a, b) => {
    const statusDifference =
      statusPriority[a.status] -
      statusPriority[b.status];

    if (statusDifference !== 0) {
      return statusDifference;
    }

    const priorityDifference =
      findingPriority[a.priority] -
      findingPriority[b.priority];

    if (priorityDifference !== 0) {
      return priorityDifference;
    }

    const impactPriority = {
      high: 0,
      medium: 1,
      low: 2,
    };

    const impactDifference =
      impactPriority[a.businessImpact] -
      impactPriority[b.businessImpact];

    if (impactDifference !== 0) {
      return impactDifference;
    }

    if (a.quickWin !== b.quickWin) {
      return Number(b.quickWin) -
        Number(a.quickWin);
    }

    return (
      b.scoreImpact -
      a.scoreImpact
    );
  });
}

export function AuditFindingsFilter({
  findings,
  mode = "public",
}: AuditFindingsFilterProps) {
  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("all");

  const [categoryFilter, setCategoryFilter] =
    useState<CategoryFilter>("all");

  const filteredFindings =
    useMemo(() => {
      const filtered = findings.filter(
        (finding) => {
          const matchesStatus =
            statusFilter === "all" ||
            (statusFilter ===
              "critical" &&
              finding.status !==
                "pass" &&
              finding.priority ===
                "critical") ||
            (statusFilter ===
              "warnings" &&
              finding.status ===
                "warning") ||
            (statusFilter ===
              "quick-wins" &&
              finding.status !==
                "pass" &&
              finding.quickWin) ||
            (statusFilter ===
              "passed" &&
              finding.status ===
                "pass");

          const matchesCategory =
            categoryFilter === "all" ||
            finding.category ===
              categoryFilter;

          return (
            matchesStatus &&
            matchesCategory
          );
        },
      );

      return sortFindings(filtered);
    }, [
      findings,
      statusFilter,
      categoryFilter,
    ]);

  const maximumVisible =
    getMaximumVisibleFindings(mode);

  const visibleFindings =
    filteredFindings.slice(
      0,
      maximumVisible,
    );

  const lockedCount = Math.max(
    filteredFindings.length -
      visibleFindings.length,
    0,
  );

  const isPublic =
    mode === "public";

  return (
    <section
      id="audit-findings"
      aria-labelledby="findings-heading"
      className="space-y-6"
    >
      <div>
        <div className="flex items-center gap-2 text-sm font-medium text-primary">
          <Search
            aria-hidden="true"
            className="size-4"
          />

          Detailed analysis
        </div>

        <h2
          id="findings-heading"
          className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl"
        >
          Audit findings
        </h2>

        <p className="mt-3 max-w-3xl leading-7 text-muted-foreground">
          Explore the issues detected during
          the audit. Higher-priority findings
          appear first so you can focus on the
          areas with the greatest potential
          impact.
        </p>
      </div>

      <div className="space-y-5 rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <SlidersHorizontal
            aria-hidden="true"
            className="size-4 text-primary"
          />

          Filter findings
        </div>

        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Issue type
          </p>

          <div className="flex flex-wrap gap-2">
            {statusFilters.map(
              (filter) => (
                <Button
                  key={filter.value}
                  type="button"
                  size="sm"
                  variant={
                    statusFilter ===
                    filter.value
                      ? "default"
                      : "outline"
                  }
                  onClick={() =>
                    setStatusFilter(
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

        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Category
          </p>

          <div className="flex flex-wrap gap-2">
            {categoryFilters.map(
              (filter) => (
                <Button
                  key={filter.value}
                  type="button"
                  size="sm"
                  variant={
                    categoryFilter ===
                    filter.value
                      ? "secondary"
                      : "ghost"
                  }
                  onClick={() =>
                    setCategoryFilter(
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

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <p className="text-xs text-muted-foreground">
            Showing{" "}
            {visibleFindings.length} of{" "}
            {filteredFindings.length} matching
            findings
          </p>

          {isPublic &&
          lockedCount > 0 ? (
            <p className="inline-flex items-center gap-1.5 text-xs font-medium text-primary">
              <LockKeyhole
                aria-hidden="true"
                className="size-3.5"
              />

              {lockedCount} additional{" "}
              {lockedCount === 1
                ? "finding"
                : "findings"}{" "}
              locked
            </p>
          ) : null}
        </div>
      </div>

      {visibleFindings.length > 0 ? (
        <div className="space-y-4">
          {visibleFindings.map(
            (finding) => (
              <FindingCard
                key={finding.id}
                finding={finding}
                mode={mode}
              />
            ),
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
          <p className="font-medium text-foreground">
            No findings match these filters.
          </p>

          <p className="mt-2 text-sm text-muted-foreground">
            Try selecting a different issue
            type or audit category.
          </p>
        </div>
      )}

      {isPublic &&
      lockedCount > 0 ? (
        <LockedFindingsPanel
          lockedCount={lockedCount}
          totalCount={
            filteredFindings.length
          }
        />
      ) : null}
    </section>
  );
}

interface LockedFindingsPanelProps {
  lockedCount: number;
  totalCount: number;
}

function LockedFindingsPanel({
  lockedCount,
  totalCount,
}: LockedFindingsPanelProps) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-primary/5 p-6 sm:p-8">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,var(--primary)_0,transparent_35%)] opacity-5"
      />

      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <LockKeyhole
              aria-hidden="true"
              className="size-5"
            />
          </div>

          <h3 className="mt-4 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            {lockedCount} additional{" "}
            {lockedCount === 1
              ? "finding is"
              : "findings are"}{" "}
            available in the full strategy
            review.
          </h3>

          <p className="mt-3 leading-7 text-muted-foreground">
            This free report provides a
            high-level view of the most
            important opportunities. A full
            strategy review includes the
            complete findings, detailed
            recommendations, implementation
            priorities, and estimated effort.
          </p>

          <p className="mt-4 text-sm font-medium text-foreground">
            Free report:{" "}
            {totalCount - lockedCount} of{" "}
            {totalCount} matching findings
            unlocked
          </p>
        </div>

        <div className="min-w-[240px] rounded-2xl border border-border bg-background p-5">
          <p className="text-sm font-semibold text-foreground">
            Full strategy review includes
          </p>

          <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
            <li>
              Complete audit findings
            </li>

            <li>
              Detailed recommendations
            </li>

            <li>
              Estimated implementation effort
            </li>

            <li>
              Priority roadmap
            </li>

            <li>
              Business-impact analysis
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}