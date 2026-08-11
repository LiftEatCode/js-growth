import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  BarChart3,
  CalendarClock,
  CheckCircle2,
  Flame,
  SearchCheck,
  TrendingUp,
  UserRoundCheck,
} from "lucide-react";

import { FollowUpCommandCenter } from "@/components/website-audit/follow-up-command-center";
import { ReportsViewSwitcher } from "@/components/website-audit/reports-view-switcher";
import {
  Button,
  Card,
  Container,
  GridPattern,
} from "@/components/ui";
import { auditReportRepository } from "@/lib/website-audit/storage";
import type {
  AuditLeadStatus,
  AuditReportSummary,
} from "@/lib/website-audit/storage";

export const metadata: Metadata = {
  title:
    "Reports Dashboard",

  description:
    "Internal website audit, lead pipeline, and prospect intelligence dashboard for JS Solutions.",

  robots: {
    index: false,
    follow: false,
  },
};

const CLOSED_STATUSES: AuditLeadStatus[] =
  [
    "WON",
    "LOST",
  ];

function isActiveLead(
  report: AuditReportSummary,
): boolean {
  return Boolean(
    report.lead &&
      !CLOSED_STATUSES.includes(
        report.lead.status,
      ),
  );
}

function isFollowUpDue(
  report: AuditReportSummary,
): boolean {
  if (
    !report.lead?.followUpAt ||
    CLOSED_STATUSES.includes(
      report.lead.status,
    )
  ) {
    return false;
  }

  const followUp =
    new Date(
      report.lead.followUpAt,
    );

  if (
    Number.isNaN(
      followUp.getTime(),
    )
  ) {
    return false;
  }

  const endOfToday =
    new Date();

  endOfToday.setHours(
    23,
    59,
    59,
    999,
  );

  return (
    followUp <=
    endOfToday
  );
}

function getPipelineLabel(
  status: AuditLeadStatus,
): string {
  if (
    status === "NEW"
  ) {
    return "New";
  }

  if (
    status === "CONTACTED"
  ) {
    return "Contacted";
  }

  if (
    status === "QUALIFIED"
  ) {
    return "Qualified";
  }

  if (
    status === "PROPOSAL"
  ) {
    return "Proposal";
  }

  if (
    status === "WON"
  ) {
    return "Won";
  }

  return "Lost";
}

function getPriorityScore(
  report: AuditReportSummary,
): number {
  const statusWeight: Record<
    AuditLeadStatus,
    number
  > = {
    NEW: 60,
    CONTACTED: 45,
    QUALIFIED: 80,
    PROPOSAL: 90,
    WON: -100,
    LOST: -150,
  };

  const leadWeight =
    report.lead
      ? statusWeight[
          report.lead.status
        ]
      : 10;

  const followUpWeight =
    isFollowUpDue(
      report,
    )
      ? 50
      : 0;

  return (
    leadWeight +
    followUpWeight +
    report.opportunityScore +
    Math.max(
      0,
      80 -
        report.overallScore,
    ) +
    report.criticalIssues *
      8 +
    report.quickWins * 2
  );
}

export default async function ReportsPage() {
  const reports =
    await auditReportRepository.list();

  const capturedLeads =
    reports.filter(
      (report) =>
        report.lead !==
        null,
    ).length;

  const activePipeline =
    reports.filter(
      isActiveLead,
    ).length;

  const followUpsDue =
    reports.filter(
      isFollowUpDue,
    ).length;

  const wonOpportunities =
    reports.filter(
      (report) =>
        report.lead
          ?.status ===
        "WON",
    ).length;

  const totalReports =
    reports.length;

  const averageScore =
    totalReports > 0
      ? Math.round(
          reports.reduce(
            (
              total,
              report,
            ) =>
              total +
              report.overallScore,
            0,
          ) /
            totalReports,
        )
      : 0;

  const averageOpportunity =
    totalReports > 0
      ? Math.round(
          reports.reduce(
            (
              total,
              report,
            ) =>
              total +
              report.opportunityScore,
            0,
          ) /
            totalReports,
        )
      : 0;

  const priorityProspects =
    [
      ...reports,
    ]
      .filter(
        (report) =>
          !report.lead ||
          !CLOSED_STATUSES.includes(
            report.lead.status,
          ),
      )
      .sort(
        (a, b) =>
          getPriorityScore(
            b,
          ) -
          getPriorityScore(
            a,
          ),
      )
      .slice(
        0,
        4,
      );

  return (
    <main className="min-h-screen bg-slate-50/60">
      <section className="relative isolate overflow-hidden bg-brand text-white">
        <GridPattern className="opacity-35" />

        <div
          aria-hidden="true"
          className="absolute -right-40 -top-32 -z-10 size-[34rem] rounded-full bg-brand-blue/25 blur-3xl"
        />

        <div
          aria-hidden="true"
          className="absolute -bottom-40 -left-32 -z-10 size-[30rem] rounded-full bg-brand-cyan/10 blur-3xl"
        />

        <Container className="relative py-10 sm:py-12 lg:py-14">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-300">
                <SearchCheck
                  aria-hidden="true"
                  className="size-3.5"
                />

                Growth Intelligence
              </div>

              <h1 className="mt-5 font-heading text-3xl font-bold tracking-[-0.04em] text-white sm:text-4xl lg:text-5xl">
                Sales & Reports Dashboard
              </h1>

              <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300 sm:text-lg">
                Manage website audits, captured leads, follow-ups, active opportunities, and the prospects most likely to benefit from JS Solutions.
              </p>
            </div>

            <Button
              size="lg"
              nativeButton={
                false
              }
              render={
                <Link href="/website-audit" />
              }
            >
              Run New Audit

              <ArrowRight
                aria-hidden="true"
                className="ml-1 size-4"
              />
            </Button>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <DashboardMetric
              icon={
                UserRoundCheck
              }
              label="Captured Leads"
              value={String(
                capturedLeads,
              )}
              description="People who requested a professional audit report."
            />

            <DashboardMetric
              icon={
                TrendingUp
              }
              label="Active Pipeline"
              value={String(
                activePipeline,
              )}
              description="Open leads that have not been won or lost."
            />

            <DashboardMetric
              icon={
                CalendarClock
              }
              label="Follow-Ups Due"
              value={String(
                followUpsDue,
              )}
              description="Open leads with a follow-up scheduled for today or earlier."
            />

            <DashboardMetric
              icon={
                CheckCircle2
              }
              label="Won Opportunities"
              value={String(
                wonOpportunities,
              )}
              description="Leads moved successfully through the pipeline."
            />
          </div>
        </Container>
      </section>

      <Container className="space-y-10 py-8 sm:py-10 lg:py-12">
        <FollowUpCommandCenter
          reports={
            reports
          }
        />

        <section
          aria-labelledby="sales-overview-heading"
          className="grid gap-5 lg:grid-cols-[0.7fr_1.3fr]"
        >
          <Card
            variant="elevated"
            padding="lg"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-blue">
              Audit Intelligence
            </p>

            <h2
              id="sales-overview-heading"
              className="mt-3 font-heading text-2xl font-semibold tracking-tight text-brand"
            >
              Portfolio health.
            </h2>

            <p className="mt-3 text-sm leading-6 text-muted">
              Website health and opportunity averages across the full audit library.
            </p>

            <div className="mt-7 grid gap-4 sm:grid-cols-2">
              <InternalMetric
                icon={
                  BarChart3
                }
                label="Average score"
                value={`${averageScore}/100`}
              />

              <InternalMetric
                icon={
                  TrendingUp
                }
                label="Avg. opportunity"
                value={`${averageOpportunity}/100`}
              />
            </div>

            <div className="mt-5 rounded-xl border border-border bg-slate-50/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                Saved audits
              </p>

              <p className="mt-2 font-heading text-2xl font-semibold text-brand">
                {
                  totalReports
                }
              </p>
            </div>
          </Card>

          <Card
            variant="elevated"
            padding="lg"
          >
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-brand-blue/10 bg-brand-blue/[0.07] text-brand-blue">
                <Flame
                  aria-hidden="true"
                  className="size-5"
                />
              </span>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-blue">
                  Priority Queue
                </p>

                <h2 className="mt-2 font-heading text-2xl font-semibold tracking-tight text-brand">
                  Opportunities worth reviewing first.
                </h2>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
                  Priority favors active pipeline stages, due follow-ups, stronger opportunity scores, weak website health, critical issues, and quick wins.
                </p>
              </div>
            </div>

            {priorityProspects.length >
            0 ? (
              <div className="mt-6 grid gap-3 md:grid-cols-2">
                {priorityProspects.map(
                  (
                    report,
                  ) => (
                    <Link
                      key={
                        report.id
                      }
                      href={`/reports/${report.id}`}
                      className="group rounded-xl border border-border bg-slate-50/60 p-4 transition hover:border-brand-blue/20 hover:bg-brand-blue/[0.035]"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="truncate font-heading font-semibold text-brand">
                            {
                              report.hostname
                            }
                          </p>

                          <p className="mt-1 text-xs text-muted">
                            Score{" "}
                            {
                              report.overallScore
                            }
                            /100 · Opportunity{" "}
                            {
                              report.opportunityScore
                            }
                            /100
                          </p>
                        </div>

                        <PipelinePill
                          report={
                            report
                          }
                        />
                      </div>

                      {report.lead ? (
                        <p className="mt-3 truncate text-sm font-medium text-brand">
                          {
                            report.lead.firstName
                          }{" "}
                          {
                            report.lead.lastName
                          }
                          {report.lead
                            .company
                            ? ` · ${report.lead.company}`
                            : ""}
                        </p>
                      ) : null}

                      <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-3">
                        <span className="text-xs text-muted">
                          {
                            report.criticalIssues
                          }{" "}
                          critical ·{" "}
                          {
                            report.quickWins
                          }{" "}
                          quick wins
                        </span>

                        <ArrowRight
                          aria-hidden="true"
                          className="size-4 text-slate-300 transition-transform group-hover:translate-x-1 group-hover:text-brand-blue"
                        />
                      </div>
                    </Link>
                  ),
                )}
              </div>
            ) : (
              <div className="mt-6 rounded-xl border border-dashed border-border bg-slate-50/60 p-6 text-center">
                <p className="font-heading font-semibold text-brand">
                  No active opportunities yet.
                </p>

                <p className="mt-2 text-sm text-muted">
                  Open prospects and leads will appear here automatically.
                </p>
              </div>
            )}
          </Card>
        </section>

        <section>
          <ReportsViewSwitcher
            reports={
              reports
            }
          />
        </section>
      </Container>
    </main>
  );
}

interface DashboardMetricProps {
  icon:
    typeof UserRoundCheck;

  label: string;

  value: string;

  description: string;
}

function DashboardMetric({
  icon: Icon,
  label,
  value,
  description,
}: DashboardMetricProps) {
  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.06] p-5 backdrop-blur-xl">
      <span className="flex size-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.07] text-cyan-300">
        <Icon
          aria-hidden="true"
          className="size-5"
        />
      </span>

      <p className="mt-4 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
        {label}
      </p>

      <p className="mt-2 font-heading text-3xl font-bold tracking-tight text-white">
        {value}
      </p>

      <p className="mt-2 text-xs leading-5 text-slate-400">
        {description}
      </p>
    </article>
  );
}

interface InternalMetricProps {
  icon:
    typeof BarChart3;

  label: string;

  value: string;
}

function InternalMetric({
  icon: Icon,
  label,
  value,
}: InternalMetricProps) {
  return (
    <div className="rounded-xl border border-border bg-slate-50/70 p-4">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted">
        <Icon
          aria-hidden="true"
          className="size-4 text-brand-blue"
        />

        {label}
      </div>

      <p className="mt-3 font-heading text-2xl font-semibold text-brand">
        {value}
      </p>
    </div>
  );
}

function PipelinePill({
  report,
}: {
  report:
    AuditReportSummary;
}) {
  if (
    !report.lead
  ) {
    return (
      <span className="shrink-0 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-600">
        Prospect
      </span>
    );
  }

  const status =
    report.lead.status;

  const classes =
    status === "WON"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : status ===
          "LOST"
        ? "border-red-200 bg-red-50 text-red-700"
        : status ===
            "PROPOSAL"
          ? "border-amber-200 bg-amber-50 text-amber-700"
          : "border-brand-blue/15 bg-brand-blue/[0.06] text-brand-blue";

  return (
    <span
      className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] ${classes}`}
    >
      {getPipelineLabel(
        status,
      )}
    </span>
  );
}