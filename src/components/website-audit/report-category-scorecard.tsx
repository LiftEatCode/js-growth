import { AlertTriangle, CheckCircle2 } from "lucide-react";

import { StatBadge } from "@/components/website-audit/report-ui";
import type { CategoryScorecardItem } from "@/lib/website-audit/report-view";

interface ReportCategoryScorecardProps {
  items: CategoryScorecardItem[];
}

function bandTone(
  percent: number,
): "success" | "primary" | "warning" | "danger" {
  if (percent >= 80) {
    return "success";
  }

  if (percent >= 70) {
    return "primary";
  }

  if (percent >= 60) {
    return "warning";
  }

  return "danger";
}

function progressClass(percent: number): string {
  if (percent >= 80) {
    return "bg-emerald-500";
  }

  if (percent >= 70) {
    return "bg-brand-blue";
  }

  if (percent >= 60) {
    return "bg-amber-500";
  }

  return "bg-red-500";
}

export function ReportCategoryScorecard({
  items,
}: ReportCategoryScorecardProps) {
  if (items.length === 0) {
    return (
      <p className="rounded-2xl border border-border bg-white p-6 text-sm leading-6 text-muted">
        Category scores are not available for this older report.
      </p>
    );
  }

  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <article
          key={item.category}
          className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm"
        >
          <div className="flex items-start justify-between gap-4 border-b border-border bg-slate-50/50 p-5">
            <div>
              <h3 className="font-heading text-lg font-semibold text-brand">
                {item.label}
              </h3>
              <p className="mt-1 text-xs text-muted">
                {item.percent}/100
              </p>
            </div>

            <StatBadge
              label={item.band.label}
              tone={bandTone(item.percent)}
            />
          </div>

          <div className="p-5">
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full ${progressClass(item.percent)}`}
                style={{ width: `${item.percent}%` }}
              />
            </div>

            <div className="mt-4 flex items-center justify-between gap-3 text-xs">
              <span className="inline-flex items-center gap-1.5 text-emerald-700">
                <CheckCircle2 aria-hidden="true" className="size-3.5" />
                {item.passCount} passed
              </span>
              <span className="inline-flex items-center gap-1.5 text-muted">
                <AlertTriangle aria-hidden="true" className="size-3.5" />
                {item.issueCount}{" "}
                {item.issueCount === 1 ? "issue" : "issues"}
              </span>
            </div>

            <p className="mt-4 border-t border-border pt-4 text-sm leading-6 text-muted">
              {item.summary}
            </p>
          </div>
        </article>
      ))}
    </div>
  );
}
