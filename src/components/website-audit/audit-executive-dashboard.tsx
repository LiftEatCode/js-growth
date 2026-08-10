import {
  AlertTriangle,
  Clock3,
  DollarSign,
  ExternalLink,
  Globe2,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Zap,
} from "lucide-react";

import { AuditGradeGauge } from "@/components/website-audit/audit-grade-gauge";
import {
  MetricCard,
  StatBadge,
} from "@/components/website-audit/report-ui";
import {
  Button,
  GridPattern,
} from "@/components/ui";
import type { ExecutiveSummary } from "@/lib/website-audit/executive-summary";
import { getReportConfig } from "@/lib/website-audit/report-config";
import type {
  ReportMode,
  WebsiteAuditResult,
} from "@/lib/website-audit/types";

interface AuditExecutiveDashboardProps {
  result: WebsiteAuditResult;
  executiveSummary: ExecutiveSummary;
  mode?: ReportMode;
}

function formatDate(
  value: string,
): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  return new Intl.DateTimeFormat(
    "en-US",
    {
      dateStyle: "medium",
    },
  ).format(date);
}

function formatMinutes(
  minutes: number,
): string {
  if (minutes <= 0) {
    return "No work";
  }

  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(
    minutes / 60,
  );

  const remainingMinutes =
    minutes % 60;

  if (remainingMinutes === 0) {
    return `${hours} hr`;
  }

  return `${hours}h ${remainingMinutes}m`;
}

function formatCurrency(
  value: number,
): string {
  return new Intl.NumberFormat(
    "en-US",
    {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    },
  ).format(value);
}

function getHostname(
  url: string,
): string {
  try {
    return new URL(
      url,
    ).hostname.replace(
      /^www\./,
      "",
    );
  } catch {
    return url;
  }
}

function getOpportunityLabel(
  level: WebsiteAuditResult["opportunity"]["level"],
): string {
  if (level === "very-high") {
    return "Very High";
  }

  if (level === "high") {
    return "High";
  }

  if (level === "medium") {
    return "Medium";
  }

  return "Low";
}

function getOpportunityTone(
  level: WebsiteAuditResult["opportunity"]["level"],
):
  | "success"
  | "primary"
  | "warning"
  | "default" {
  if (level === "very-high") {
    return "success";
  }

  if (level === "high") {
    return "primary";
  }

  if (level === "medium") {
    return "warning";
  }

  return "default";
}

export function AuditExecutiveDashboard({
  result,
  executiveSummary,
  mode = "public",
}: AuditExecutiveDashboardProps) {
  const config = getReportConfig(
    mode,
  );

  const hostname = getHostname(
    result.metadata.finalUrl,
  );

  const actionableFindings =
    result.summary.failed +
    result.summary.warnings;

  return (
    <section
      aria-labelledby="executive-dashboard-heading"
      className="relative overflow-hidden rounded-[2rem] border border-slate-800 bg-brand text-white shadow-soft"
    >
      <GridPattern className="opacity-35" />

      <div
        aria-hidden="true"
        className="absolute -right-24 -top-32 size-[28rem] rounded-full bg-brand-blue/25 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="absolute -bottom-40 -left-32 size-[30rem] rounded-full bg-brand-cyan/10 blur-3xl"
      />

      <div className="relative">
        <div className="border-b border-white/10 p-6 sm:p-8 lg:p-10">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-semibold text-cyan-300">
                  <Sparkles
                    aria-hidden="true"
                    className="size-3.5"
                  />

                  Website Growth Intelligence
                </span>

                <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs font-medium text-slate-300">
                  HTTP {result.metadata.statusCode}
                </span>

                {mode !== "public" ? (
                  <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs font-medium text-slate-300">
                    {mode === "client"
                      ? "Client Report"
                      : "Strategy Report"}
                  </span>
                ) : null}
              </div>

              <div className="mt-6 flex items-center gap-2 text-sm text-slate-400">
                <Globe2
                  aria-hidden="true"
                  className="size-4"
                />

                <span className="truncate">
                  {hostname}
                </span>
              </div>

              <h1
                id="executive-dashboard-heading"
                className="mt-2 font-heading text-3xl font-bold tracking-[-0.04em] text-white sm:text-4xl lg:text-5xl"
              >
                Website Growth Report
              </h1>

              <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-400">
                <span>
                  Audited{" "}
                  {formatDate(
                    result.metadata.fetchedAt,
                  )}
                </span>

                <span className="inline-flex items-center gap-2">
                  <ShieldCheck
                    aria-hidden="true"
                    className="size-4 text-cyan-300"
                  />

                  Read-only public website analysis
                </span>
              </div>
            </div>

            <Button
              size="lg"
              variant="outline"
              nativeButton={false}
              render={
                <a
                  href={result.metadata.finalUrl}
                  target="_blank"
                  rel="noreferrer"
                />
              }
              className="shrink-0 border-white/15 bg-white/[0.04] text-white hover:border-white/25 hover:bg-white/[0.08] hover:text-white"
            >
              Open Website

              <ExternalLink
                aria-hidden="true"
                className="ml-1 size-4"
              />
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-[320px_1fr]">
          <div className="flex items-center justify-center border-b border-white/10 p-8 lg:border-b-0 lg:border-r">
            <div className="text-center">
              <AuditGradeGauge
                score={result.overallScore}
                size={220}
              />

              <p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Overall Website Score
              </p>
            </div>
          </div>

          <div className="p-6 sm:p-8 lg:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">
              Executive Summary
            </p>

            <h2 className="mt-3 max-w-4xl font-heading text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              {executiveSummary.heading}
            </h2>

            <p className="mt-4 max-w-4xl text-base leading-7 text-slate-300 sm:text-lg">
              {executiveSummary.summary}
            </p>

            <div className="mt-7 flex flex-wrap gap-2">
              <StatBadge
                label={`${result.summary.criticalIssues} critical`}
                tone={
                  result.summary.criticalIssues > 0
                    ? "danger"
                    : "success"
                }
              />

              <StatBadge
                label={`${result.summary.quickWins} quick wins`}
                tone="primary"
              />

              <StatBadge
                label={`${result.summary.highImpactFindings} high impact`}
                tone={
                  result.summary.highImpactFindings > 0
                    ? "warning"
                    : "default"
                }
              />

              <StatBadge
                label={`${getOpportunityLabel(
                  result.opportunity.level,
                )} growth opportunity`}
                tone={getOpportunityTone(
                  result.opportunity.level,
                )}
              />
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 bg-white/[0.025] p-6 sm:p-8 lg:p-10">
          <div
            className={`grid gap-4 sm:grid-cols-2 ${
              config.showRevenueModel
                ? "xl:grid-cols-5"
                : "xl:grid-cols-4"
            }`}
          >
            <MetricCard
              icon={TrendingUp}
              label="Opportunity score"
              value={`${result.opportunity.score}/100`}
              description={`${getOpportunityLabel(
                result.opportunity.level,
              )} modeled growth potential`}
            />

            <MetricCard
              icon={AlertTriangle}
              label="Critical issues"
              value={String(
                result.summary.criticalIssues,
              )}
              description="Issues requiring the highest attention."
            />

            <MetricCard
              icon={Zap}
              label="Quick wins"
              value={String(
                result.summary.quickWins,
              )}
              description="Lower-effort opportunities identified."
            />

            {config.showEstimatedTime ? (
              <MetricCard
                icon={Clock3}
                label="Estimated effort"
                value={formatMinutes(
                  result.summary.estimatedFixMinutes,
                )}
                description="Modeled implementation effort."
              />
            ) : (
              <MetricCard
                icon={Clock3}
                label="Actionable findings"
                value={String(
                  actionableFindings,
                )}
                description="Areas where improvement was detected."
              />
            )}

            {config.showRevenueModel ? (
              <MetricCard
                icon={DollarSign}
                label="Monthly opportunity"
                value={`${formatCurrency(
                  result.opportunity
                    .monthlyRevenueOpportunity
                    .minimum,
                )}–${formatCurrency(
                  result.opportunity
                    .monthlyRevenueOpportunity
                    .maximum,
                )}`}
                description="Directional modeled revenue opportunity."
              />
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}