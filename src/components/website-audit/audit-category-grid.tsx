import {
  Accessibility,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Gauge,
  MapPin,
  Search,
  Settings2,
  Target,
} from "lucide-react";

import type {
  AuditCategory,
  AuditCategoryScore,
  AuditFinding,
} from "@/lib/website-audit/types";

interface AuditCategoryGridProps {
  categoryScores: AuditCategoryScore[];
  findings: AuditFinding[];
}

const CATEGORY_ICONS = {
  technical: Settings2,
  seo: Search,
  content: FileText,
  cro: Target,
  accessibility: Accessibility,
  local: MapPin,
  performance: Gauge,
} satisfies Record<
  AuditCategory,
  typeof Search
>;

function getScoreLabel(
  percent: number,
): string {
  if (percent >= 90) {
    return "Excellent";
  }

  if (percent >= 75) {
    return "Strong";
  }

  if (percent >= 60) {
    return "Needs attention";
  }

  return "High priority";
}

function getProgressClasses(
  percent: number,
): string {
  if (percent >= 90) {
    return "bg-emerald-500";
  }

  if (percent >= 75) {
    return "bg-brand-blue";
  }

  if (percent >= 60) {
    return "bg-amber-500";
  }

  return "bg-red-500";
}

function getScoreTone(
  percent: number,
): string {
  if (percent >= 90) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (percent >= 75) {
    return "border-brand-blue/15 bg-brand-blue/[0.06] text-brand-blue";
  }

  if (percent >= 60) {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-red-200 bg-red-50 text-red-700";
}

export function AuditCategoryGrid({
  categoryScores,
  findings,
}: AuditCategoryGridProps) {
  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {categoryScores.map(
        (categoryScore) => {
          const Icon =
            CATEGORY_ICONS[
              categoryScore.category
            ];

          const percentage =
            categoryScore.maxScore === 0
              ? 0
              : Math.round(
                  (categoryScore.score /
                    categoryScore.maxScore) *
                    100,
                );

          const categoryFindings =
            findings.filter(
              (finding) =>
                finding.category ===
                categoryScore.category,
            );

          const issueCount =
            categoryFindings.filter(
              (finding) =>
                finding.status !==
                "pass",
            ).length;

          const passedCount =
            categoryFindings.filter(
              (finding) =>
                finding.status ===
                "pass",
            ).length;

          const hasIssues =
            issueCount > 0;

          return (
            <article
              key={
                categoryScore.category
              }
              className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm"
            >
              <div className="flex items-start justify-between gap-4 border-b border-border bg-slate-50/50 p-5">
                <div className="flex items-center gap-3">
                  <div className="flex size-11 items-center justify-center rounded-xl border border-brand-blue/10 bg-white text-brand-blue shadow-sm">
                    <Icon
                      aria-hidden="true"
                      className="size-5"
                    />
                  </div>

                  <div>
                    <h3 className="font-heading text-lg font-semibold text-brand">
                      {
                        categoryScore.label
                      }
                    </h3>

                    <p className="mt-1 text-xs text-muted">
                      {
                        categoryScore.score
                      }
                      /
                      {
                        categoryScore.maxScore
                      } points
                    </p>
                  </div>
                </div>

                <div
                  className={`rounded-xl border px-3 py-2 text-right ${getScoreTone(
                    percentage,
                  )}`}
                >
                  <p className="font-heading text-2xl font-bold leading-none">
                    {percentage}%
                  </p>

                  <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em]">
                    Score
                  </p>
                </div>
              </div>

              <div className="p-5">
                <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full transition-[width] duration-500 ${getProgressClasses(
                      percentage,
                    )}`}
                    style={{
                      width: `${percentage}%`,
                    }}
                  />
                </div>

                <div className="mt-4 flex items-center justify-between gap-4">
                  <p className="font-heading font-semibold text-brand">
                    {getScoreLabel(
                      percentage,
                    )}
                  </p>

                  <div className="flex items-center gap-3 text-xs">
                    <span className="inline-flex items-center gap-1.5 text-emerald-700">
                      <CheckCircle2
                        aria-hidden="true"
                        className="size-3.5"
                      />

                      {passedCount} passed
                    </span>

                    <span
                      className={`inline-flex items-center gap-1.5 ${
                        hasIssues
                          ? "text-red-600"
                          : "text-muted"
                      }`}
                    >
                      <AlertTriangle
                        aria-hidden="true"
                        className="size-3.5"
                      />

                      {issueCount}{" "}
                      {issueCount === 1
                        ? "issue"
                        : "issues"}
                    </span>
                  </div>
                </div>

                <p className="mt-4 border-t border-border pt-4 text-sm leading-6 text-muted">
                  {getCategorySummary(
                    categoryScore.category,
                    percentage,
                  )}
                </p>
              </div>
            </article>
          );
        },
      )}
    </div>
  );
}

function getCategorySummary(
  category: AuditCategory,
  percentage: number,
): string {
  const condition =
    percentage >= 90
      ? "performing very well"
      : percentage >= 75
        ? "in solid shape"
        : percentage >= 60
          ? "showing several improvement opportunities"
          : "one of the stronger areas to prioritize";

  if (category === "technical") {
    return `The technical foundation is ${condition}.`;
  }

  if (category === "seo") {
    return `Search optimization is ${condition}.`;
  }

  if (category === "content") {
    return `Homepage content signals are ${condition}.`;
  }

  if (category === "cro") {
    return `Conversion readiness is ${condition}.`;
  }

  if (
    category ===
    "accessibility"
  ) {
    return `Accessibility signals are ${condition}.`;
  }

  if (category === "local") {
    return `Local business signals are ${condition}.`;
  }

  return `Performance-related signals are ${condition}.`;
}