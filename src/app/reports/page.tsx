import Link from "next/link";
import type { Metadata } from "next";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  FileSearch,
  Flame,
  SearchCheck,
  TrendingUp,
  UserRoundCheck,
} from "lucide-react";

import { ReportsDashboardClient } from "@/components/website-audit/reports-dashboard-client";
import {
  Button,
  Card,
  Container,
  GridPattern,
} from "@/components/ui";
import { auditReportRepository } from "@/lib/website-audit/storage";

export const metadata: Metadata = {
  title: "Reports Dashboard",
  description:
    "Internal website audit and prospect intelligence dashboard for JS Solutions.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function ReportsPage() {
  const reports =
    await auditReportRepository.list();

  const totalReports =
    reports.length;

  const capturedLeads =
    reports.filter(
      (report) =>
        report.lead !== null,
    ).length;

  const highOpportunitySites =
    reports.filter(
      (report) =>
        report.opportunityScore >= 70,
    ).length;

  const criticalSites =
    reports.filter(
      (report) =>
        report.criticalIssues > 0,
    ).length;

  const averageScore =
    totalReports > 0
      ? Math.round(
          reports.reduce(
            (total, report) =>
              total +
              report.overallScore,
            0,
          ) / totalReports,
        )
      : 0;

  const averageOpportunity =
    totalReports > 0
      ? Math.round(
          reports.reduce(
            (total, report) =>
              total +
              report.opportunityScore,
            0,
          ) / totalReports,
        )
      : 0;

  const priorityProspects =
    reports
      .filter(
        (report) =>
          report.opportunityScore >=
            65 &&
          (report.overallScore < 75 ||
            report.criticalIssues > 0),
      )
      .sort((a, b) => {
        const leadWeightA =
          a.lead ? 30 : 0;

        const leadWeightB =
          b.lead ? 30 : 0;

        const scoreA =
          a.opportunityScore +
          a.criticalIssues * 5 +
          Math.max(
            0,
            75 -
              a.overallScore,
          ) +
          leadWeightA;

        const scoreB =
          b.opportunityScore +
          b.criticalIssues * 5 +
          Math.max(
            0,
            75 -
              b.overallScore,
          ) +
          leadWeightB;

        return scoreB - scoreA;
      })
      .slice(0, 4);

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
                Reports Dashboard
              </h1>

              <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300 sm:text-lg">
                Review website audits, identify strong prospects, track captured leads, and decide where follow-up can create the most value.
              </p>
            </div>

            <Button
              size="lg"
              nativeButton={false}
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
              icon={FileSearch}
              label="Total Audits"
              value={String(
                totalReports,
              )}
              description="Saved website growth reports."
            />

            <DashboardMetric
              icon={TrendingUp}
              label="High Opportunity"
              value={String(
                highOpportunitySites,
              )}
              description="Sites scoring 70+ for modeled opportunity."
            />

            <DashboardMetric
              icon={UserRoundCheck}
              label="Captured Leads"
              value={String(
                capturedLeads,
              )}
              description="Audit visitors who requested their professional report."
            />

            <DashboardMetric
              icon={AlertTriangle}
              label="Critical Sites"
              value={String(
                criticalSites,
              )}
              description="Audits containing at least one critical issue."
            />
          </div>
        </Container>
      </section>

      <Container className="space-y-10 py-8 sm:py-10 lg:py-12">
        <section
          aria-labelledby="portfolio-health-heading"
          className="grid gap-5 lg:grid-cols-[0.7fr_1.3fr]"
        >
          <Card
            variant="elevated"
            padding="lg"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-blue">
              Portfolio Health
            </p>

            <h2
              id="portfolio-health-heading"
              className="mt-3 font-heading text-2xl font-semibold tracking-tight text-brand"
            >
              Current audit averages.
            </h2>

            <p className="mt-3 text-sm leading-6 text-muted">
              A quick view of the overall quality and growth potential across all saved audits.
            </p>

            <div className="mt-7 grid gap-4 sm:grid-cols-2">
              <InternalMetric
                icon={BarChart3}
                label="Average score"
                value={`${averageScore}/100`}
              />

              <InternalMetric
                icon={TrendingUp}
                label="Avg. opportunity"
                value={`${averageOpportunity}/100`}
              />
            </div>
          </Card>

          <Card
            variant="elevated"
            padding="lg"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-brand-blue">
                  <Flame
                    aria-hidden="true"
                    className="size-4"
                  />

                  Priority Prospects
                </div>

                <h2 className="mt-3 font-heading text-2xl font-semibold tracking-tight text-brand">
                  Sites worth reviewing first.
                </h2>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
                  Prioritized using opportunity score, weak website health, critical issues, and whether a lead has already engaged.
                </p>
              </div>
            </div>

            {priorityProspects.length >
            0 ? (
              <div className="mt-6 grid gap-3 md:grid-cols-2">
                {priorityProspects.map(
                  (report) => (
                    <Link
                      key={report.id}
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

                        {report.lead ? (
                          <span className="shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-emerald-700">
                            Lead
                          </span>
                        ) : (
                          <span className="shrink-0 rounded-full border border-brand-blue/15 bg-brand-blue/[0.06] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-brand-blue">
                            Prospect
                          </span>
                        )}
                      </div>

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
                  No priority prospects yet.
                </p>

                <p className="mt-2 text-sm text-muted">
                  Higher-opportunity audits will appear here automatically.
                </p>
              </div>
            )}
          </Card>
        </section>

        <section>
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-blue">
              Audit Library
            </p>

            <h2 className="mt-3 font-heading text-3xl font-semibold tracking-tight text-brand">
              All reports
            </h2>

            <p className="mt-3 max-w-3xl leading-7 text-muted">
              Search, filter, sort, open, and manage saved website audits.
            </p>
          </div>

          <ReportsDashboardClient
            reports={reports}
          />
        </section>
      </Container>
    </main>
  );
}

interface DashboardMetricProps {
  icon: typeof FileSearch;
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
  icon: typeof BarChart3;
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