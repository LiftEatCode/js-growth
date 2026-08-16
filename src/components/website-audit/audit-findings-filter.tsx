"use client";

import { useMemo, useState } from "react";
import {
  LockKeyhole,
  Search,
  SlidersHorizontal,
} from "lucide-react";

import { FindingCard } from "@/components/website-audit/finding-card";
import {
  InfoPanel,
  StatBadge,
} from "@/components/website-audit/report-ui";
import { Button } from "@/components/ui";
import { getReportConfig } from "@/lib/website-audit/report-config";
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

const STATUS_FILTERS: {
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

const CATEGORY_FILTERS: {
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
    value: "cro",
    label: "Conversion",
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

const STATUS_PRIORITY = {
  fail: 0,
  warning: 1,
  pass: 2,
};

const FINDING_PRIORITY = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

const IMPACT_PRIORITY = {
  high: 0,
  medium: 1,
  low: 2,
};

function sortFindings(
  findings: AuditFinding[],
): AuditFinding[] {
  return [...findings].sort(
    (a, b) => {
      const statusDifference =
        STATUS_PRIORITY[a.status] -
        STATUS_PRIORITY[b.status];

      if (statusDifference !== 0) {
        return statusDifference;
      }

      const priorityDifference =
        FINDING_PRIORITY[a.priority] -
        FINDING_PRIORITY[b.priority];

      if (priorityDifference !== 0) {
        return priorityDifference;
      }

      const impactDifference =
        IMPACT_PRIORITY[
          a.businessImpact
        ] -
        IMPACT_PRIORITY[
          b.businessImpact
        ];

      if (impactDifference !== 0) {
        return impactDifference;
      }

      if (
        a.quickWin !== b.quickWin
      ) {
        return (
          Number(b.quickWin) -
          Number(a.quickWin)
        );
      }

      return (
        b.scoreImpact -
        a.scoreImpact
      );
    },
  );
}

export function AuditFindingsFilter({
  findings,
  mode = "public",
}: AuditFindingsFilterProps) {
  const config = getReportConfig(
    mode,
  );

  const [
    statusFilter,
    setStatusFilter,
  ] =
    useState<StatusFilter>(
      "all",
    );

  const [
    categoryFilter,
    setCategoryFilter,
  ] =
    useState<CategoryFilter>(
      "all",
    );

  const filteredFindings =
    useMemo(() => {
      const filtered =
        findings.filter(
          (finding) => {
            const matchesStatus =
              statusFilter ===
                "all" ||
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
              categoryFilter ===
                "all" ||
              finding.category ===
                categoryFilter;

            return (
              matchesStatus &&
              matchesCategory
            );
          },
        );

      return sortFindings(
        filtered,
      );
    }, [
      findings,
      statusFilter,
      categoryFilter,
    ]);

  const visibleFindings =
    filteredFindings.slice(
      0,
      config.maximumFindings,
    );

  const lockedCount =
    Math.max(
      filteredFindings.length -
        visibleFindings.length,
      0,
    );

  return (
    <div
      id="audit-findings"
      className="space-y-6"
    >
      <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-border bg-slate-50/60 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-brand-blue">
              <SlidersHorizontal
                aria-hidden="true"
                className="size-4"
              />

              Filter Findings
            </div>

            <p className="mt-2 text-sm leading-6 text-muted">
              Narrow the report by issue type or audit category.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <StatBadge
              label={`${visibleFindings.length} visible`}
            />

            <StatBadge
              label={`${filteredFindings.length} matching`}
              tone="primary"
            />

            {lockedCount > 0 ? (
              <StatBadge
                label={`${lockedCount} additional`}
                tone="warning"
              />
            ) : null}
          </div>
        </div>

        <div className="space-y-6 p-5 sm:p-6">
          <FilterGroup
            label="Issue Type"
          >
            {STATUS_FILTERS.map(
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
          </FilterGroup>

          <FilterGroup
            label="Category"
          >
            {CATEGORY_FILTERS.map(
              (filter) => (
                <Button
                  key={filter.value}
                  type="button"
                  size="sm"
                  variant={
                    categoryFilter ===
                    filter.value
                      ? "default"
                      : "outline"
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
          </FilterGroup>

          <div className="border-t border-border pt-4">
            <p className="text-xs leading-5 text-muted">
              Showing{" "}
              {visibleFindings.length} of{" "}
              {filteredFindings.length} matching{" "}
              {filteredFindings.length ===
              1
                ? "finding"
                : "findings"}
              .
            </p>
          </div>
        </div>
      </div>

      {visibleFindings.length >
      0 ? (
        <div className="space-y-5">
          {visibleFindings.map(
            (finding, index) => (
              <FindingCard
                key={finding.id}
                finding={finding}
                mode={mode}
                number={
                  index + 1
                }
              />
            ),
          )}
        </div>
      ) : (
        <InfoPanel
          icon={Search}
          title="No findings match these filters"
          description="Try selecting a different issue type or audit category."
        />
      )}

      {lockedCount > 0 ? (
        <InfoPanel
          icon={LockKeyhole}
          title={`${lockedCount} additional ${
            lockedCount === 1
              ? "finding"
              : "findings"
          } available`}
          description="The full strategy review includes the complete findings list, detailed recommendations, estimated implementation effort, priority guidance, and deeper business-impact analysis."
          tone="primary"
        />
      ) : null}
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