import { CheckCircle2 } from "lucide-react";

import { FindingCard } from "@/components/website-audit/finding-card";
import { ReportPerformanceEvidence } from "@/components/website-audit/report-performance-evidence";
import { StatBadge } from "@/components/website-audit/report-ui";
import type { GrowthReportViewModel } from "@/lib/website-audit/report-view";
import { compareActionableFindings } from "@/lib/website-audit/report-view";
import type { ReportMode } from "@/lib/website-audit/types";

interface ReportCategoryDivesProps {
  view: GrowthReportViewModel;
  mode: ReportMode;
}

export function ReportCategoryDives({
  view,
  mode,
}: ReportCategoryDivesProps) {
  if (!view.capabilities.showCategoryDeepDives) {
    return null;
  }

  return (
    <div className="space-y-8">
      {view.scorecard.map((item) => (
        <section
          key={item.category}
          id={`report-category-${item.category}`}
          className="scroll-mt-24 overflow-hidden rounded-[1.75rem] border border-border bg-white shadow-sm"
        >
          <div className="border-b border-border bg-slate-50/50 px-6 py-6 sm:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-blue">
                  Category deep dive
                </p>
                <h2 className="mt-2 font-heading text-2xl font-semibold text-brand">
                  {item.label}
                </h2>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
                  {item.summary}
                </p>
              </div>
              <div className="text-left sm:text-right">
                <p className="font-heading text-3xl font-bold text-brand">
                  {item.percent}/100
                </p>
                <p className="mt-1 text-sm text-muted">{item.band.label}</p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <StatBadge
                label={`${item.issueCount} ${item.issueCount === 1 ? "issue" : "issues"}`}
                tone={item.issueCount > 0 ? "warning" : "success"}
              />
              <StatBadge
                label={`${item.passCount} passed`}
                tone="success"
              />
            </div>
          </div>

          <div className="space-y-5 p-6 sm:p-8">
            {item.category === "performance" &&
            view.capabilities.showTechnicalEvidence &&
            view.report.pageData.performance ? (
              <ReportPerformanceEvidence
                performance={view.report.pageData.performance}
              />
            ) : null}
            {item.positiveFindings.length > 0 ? (
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                  What&apos;s working
                </p>
                <ul className="mt-3 space-y-2">
                  {item.positiveFindings.map((finding) => (
                    <li
                      key={finding.id}
                      className="flex items-start gap-2 text-sm leading-6 text-brand"
                    >
                      <CheckCircle2
                        aria-hidden="true"
                        className="mt-0.5 size-4 shrink-0 text-emerald-600"
                      />
                      {finding.title}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {item.issueCount === 0 ? (
              <p className="text-sm leading-6 text-muted">
                No open issues were recorded in this category.
              </p>
            ) : (
              view.report.findings
                .filter(
                  (finding) =>
                    finding.category === item.category &&
                    finding.status !== "pass",
                )
                .sort(compareActionableFindings)
                .slice(0, 6)
                .map((finding) => (
                  <FindingCard
                    key={finding.id}
                    finding={finding}
                    mode={mode}
                    tier={view.tier}
                  />
                ))
            )}
          </div>
        </section>
      ))}
    </div>
  );
}
