import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  BarChart3,
  Search,
  Share2,
  Target,
  TrendingUp,
} from "lucide-react";

import { CreateGrowthSnapshotForm } from "@/components/growth/create-snapshot-form";
import {
  Button,
  Card,
  Container,
} from "@/components/ui";
import {
  getInternalFunnelMetrics,
  lastNDaysEndingNow,
  previousPeriod,
} from "@/lib/growth/funnel-metrics";
import {
  describeQualifiedTraffic,
  KPI_HIERARCHY,
} from "@/lib/growth";
import { listGrowthSnapshots } from "@/lib/growth/snapshot-store";

export const metadata: Metadata = {
  title: "Growth Dashboard",
  description:
    "Internal growth measurement baseline, funnel metrics, and UTM tooling.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

function formatCount(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

function Metric({
  label,
  value,
  previous,
}: {
  label: string;
  value: number;
  previous?: number;
}) {
  return (
    <div className="rounded-2xl border border-border bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
        {label}
      </p>
      <p className="mt-2 font-heading text-2xl font-semibold text-brand">
        {formatCount(value)}
      </p>
      {previous !== undefined ? (
        <p className="mt-1 text-xs text-muted">
          Prev 28d: {formatCount(previous)}
        </p>
      ) : null}
    </div>
  );
}

export default async function GrowthDashboardPage() {
  const current = lastNDaysEndingNow(28);
  const previous = previousPeriod(current.periodStart, current.periodEnd);

  const [currentMetrics, previousMetrics, snapshots] = await Promise.all([
    getInternalFunnelMetrics(current),
    getInternalFunnelMetrics(previous),
    listGrowthSnapshots(20),
  ]);

  return (
    <main className="min-h-screen bg-slate-50/70">
      <Container className="py-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-blue">
              Growth Sprint 1
            </p>
            <h1 className="mt-2 font-heading text-3xl font-semibold tracking-tight text-brand">
              Growth measurement baseline
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
              Internal product facts only. GA4 / Search Console / Facebook are
              linked for operator review — V1 does not call external analytics
              APIs on page load.
            </p>
          </div>
          <Button
            nativeButton={false}
            render={<Link href="/reports/growth/utm-builder" />}
          >
            UTM Builder
            <ArrowRight aria-hidden="true" className="size-4" />
          </Button>
        </div>

        <section className="mt-10 space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="size-4 text-brand-blue" />
            <h2 className="font-heading text-xl font-semibold text-brand">
              Growth Overview
            </h2>
          </div>
          <p className="text-sm text-muted">
            Window: last 28 days vs previous 28 days (first-party DB).
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Metric
              label="Public audits created"
              value={currentMetrics.auditsCreated}
              previous={previousMetrics.auditsCreated}
            />
            <Metric
              label="Professional purchases"
              value={currentMetrics.professionalPurchases}
              previous={previousMetrics.professionalPurchases}
            />
            <Metric
              label="Opportunities created"
              value={currentMetrics.opportunitiesCreated}
              previous={previousMetrics.opportunitiesCreated}
            />
            <Metric
              label="Clients created"
              value={currentMetrics.clientsCreated}
              previous={previousMetrics.clientsCreated}
            />
          </div>
        </section>

        <section className="mt-12 space-y-4">
          <div className="flex items-center gap-2">
            <Target className="size-4 text-brand-blue" />
            <h2 className="font-heading text-xl font-semibold text-brand">
              Acquisition
            </h2>
          </div>
          <Card className="p-6">
            <p className="text-sm leading-6 text-muted">
              Use GA4 <strong>Traffic acquisition</strong> for session
              source/medium/campaign and landing page. Tag Facebook / GBP /
              email links with the internal UTM builder. Do not UTM internal
              site navigation.
            </p>
            <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-muted">
              <li>
                GA4:{" "}
                <a
                  className="text-brand-blue underline"
                  href="https://analytics.google.com/"
                  target="_blank"
                  rel="noreferrer"
                >
                  analytics.google.com
                </a>
              </li>
              <li>
                Search Console:{" "}
                <a
                  className="text-brand-blue underline"
                  href="https://search.google.com/search-console"
                  target="_blank"
                  rel="noreferrer"
                >
                  search.google.com/search-console
                </a>
              </li>
            </ul>
            {currentMetrics.attributionBySource.length > 0 ? (
              <div className="mt-6">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                  First-party audit attribution (last 28d)
                </p>
                <ul className="mt-3 space-y-2 text-sm">
                  {currentMetrics.attributionBySource.map((row) => (
                    <li
                      key={`${row.source}-${row.medium ?? ""}`}
                      className="flex justify-between gap-4 border-b border-border/70 py-2"
                    >
                      <span>
                        {row.source}
                        {row.medium ? ` / ${row.medium}` : ""}
                      </span>
                      <span className="font-semibold">
                        {formatCount(row.count)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted">
                No first-party UTM attribution captured on audits yet.
              </p>
            )}
          </Card>
        </section>

        <section className="mt-12 space-y-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="size-4 text-brand-blue" />
            <h2 className="font-heading text-xl font-semibold text-brand">
              Website & Audit Funnel (internal)
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Metric label="Audits created" value={currentMetrics.auditsCreated} />
            <Metric
              label="Free reports completed"
              value={currentMetrics.freeReportsCompleted}
            />
            <Metric
              label="Professional purchases"
              value={currentMetrics.professionalPurchases}
            />
            <Metric
              label="Prospects created"
              value={currentMetrics.prospectsCreated}
            />
          </div>
          <p className="text-sm text-muted">
            Public funnel events (`audit_started`, `audit_submitted`, etc.) live
            in GA4. Mark key events in GA Admin per docs/growth.
          </p>
        </section>

        <section className="mt-12 space-y-4">
          <div className="flex items-center gap-2">
            <Search className="size-4 text-brand-blue" />
            <h2 className="font-heading text-xl font-semibold text-brand">
              Search
            </h2>
          </div>
          <Card className="p-6 text-sm leading-6 text-muted">
            Record Search Console baselines as GrowthSnapshots (source
            SEARCH_CONSOLE). Primary SEO outcomes: qualified impressions,
            clicks, landing-page traffic, audit starts, leads — not average
            position alone. See docs/growth/measurement-framework.md.
          </Card>
        </section>

        <section className="mt-12 space-y-4">
          <div className="flex items-center gap-2">
            <Share2 className="size-4 text-brand-blue" />
            <h2 className="font-heading text-xl font-semibold text-brand">
              Facebook
            </h2>
          </div>
          <Card className="p-6 text-sm leading-6 text-muted">
            Keep <strong>JS Solutions Page</strong> and{" "}
            <strong>founder/personal</strong> baselines separate. Capture
            manually as FACEBOOK snapshots. Use utm_source=facebook +
            organic_social (founder_content campaign for personal posts).
          </Card>
        </section>

        <section className="mt-12 space-y-4">
          <h2 className="font-heading text-xl font-semibold text-brand">
            Commercial Outcomes
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Metric
              label="Opportunities"
              value={currentMetrics.opportunitiesCreated}
              previous={previousMetrics.opportunitiesCreated}
            />
            <Metric
              label="Proposals"
              value={currentMetrics.proposalsCreated}
              previous={previousMetrics.proposalsCreated}
            />
            <Metric
              label="Agreements accepted"
              value={currentMetrics.agreementsAccepted}
              previous={previousMetrics.agreementsAccepted}
            />
            <Metric
              label="Clients"
              value={currentMetrics.clientsCreated}
              previous={previousMetrics.clientsCreated}
            />
          </div>
        </section>

        <section className="mt-12 space-y-4">
          <h2 className="font-heading text-xl font-semibold text-brand">
            Qualified traffic & KPI hierarchy
          </h2>
          <Card className="space-y-4 p-6">
            <p className="text-sm leading-6 text-muted">
              {describeQualifiedTraffic()}
            </p>
            <ol className="space-y-2 text-sm">
              {KPI_HIERARCHY.map((level) => (
                <li key={level.level}>
                  <span className="font-semibold text-brand">
                    L{level.level} {level.name}:
                  </span>{" "}
                  <span className="text-muted">{level.kpis.join(" · ")}</span>
                </li>
              ))}
            </ol>
          </Card>
        </section>

        <section className="mt-12 space-y-4">
          <h2 className="font-heading text-xl font-semibold text-brand">
            Baseline snapshots
          </h2>
          <CreateGrowthSnapshotForm />
          <Card className="overflow-hidden p-0">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-slate-50 text-xs uppercase tracking-[0.08em] text-muted">
                <tr>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3">Source</th>
                  <th className="px-4 py-3">Period</th>
                  <th className="px-4 py-3">By</th>
                </tr>
              </thead>
              <tbody>
                {snapshots.length === 0 ? (
                  <tr>
                    <td className="px-4 py-4 text-muted" colSpan={4}>
                      No snapshots yet. Record GA4 / GSC / Facebook / Internal
                      baselines above.
                    </td>
                  </tr>
                ) : (
                  snapshots.map((snap) => (
                    <tr key={snap.id} className="border-b border-border/70">
                      <td className="px-4 py-3">
                        {snap.createdAt.toISOString().slice(0, 10)}
                      </td>
                      <td className="px-4 py-3">{snap.source}</td>
                      <td className="px-4 py-3">
                        {snap.periodStart.toISOString().slice(0, 10)} →{" "}
                        {snap.periodEnd.toISOString().slice(0, 10)}
                      </td>
                      <td className="px-4 py-3">{snap.createdByEmail}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </Card>
        </section>
      </Container>
    </main>
  );
}
