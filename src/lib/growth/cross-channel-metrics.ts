import "server-only";

import {
  buildFollowUpAttentionQueue,
} from "@/lib/follow-up";
import { WEBSITE_TO_FACEBOOK_DECISION } from "@/lib/growth/facebook-execution";
import { buildDueReviewQueue } from "@/lib/growth/content-review";
import { listContentPlans } from "@/lib/growth/content-plan-store";
import {
  buildCrossChannelIntelligence,
  summarizeCrossChannelCompact,
  type CrossChannelActionType,
  type CrossChannelIntelligenceInput,
  type CrossChannelIntelligenceReport,
} from "@/lib/growth/cross-channel-intelligence";
import { lastNDaysEndingNow } from "@/lib/growth/funnel-metrics";
import { getLeadConversionIntelligence } from "@/lib/growth/lead-conversion-metrics";
import {
  getLocalGrowthCompactCard,
  getLocalGrowthDashboardModel,
} from "@/lib/growth/local-growth-metrics";
import { SEARCH_CONTENT_GAPS } from "@/lib/growth/search-intelligence";
import { listSearchOpportunities } from "@/lib/growth/search-opportunity-store";
import type {
  FacebookSnapshotMetrics,
  GbpSnapshotMetrics,
  SearchConsoleSnapshotMetrics,
} from "@/lib/growth/snapshot";
import { listGrowthSnapshots } from "@/lib/growth/snapshot-store";
import { prisma } from "@/lib/prisma";

/**
 * Assemble Cross-Channel Intelligence from persisted internal evidence only.
 * OPENAI / META / GSC / GBP / Places / Crawl / Resend / Stripe mutations = 0.
 */
export async function getCrossChannelIntelligence(input?: {
  periodStart?: Date;
  periodEnd?: Date;
}): Promise<CrossChannelIntelligenceReport> {
  const window =
    input?.periodStart && input?.periodEnd
      ? { periodStart: input.periodStart, periodEnd: input.periodEnd }
      : lastNDaysEndingNow(28);

  const windowLabel = `${window.periodStart.toISOString().slice(0, 10)} → ${window.periodEnd.toISOString().slice(0, 10)}`;

  const [
    leadConversion,
    followUpQueue,
    localCard,
    localModel,
    snapshots,
    contentPlans,
    searchOpportunities,
    paymentsPending,
  ] = await Promise.all([
    getLeadConversionIntelligence(window),
    buildFollowUpAttentionQueue({ limit: 40 }),
    getLocalGrowthCompactCard(),
    getLocalGrowthDashboardModel(),
    listGrowthSnapshots(30),
    listContentPlans(40),
    listSearchOpportunities(50),
    prisma.commercialPayment.count({
      where: { status: { in: ["PENDING", "CHECKOUT_CREATED"] } },
    }),
  ]);

  const searchSnapshots = snapshots.filter((s) => s.source === "SEARCH_CONSOLE");
  const latestSearch = (searchSnapshots[0]?.metricsJson ??
    null) as SearchConsoleSnapshotMetrics | null;

  const facebookSnapshots = snapshots.filter((s) => s.source === "FACEBOOK");
  const latestFb = (facebookSnapshots[0]?.metricsJson ??
    null) as FacebookSnapshotMetrics | null;

  const gbpSnapshots = snapshots.filter(
    (s) => s.source === "GOOGLE_BUSINESS_PROFILE",
  );
  const latestGbp = (gbpSnapshots[0]?.metricsJson ?? null) as GbpSnapshotMetrics | null;

  const dueReviews = buildDueReviewQueue({
    plans: contentPlans.map((p) => ({
      id: p.id,
      slug: p.slug,
      status: p.status,
      publishedUrl: p.publishedUrl,
      publishedAt: p.publishedAt,
      performanceJson: p.performanceJson,
    })),
  });

  const published = contentPlans.filter(
    (p) => p.status === "PUBLISHED" || p.status === "MONITORING",
  );
  const distributed = published.filter((p) => {
    const perf = p.performanceJson;
    if (!perf || typeof perf !== "object" || Array.isArray(perf)) return false;
    const dist = (perf as { distribution?: unknown }).distribution;
    return Boolean(dist);
  }).length;

  const openSearchGaps = SEARCH_CONTENT_GAPS.filter((gap) => {
    if (gap.kind !== "MISSING_SUPPORT" && gap.kind !== "MISSING_SERVICE") {
      return false;
    }
    const topic = gap.topic.toLowerCase();
    const already = searchOpportunities.some(
      (o) =>
        o.status !== "ARCHIVED" &&
        (o.slug.toLowerCase().includes(topic) ||
          o.queryConcept.toLowerCase().includes(topic) ||
          o.topic.toLowerCase().includes(topic)),
    );
    const planned = contentPlans.some(
      (p) =>
        p.status !== "ARCHIVED" &&
        (p.slug.toLowerCase().includes(topic) ||
          p.workingTitle.toLowerCase().includes(topic) ||
          p.topic.toLowerCase().includes(topic)),
    );
    return !already && !planned;
  }).length;

  const activeFacebookExperimentIds: string[] = [];
  if (WEBSITE_TO_FACEBOOK_DECISION.status === "ACTIVE") {
    activeFacebookExperimentIds.push(WEBSITE_TO_FACEBOOK_DECISION.experimentId);
  }

  const activeGbpExperimentIds = localCard.activeExperiment
    ? [localCard.activeExperiment]
    : [];

  const commercialAttention: CrossChannelIntelligenceInput["commercialAttention"] =
    [];

  const followUpItems = [
    ...followUpQueue.now,
    ...followUpQueue.next,
    ...followUpQueue.watch,
  ];

  for (const item of followUpQueue.now) {
    if (item.doNotContact) {
      continue;
    }
    let action: CrossChannelActionType = "FOLLOW_UP_LEAD";
    if (item.subjectKind === "OPPORTUNITY") {
      action = "ADVANCE_OPPORTUNITY";
    }
    commercialAttention.push({
      action,
      title: item.title.slice(0, 80),
      why: [item.reason, `dueState=${item.dueState}`],
      evidence: [item.subjectKind, "FollowUpActivity"],
      href: item.href,
      doNotContact: false,
    });
  }

  // Payment pending from commercial DB (counts only — no IDs into analytics).
  if (paymentsPending > 0) {
    commercialAttention.push({
      action: "CHECK_PAYMENT",
      title: `${paymentsPending} payment(s) pending`,
      why: [
        "Payment pending outranks WATCH-level SEO review",
        "Growth Engine does not mutate payments",
      ],
      evidence: ["PAYMENT"],
      href: "/reports/growth/conversion",
    });
  }

  const impressions =
    typeof latestSearch?.impressions === "number"
      ? latestSearch.impressions
      : null;
  const clicks =
    typeof latestSearch?.clicks === "number" ? latestSearch.clicks : null;

  const engineInput: CrossChannelIntelligenceInput = {
    windowLabel,
    comparablePriorWindow: false,
    websiteSessions: null,
    searchImpressions: impressions,
    searchClicks: clicks,
    searchIndexedSeo: contentPlans.some(
      (p) =>
        p.slug.includes("seo") &&
        (p.status === "PUBLISHED" || p.status === "MONITORING"),
    ),
    searchEarlyStage:
      impressions == null ||
      impressions < 50 ||
      latestSearch?.queryDataStatus === "INSUFFICIENT_DATA",
    facebookReach:
      typeof latestFb?.reach === "number"
        ? latestFb.reach
        : typeof latestFb?.followers === "number"
          ? latestFb.followers
          : null,
    facebookEngagement:
      typeof latestFb?.engagement === "number" ? latestFb.engagement : null,
    gbpProfileViews:
      typeof latestGbp?.profileViews === "number"
        ? latestGbp.profileViews
        : null,
    gbpWebsiteClicks:
      typeof latestGbp?.websiteClicks === "number"
        ? latestGbp.websiteClicks
        : null,
    gbpChecklistNeedsAttention:
      localModel.checklist.needsAttention + localModel.checklist.mismatches,
    gbpSnapshotCount: gbpSnapshots.length,
    gbpApiApprovalPending: true,
    contentPublishedCount: published.length,
    contentDistributedCount: distributed,
    contentReviewsDue: dueReviews.length,
    audits: leadConversion.counts.publicAudits.value,
    contacts: leadConversion.counts.contactSubmissions.value,
    inboundLeads: leadConversion.counts.inboundLeads.value,
    outboundProspects: leadConversion.counts.outboundProspects.value,
    opportunities: leadConversion.counts.opportunities.value,
    proposals: leadConversion.counts.proposals.value,
    agreements: leadConversion.counts.agreementsAccepted.value,
    paymentsPending,
    paymentsPaid: leadConversion.counts.paymentsPaid.value,
    clients: leadConversion.counts.clients.value,
    overdueFollowUps: followUpQueue.counts.overdue,
    suppressedSubjects: followUpItems.filter((i) => i.doNotContact).length,
    attributionKnownChannel:
      leadConversion.attributionCoverage.coverage.knownChannel,
    attributionDirect: leadConversion.attributionCoverage.coverage.direct,
    attributionUnknown: leadConversion.attributionCoverage.coverage.unknown,
    attributionEligible: leadConversion.attributionCoverage.coverage.eligible,
    activeFacebookExperimentIds,
    activeGbpExperimentIds,
    searchContentGaps: openSearchGaps,
    commercialAttention,
  };

  return buildCrossChannelIntelligence(engineInput);
}

export async function getCrossChannelCompactCard() {
  const report = await getCrossChannelIntelligence();
  return summarizeCrossChannelCompact(report);
}
