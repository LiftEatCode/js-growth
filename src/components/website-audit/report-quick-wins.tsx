import { Clock3, Sparkles } from "lucide-react";

import {
  InfoPanel,
  ReportSection,
  StatBadge,
} from "@/components/website-audit/report-ui";
import {
  formatDifficulty,
  formatFindingEffort,
  type GrowthReportViewModel,
} from "@/lib/website-audit/report-view";

interface ReportQuickWinsProps {
  view: GrowthReportViewModel;
}

export function ReportQuickWins({ view }: ReportQuickWinsProps) {
  if (!view.capabilities.showQuickWins) {
    return null;
  }

  if (view.quickWins.length === 0) {
    return (
      <section id="report-quick-wins">
        <InfoPanel
          icon={Sparkles}
          title="No high-confidence quick wins were identified in this audit."
          description="The scan did not find easy, high-confidence fixes among the current findings. That is common on already-polished pages or older stored reports."
        />
      </section>
    );
  }

  return (
    <div id="report-quick-wins">
      <ReportSection
        eyebrow="Quick Wins"
        title="Smaller changes that can still help."
        description="These findings are already marked as lower-effort improvements. They are useful starting points, not a promise of traffic or sales."
        icon={Sparkles}
      >
        <div className="space-y-4">
          {view.quickWins.map((finding) => (
            <article
              key={finding.id}
              className="rounded-2xl border border-border bg-slate-50/60 p-5"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <h3 className="font-heading text-lg font-semibold text-brand">
                  {finding.title}
                </h3>
                <StatBadge label="Quick win" tone="success" />
              </div>
              <p className="mt-2 text-sm leading-6 text-muted">
                {finding.description}
              </p>
              {view.capabilities.showRecommendations &&
              finding.recommendation ? (
                <p className="mt-3 text-sm leading-6 text-brand">
                  {finding.recommendation}
                </p>
              ) : null}
              <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted">
                <span>
                  Effort: {formatDifficulty(finding.difficulty)}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock3 aria-hidden="true" className="size-3.5" />
                  {formatFindingEffort(finding.estimatedFixMinutes)}
                </span>
              </div>
            </article>
          ))}
        </div>
      </ReportSection>
    </div>
  );
}
