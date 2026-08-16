import { Clock3, Lightbulb } from "lucide-react";

import {
  ReportSection,
  StatBadge,
} from "@/components/website-audit/report-ui";
import {
  formatDifficulty,
  formatFindingEffort,
  type GrowthReportViewModel,
} from "@/lib/website-audit/report-view";
import { getReportCategoryLabel } from "@/lib/website-audit/report-categories";
import type { AuditFinding } from "@/lib/website-audit/types";

interface ReportTopPrioritiesProps {
  view: GrowthReportViewModel;
}

function priorityTone(
  finding: AuditFinding,
): "danger" | "warning" | "primary" | "default" {
  if (finding.priority === "critical" || finding.status === "fail") {
    return "danger";
  }

  if (finding.priority === "high") {
    return "warning";
  }

  return "primary";
}

export function ReportTopPriorities({ view }: ReportTopPrioritiesProps) {
  if (view.topPriorities.length === 0) {
    return (
      <ReportSection
        eyebrow="Top Priorities"
        title="No major issues stood out first."
        description="The scan did not identify a block of high-priority problems. Review the category details below for remaining opportunities."
      >
        <p className="text-sm leading-6 text-muted">
          A healthy report can still have smaller improvements. This does not
          mean the website is finished, only that no critical blockers rose to
          the top of this scan.
        </p>
      </ReportSection>
    );
  }

  return (
    <ReportSection
      eyebrow="Top Priorities"
      title="Fix these first."
      description="These are the highest-impact issues from this scan, ranked by business impact, priority, and estimated effort. They are a starting point, not a guarantee of rankings or leads."
    >
      <div className="space-y-4">
        {view.topPriorities.map((finding, index) => (
          <article
            key={finding.id}
            className="rounded-2xl border border-border bg-slate-50/60 p-5"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex min-w-0 gap-4">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-brand-blue/10 bg-white font-heading text-sm font-semibold text-brand-blue shadow-sm">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                    {getReportCategoryLabel(finding.category)}
                  </p>
                  <h3 className="mt-1 font-heading text-lg font-semibold text-brand">
                    {finding.title}
                  </h3>
                </div>
              </div>
              <StatBadge
                label={`${finding.priority} priority`}
                tone={priorityTone(finding)}
              />
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                  Why it matters
                </p>
                <p className="mt-2 text-sm leading-6 text-muted">
                  {finding.description}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                  What to do
                </p>
                <p className="mt-2 text-sm leading-6 text-brand">
                  {view.capabilities.showRecommendations
                    ? finding.recommendation ??
                      "Review this issue and decide the next implementation step with your website partner."
                    : "The professional report includes the recommended next step for this issue."}
                </p>
              </div>
            </div>

            {view.capabilities.showEstimatedEffort ? (
              <div className="mt-4 flex flex-wrap gap-3 border-t border-border pt-4 text-xs text-muted">
                <span className="inline-flex items-center gap-1.5">
                  <Lightbulb aria-hidden="true" className="size-3.5" />
                  Effort: {formatDifficulty(finding.difficulty)}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock3 aria-hidden="true" className="size-3.5" />
                  {formatFindingEffort(finding.estimatedFixMinutes)}
                </span>
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </ReportSection>
  );
}
