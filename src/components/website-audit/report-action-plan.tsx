import {
  ReportSection,
  StatBadge,
} from "@/components/website-audit/report-ui";
import type { GrowthReportViewModel } from "@/lib/website-audit/report-view";
import { formatDifficulty, formatFindingEffort } from "@/lib/website-audit/report-view";
import { getReportCategoryLabel } from "@/lib/website-audit/report-categories";

interface ReportActionPlanProps {
  view: GrowthReportViewModel;
}

export function ReportActionPlan({ view }: ReportActionPlanProps) {
  if (!view.capabilities.showActionPlan) {
    return null;
  }

  if (view.actionPlan.phases.length === 0) {
    return (
      <section id="report-action-plan">
        <ReportSection
          eyebrow="30–90 Day Action Plan"
          title="No major sequenced actions were identified."
          description="This scan did not produce a list of follow-up tasks beyond what is already covered in priorities."
        >
          <p className="text-sm leading-6 text-muted">
            That can happen on a strong page. Re-run the audit after changes if you want a fresh plan.
          </p>
        </ReportSection>
      </section>
    );
  }

  return (
    <div id="report-action-plan">
      <ReportSection
          eyebrow="30–90 Day Action Plan"
          title="A practical checklist of work."
          description={`${view.estimatedEffortLabel} estimated across the findings in this scan. This checklist comes from the audit engine. The Executive Growth Analysis above explains the strategic sequence. Actual implementation time depends on the website platform, codebase, and complexity. This is not a price quote.`}
      >
        <div className="space-y-6">
          {view.actionPlan.phases.map((phase) => (
            <section key={phase.id} className="rounded-2xl border border-border p-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="font-heading text-xl font-semibold text-brand">
                    {phase.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-muted">
                    {phase.description}
                  </p>
                </div>
                <StatBadge label={phase.timeframe} tone="primary" />
              </div>

              <ol className="mt-5 space-y-3">
                {phase.findings.map((finding) => (
                  <li
                    key={`${phase.id}-${finding.id}`}
                    className="rounded-xl border border-border bg-slate-50/70 p-4"
                  >
                    <p className="font-heading font-semibold text-brand">
                      {finding.title}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {getReportCategoryLabel(finding.category)} ·{" "}
                      {formatDifficulty(finding.difficulty)} ·{" "}
                      {formatFindingEffort(finding.estimatedFixMinutes)}
                    </p>
                    {view.capabilities.showRecommendations &&
                    finding.recommendation ? (
                      <p className="mt-2 text-sm leading-6 text-muted">
                        {finding.recommendation}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>
      </ReportSection>
    </div>
  );
}
