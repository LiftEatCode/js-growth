import "server-only";

import { Prisma as PrismaNamespace } from "@/generated/prisma/client";

import { getAuditFunnelDashboardMetrics } from "@/lib/growth/audit-funnel-metrics";
import { getFacebookOrganicAttributionSummary } from "@/lib/growth/facebook-attribution-metrics";
import {
  channelFromAcquisition,
  parseAcquisitionContextFromUnknown,
  computeAttributionCoverage,
} from "@/lib/growth/acquisition-capture";
import { countContactSubmissionsInWindow } from "@/lib/growth/contact-submission-store";
import {
  LEAD_CONVERSION_INTELLIGENCE_VERSION,
  LEAD_CONVERSION_THRESHOLDS,
  TOUCH_SEMANTICS,
  buildPriorityActions,
  classifyAttributionStrength,
  classifyLeadAge,
  classifyOutboundProspectSource,
  contentBusinessSignalLabel,
  conversionRate,
  dropOffObservation,
  marketingRoiStatus,
  observeCount,
  pipelineVelocityMedianDays,
  revenueEvidenceKind,
  sampleQuality,
  type AttentionItem,
  type AttributionChannel,
  type CountObservation,
  type PriorityAction,
  type RateObservation,
} from "@/lib/growth/lead-conversion-intelligence";
import { prisma } from "@/lib/prisma";

const OPEN_LEAD_STATUSES = ["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL"] as const;
const ACTIVE_OPPORTUNITY_STAGES = [
  "NEW",
  "QUALIFIED",
  "DISCOVERY",
  "SOLUTION_FIT",
  "PROPOSAL_READY",
] as const;

type AttributionRecord = {
  source?: unknown;
  medium?: unknown;
  campaign?: unknown;
  content?: unknown;
  landingPath?: unknown;
};

function periodFilter(periodStart: Date, periodEnd: Date) {
  return { gte: periodStart, lt: periodEnd };
}

function parseAttribution(raw: unknown): AttributionRecord | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return null;
  }
  return raw as AttributionRecord;
}

function stringField(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function daysBetween(start: Date, end: Date): number {
  return (end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000);
}

function inboundLeadTitle(input: {
  company: string | null;
  firstName: string;
}): string {
  const company = input.company?.trim();
  if (company) {
    return company.slice(0, 80);
  }
  const name = input.firstName.trim();
  return name ? `Inbound lead (${name.slice(0, 40)})` : "Inbound lead";
}

export type ChannelSummaryRow = {
  channel: AttributionChannel;
  audits: CountObservation;
  statusNote: string;
};

export type ContentPipelineRow = {
  publicSlug: string;
  landingOrContent: string;
  audits: number;
  inboundLeads: number;
  signal: ReturnType<typeof contentBusinessSignalLabel>;
};

export type LeadConversionIntelligenceReport = {
  version: typeof LEAD_CONVERSION_INTELLIGENCE_VERSION;
  periodStart: Date;
  periodEnd: Date;
  counts: {
    publicAudits: CountObservation;
    inboundLeads: CountObservation;
    outboundProspects: CountObservation;
    opportunities: CountObservation;
    proposals: CountObservation;
    agreementsAccepted: CountObservation;
    paymentsPaid: CountObservation;
    clients: CountObservation;
    professionalPurchases: CountObservation;
    contactSubmissions: CountObservation;
    qualifiedVisits: CountObservation;
  };
  rates: {
    auditToInboundLead: RateObservation;
    inboundLeadToOpportunity: RateObservation;
    opportunityToProposal: RateObservation;
    proposalToAgreement: RateObservation;
    agreementToPayment: RateObservation;
    clientsPerPageView: RateObservation;
  };
  dropOff: {
    prospectToOpportunity: ReturnType<typeof dropOffObservation>;
    opportunityToProposal: ReturnType<typeof dropOffObservation>;
    proposalToAgreement: ReturnType<typeof dropOffObservation>;
    agreementToPayment: ReturnType<typeof dropOffObservation>;
  };
  sample: {
    inbound: ReturnType<typeof sampleQuality>;
    outbound: ReturnType<typeof sampleQuality>;
    audits: ReturnType<typeof sampleQuality>;
  };
  channels: ChannelSummaryRow[];
  gbp: { status: "NOT_CAPTURED" | "AVAILABLE"; audits: number };
  attributionCoverage: {
    auditsWithUtm: number;
    auditsUnknown: number;
    strengthDirectFirstParty: number;
    /** Sprint 10: knownChannel + direct classified / eligible audits */
    coverage: ReturnType<typeof computeAttributionCoverage>;
    contactSubmissions: number;
    contactNotCaptured: boolean;
  };
  inboundVsOutbound: {
    inboundLeads: number;
    outboundProspects: number;
    outboundBySource: Record<string, number>;
  };
  attention: AttentionItem[];
  priorityActions: PriorityAction[];
  velocity: {
    prospectToOpportunity: ReturnType<typeof pipelineVelocityMedianDays>;
    opportunityToProposal: ReturnType<typeof pipelineVelocityMedianDays>;
    proposalToAgreement: ReturnType<typeof pipelineVelocityMedianDays>;
    agreementToPayment: ReturnType<typeof pipelineVelocityMedianDays>;
  };
  money: {
    pipelineApprovedProposalCents: number;
    acceptedAgreementCents: number;
    paidCommercialCents: number;
    paidProfessionalAuditCents: number | null;
    observedRevenueCents: number;
    attributedRevenueCents: number;
    revenueKind: ReturnType<typeof revenueEvidenceKind>;
    roiStatus: ReturnType<typeof marketingRoiStatus>;
  };
  contentPipeline: ContentPipelineRow[];
  facebookPipeline: {
    attributedAudits: number;
    inboundLeads: number;
    signal: ReturnType<typeof contentBusinessSignalLabel>;
  };
  searchPipeline: {
    seoLandingAudits: number;
    inboundLeads: number;
    signal: ReturnType<typeof contentBusinessSignalLabel>;
  };
  touchSemantics: typeof TOUCH_SEMANTICS;
  funnelStarts: CountObservation;
  funnelSubmissions: CountObservation;
};

export async function getLeadConversionIntelligence(input: {
  periodStart: Date;
  periodEnd: Date;
  now?: Date;
}): Promise<LeadConversionIntelligenceReport> {
  const now = input.now ?? new Date();
  const createdAt = periodFilter(input.periodStart, input.periodEnd);

  const [
    publicAudits,
    inboundLeadsCreated,
    outboundProspectsCreated,
    opportunitiesCreated,
    inboundOpportunitiesCreated,
    proposalsCreated,
    agreementsAccepted,
    paymentsPaid,
    clientsCreated,
    professionalPurchases,
    attributedReports,
    openLeads,
    activeOpportunities,
    pendingDeliveries,
    awaitingAgreements,
    pendingPayments,
    outboundInWindow,
    opportunitiesForVelocity,
    proposalsForVelocity,
    agreementsForVelocity,
    paymentsForVelocity,
    approvedProposals,
    paidPayments,
    facebookAttribution,
    auditFunnel,
    contactSubmissionsCreated,
  ] = await Promise.all([
    prisma.auditReport.count({
      where: { source: "PUBLIC_FUNNEL", createdAt },
    }),
    prisma.lead.count({ where: { createdAt } }),
    prisma.prospect.count({ where: { createdAt } }),
    prisma.opportunity.count({ where: { createdAt } }),
    prisma.opportunity.count({
      where: { createdAt, leadId: { not: null } },
    }),
    prisma.commercialProposal.count({ where: { createdAt } }),
    prisma.commercialAgreement.count({
      where: { status: "ACCEPTED", acceptedAt: createdAt },
    }),
    prisma.commercialPayment.count({
      where: { status: "PAID", paidAt: createdAt },
    }),
    prisma.client.count({ where: { createdAt } }),
    prisma.reportPurchase.count({
      where: { status: "PAID", paidAt: createdAt },
    }),
    prisma.auditReport.findMany({
      where: { source: "PUBLIC_FUNNEL", createdAt },
      select: {
        id: true,
        leadId: true,
        attributionJson: true,
      },
      take: 5000,
    }),
    prisma.lead.findMany({
      where: { status: { in: [...OPEN_LEAD_STATUSES] } },
      select: {
        id: true,
        createdAt: true,
        company: true,
        firstName: true,
        status: true,
        followUpAt: true,
        reports: { select: { id: true }, take: 1, orderBy: { createdAt: "desc" } },
      },
      take: 200,
      orderBy: { createdAt: "desc" },
    }),
    prisma.opportunity.findMany({
      where: { stage: { in: [...ACTIVE_OPPORTUNITY_STAGES] } },
      select: {
        id: true,
        name: true,
        createdAt: true,
        nextAction: true,
        nextActionAt: true,
        stage: true,
      },
      take: 200,
      orderBy: { updatedAt: "desc" },
    }),
    prisma.proposalDelivery.findMany({
      where: {
        status: { in: ["SENT", "READY"] },
        decision: "PENDING",
        revokedAt: null,
      },
      select: { opportunityId: true, proposalId: true },
      take: 50,
    }),
    prisma.commercialAgreement.findMany({
      where: { status: { in: ["APPROVED"] } },
      select: { id: true, opportunityId: true },
      take: 50,
    }),
    prisma.commercialPayment.findMany({
      where: { status: { in: ["PENDING", "CHECKOUT_CREATED"] } },
      select: { id: true, opportunityId: true, type: true },
      take: 50,
    }),
    prisma.prospect.findMany({
      where: { createdAt },
      select: { sourceType: true },
      take: 5000,
    }),
    prisma.opportunity.findMany({
      where: { createdAt },
      select: {
        createdAt: true,
        prospect: { select: { createdAt: true } },
      },
      take: 500,
    }),
    prisma.commercialProposal.findMany({
      where: { createdAt },
      select: {
        createdAt: true,
        opportunity: { select: { createdAt: true } },
      },
      take: 500,
    }),
    prisma.commercialAgreement.findMany({
      where: { status: "ACCEPTED", acceptedAt: createdAt },
      select: {
        acceptedAt: true,
        createdAt: true,
        proposal: { select: { createdAt: true } },
        totalInvestmentCents: true,
      },
      take: 500,
    }),
    prisma.commercialPayment.findMany({
      where: { status: "PAID", paidAt: createdAt },
      select: {
        paidAt: true,
        amountPaidCents: true,
        opportunityId: true,
        agreement: { select: { acceptedAt: true } },
      },
      take: 500,
    }),
    prisma.commercialProposal.findMany({
      where: {
        status: "APPROVED",
        opportunity: { stage: { in: [...ACTIVE_OPPORTUNITY_STAGES] } },
      },
      select: {
        opportunityId: true,
        totalInvestmentCents: true,
        createdAt: true,
        revision: true,
      },
      take: 500,
    }),
    prisma.commercialPayment.findMany({
      where: { status: "PAID", paidAt: createdAt },
      select: {
        amountPaidCents: true,
        opportunity: {
          select: {
            leadId: true,
            lead: {
              select: {
                reports: {
                  where: { source: "PUBLIC_FUNNEL" },
                  select: { attributionJson: true },
                  take: 1,
                },
              },
            },
          },
        },
      },
      take: 500,
    }),
    getFacebookOrganicAttributionSummary({
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
    }),
    getAuditFunnelDashboardMetrics({
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
    }),
    countContactSubmissionsInWindow({
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
    }),
  ]);

  const channelCounts = new Map<AttributionChannel, number>();
  let auditsWithUtm = 0;
  let auditsUnknown = 0;
  let strengthDirectFirstParty = 0;
  let seoLandingAudits = 0;
  let seoLandingLeads = 0;
  let facebookInboundLeads = 0;
  const contentBuckets = new Map<
    string,
    { landingOrContent: string; audits: number; inboundLeads: number }
  >();

  for (const row of attributedReports) {
    const parsed = parseAttribution(row.attributionJson);
    const source = stringField(parsed?.source);
    const medium = stringField(parsed?.medium);
    const content = stringField(parsed?.content);
    const landingPath = stringField(parsed?.landingPath);
    const hasUtm = Boolean(source || medium);
    const ctx = parseAcquisitionContextFromUnknown(row.attributionJson);
    const isSprint10Capture =
      ctx != null &&
      (row.attributionJson as { acquisitionCaptureVersion?: number } | null)
        ?.acquisitionCaptureVersion === 1;

    if (!parsed) {
      auditsUnknown += 1;
      channelCounts.set(
        "UNKNOWN",
        (channelCounts.get("UNKNOWN") ?? 0) + 1,
      );
    } else if (isSprint10Capture && ctx) {
      const channel = channelFromAcquisition(ctx);
      channelCounts.set(channel, (channelCounts.get(channel) ?? 0) + 1);
      if (ctx.entryType === "UTM") {
        auditsWithUtm += 1;
      }
      if (channel === "UNKNOWN") {
        auditsUnknown += 1;
      }
      const strength = classifyAttributionStrength({
        hasFirstPartyUtm: ctx.entryType === "UTM",
        hasSourceAndMedium: Boolean(source && medium),
        linkedToAudit: true,
        path: "INBOUND",
      });
      if (strength === "DIRECT_FIRST_PARTY") {
        strengthDirectFirstParty += 1;
      }
    } else if (!hasUtm) {
      // Sprint 9 legacy: present JSON without UTM counted as DIRECT.
      channelCounts.set("DIRECT", (channelCounts.get("DIRECT") ?? 0) + 1);
    } else {
      auditsWithUtm += 1;
      const channel = channelFromAcquisition(ctx);
      channelCounts.set(channel, (channelCounts.get(channel) ?? 0) + 1);
      const strength = classifyAttributionStrength({
        hasFirstPartyUtm: true,
        hasSourceAndMedium: Boolean(source && medium),
        linkedToAudit: true,
        path: "INBOUND",
      });
      if (strength === "DIRECT_FIRST_PARTY") {
        strengthDirectFirstParty += 1;
      }
    }

    if (landingPath?.startsWith("/seo")) {
      seoLandingAudits += 1;
      if (row.leadId) {
        seoLandingLeads += 1;
      }
      const bucket = contentBuckets.get("seo_service_page") ?? {
        landingOrContent: "/seo",
        audits: 0,
        inboundLeads: 0,
      };
      bucket.audits += 1;
      if (row.leadId) {
        bucket.inboundLeads += 1;
      }
      contentBuckets.set("seo_service_page", bucket);
    }

    if (source === "facebook" && row.leadId) {
      facebookInboundLeads += 1;
    }

    const publicSlug =
      content && /^[a-z0-9][a-z0-9_-]{0,60}$/.test(content) ? content : null;
    if (publicSlug) {
      const bucket = contentBuckets.get(publicSlug) ?? {
        landingOrContent: publicSlug,
        audits: 0,
        inboundLeads: 0,
      };
      bucket.audits += 1;
      if (row.leadId) {
        bucket.inboundLeads += 1;
      }
      contentBuckets.set(publicSlug, bucket);
    }
  }

  const gbpAudits = channelCounts.get("GBP") ?? 0;
  const gbp = {
    status: gbpAudits > 0 ? ("AVAILABLE" as const) : ("NOT_CAPTURED" as const),
    audits: gbpAudits,
  };

  const channels: ChannelSummaryRow[] = (
    [
      "FACEBOOK",
      "ORGANIC_SEARCH",
      "DIRECT",
      "REFERRAL",
      "GBP",
      "PAID",
      "UNKNOWN",
    ] as AttributionChannel[]
  ).map((channel) => {
    if (channel === "GBP" && gbp.status === "NOT_CAPTURED") {
      return {
        channel,
        audits: { status: "NOT_CAPTURED", value: null },
        statusNote: "No google_business_profile / organic_local UTM observed.",
      };
    }
    const value = channelCounts.get(channel) ?? 0;
    return {
      channel,
      audits: observeCount(value),
      statusNote:
        channel === "UNKNOWN"
          ? "Missing first-party attribution on public audits."
          : "Observed from AuditReport.attributionJson.",
    };
  });

  const outboundBySource: Record<string, number> = {};
  for (const row of outboundInWindow) {
    const key = classifyOutboundProspectSource(row.sourceType);
    outboundBySource[key] = (outboundBySource[key] ?? 0) + 1;
  }

  const attention: AttentionItem[] = [];
  for (const lead of openLeads) {
    const ageBand = classifyLeadAge(lead.createdAt, now);
    const href = lead.reports[0]
      ? `/reports/${lead.reports[0].id}`
      : "/reports";
    const title = inboundLeadTitle(lead);
    if (lead.followUpAt && lead.followUpAt.getTime() <= now.getTime()) {
      attention.push({
        kind: "FOLLOW_UP_DUE",
        title,
        href,
        recommendedAction: "FOLLOW_UP",
        ageBand,
        createdAt: lead.createdAt.toISOString(),
      });
      continue;
    }
    if (lead.status === "NEW" && ageBand === "NEW") {
      attention.push({
        kind: "NEW_INBOUND_LEAD",
        title,
        href,
        recommendedAction: "REVIEW_LEAD",
        ageBand,
        createdAt: lead.createdAt.toISOString(),
      });
      continue;
    }
    if (ageBand === "AGING") {
      attention.push({
        kind: "AGING_INBOUND_LEAD",
        title,
        href,
        recommendedAction: "FOLLOW_UP",
        ageBand,
        createdAt: lead.createdAt.toISOString(),
      });
    } else if (ageBand === "STALE") {
      attention.push({
        kind: "STALE_INBOUND_LEAD",
        title,
        href,
        recommendedAction: "REVIEW_LEAD",
        ageBand,
        createdAt: lead.createdAt.toISOString(),
      });
    }
  }

  for (const opp of activeOpportunities) {
    const href = `/reports/opportunities/${opp.id}`;
    if (opp.nextActionAt && opp.nextActionAt.getTime() <= now.getTime()) {
      attention.push({
        kind: "OPPORTUNITY_OVERDUE",
        title: opp.name.slice(0, 80),
        href,
        recommendedAction: "FOLLOW_UP",
        createdAt: opp.createdAt.toISOString(),
      });
    } else if (!opp.nextAction && !opp.nextActionAt) {
      attention.push({
        kind: "OPPORTUNITY_NO_NEXT_ACTION",
        title: opp.name.slice(0, 80),
        href,
        recommendedAction: "QUALIFY",
        createdAt: opp.createdAt.toISOString(),
      });
    }
  }

  for (const delivery of pendingDeliveries) {
    attention.push({
      kind: "PROPOSAL_AWAITING_DECISION",
      title: "Proposal awaiting response",
      href: `/reports/opportunities/${delivery.opportunityId}/proposal/${delivery.proposalId}`,
      recommendedAction: "REVIEW_PROPOSAL_STATUS",
    });
  }
  for (const agreement of awaitingAgreements) {
    attention.push({
      kind: "AGREEMENT_AWAITING_ACCEPTANCE",
      title: "Agreement approved, awaiting acceptance",
      href: `/reports/opportunities/${agreement.opportunityId}/agreement/${agreement.id}`,
      recommendedAction: "CHECK_AGREEMENT",
    });
  }
  for (const payment of pendingPayments) {
    attention.push({
      kind: "PAYMENT_PENDING",
      title: `Payment ${payment.type} pending`,
      href: `/reports/opportunities/${payment.opportunityId}`,
      recommendedAction: "CHECK_PAYMENT",
    });
  }

  const trimmedAttention = attention.slice(
    0,
    LEAD_CONVERSION_THRESHOLDS.ATTENTION_QUEUE_MAX,
  );

  const prospectToOppDays = opportunitiesForVelocity.map((row) =>
    daysBetween(row.prospect.createdAt, row.createdAt),
  );
  const oppToProposalDays = proposalsForVelocity.map((row) =>
    daysBetween(row.opportunity.createdAt, row.createdAt),
  );
  const proposalToAgreementDays = agreementsForVelocity
    .filter((row) => row.acceptedAt)
    .map((row) => daysBetween(row.proposal.createdAt, row.acceptedAt!));
  const agreementToPaymentDays = paymentsForVelocity
    .filter((row) => row.paidAt && row.agreement.acceptedAt)
    .map((row) => daysBetween(row.agreement.acceptedAt!, row.paidAt!));

  const latestApprovedByOpp = new Map<
    string,
    { cents: number; createdAt: number; revision: number }
  >();
  for (const row of approvedProposals) {
    const existing = latestApprovedByOpp.get(row.opportunityId);
    const createdAtMs = row.createdAt.getTime();
    if (
      !existing ||
      row.revision > existing.revision ||
      (row.revision === existing.revision && createdAtMs > existing.createdAt)
    ) {
      latestApprovedByOpp.set(row.opportunityId, {
        cents: row.totalInvestmentCents,
        createdAt: createdAtMs,
        revision: row.revision,
      });
    }
  }
  const pipelineApprovedProposalCents = [...latestApprovedByOpp.values()].reduce(
    (sum, row) => sum + row.cents,
    0,
  );
  const acceptedAgreementCents = agreementsForVelocity.reduce(
    (sum, row) => sum + row.totalInvestmentCents,
    0,
  );
  const paidCommercialCents = paymentsForVelocity.reduce(
    (sum, row) => sum + row.amountPaidCents,
    0,
  );

  let attributedRevenueCents = 0;
  for (const payment of paidPayments) {
    const attr = payment.opportunity.lead?.reports[0]?.attributionJson;
    const parsed = parseAttribution(attr);
    if (stringField(parsed?.source) || stringField(parsed?.medium)) {
      attributedRevenueCents += payment.amountPaidCents;
    }
  }

  const observedRevenueCents = paidCommercialCents;
  const revenueKind = revenueEvidenceKind({
    paidCents: observedRevenueCents,
    hasMarketingAttribution: attributedRevenueCents > 0,
  });

  const contentPipeline: ContentPipelineRow[] = [...contentBuckets.entries()]
    .map(([publicSlug, bucket]) => ({
      publicSlug,
      landingOrContent: bucket.landingOrContent,
      audits: bucket.audits,
      inboundLeads: bucket.inboundLeads,
      signal: contentBusinessSignalLabel({
        attributedAudits: bucket.audits,
        attributedLeads: bucket.inboundLeads,
        attributedOpportunities: 0,
      }),
    }))
    .sort((a, b) => b.audits - a.audits)
    .slice(0, 12);

  const facebookSignal = contentBusinessSignalLabel({
    attributedAudits: facebookAttribution.totalAttributedAudits,
    attributedLeads: facebookInboundLeads,
    attributedOpportunities: 0,
  });
  const searchSignal = contentBusinessSignalLabel({
    attributedAudits: seoLandingAudits,
    attributedLeads: seoLandingLeads,
    attributedOpportunities: 0,
  });

  const priorityActions = buildPriorityActions({
    attention: trimmedAttention,
    inboundLeads: inboundLeadsCreated,
    outboundProspects: outboundProspectsCreated,
    opportunities: opportunitiesCreated,
    attributedAudits: auditsWithUtm,
    unknownAttributionAudits: auditsUnknown,
    sampleLabel: sampleQuality(inboundLeadsCreated + publicAudits),
  });

  const funnelStartsValue =
    auditFunnel.auditStarts.status === "AVAILABLE" ||
    auditFunnel.auditStarts.status === "ZERO"
      ? auditFunnel.auditStarts.value
      : null;
  const funnelSubsValue =
    auditFunnel.auditSubmissions.status === "AVAILABLE" ||
    auditFunnel.auditSubmissions.status === "ZERO"
      ? auditFunnel.auditSubmissions.value
      : null;

  return {
    version: LEAD_CONVERSION_INTELLIGENCE_VERSION,
    periodStart: input.periodStart,
    periodEnd: input.periodEnd,
    counts: {
      publicAudits: observeCount(publicAudits),
      inboundLeads: observeCount(inboundLeadsCreated),
      outboundProspects: observeCount(outboundProspectsCreated),
      opportunities: observeCount(opportunitiesCreated),
      proposals: observeCount(proposalsCreated),
      agreementsAccepted: observeCount(agreementsAccepted),
      paymentsPaid: observeCount(paymentsPaid),
      clients: observeCount(clientsCreated),
      professionalPurchases: observeCount(professionalPurchases),
      contactSubmissions: observeCount(contactSubmissionsCreated),
      qualifiedVisits: { status: "NOT_CAPTURED", value: null },
    },
    rates: {
      auditToInboundLead: conversionRate({
        numerator: inboundLeadsCreated,
        denominator: publicAudits,
      }),
      inboundLeadToOpportunity: conversionRate({
        numerator: inboundOpportunitiesCreated,
        denominator: inboundLeadsCreated,
      }),
      opportunityToProposal: conversionRate({
        numerator: proposalsCreated,
        denominator: opportunitiesCreated,
      }),
      proposalToAgreement: conversionRate({
        numerator: agreementsAccepted,
        denominator: proposalsCreated,
      }),
      agreementToPayment: conversionRate({
        numerator: paymentsPaid,
        denominator: agreementsAccepted,
      }),
      clientsPerPageView: conversionRate({
        numerator: clientsCreated,
        denominator: null,
        denominatorCaptured: false,
      }),
    },
    dropOff: {
      prospectToOpportunity: dropOffObservation({
        fromCount: outboundProspectsCreated,
        toCount: opportunitiesCreated,
      }),
      opportunityToProposal: dropOffObservation({
        fromCount: opportunitiesCreated,
        toCount: proposalsCreated,
      }),
      proposalToAgreement: dropOffObservation({
        fromCount: proposalsCreated,
        toCount: agreementsAccepted,
      }),
      agreementToPayment: dropOffObservation({
        fromCount: agreementsAccepted,
        toCount: paymentsPaid,
      }),
    },
    sample: {
      inbound: sampleQuality(inboundLeadsCreated),
      outbound: sampleQuality(outboundProspectsCreated),
      audits: sampleQuality(publicAudits),
    },
    channels,
    gbp,
    attributionCoverage: {
      auditsWithUtm,
      auditsUnknown,
      strengthDirectFirstParty,
      coverage: computeAttributionCoverage(
        [...channelCounts.entries()].flatMap(([channel, count]) =>
          Array.from({ length: count }, () => channel),
        ),
      ),
      contactSubmissions: contactSubmissionsCreated,
      contactNotCaptured: false,
    },
    inboundVsOutbound: {
      inboundLeads: inboundLeadsCreated,
      outboundProspects: outboundProspectsCreated,
      outboundBySource,
    },
    attention: trimmedAttention,
    priorityActions,
    velocity: {
      prospectToOpportunity: pipelineVelocityMedianDays(prospectToOppDays),
      opportunityToProposal: pipelineVelocityMedianDays(oppToProposalDays),
      proposalToAgreement: pipelineVelocityMedianDays(proposalToAgreementDays),
      agreementToPayment: pipelineVelocityMedianDays(agreementToPaymentDays),
    },
    money: {
      pipelineApprovedProposalCents,
      acceptedAgreementCents,
      paidCommercialCents,
      paidProfessionalAuditCents: null,
      observedRevenueCents,
      attributedRevenueCents,
      revenueKind,
      roiStatus: marketingRoiStatus({
        costKnown: false,
        revenueAttributionStrong: attributedRevenueCents > 0,
        windowCompatible: true,
      }),
    },
    contentPipeline,
    facebookPipeline: {
      attributedAudits: facebookAttribution.totalAttributedAudits,
      inboundLeads: facebookInboundLeads,
      signal: facebookSignal,
    },
    searchPipeline: {
      seoLandingAudits,
      inboundLeads: seoLandingLeads,
      signal: searchSignal,
    },
    touchSemantics: TOUCH_SEMANTICS,
    funnelStarts: observeCount(funnelStartsValue),
    funnelSubmissions: observeCount(funnelSubsValue),
  };
}
