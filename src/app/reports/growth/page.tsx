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

import { CreateExperimentDecisionForm } from "@/components/growth/create-experiment-decision-form";
import { CreateGrowthContentForm } from "@/components/growth/create-content-form";
import { CreateGrowthSnapshotForm } from "@/components/growth/create-snapshot-form";
import { GrowthContentRecordsTable } from "@/components/growth/growth-content-records-table";
import {
  CreateSearchOpportunityForm,
  SearchOpportunityRowForm,
} from "@/components/growth/search-opportunity-form";
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
  type SearchConsoleSnapshotMetrics,
} from "@/lib/growth";
import { getFacebookOrganicAttributionSummary } from "@/lib/growth/facebook-attribution-metrics";
import { summarizeGrowthContentRecords } from "@/lib/growth/content-store";
import { listContentPlans } from "@/lib/growth/content-plan-store";
import { buildDueReviewQueue } from "@/lib/growth/content-review";
import { getLeadConversionIntelligence } from "@/lib/growth/lead-conversion-metrics";
import {
  LEAD_CONVERSION_INTELLIGENCE_VERSION,
} from "@/lib/growth/lead-conversion-intelligence";
import {
  buildFollowUpAttentionQueue,
  LEAD_FOLLOWUP_VERSION,
} from "@/lib/follow-up";
import {
  LOCAL_GROWTH_VERSION,
} from "@/lib/growth/local-growth";
import { getLocalGrowthCompactCard } from "@/lib/growth/local-growth-metrics";
import {
  CROSS_CHANNEL_INTELLIGENCE_VERSION,
} from "@/lib/growth/cross-channel-intelligence";
import {
  getCrossChannelCompactCard,
  getCrossChannelIntelligence,
} from "@/lib/growth/cross-channel-metrics";
import { listGrowthExperimentDecisions } from "@/lib/growth/experiment-decisions";
import {
  FACEBOOK_30_DAY_TARGETS,
  FACEBOOK_EXECUTION_VERSION,
  FACEBOOK_EXECUTION_WINDOW,
  FACEBOOK_EXPERIMENT_SEQUENCE,
  FACEBOOK_EXPERIMENTAL_CADENCE,
  followerTargetProgress,
  scheduleToday,
  WEBSITE_TO_FACEBOOK_DECISION,
} from "@/lib/growth/facebook-execution";
import {
  AI_SEARCH_GUIDANCE_SUMMARY,
  PREFERRED_SOURCES_DECISION,
  SEARCH_BASELINE_SUMMARY,
  SEARCH_BLOG_INVENTORY,
  SEARCH_CONTENT_GAPS,
  SEARCH_CONSOLE_STAGES,
  SEARCH_INTELLIGENCE_VERSION,
  SEARCH_INTERNAL_LINK_RECS,
  SEARCH_OPPORTUNITY_SEEDS,
  SEARCH_PAGE_INVENTORY,
  SOCIAL_VIDEO_SEARCH_DECISION,
  buildContentBriefFromSeed,
  rankSeedOpportunities,
  resolveSearchConsoleStage,
} from "@/lib/growth/search-intelligence";
import { listSearchOpportunities } from "@/lib/growth/search-opportunity-store";
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
    experimentDecisions,
    searchOpportunities,
    contentPlans,
    leadConversion,
    followUpQueue,
    localGrowthCard,
    crossChannelCard,
    crossChannel,
  ] = await Promise.all([
    getInternalFunnelMetrics(current),
    getInternalFunnelMetrics(previous),
    getAuditFunnelDashboardMetrics(current),
    listGrowthSnapshots(20),
    summarizeGrowthContentRecords(200),
    getFacebookOrganicAttributionSummary(current),
    listGrowthExperimentDecisions(10),
    listSearchOpportunities(50),
    listContentPlans(40),
    getLeadConversionIntelligence(current),
    buildFollowUpAttentionQueue({ limit: 20 }),
    getLocalGrowthCompactCard(),
    getCrossChannelCompactCard(),
    getCrossChannelIntelligence(current),
  ]);

  const contentDueReviews = buildDueReviewQueue({
    plans: contentPlans.map((p) => ({
      id: p.id,
      slug: p.slug,
      status: p.status,
      publishedUrl: p.publishedUrl,
      publishedAt: p.publishedAt,
      performanceJson: p.performanceJson,
    })),
  });
  const publishedMeasuring = contentPlans.filter(
    (p) => p.status === "PUBLISHED" || p.status === "MONITORING",
  ).length;

  const searchSnapshots = snapshots.filter((s) => s.source === "SEARCH_CONSOLE");
  const latestSearchSnapshot = searchSnapshots[0] ?? null;
  const latestSearchMetrics = (latestSearchSnapshot?.metricsJson ??
    null) as SearchConsoleSnapshotMetrics | null;
  const searchStage = resolveSearchConsoleStage({
    impressions:
      latestSearchMetrics?.impressions ?? SEARCH_BASELINE_SUMMARY.impressions,
    queryDataStatus:
      latestSearchMetrics?.queryDataStatus ??
      SEARCH_BASELINE_SUMMARY.queryDataStatus,
    distinctQueryCount: latestSearchMetrics?.topQueries?.length ?? 0,
  });
  const rankedSeeds = rankSeedOpportunities();
  const topBrief = buildContentBriefFromSeed(SEARCH_OPPORTUNITY_SEEDS[0]!);

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
  const followerProgress = followerTargetProgress({
    currentFollowers,
  });
  const todaysSchedule = scheduleToday();
  const tableRows = contentSummary.rows.map((row) => ({
    id: row.id,
    title: row.title,
    utmContent: row.utmContent,
    publisherType: row.publisherType,
    publishedAt: row.publishedAt.toISOString().slice(0, 10),
    contentJob: row.contentJob,
    contentPillar: row.contentPillar,
    contentFormat: row.contentFormat,
    fbViews: row.fbViews,
    fbReach: row.fbReach,
    fbEngagements: row.fbEngagements,
    fbReactions: row.fbReactions,
    fbComments: row.fbComments,
    fbShares: row.fbShares,
    fbPageVisits: row.fbPageVisits,
    fbFollowersGained: row.fbFollowersGained,
    fbLinkClicks: row.fbLinkClicks,
    notes: row.notes,
    measurementStatus: row.measurementStatus,
    has72h: row.has72h,
    has7d: row.has7d,
  }));

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
          <Button
            nativeButton={false}
            render={<Link href="/reports/growth/content" />}
          >
            Content Intelligence
            <ArrowRight aria-hidden="true" className="size-4" />
          </Button>
          <Button
            nativeButton={false}
            render={<Link href="/reports/growth/conversion" />}
          >
            Lead Conversion
            <ArrowRight aria-hidden="true" className="size-4" />
          </Button>
          <Button
            nativeButton={false}
            render={<Link href="/reports/growth/attribution" />}
          >
            Attribution
            <ArrowRight aria-hidden="true" className="size-4" />
          </Button>
          <Button
            nativeButton={false}
            render={<Link href="/reports/growth/follow-up" />}
          >
            Follow-Up Queue
            <ArrowRight aria-hidden="true" className="size-4" />
          </Button>
          <Button
            nativeButton={false}
            render={<Link href="/reports/growth/local" />}
          >
            Local / GBP
            <ArrowRight aria-hidden="true" className="size-4" />
          </Button>
          <Button
            nativeButton={false}
            render={<Link href="/reports/growth/intelligence" />}
          >
            Cross-Channel
            <ArrowRight aria-hidden="true" className="size-4" />
          </Button>
        </div>

        <Card
          className="mt-6 space-y-3 p-5"
          data-testid="cross-channel-compact-card"
        >
          <p className="text-sm font-semibold text-brand">
            Cross-Channel Intelligence (compact) · v
            {CROSS_CHANNEL_INTELLIGENCE_VERSION}
          </p>
          <p className="text-xs text-muted">
            Top bottleneck: {crossChannelCard.topBottleneck} · NOW:{" "}
            {crossChannelCard.nowCount} · NEXT: {crossChannelCard.nextCount} ·
            WATCH: {crossChannelCard.watchCount} · Attribution:{" "}
            {crossChannelCard.attributionHealth}
            {crossChannelCard.gbpDependency
              ? ` · ${crossChannelCard.gbpDependency}`
              : ""}
            . No composite Growth Score. Persisted evidence only (external APIs
            = 0 on load).
          </p>
          {crossChannel.recommendations.now.length > 0 ? (
            <ul className="space-y-1 text-xs text-muted">
              {crossChannel.recommendations.now.map((r) => (
                <li key={`now-${r.action}-${r.title}`}>
                  NOW — {r.action}: {r.title}
                </li>
              ))}
            </ul>
          ) : null}
          <Button
            nativeButton={false}
            render={<Link href="/reports/growth/intelligence" />}
          >
            Open Cross-Channel Intelligence
            <ArrowRight aria-hidden="true" className="size-4" />
          </Button>
        </Card>

        <Card className="mt-6 space-y-2 p-5" data-testid="local-growth-compact-card">
          <p className="text-sm font-semibold text-brand">
            LOCAL / GBP (compact) · v{LOCAL_GROWTH_VERSION}
          </p>
          <p className="text-xs text-muted">
            State: {localGrowthCard.performanceState} · Reviews:{" "}
            {localGrowthCard.reviewCount} · Rating:{" "}
            {localGrowthCard.averageRating} · Website clicks:{" "}
            {localGrowthCard.websiteClicks} · GBP audits:{" "}
            {localGrowthCard.attributedAudits} · GBP leads:{" "}
            {localGrowthCard.attributedLeads} · Profile issues:{" "}
            {localGrowthCard.profileIssues} · Experiment:{" "}
            {localGrowthCard.activeExperiment}. Unknown stays NOT_CAPTURED.
          </p>
          <Button
            nativeButton={false}
            render={<Link href="/reports/growth/local" />}
          >
            Open Local Growth
            <ArrowRight aria-hidden="true" className="size-4" />
          </Button>
        </Card>

        <Card className="mt-6 space-y-2 p-5" data-testid="follow-up-compact-card">
          <p className="text-sm font-semibold text-brand">
            FOLLOW-UP (compact) · v{LEAD_FOLLOWUP_VERSION}
          </p>
          <p className="text-xs text-muted">
            Overdue: {followUpQueue.counts.overdue} · Due today:{" "}
            {followUpQueue.counts.dueToday} · New inbound:{" "}
            {followUpQueue.counts.newInbound} · Nurture:{" "}
            {followUpQueue.counts.nurture}. Human-controlled activity history —
            no autonomous outreach.
          </p>
          <Button
            nativeButton={false}
            render={<Link href="/reports/growth/follow-up" />}
          >
            Open Follow-Up Queue
            <ArrowRight aria-hidden="true" className="size-4" />
          </Button>
        </Card>

        <Card className="mt-4 space-y-2 p-5">
          <p className="text-sm font-semibold text-brand">
            Content performance review (compact)
          </p>
          <p className="text-xs text-muted">
            Reviews due: {contentDueReviews.length} · Published/measuring assets:{" "}
            {publishedMeasuring} · Refresh only after human evidence decision.
            Details on Content Intelligence.
          </p>
        </Card>

        <Card className="mt-4 space-y-2 p-5">
          <p className="text-sm font-semibold text-brand">
            Acquisition Coverage (compact)
          </p>
          <p className="text-xs text-muted">
            acquisition-capture-v1 · Known channels:{" "}
            {leadConversion.attributionCoverage.coverage.knownChannel} · Direct:{" "}
            {leadConversion.attributionCoverage.coverage.direct} · Unknown:{" "}
            {leadConversion.attributionCoverage.coverage.unknown} · Contact
            submissions (28d):{" "}
            {leadConversion.counts.contactSubmissions.value ?? 0}. Historical
            UNKNOWN audits are not rewritten. Details on Attribution.
          </p>
        </Card>

        <Card className="mt-4 space-y-2 p-5">
          <p className="text-sm font-semibold text-brand">
            Lead Conversion / Pipeline Intelligence (compact)
          </p>
          <p className="text-xs text-muted">
            v{LEAD_CONVERSION_INTELLIGENCE_VERSION} · 28d inbound leads:{" "}
            {leadConversion.counts.inboundLeads.value ?? "NOT CAPTURED"} ·
            outbound prospects:{" "}
            {leadConversion.counts.outboundProspects.value ?? "NOT CAPTURED"} ·
            opportunities: {leadConversion.counts.opportunities.value ?? 0} ·
            attention: {leadConversion.attention.length} · unknown audit
            attribution: {leadConversion.attributionCoverage.auditsUnknown}.
            Inbound and outbound are not mixed. Details on Lead Conversion.
          </p>
        </Card>

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
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Search className="size-4 text-brand-blue" />
              <h2 className="font-heading text-xl font-semibold text-brand">
                Search Intelligence
              </h2>
            </div>
            <p className="text-xs font-medium text-muted">
              search-intelligence-v{SEARCH_INTELLIGENCE_VERSION}
            </p>
          </div>

          <Card className="space-y-4 p-6">
            <p className="text-sm leading-6 text-muted">
              Sprint 5 decides what content should exist. No fabricated search
              volumes, ranking guarantees, GSC API, or AI drafting. Google APIs on
              this page: <strong>0</strong>. Baseline V1 Search Console totals
              remain immutable.
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <BaselineStat
                label="Baseline clicks"
                value={SEARCH_BASELINE_SUMMARY.clicks}
              />
              <BaselineStat
                label="Baseline impressions"
                value={SEARCH_BASELINE_SUMMARY.impressions}
              />
              <BaselineStat
                label="Baseline CTR"
                value={`${SEARCH_BASELINE_SUMMARY.averageCtr}%`}
              />
              <BaselineStat
                label="Baseline avg position"
                value={SEARCH_BASELINE_SUMMARY.averagePosition}
              />
              <BaselineStat
                label="Query data"
                value={SEARCH_BASELINE_SUMMARY.queryDataStatus}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <BaselineStat label="GSC stage" value={searchStage} />
              <BaselineStat
                label="Latest snapshot"
                value={
                  latestSearchSnapshot
                    ? latestSearchSnapshot.periodEnd
                        .toISOString()
                        .slice(0, 10)
                    : "NONE"
                }
              />
              <BaselineStat
                label="Latest clicks"
                value={
                  latestSearchMetrics?.clicks ??
                  "NOT_CAPTURED (use baseline)"
                }
              />
              <BaselineStat
                label="Latest impressions"
                value={
                  latestSearchMetrics?.impressions ??
                  "NOT_CAPTURED (use baseline)"
                }
              />
            </div>
            <p className="text-xs text-muted">
              Stage guide:{" "}
              {SEARCH_CONSOLE_STAGES.map((s) => s.id).join(" → ")}. Prefer
              INSUFFICIENT_DATA over inventing zeros from exports.
            </p>
          </Card>

          <Card className="space-y-3 p-6">
            <p className="text-sm font-semibold text-brand">
              Seed backlog (deterministic priority)
            </p>
            <ul className="space-y-2 text-sm text-muted">
              {rankedSeeds.slice(0, 8).map((seed) => (
                <li key={seed.slug}>
                  <span className="font-medium text-brand">
                    {seed.priority.band}
                  </span>{" "}
                  · {seed.queryConcept} →{" "}
                  {seed.recommendedPath ?? seed.currentPagePath ?? "(new)"} ·{" "}
                  {seed.source}/{seed.evidenceKind}
                </li>
              ))}
            </ul>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="space-y-2 p-6">
              <p className="text-sm font-semibold text-brand">
                Content gaps ({SEARCH_CONTENT_GAPS.length})
              </p>
              <ul className="space-y-2 text-xs text-muted">
                {SEARCH_CONTENT_GAPS.map((gap) => (
                  <li key={gap.id}>
                    [{gap.kind}] {gap.summary}{" "}
                    <span className="font-mono">({gap.evidence})</span>
                  </li>
                ))}
              </ul>
            </Card>
            <Card className="space-y-2 p-6">
              <p className="text-sm font-semibold text-brand">
                Internal link recs ({SEARCH_INTERNAL_LINK_RECS.length})
              </p>
              <ul className="space-y-2 text-xs text-muted">
                {SEARCH_INTERNAL_LINK_RECS.map((rec) => (
                  <li key={`${rec.fromPath}->${rec.toPath}`}>
                    {rec.fromPath} → {rec.toPath}: {rec.reason}
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="space-y-2 p-6">
              <p className="text-sm font-semibold text-brand">
                Service inventory ({SEARCH_PAGE_INVENTORY.length})
              </p>
              <ul className="max-h-48 space-y-1 overflow-y-auto text-xs text-muted">
                {SEARCH_PAGE_INVENTORY.map((page) => (
                  <li key={page.path}>
                    {page.path} · {page.pageType}/{page.intent}
                    {page.inSitemap ? "" : " · NOT IN SITEMAP"}
                  </li>
                ))}
              </ul>
              <p className="text-xs text-muted">
                Blogs inventoried: {SEARCH_BLOG_INVENTORY.length}
              </p>
            </Card>
            <Card className="space-y-2 p-6">
              <p className="text-sm font-semibold text-brand">
                Sprint 6 brief preview (top seed)
              </p>
              <dl className="space-y-1 text-xs text-muted">
                <div>
                  <dt className="font-medium text-brand">Primary question</dt>
                  <dd>{topBrief.primaryQuestion}</dd>
                </div>
                <div>
                  <dt className="font-medium text-brand">Intent / format</dt>
                  <dd>
                    {topBrief.primaryIntent} · {topBrief.recommendedFormat}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-brand">CTA</dt>
                  <dd>{topBrief.cta}</dd>
                </div>
                <div>
                  <dt className="font-medium text-brand">Avoid</dt>
                  <dd>{topBrief.avoidClaimConstraints.join("; ")}</dd>
                </div>
              </dl>
              <p className="text-xs text-muted">
                Preferred Sources: {PREFERRED_SOURCES_DECISION.status}. Social /
                video GSC: {SOCIAL_VIDEO_SEARCH_DECISION.status}. AI Search:{" "}
                {AI_SEARCH_GUIDANCE_SUMMARY.weWillTest.slice(0, 80)}…
              </p>
            </Card>
          </div>

          <CreateSearchOpportunityForm />

          <Card className="space-y-3 p-6">
            <p className="text-sm font-semibold text-brand">
              Persisted opportunities ({searchOpportunities.length})
            </p>
            {searchOpportunities.length === 0 ? (
              <p className="text-sm text-muted">
                None yet. Create above or seed from docs after migrate. Seed
                concepts live in code until operators persist them.
              </p>
            ) : (
              <div className="space-y-3">
                {searchOpportunities.map((row) => (
                  <SearchOpportunityRowForm
                    key={row.id}
                    opportunity={{
                      id: row.id,
                      slug: row.slug,
                      queryConcept: row.queryConcept,
                      topic: row.topic,
                      intent: row.intent,
                      status: row.status,
                      priorityBand: row.priorityBand,
                      priorityScore: row.priorityScore,
                      source: row.source,
                      evidenceKind: row.evidenceKind,
                      currentPagePath: row.currentPagePath,
                      recommendedPath: row.recommendedPath,
                      notes: row.notes,
                    }}
                  />
                ))}
              </div>
            )}
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

          <Card className="space-y-3 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
              What should I do today? ({FACEBOOK_EXECUTION_VERSION})
            </p>
            <p className="text-sm text-muted">
              Window {FACEBOOK_EXECUTION_WINDOW.startDate} →{" "}
              {FACEBOOK_EXECUTION_WINDOW.endDate}. Weekly FACEBOOK snapshot:{" "}
              {FACEBOOK_EXECUTION_WINDOW.weeklySnapshotWeekday}s.
            </p>
            <div className="grid gap-3 lg:grid-cols-3">
              <div>
                <p className="text-xs font-semibold text-brand">Scheduled today</p>
                {todaysSchedule.length === 0 ? (
                  <p className="mt-1 text-sm text-muted">No schedule row for today.</p>
                ) : (
                  <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-muted">
                    {todaysSchedule.map((item) => (
                      <li key={`${item.date}-${item.slugHint}`}>
                        {item.publisher}: {item.titleHint} ({item.contentJob}/
                        {item.contentFormat}
                        {item.link ? ", link" : ", native"}
                        {item.experimentId ? `, ${item.experimentId}` : ""})
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <p className="text-xs font-semibold text-brand">Metrics due</p>
                <p className="mt-1 text-sm text-muted">
                  72h: {contentSummary.due72h.length} · 7d:{" "}
                  {contentSummary.due7d.length}
                </p>
                <ul className="mt-1 list-disc space-y-1 pl-5 text-xs text-muted">
                  {[...contentSummary.due72h, ...contentSummary.due7d]
                    .slice(0, 6)
                    .map((row) => (
                      <li key={row.id}>
                        {row.utmContent} — {row.measurementStatus}
                      </li>
                    ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-semibold text-brand">Current experiment</p>
                <p className="mt-1 text-sm text-muted">
                  Now: {FACEBOOK_EXPERIMENT_SEQUENCE.current} · Next:{" "}
                  {FACEBOOK_EXPERIMENT_SEQUENCE.next}
                </p>
                <p className="mt-2 text-xs text-muted">
                  Cadence ({FACEBOOK_EXPERIMENTAL_CADENCE.label}): company{" "}
                  {FACEBOOK_EXPERIMENTAL_CADENCE.companyPostsPerWeek.target}
                  /wk · founder{" "}
                  {FACEBOOK_EXPERIMENTAL_CADENCE.founderPostsPerWeek.target}/wk
                </p>
              </div>
            </div>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="space-y-3 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                Follower growth scorecard
              </p>
              <div className="grid grid-cols-2 gap-2">
                <BaselineStat
                  label="Baseline"
                  value={FACEBOOK_30_DAY_TARGETS.baselineFollowers}
                />
                <BaselineStat
                  label="Current"
                  value={currentFollowers ?? "NOT CAPTURED"}
                />
                <BaselineStat
                  label="Δ absolute"
                  value={
                    followerProgress.absoluteGain != null
                      ? followerProgress.absoluteGain
                      : "NOT CAPTURED"
                  }
                />
                <BaselineStat
                  label="Band"
                  value={followerProgress.band.replaceAll("_", " ")}
                />
              </div>
              <p className="text-xs text-muted">
                30d floor +{FACEBOOK_30_DAY_TARGETS.followers.floorAbsoluteGain} ·
                target +{FACEBOOK_30_DAY_TARGETS.followers.targetAbsoluteGain} ·
                stretch +{FACEBOOK_30_DAY_TARGETS.followers.stretchAbsoluteGain}{" "}
                (TARGET bands, not forecasts). Also track Page visits / non-follower
                % / engagement — never chase followers alone.
              </p>
            </Card>
            <Card className="space-y-3 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                Company vs founder (ledger totals)
              </p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="font-semibold text-brand">COMPANY</p>
                  <p className="text-muted">
                    posts={contentSummary.publisherScorecard.COMPANY.posts}
                    <br />
                    views=
                    {contentSummary.publisherScorecard.COMPANY.views ??
                      "NOT_CAPTURED"}
                    <br />
                    eng=
                    {contentSummary.publisherScorecard.COMPANY.engagements ??
                      "NOT_CAPTURED"}
                    <br />
                    follows=
                    {contentSummary.publisherScorecard.COMPANY.followersGained ??
                      "NOT_CAPTURED"}
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-brand">FOUNDER</p>
                  <p className="text-muted">
                    posts={contentSummary.publisherScorecard.FOUNDER.posts}
                    <br />
                    views=
                    {contentSummary.publisherScorecard.FOUNDER.views ??
                      "NOT_CAPTURED"}
                    <br />
                    eng=
                    {contentSummary.publisherScorecard.FOUNDER.engagements ??
                      "NOT_CAPTURED"}
                    <br />
                    follows=
                    {contentSummary.publisherScorecard.FOUNDER.followersGained ??
                      "NOT_CAPTURED"}
                  </p>
                </div>
              </div>
              <p className="text-xs text-muted">
                Do not declare a single winner — founder may win engagement while
                company wins audit UTMs. Attributed audits: company=
                {facebookAttribution.company}, founder=
                {facebookAttribution.founder}.
              </p>
            </Card>
          </div>

          <Card className="space-y-2 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
              Weekly review prompts
            </p>
            <ul className="list-disc space-y-1 pl-5 text-sm text-muted">
              <li>
                Top engagement in ledger:{" "}
                {contentSummary.rows
                  .slice()
                  .sort(
                    (a, b) => (b.fbEngagements ?? -1) - (a.fbEngagements ?? -1),
                  )[0]?.utmContent ?? "INSUFFICIENT DATA"}
              </li>
              <li>
                Top views in ledger:{" "}
                {contentSummary.rows
                  .slice()
                  .sort((a, b) => (b.fbViews ?? -1) - (a.fbViews ?? -1))[0]
                  ?.utmContent ?? "INSUFFICIENT DATA"}
              </li>
              <li>
                Non-follower % (latest snapshot):{" "}
                {typeof latestFbMetrics?.nonFollowerViewPercent === "number"
                  ? `${latestFbMetrics.nonFollowerViewPercent}%`
                  : "NOT CAPTURED"}
              </li>
              <li>
                FB-attributed audits (28d):{" "}
                {facebookAttribution.totalAttributedAudits}
              </li>
              <li>
                Website→Facebook: {WEBSITE_TO_FACEBOOK_DECISION.status} (
                {WEBSITE_TO_FACEBOOK_DECISION.experimentId})
              </li>
            </ul>
          </Card>

          <Card className="space-y-2 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
              Experiment sequencing
            </p>
            <p className="text-sm text-muted">
              Current: <strong>{FACEBOOK_EXPERIMENT_SEQUENCE.current}</strong> ·
              Next: <strong>{FACEBOOK_EXPERIMENT_SEQUENCE.next}</strong>
            </p>
            <p className="text-xs text-muted">
              Backlog: {FACEBOOK_EXPERIMENT_SEQUENCE.backlog.join(" → ")}
            </p>
            {experimentDecisions.length > 0 ? (
              <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-muted">
                {experimentDecisions.map((row) => (
                  <li key={row.id}>
                    {row.createdAt.toISOString().slice(0, 10)} {row.experimentId}{" "}
                    → {row.decision} ({row.confidence ?? "n/a"})
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted">No decisions recorded yet.</p>
            )}
          </Card>

          <CreateExperimentDecisionForm />
          <CreateGrowthContentForm />

          <Card className="overflow-hidden p-0">
            <GrowthContentRecordsTable rows={tableRows} />
          </Card>
        </section>

        <section className="mt-12 space-y-4">
          <h2 className="font-heading text-xl font-semibold text-brand">
            Lead Conversion Intelligence
          </h2>
          <p className="text-sm text-muted">
            Traffic, followers, and clicks are not the goal. This section
            observes pipeline facts. ROI {leadConversion.money.roiStatus}. GBP:{" "}
            {leadConversion.gbp.status}.
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Metric
              label="Inbound leads (28d)"
              value={leadConversion.counts.inboundLeads.value ?? 0}
            />
            <Metric
              label="Outbound prospects (28d)"
              value={leadConversion.counts.outboundProspects.value ?? 0}
            />
            <Metric
              label="Attention queue"
              value={leadConversion.attention.length}
            />
          </div>
          <Card className="space-y-2 p-5">
            <p className="text-sm font-semibold text-brand">Business signals</p>
            <p className="text-sm text-muted">
              Facebook → pipeline: {leadConversion.facebookPipeline.signal} (
              {leadConversion.facebookPipeline.attributedAudits} attributed
              audits). Search /seo: {leadConversion.searchPipeline.signal} (
              {leadConversion.searchPipeline.seoLandingAudits} landing audits).
              Not “SEO/Facebook successful.”
            </p>
            {leadConversion.priorityActions.slice(0, 4).length > 0 ? (
              <ul className="list-disc space-y-1 pl-5 text-sm text-muted">
                {leadConversion.priorityActions.slice(0, 4).map((item) => (
                  <li key={`${item.band}-${item.reason}`}>
                    {item.band}: {item.reason}
                  </li>
                ))}
              </ul>
            ) : null}
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
