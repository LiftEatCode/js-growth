"use client";

import { useMemo, useState } from "react";

import { FindingCard } from "@/components/website-audit/finding-card";
import { Button } from "@/components/ui/button";
import type {
  AuditCategory,
  AuditFinding,
} from "@/lib/website-audit/types";

interface AuditFindingsFilterProps {
  findings: AuditFinding[];
}

type StatusFilter =
  | "all"
  | "critical"
  | "warnings"
  | "quick-wins"
  | "passed";

type CategoryFilter = "all" | AuditCategory;

const statusFilters: {
  value: StatusFilter;
  label: string;
}[] = [
  { value: "all", label: "All" },
  { value: "critical", label: "Critical" },
  { value: "warnings", label: "Warnings" },
  { value: "quick-wins", label: "Quick Wins" },
  { value: "passed", label: "Passed" },
];

const categoryFilters: {
  value: CategoryFilter;
  label: string;
}[] = [
  { value: "all", label: "All Categories" },
  { value: "technical", label: "Technical" },
  { value: "seo", label: "SEO" },
  { value: "content", label: "Content" },
  {
    value: "accessibility",
    label: "Accessibility",
  },
  { value: "local", label: "Local SEO" },
  { value: "performance", label: "Performance" },
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

    return b.scoreImpact - a.scoreImpact;
  });
}

export function AuditFindingsFilter({
  findings,
}: AuditFindingsFilterProps) {
  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("all");

  const [categoryFilter, setCategoryFilter] =
    useState<CategoryFilter>("all");

  const filteredFindings = useMemo(() => {
    const filtered = findings.filter((finding) => {
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "critical" &&
          finding.priority === "critical" &&
          finding.status !== "pass") ||
        (statusFilter === "warnings" &&
          finding.status === "warning") ||
        (statusFilter === "quick-wins" &&
          finding.quickWin &&
          finding.status !== "pass") ||
        (statusFilter === "passed" &&
          finding.status === "pass");

      const matchesCategory =
        categoryFilter === "all" ||
        finding.category === categoryFilter;

      return matchesStatus && matchesCategory;
    });

    return sortFindings(filtered);
  }, [findings, statusFilter, categoryFilter]);

  return (
    <section
      aria-labelledby="findings-heading"
      className="space-y-6"
    >
        
      <div>
        <p className="text-sm font-medium text-primary">
          Recommended actions
        </p>

        <h2
          id="findings-heading"
          className="mt-1 text-2xl font-semibold tracking-tight text-foreground"
        >
          Audit findings
        </h2>

        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
          Filter the report by issue type or audit
          category. Failed and higher-priority findings
          appear first.
        </p>
      </div>

      <div className="space-y-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {statusFilters.map((filter) => (
            <Button
              key={filter.value}
              type="button"
              size="sm"
              variant={
                statusFilter === filter.value
                  ? "default"
                  : "outline"
              }
              onClick={() =>
                setStatusFilter(filter.value)
              }
            >
              {filter.label}
            </Button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {categoryFilters.map((filter) => (
            <Button
              key={filter.value}
              type="button"
              size="sm"
              variant={
                categoryFilter === filter.value
                  ? "secondary"
                  : "ghost"
              }
              onClick={() =>
                setCategoryFilter(filter.value)
              }
            >
              {filter.label}
            </Button>
          ))}
        </div>

        <p className="text-xs text-muted-foreground">
          Showing {filteredFindings.length} of{" "}
          {findings.length} findings
        </p>
      </div>

      {filteredFindings.length > 0 ? (
        <div className="space-y-4">
          {filteredFindings.map((finding) => (
            <FindingCard
              key={finding.id}
              finding={finding}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center">
          <p className="font-medium text-foreground">
            No findings match these filters.
          </p>

          <p className="mt-2 text-sm text-muted-foreground">
            Try another issue type or category.
          </p>
        </div>
      )}
    </section>
  );
}