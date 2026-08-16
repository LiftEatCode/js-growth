import {
  Clock3,
  ExternalLink,
  Globe2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { AuditGradeGauge } from "@/components/website-audit/audit-grade-gauge";
import {
  MetricCard,
  StatBadge,
} from "@/components/website-audit/report-ui";
import { Button, GridPattern } from "@/components/ui";
import type { GrowthReportViewModel } from "@/lib/website-audit/report-view";

interface AuditExecutiveDashboardProps {
  view: GrowthReportViewModel;
}

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
  }).format(date);
}

function getHostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function AuditExecutiveDashboard({
  view,
}: AuditExecutiveDashboardProps) {
  const hostname = getHostname(view.report.metadata.finalUrl);
  const { summary, counts, scoreBand } = view;

  return (
    <section
      id="report-overview"
      aria-labelledby="executive-dashboard-heading"
      className="relative overflow-hidden rounded-[2rem] border border-slate-800 bg-brand text-white shadow-soft"
    >
      <GridPattern className="opacity-35" />
      <div
        aria-hidden="true"
        className="absolute -right-24 -top-32 size-[28rem] rounded-full bg-brand-blue/25 blur-3xl"
      />

      <div className="relative">
        <div className="border-b border-white/10 p-6 sm:p-8 lg:p-10">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-semibold text-cyan-300">
                  <Sparkles aria-hidden="true" className="size-3.5" />
                  Website Growth Audit
                </span>
                <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs font-medium text-slate-300">
                  {view.tier === "professional"
                    ? "Professional report"
                    : "Free preview"}
                </span>
              </div>

              <div className="mt-6 flex items-center gap-2 text-sm text-slate-400">
                <Globe2 aria-hidden="true" className="size-4" />
                <span className="truncate">{hostname}</span>
              </div>

              <h1
                id="executive-dashboard-heading"
                className="mt-2 font-heading text-3xl font-bold tracking-[-0.04em] text-white sm:text-4xl lg:text-5xl"
              >
                Website Growth Audit
              </h1>

              <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-300 sm:text-base">
                This report evaluates the website across search visibility,
                content, conversion, local visibility, technical health, and
                performance signals.
              </p>

              <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-400">
                <span>
                  Audited {formatDate(view.report.metadata.fetchedAt)}
                </span>
                <span className="inline-flex items-center gap-2">
                  <ShieldCheck
                    aria-hidden="true"
                    className="size-4 text-cyan-300"
                  />
                  JS Solutions · read-only public analysis
                </span>
              </div>
            </div>

            <Button
              size="lg"
              variant="outline"
              nativeButton={false}
              render={
                <a
                  href={view.report.metadata.finalUrl}
                  target="_blank"
                  rel="noreferrer"
                />
              }
              className="print:hidden shrink-0 border-white/15 bg-white/[0.04] text-white hover:border-white/25 hover:bg-white/[0.08] hover:text-white"
            >
              Open Website
              <ExternalLink aria-hidden="true" className="ml-1 size-4" />
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-[320px_1fr]">
          <div className="flex items-center justify-center border-b border-white/10 p-8 lg:border-b-0 lg:border-r">
            <div className="text-center">
              <AuditGradeGauge score={view.report.overallScore} size={220} />
              <p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Website Growth Score
              </p>
              <p className="mt-2 text-sm text-slate-300">{scoreBand.label}</p>
            </div>
          </div>

          <div className="p-6 sm:p-8 lg:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">
              Executive Summary
            </p>
            <h2 className="mt-3 max-w-4xl font-heading text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              {summary.heading}
            </h2>
            <p className="mt-4 max-w-4xl text-base leading-7 text-slate-300">
              {summary.overview}
            </p>

            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              <SummaryStat
                label="Website Growth Score"
                value={`${summary.overallScore}/100`}
              />
              <SummaryStat
                label="Strongest area"
                value={
                  summary.strongest
                    ? `${summary.strongest.label} — ${summary.strongest.percent}/100`
                    : "Not enough category data"
                }
              />
              <SummaryStat
                label="Biggest opportunity"
                value={
                  summary.weakest
                    ? `${summary.weakest.label} — ${summary.weakest.percent}/100`
                    : "Not enough category data"
                }
              />
              <SummaryStat
                label="Estimated improvement work"
                value={summary.estimatedEffortLabel}
              />
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <StatBadge
                label={`${counts.highPriority} high priority`}
                tone={counts.highPriority > 0 ? "danger" : "success"}
              />
              <StatBadge
                label={`${counts.mediumPriority} medium`}
                tone="warning"
              />
              <StatBadge
                label={`${counts.lowPriority} low`}
              />
              <StatBadge
                label={`${counts.passed} checks passed`}
                tone="success"
              />
            </div>
          </div>
        </div>

        {view.capabilities.showEstimatedEffort ? (
          <div className="border-t border-white/10 bg-white/[0.025] p-6 sm:p-8">
            <div className="grid gap-4 sm:grid-cols-3">
              <MetricCard
                icon={Sparkles}
                label="High-priority issues"
                value={String(summary.highPriorityCount)}
                description="Issues that should be reviewed first."
              />
              <MetricCard
                icon={Clock3}
                label="Estimated effort"
                value={summary.estimatedEffortLabel}
                description="Actual time depends on the website platform and complexity."
              />
              <MetricCard
                icon={Sparkles}
                label="Quick wins"
                value={String(summary.quickWinCount)}
                description="Lower-effort improvements identified by the scan."
              />
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function SummaryStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 font-heading text-lg font-semibold text-white">
        {value}
      </p>
    </div>
  );
}
