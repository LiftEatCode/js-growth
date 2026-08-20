import type { CompetitiveGrowthReportViewModel } from "@/lib/competitive-intelligence/report/types";
import {
  formatReportGap,
  formatReportScore,
} from "@/lib/competitive-intelligence/report/format";

function ScoreBar(props: {
  label: string;
  score: number;
  maxScore?: number;
  tone: "target" | "peer";
}) {
  const max = props.maxScore ?? 100;
  const width = Math.max(0, Math.min(100, (props.score / max) * 100));

  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="text-muted">{props.label}</span>
        <span className="font-medium tabular-nums text-ink">
          {formatReportScore(props.score)}
        </span>
      </div>
      <div
        className="h-2.5 overflow-hidden rounded-full bg-border/70"
        role="img"
        aria-label={`${props.label}: ${formatReportScore(props.score)} of ${max}`}
      >
        <div
          className={
            props.tone === "target"
              ? "h-full rounded-full bg-brand"
              : "h-full rounded-full bg-brand-blue/70"
          }
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

export function CompetitiveGrowthReportView(props: {
  report: CompetitiveGrowthReportViewModel;
}) {
  const { report } = props;

  return (
    <article className="competitive-growth-report mx-auto max-w-4xl space-y-10 bg-white text-ink print:max-w-none print:space-y-8">
      <header className="space-y-4 border-b border-border pb-8 print:border-black/20">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-blue">
          Prepared by {report.preparedBy}
        </p>
        <div className="space-y-2">
          <h1 className="font-heading text-3xl font-semibold tracking-tight text-brand sm:text-4xl">
            {report.businessName}
          </h1>
          <p className="font-heading text-xl text-ink/80 sm:text-2xl">
            Competitive Website Growth Analysis
          </p>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted">
          {report.locationLabel ? <p>{report.locationLabel}</p> : null}
          <p>Analysis date: {report.analysisDateLabel}</p>
        </div>
        <p className="text-sm text-muted">{report.sampleDisclosure}</p>
      </header>

      <section
        aria-label="Executive metrics"
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
      >
        <div className="rounded-2xl border border-border px-4 py-4">
          <p className="text-xs uppercase tracking-[0.08em] text-muted">
            Website Growth Score
          </p>
          <p className="mt-2 font-heading text-3xl font-semibold tabular-nums text-brand">
            {formatReportScore(report.metrics.websiteGrowthScore)}
          </p>
        </div>
        <div className="rounded-2xl border border-border px-4 py-4">
          <p className="text-xs uppercase tracking-[0.08em] text-muted">
            Selected Competitor Average
          </p>
          <p className="mt-2 font-heading text-3xl font-semibold tabular-nums text-brand">
            {formatReportScore(report.metrics.selectedCompetitorAverage)}
          </p>
        </div>
        <div className="rounded-2xl border border-border px-4 py-4">
          <p className="text-xs uppercase tracking-[0.08em] text-muted">
            Competitive Position
          </p>
          <p className="mt-2 font-heading text-3xl font-semibold text-brand">
            {report.metrics.competitivePosition}
          </p>
        </div>
        <div className="rounded-2xl border border-border px-4 py-4">
          <p className="text-xs uppercase tracking-[0.08em] text-muted">
            Competitive Gap
          </p>
          <p className="mt-2 font-heading text-3xl font-semibold tabular-nums text-brand">
            {formatReportGap(report.metrics.competitiveGap)}
          </p>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-2xl font-semibold text-brand">
          Executive summary
        </h2>
        <p className="text-lg font-medium text-ink">
          {report.executiveSummary.headline}
        </p>
        <p className="text-base leading-relaxed text-ink/90">
          {report.executiveSummary.summary}
        </p>
        <div className="rounded-2xl border border-border/80 bg-surface/30 px-4 py-3">
          <p className="font-medium text-ink">
            {report.executiveSummary.positionAssessment}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-ink/90">
            {report.executiveSummary.positionExplanation}
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-heading text-2xl font-semibold text-brand">
          Category comparison
        </h2>
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-border text-muted">
                <th className="py-2 pr-3 font-medium">Category</th>
                <th className="py-2 pr-3 font-medium">Your score</th>
                <th className="py-2 pr-3 font-medium">
                  Selected competitor average
                </th>
                <th className="py-2 pr-3 font-medium">Gap</th>
                <th className="py-2 font-medium">Position</th>
              </tr>
            </thead>
            <tbody>
              {report.categories.map((row) => (
                <tr key={row.category} className="border-b border-border/70">
                  <td className="py-3 pr-3 font-medium text-ink">{row.label}</td>
                  <td className="py-3 pr-3 tabular-nums">
                    {formatReportScore(row.targetScore)}
                  </td>
                  <td className="py-3 pr-3 tabular-nums">
                    {formatReportScore(row.competitorAverage)}
                  </td>
                  <td className="py-3 pr-3 tabular-nums">
                    {formatReportGap(row.gap)}
                  </td>
                  <td className="py-3">{row.positionLabel}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-4 md:hidden">
          {report.categories.map((row) => (
            <div
              key={row.category}
              className="rounded-2xl border border-border px-4 py-4"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="font-medium text-ink">{row.label}</p>
                <p className="text-sm text-muted">{row.positionLabel}</p>
              </div>
              <div className="mt-3 space-y-3">
                <ScoreBar label="Your website" score={row.targetScore} tone="target" />
                <ScoreBar
                  label="Selected competitors"
                  score={row.competitorAverage}
                  tone="peer"
                />
              </div>
              <p className="mt-3 text-sm text-muted">
                Gap:{" "}
                <span className="font-medium tabular-nums text-ink">
                  {formatReportGap(row.gap)}
                </span>
              </p>
            </div>
          ))}
        </div>

        <div className="hidden space-y-5 md:block">
          {report.categories.map((row) => (
            <div key={`${row.category}-bars`} className="space-y-2">
              <p className="text-sm font-medium text-ink">{row.label}</p>
              <ScoreBar label="Your website" score={row.targetScore} tone="target" />
              <ScoreBar
                label="Selected competitors"
                score={row.competitorAverage}
                tone="peer"
              />
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-heading text-2xl font-semibold text-brand">
          Where your website has the biggest opportunities
        </h2>
        <div className="space-y-4">
          {report.opportunities.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-border px-4 py-4"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="font-heading text-lg font-semibold text-ink">
                  {item.title}
                </h3>
                {item.positionLabel ? (
                  <p className="text-sm text-muted">{item.positionLabel}</p>
                ) : null}
              </div>
              {item.targetScore != null && item.competitorAverage != null ? (
                <p className="mt-2 text-sm text-muted">
                  Your score:{" "}
                  <span className="font-medium tabular-nums text-ink">
                    {formatReportScore(item.targetScore)}
                  </span>
                  {" · "}
                  Selected competitor average:{" "}
                  <span className="font-medium tabular-nums text-ink">
                    {formatReportScore(item.competitorAverage)}
                  </span>
                  {item.gap != null ? (
                    <>
                      {" · "}
                      Gap:{" "}
                      <span className="font-medium tabular-nums text-ink">
                        {formatReportGap(item.gap)}
                      </span>
                    </>
                  ) : null}
                </p>
              ) : null}
              <p className="mt-2 text-sm leading-relaxed text-ink/90">
                {item.explanation}
              </p>
              {item.recommendedActions.length > 0 ? (
                <div className="mt-3">
                  <p className="text-sm font-medium text-ink">Recommended focus</p>
                  <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-muted">
                    {item.recommendedActions.map((action) => (
                      <li key={action}>{action}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-heading text-2xl font-semibold text-brand">
          Where you&apos;re already strong
        </h2>
        <div className="space-y-4">
          {report.advantages.map((item) => (
            <div
              key={`${item.kind}:${item.title}`}
              className="rounded-2xl border border-border px-4 py-4"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="font-heading text-lg font-semibold text-ink">
                  {item.title}
                </h3>
                {item.positionLabel ? (
                  <p className="text-sm text-muted">{item.positionLabel}</p>
                ) : null}
              </div>
              {item.targetScore != null && item.competitorAverage != null ? (
                <p className="mt-2 text-sm text-muted">
                  Your score:{" "}
                  <span className="font-medium tabular-nums text-ink">
                    {formatReportScore(item.targetScore)}
                  </span>
                  {" · "}
                  Selected competitor average:{" "}
                  <span className="font-medium tabular-nums text-ink">
                    {formatReportScore(item.competitorAverage)}
                  </span>
                  {item.gap != null ? (
                    <>
                      {" · "}
                      Gap:{" "}
                      <span className="font-medium tabular-nums text-ink">
                        {formatReportGap(item.gap)}
                      </span>
                    </>
                  ) : null}
                </p>
              ) : null}
              <p className="mt-2 text-sm leading-relaxed text-ink/90">
                {item.explanation}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-heading text-2xl font-semibold text-brand">
          Competitive set
        </h2>
        <p className="text-sm text-muted">
          These are the selected websites included in the comparison.
        </p>
        <ul className="divide-y divide-border/80 rounded-2xl border border-border">
          {report.competitiveSet.map((row) => (
            <li
              key={`${row.isTarget ? "target" : "competitor"}:${row.businessName}`}
              className="flex flex-wrap items-baseline justify-between gap-2 px-4 py-3"
            >
              <div>
                <p className="font-medium text-ink">
                  {row.businessName}
                  {row.isTarget ? (
                    <span className="text-xs font-normal text-muted">
                      {" "}
                      (your website)
                    </span>
                  ) : null}
                </p>
                {!row.isTarget && row.distanceMiles != null ? (
                  <p className="text-xs text-muted">
                    {row.distanceMiles.toFixed(1)} mi
                    {row.competitiveRelevance != null
                      ? ` · relevance ${row.competitiveRelevance}`
                      : ""}
                  </p>
                ) : null}
              </div>
              <p className="tabular-nums text-sm font-medium text-ink">
                Website Growth Score: {formatReportScore(row.websiteGrowthScore)}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="font-heading text-2xl font-semibold text-brand">
          Recommended priorities
        </h2>
        <ol className="space-y-4">
          {report.priorities.map((priority) => (
            <li
              key={`${priority.number}:${priority.title}`}
              className="rounded-2xl border border-border px-4 py-4"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-brand-blue">
                Priority {priority.number}
              </p>
              <h3 className="mt-1 font-heading text-lg font-semibold text-ink">
                {priority.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink/90">
                {priority.explanation}
              </p>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted">
                {priority.actions.map((action) => (
                  <li key={action}>{action}</li>
                ))}
              </ul>
              {priority.evidenceLabel && priority.evidenceLines.length > 0 ? (
                <div className="mt-3 rounded-xl bg-surface/40 px-3 py-2 text-xs text-muted">
                  <p className="font-medium text-ink">{priority.evidenceLabel}</p>
                  <ul className="mt-1 space-y-0.5">
                    {priority.evidenceLines.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </li>
          ))}
        </ol>
      </section>

      <section className="space-y-4">
        <h2 className="font-heading text-2xl font-semibold text-brand">
          90-day direction
        </h2>
        <p className="text-xs text-muted">{report.ninetyDayDisclaimer}</p>
        <div className="space-y-4">
          {report.ninetyDayPlan.map((phase) => (
            <div
              key={phase.phase}
              className="rounded-2xl border border-border px-4 py-4 break-inside-avoid"
            >
              <h3 className="font-heading text-lg font-semibold text-ink">
                {phase.phase}
              </h3>
              <p className="mt-1 text-sm text-ink/90">{phase.objective}</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted">
                {phase.actions.map((action) => (
                  <li key={action}>{action}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-surface/30 px-5 py-6 print:bg-white">
        <h2 className="font-heading text-2xl font-semibold text-brand">
          {report.cta.headline}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-ink/90">{report.cta.body}</p>
        <ul className="mt-3 flex flex-wrap gap-2 text-sm text-muted">
          {report.cta.services.map((service) => (
            <li
              key={service}
              className="rounded-full border border-border px-3 py-1"
            >
              {service}
            </li>
          ))}
        </ul>
        {report.cta.primaryHref ? (
          <p className="mt-4 text-sm font-medium text-brand">
            {report.cta.primaryLabel}
            <span className="ml-2 font-normal text-muted">
              (preview — no form submission from this report)
            </span>
          </p>
        ) : (
          <p className="mt-4 text-sm font-medium text-brand">
            {report.cta.primaryLabel}
          </p>
        )}
      </section>

      <footer className="border-t border-border pt-4 text-xs leading-relaxed text-muted print:border-black/20">
        <p>{report.methodologyNote}</p>
      </footer>
    </article>
  );
}
