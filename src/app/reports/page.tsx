import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  FileSearch,
  Globe2,
  TrendingUp,
} from "lucide-react";

import {
  MetricCard,
  ReportSection,
} from "@/components/website-audit/report-ui";
import { ReportsDashboardClient } from "@/components/website-audit/reports-dashboard-client";
import { Button } from "@/components/ui/button";
import { auditReportRepository } from "@/lib/website-audit/storage";

export default async function ReportsPage() {
  const reports =
    await auditReportRepository.list();

  const totalReports =
    reports.length;

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

  const criticalSites =
    reports.filter(
      (report) =>
        report.criticalIssues > 0,
    ).length;

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-7xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
        <section>
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-medium text-primary">
                Growth intelligence
              </p>

              <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Reports Dashboard
              </h1>

              <p className="mt-3 max-w-3xl leading-7 text-muted-foreground">
                Review saved website
                audits, identify
                high-opportunity prospects,
                and track website health
                over time.
              </p>
            </div>

            <Button
              nativeButton={false}
              render={
                <Link href="/website-audit" />
              }
            >
              Run new audit

              <ArrowRight
                aria-hidden="true"
                className="ml-2 size-4"
              />
            </Button>
          </div>
        </section>

        <section
          aria-label="Report summary"
          className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
        >
          <MetricCard
            icon={FileSearch}
            label="Total reports"
            value={String(
              totalReports,
            )}
            description="Saved website growth reports."
          />

          <MetricCard
            icon={BarChart3}
            label="Average score"
            value={`${averageScore}/100`}
            description="Average website health score."
          />

          <MetricCard
            icon={TrendingUp}
            label="Avg. opportunity"
            value={`${averageOpportunity}/100`}
            description="Average modeled growth opportunity."
          />

          <MetricCard
            icon={AlertTriangle}
            label="Critical sites"
            value={String(
              criticalSites,
            )}
            description="Reports containing critical issues."
          />
        </section>

        <ReportSection
          eyebrow="Saved audits"
          title="Recent reports"
          description="Search, filter, sort, and open previously generated website growth reports."
          icon={Globe2}
        >
          <ReportsDashboardClient
            reports={reports}
          />
        </ReportSection>
      </div>
    </main>
  );
}