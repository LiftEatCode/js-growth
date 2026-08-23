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

import { CreateGrowthContentForm } from "@/components/growth/create-content-form";
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
  formatFunnelCount,
  formatFunnelRate,
  getAuditFunnelDashboardMetrics,
  type FunnelCountMetric,
  type FunnelRateMetric,
} from "@/lib/growth/audit-funnel-metrics";
import {
  describeQualifiedTraffic,
  AUDIT_FUNNEL_VERSION,
  FACEBOOK_FOLLOWER_TARGET_FRAMEWORK,
  FACEBOOK_GROWTH_VERSION,
  FACEBOOK_METRIC_LAYERS,
  FACEBOOK_SCORECARD,
  followerGrowthRatePercent,
  GROWTH_BASELINE_DATE,
  GROWTH_BASELINE_LABEL,
  GROWTH_BASELINE_PERIOD,
  GROWTH_BASELINE_V1,
  GROWTH_BASELINE_VERSION,
  KPI_HIERARCHY,
  netFollowerChange,
  type FacebookSnapshotMetrics,
} from "@/lib/growth";
import { getFacebookOrganicAttributionSummary } from "@/lib/growth/facebook-attribution-metrics";
import { summarizeGrowthContentRecords } from "@/lib/growth/content-store";
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

function StatusBadge({ status }: { status: string }) {
  return (
    <span className="rounded-md border border-border bg-slate-50 px-2 py-0.5 font-mono text-xs text-muted">
      {status}
    </span>
  );
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

function BaselineStat({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl border border-border/80 bg-white px-3 py-2">
      <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-brand">{value}</p>
    </div>
  );
}

function FunnelStep({ label, metric }: { label: string; metric: FunnelCountMetric }) {
  return (
    <div className="rounded-2xl border border-border bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
        {label}
      </p>
      <p className="mt-2 font-heading text-2xl font-semibold text-brand">
        {formatFunnelCount(metric)}
      </p>
    </div>
  );
}

function FunnelRate({
  label,
  metric,
}: {
  label: string;
  metric: FunnelRateMetric;
}) {
  return (
    <div className="rounded-xl border border-border/80 bg-slate-50 px-3 py-2">
      <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-brand">
        {formatFunnelRate(metric)}
      </p>
    </div>
  );
}

export default async function GrowthDashboardPage() {
  const current = lastNDaysEndingNow(28);
  const previous = previousPeriod(current.periodStart, current.periodEnd);

  const [
    currentMetrics,
    previousMetrics,
    auditFunnel,
    snapshots,
    contentSummary,
    facebookAttribution,
  ] = await Promise.all([
    getInternalFunnelMetrics(current),
    getInternalFunnelMetrics(previous),
    getAuditFunnelDashboardMetrics(current),
    listGrowthSnapshots(20),
    summarizeGrowthContentRecords(200),
    getFacebookOrganicAttributionSummary(current),
  ]);

  const facebookSnapshots = snapshots.filter((s) => s.source === "FACEBOOK");
  const latestFacebookSnapshot = facebookSnapshots[0] ?? null;
  const latestFbMetrics = (latestFacebookSnapshot?.metricsJson ??
    null) as FacebookSnapshotMetrics | null;
  const currentFollowers =
    typeof latestFbMetrics?.followers === "number"
      ? latestFbMetrics.followers
      : null;
  const followerDelta = netFollowerChange(
    currentFollowers,
    GROWTH_BASELINE_V1.facebook.followers,
  );
  const followerRate = followerGrowthRatePercent(
    currentFollowers,
    GROWTH_BASELINE_V1.facebook.followers,
  );

  return (
    <main className="min-h-screen bg-slate-50/70">
      <Container className="py-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-blue">
              Growth Baseline V{GROWTH_BASELINE_VERSION}
            </p>
            <h1 className="mt-2 font-heading text-3xl font-semibold tracking-tight text-brand">
              Growth measurement baseline
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
              Internal product facts only. GA4 / Search Console / Facebook are
              linked for operator review — V1 does not call external analytics
              APIs on page load. Unknowns stay{" "}
              <StatusBadge status="NOT_CAPTURED" /> /{" "}
              <StatusBadge status="INSUFFICIENT_DATA" /> — never estimated zeros.
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
              {GROWTH_BASELINE_LABEL}
            </h2>
          </div>
          <Card className="space-y-5 p-6">
            <p className="text-sm leading-6 text-muted">
              Recorded {GROWTH_BASELINE_DATE}. Window{" "}
              {GROWTH_BASELINE_PERIOD.start} → {GROWTH_BASELINE_PERIOD.end}.
              Canonical values live in code and docs — compare future sprints
              against this snapshot without rewriting history.
            </p>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                Search Console ({GROWTH_BASELINE_V1.searchConsole.property})
              </p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                <BaselineStat
                  label="Clicks"
                  value={GROWTH_BASELINE_V1.searchConsole.clicks}
                />
                <BaselineStat
                  label="Impressions"
                  value={GROWTH_BASELINE_V1.searchConsole.impressions}
                />
                <BaselineStat
                  label="CTR"
                  value={`${GROWTH_BASELINE_V1.searchConsole.averageCtr}%`}
                />
                <BaselineStat
                  label="Avg position"
                  value={GROWTH_BASELINE_V1.searchConsole.averagePosition}
                />
                <BaselineStat
                  label="Query data"
                  value={GROWTH_BASELINE_V1.searchConsole.queryDataStatus}
                />
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                GA4 instrumentation
              </p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                <BaselineStat label="Production tracking" value="VERIFIED" />
                <BaselineStat
                  label="Historical traffic totals"
                  value={GROWTH_BASELINE_V1.ga4.historicalTrafficTotalsStatus}
                />
                <BaselineStat
                  label="Key-event candidates"
                  value={GROWTH_BASELINE_V1.ga4.keyEventCandidates.join(", ")}
                />
              </div>
              <p className="mt-2 text-xs text-muted">
                Realtime funnel verified:{" "}
                {GROWTH_BASELINE_V1.ga4.verifiedFunnel.join(" → ")}.{" "}
                {GROWTH_BASELINE_V1.ga4.monitorEventCardinality.status}:
                submitted=
                {
                  GROWTH_BASELINE_V1.ga4.monitorEventCardinality
                    .observedDuringRealtimeValidation.audit_submitted
                }
                , completed=
                {
                  GROWTH_BASELINE_V1.ga4.monitorEventCardinality
                    .observedDuringRealtimeValidation.audit_completed
                }{" "}
                (monitor only — baseline snapshot; Sprint 2 dedupes duplicate
                `audit_completed` fires).
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                Facebook — JS Solutions Page
              </p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                <BaselineStat
                  label="Followers"
                  value={GROWTH_BASELINE_V1.facebook.followers}
                />
                <BaselineStat
                  label="Visits"
                  value={GROWTH_BASELINE_V1.facebook.visits}
                />
                <BaselineStat
                  label="Engagements"
                  value={GROWTH_BASELINE_V1.facebook.engagements}
                />
                <BaselineStat
                  label="Non-follower views"
                  value={`${GROWTH_BASELINE_V1.facebook.viewsByFollowerStatus.nonFollowersPercent}%`}
                />
                <BaselineStat
                  label="Photo views"
                  value={`${GROWTH_BASELINE_V1.facebook.viewsByContentType.photoPercent}%`}
                />
                <BaselineStat
                  label="Total views"
                  value={GROWTH_BASELINE_V1.facebook.totalViewsStatus}
                />
                <BaselineStat
                  label="Top fans"
                  value={GROWTH_BASELINE_V1.facebook.topFansStatus}
                />
                <BaselineStat
                  label="Demographics"
                  value={GROWTH_BASELINE_V1.facebook.audienceDemographicsStatus}
                />
              </div>
            </div>
            <p className="text-sm leading-6 text-muted">
              Funnel: Facebook / Search / GBP / Direct / Referral → Session →
              Qualified Visit → Audit Landing → Started → Submitted → Completed →
              CTA / Contact → Lead / Prospect → Opportunity → Proposal →
              Agreement → Payment → Client.
            </p>
          </Card>
        </section>

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
              Website Audit Funnel (AUDIT_FUNNEL v{AUDIT_FUNNEL_VERSION})
            </h2>
          </div>
          <p className="text-sm text-muted">
            Last 28 days. Browser-only steps (report views, CTA clicks, contact
            submissions) require GA4 Funnel Exploration — see{" "}
            <code className="text-xs">docs/growth/ga4-audit-funnel.md</code>.
            First-party funnel milestones persist on audit attribution when
            captured in-session.
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <FunnelStep label="Landing views" metric={auditFunnel.landingViews} />
            <FunnelStep label="Audit starts" metric={auditFunnel.auditStarts} />
            <FunnelStep
              label="Audit submissions"
              metric={auditFunnel.auditSubmissions}
            />
            <FunnelStep
              label="Audit completions"
              metric={auditFunnel.auditCompletions}
            />
            <FunnelStep label="Report views" metric={auditFunnel.reportViews} />
            <FunnelStep
              label="Professional CTA clicks"
              metric={auditFunnel.professionalCtaClicks}
            />
            <FunnelStep
              label="Contact submissions"
              metric={auditFunnel.contactSubmissions}
            />
            <FunnelStep label="Prospects created" metric={auditFunnel.leadsProspects} />
          </div>
          <Card className="p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
              Step conversion rates (last 28d)
            </p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              <FunnelRate
                label="Landing → Start"
                metric={auditFunnel.rates.landingToStart}
              />
              <FunnelRate
                label="Start → Submit"
                metric={auditFunnel.rates.startToSubmit}
              />
              <FunnelRate
                label="Submit → Complete"
                metric={auditFunnel.rates.submitToComplete}
              />
              <FunnelRate
                label="Complete → Report view"
                metric={auditFunnel.rates.completeToReportView}
              />
              <FunnelRate
                label="Report → CTA"
                metric={auditFunnel.rates.reportToCta}
              />
              <FunnelRate
                label="CTA → Lead"
                metric={auditFunnel.rates.ctaToLead}
              />
            </div>
            <p className="mt-4 text-xs leading-5 text-muted">
              Rates show INSUFFICIENT DATA below {5} observations in the
              denominator — never fabricated 0%. Compare submissions vs Baseline
              V1 internal window once Sprint 3 traffic increases.
            </p>
          </Card>
          {auditFunnel.attributionBySource.length > 0 ? (
            <Card className="p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                Audit submissions by source / medium (first-party)
              </p>
              <ul className="mt-3 space-y-2 text-sm">
                {auditFunnel.attributionBySource.map((row) => (
                  <li
                    key={`funnel-${row.source}-${row.medium ?? ""}`}
                    className="flex justify-between gap-4 border-b border-border/70 py-2"
                  >
                    <span>
                      {row.source}
                      {row.medium ? ` / ${row.medium}` : ""}
                    </span>
                    <span className="font-semibold">{formatCount(row.count)}</span>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}
        </section>

        <section className="mt-12 space-y-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="size-4 text-brand-blue" />
            <h2 className="font-heading text-xl font-semibold text-brand">
              Website & Audit Funnel (internal DB)
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
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Share2 className="size-4 text-brand-blue" />
              <h2 className="font-heading text-xl font-semibold text-brand">
                Facebook
              </h2>
            </div>
            <p className="text-xs font-medium text-muted">
              {FACEBOOK_GROWTH_VERSION}
            </p>
          </div>

          <Card className="space-y-4 p-6">
            <p className="text-sm leading-6 text-muted">
              Balanced scorecard — not a single Facebook score. Manual Facebook
              Insights + first-party website attribution. Meta API calls on this
              page: <strong>0</strong>. Unknowns stay NOT CAPTURED /
              INSUFFICIENT DATA / NOT ATTRIBUTABLE.
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                  Leading
                </p>
                <p className="mt-1 text-sm text-brand">
                  {FACEBOOK_SCORECARD.leading.join(" · ")}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                  Mid-funnel
                </p>
                <p className="mt-1 text-sm text-brand">
                  {FACEBOOK_SCORECARD.midFunnel.join(" · ")}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                  Lagging / business
                </p>
                <p className="mt-1 text-sm text-brand">
                  {FACEBOOK_SCORECARD.lagging.join(" · ")}
                </p>
              </div>
            </div>
            <ol className="space-y-1 text-sm text-muted">
              {FACEBOOK_METRIC_LAYERS.map((layer) => (
                <li key={layer.id}>
                  <span className="font-semibold text-brand">
                    L{layer.layer} {layer.name}:
                  </span>{" "}
                  {layer.metrics.join(" · ")}
                </li>
              ))}
            </ol>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="space-y-3 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                Baseline V1 (immutable)
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                <BaselineStat
                  label="Followers"
                  value={GROWTH_BASELINE_V1.facebook.followers}
                />
                <BaselineStat
                  label="Visits"
                  value={GROWTH_BASELINE_V1.facebook.visits}
                />
                <BaselineStat
                  label="Engagements"
                  value={GROWTH_BASELINE_V1.facebook.engagements}
                />
                <BaselineStat
                  label="Non-follower views"
                  value={`${GROWTH_BASELINE_V1.facebook.viewsByFollowerStatus.nonFollowersPercent}%`}
                />
              </div>
            </Card>
            <Card className="space-y-3 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                Current snapshot vs baseline
              </p>
              {latestFacebookSnapshot && latestFbMetrics ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  <BaselineStat
                    label="Followers (latest)"
                    value={
                      currentFollowers != null
                        ? currentFollowers
                        : "NOT CAPTURED"
                    }
                  />
                  <BaselineStat
                    label="Δ followers"
                    value={
                      followerDelta.status === "AVAILABLE"
                        ? followerDelta.value
                        : "NOT CAPTURED"
                    }
                  />
                  <BaselineStat
                    label="Follower growth %"
                    value={
                      followerRate.status === "AVAILABLE"
                        ? `${followerRate.value}%`
                        : followerRate.status === "ZERO"
                          ? "0%"
                          : followerRate.status.replaceAll("_", " ")
                    }
                  />
                  <BaselineStat
                    label="Page visits (snapshot)"
                    value={
                      typeof latestFbMetrics.pageVisits === "number"
                        ? latestFbMetrics.pageVisits
                        : "NOT CAPTURED"
                    }
                  />
                  <BaselineStat
                    label="Engagements (snapshot)"
                    value={
                      typeof latestFbMetrics.engagement === "number"
                        ? latestFbMetrics.engagement
                        : "NOT CAPTURED"
                    }
                  />
                  <BaselineStat
                    label="Non-follower %"
                    value={
                      typeof latestFbMetrics.nonFollowerViewPercent === "number"
                        ? `${latestFbMetrics.nonFollowerViewPercent}%`
                        : "NOT CAPTURED"
                    }
                  />
                </div>
              ) : (
                <p className="text-sm text-muted">
                  No FACEBOOK GrowthSnapshot recorded yet after Baseline V1.
                  Use the snapshot form below (source FACEBOOK).
                </p>
              )}
              <p className="text-xs leading-5 text-muted">
                Experimental follower TARGET (not forecast): +
                {
                  FACEBOOK_FOLLOWER_TARGET_FRAMEWORK.windows.days30
                    .minAbsoluteGain
                }
                –{FACEBOOK_FOLLOWER_TARGET_FRAMEWORK.windows.days30.stretchAbsoluteGain}{" "}
                in 30 days from baseline 75.
              </p>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="space-y-3 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                Company vs founder (content ledger)
              </p>
              <div className="grid grid-cols-2 gap-2">
                <BaselineStat
                  label="Company records"
                  value={contentSummary.byPublisher.COMPANY}
                />
                <BaselineStat
                  label="Founder records"
                  value={contentSummary.byPublisher.FOUNDER}
                />
              </div>
              <p className="text-xs text-muted">
                Jobs:{" "}
                {Object.keys(contentSummary.byJob).length === 0
                  ? "NONE YET"
                  : Object.entries(contentSummary.byJob)
                      .map(([k, v]) => `${k}=${v}`)
                      .join(" · ")}
              </p>
              <p className="text-xs text-muted">
                Formats:{" "}
                {Object.keys(contentSummary.byFormat).length === 0
                  ? "NONE YET"
                  : Object.entries(contentSummary.byFormat)
                      .map(([k, v]) => `${k}=${v}`)
                      .join(" · ")}
              </p>
              <p className="text-xs text-muted">
                Pillars:{" "}
                {Object.keys(contentSummary.byPillar).length === 0
                  ? "NONE YET"
                  : Object.entries(contentSummary.byPillar)
                      .map(([k, v]) => `${k}=${v}`)
                      .join(" · ")}
              </p>
            </Card>
            <Card className="space-y-3 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                Facebook-attributed funnel (first-party, 28d)
              </p>
              <div className="grid grid-cols-2 gap-2">
                <BaselineStat
                  label="FB organic audits"
                  value={facebookAttribution.totalAttributedAudits}
                />
                <BaselineStat
                  label="Company classified"
                  value={facebookAttribution.company}
                />
                <BaselineStat
                  label="Founder classified"
                  value={facebookAttribution.founder}
                />
                <BaselineStat
                  label="Publisher NOT ATTRIBUTABLE"
                  value={facebookAttribution.notAttributablePublisher}
                />
              </div>
              <p className="text-xs leading-5 text-muted">
                Classification uses utm_content prefixes (`company_` /
                `founder_`) then campaign (`page_organic` /
                `founder_content`). Website sessions: review in GA4 (not loaded
                here). Commercial outcomes observe-only.
              </p>
              <Link
                href="/reports/growth/utm-builder"
                className="inline-flex text-sm font-medium text-brand-blue underline"
              >
                UTM builder
              </Link>
            </Card>
          </div>

          <Card className="space-y-2 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
              Active Facebook experiments
            </p>
            <ul className="list-disc space-y-1 pl-5 text-sm text-muted">
              <li>2026-010 Photo vs text</li>
              <li>2026-011 Native vs link</li>
              <li>2026-012 Founder vs company</li>
              <li>2026-013 Direct vs soft CTA</li>
              <li>2026-014 Edu vs proof</li>
              <li>2026-015 Reel vs static</li>
              <li>2026-016 Follow CTA</li>
              <li>2026-017 Discussion vs info</li>
              <li>2026-018 Website → Facebook follow loop</li>
            </ul>
            <p className="text-xs text-muted">
              Docs: docs/growth/experiments/2026-01*.md — no significance claims
              from tiny samples.
            </p>
          </Card>

          <CreateGrowthContentForm />

          <Card className="overflow-hidden p-0">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-slate-50 text-xs uppercase tracking-[0.08em] text-muted">
                <tr>
                  <th className="px-4 py-3">Published</th>
                  <th className="px-4 py-3">Publisher</th>
                  <th className="px-4 py-3">Job / format</th>
                  <th className="px-4 py-3">utm_content</th>
                  <th className="px-4 py-3">FB metrics</th>
                </tr>
              </thead>
              <tbody>
                {contentSummary.rows.length === 0 ? (
                  <tr>
                    <td className="px-4 py-4 text-muted" colSpan={5}>
                      No content records yet. Record company and founder posts
                      above.
                    </td>
                  </tr>
                ) : (
                  contentSummary.rows.slice(0, 15).map((row) => (
                    <tr key={row.id} className="border-b border-border/70">
                      <td className="px-4 py-3">
                        {row.publishedAt.toISOString().slice(0, 10)}
                      </td>
                      <td className="px-4 py-3">{row.publisherType}</td>
                      <td className="px-4 py-3">
                        {row.contentJob} / {row.contentFormat}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">
                        {row.utmContent}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted">
                        views=
                        {row.fbViews ?? "NOT_CAPTURED"} · eng=
                        {row.fbEngagements ?? "NOT_CAPTURED"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
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
