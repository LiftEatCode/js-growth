import "server-only";

import { prisma } from "@/lib/prisma";
import {
  channelFromAcquisition,
  parseAcquisitionContextFromUnknown,
} from "@/lib/growth/acquisition-capture";
import {
  FOLLOW_UP_ATTENTION_LIMIT,
  type FollowUpPriorityBand,
} from "./constants";
import {
  attentionSortWeight,
  bandFromWeight,
  classifyLeadAgeBand,
  dueStateForAuthority,
  type FollowUpAttentionItem,
} from "./attention";

function leadHref(leadId: string, reportId: string | null): string {
  if (reportId) {
    return `/reports/${reportId}`;
  }
  return `/reports/leads/${leadId}`;
}

export async function buildFollowUpAttentionQueue(input?: {
  now?: Date;
  limit?: number;
}): Promise<{
  now: FollowUpAttentionItem[];
  next: FollowUpAttentionItem[];
  watch: FollowUpAttentionItem[];
  counts: {
    overdue: number;
    dueToday: number;
    newInbound: number;
    nurture: number;
  };
}> {
  const now = input?.now ?? new Date();
  const limit = input?.limit ?? FOLLOW_UP_ATTENTION_LIMIT;

  const [leads, prospects, opportunities] = await Promise.all([
    prisma.lead.findMany({
      where: { status: { notIn: ["WON", "LOST"] } },
      orderBy: [{ followUpAt: "asc" }, { createdAt: "desc" }],
      take: 80,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        company: true,
        email: true,
        status: true,
        followUpAt: true,
        createdAt: true,
        reports: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { id: true, attributionJson: true },
        },
        opportunities: { select: { id: true }, take: 1 },
        followUpActivities: {
          orderBy: { occurredAt: "desc" },
          take: 1,
          select: { direction: true, outcome: true, occurredAt: true },
        },
      },
    }),
    prisma.prospect.findMany({
      where: {
        outreachStatus: { notIn: ["SUPPRESSED", "CONVERTED"] },
        OR: [
          { followUpAt: { not: null } },
          { outreachStatus: {
            in: ["DRAFT_READY", "APPROVED", "SENT", "REPLIED", "INTERESTED"],
          } },
        ],
      },
      orderBy: [{ followUpAt: "asc" }, { createdAt: "desc" }],
      take: 60,
      select: {
        id: true,
        businessName: true,
        followUpAt: true,
        createdAt: true,
        outreachStatus: true,
        campaignProspects: {
          take: 1,
          select: { campaignId: true },
        },
      },
    }),
    prisma.opportunity.findMany({
      where: { stage: { notIn: ["WON", "LOST"] } },
      orderBy: [{ nextActionAt: "asc" }, { createdAt: "desc" }],
      take: 40,
      select: {
        id: true,
        name: true,
        nextAction: true,
        nextActionAt: true,
        createdAt: true,
        stage: true,
      },
    }),
  ]);

  const items: FollowUpAttentionItem[] = [];
  let overdue = 0;
  let dueToday = 0;
  let newInbound = 0;
  let nurture = 0;

  for (const lead of leads) {
    const ageBand = classifyLeadAgeBand(lead.createdAt, now);
    const dueState = dueStateForAuthority(lead.followUpAt, now);
    const last = lead.followUpActivities[0];
    const inboundReplyAwaiting =
      last?.direction === "INBOUND" &&
      last.outcome !== "DO_NOT_CONTACT" &&
      (!lead.followUpAt || dueState === "OVERDUE" || dueState === "DUE_TODAY");
    const isNewInbound = lead.status === "NEW" && ageBand === "NEW";
    const qualifiedWithoutOpportunity =
      lead.status === "QUALIFIED" && lead.opportunities.length === 0;
    const nurtureUpcoming =
      dueState === "UPCOMING" &&
      Boolean(lead.followUpAt) &&
      daysAhead(lead.followUpAt!, now) >= 14;

    if (dueState === "OVERDUE") overdue += 1;
    if (dueState === "DUE_TODAY") dueToday += 1;
    if (isNewInbound) newInbound += 1;
    if (nurtureUpcoming) nurture += 1;

    const weight = attentionSortWeight({
      inboundReplyAwaiting,
      dueState,
      isNewInbound,
      qualifiedWithoutOpportunity,
      opportunityOverdue: false,
      ageBand,
      nurtureUpcoming,
    });

    if (
      weight > 100 &&
      dueState === "NONE" &&
      ageBand !== "AGING" &&
      ageBand !== "STALE" &&
      !isNewInbound &&
      !qualifiedWithoutOpportunity
    ) {
      continue;
    }

    const report = lead.reports[0];
    const channel = report?.attributionJson
      ? channelFromAcquisition(
          parseAcquisitionContextFromUnknown(report.attributionJson),
        )
      : null;

    items.push({
      subjectKind: "LEAD",
      subjectId: lead.id,
      title:
        [lead.firstName, lead.lastName].filter(Boolean).join(" ") ||
        lead.company ||
        lead.email,
      href: leadHref(lead.id, report?.id ?? null),
      priority: bandFromWeight(weight),
      reason: describeLeadReason({
        inboundReplyAwaiting,
        dueState,
        isNewInbound,
        qualifiedWithoutOpportunity,
        ageBand,
        nurtureUpcoming,
      }),
      dueState,
      followUpAt: lead.followUpAt?.toISOString() ?? null,
      ageBand,
      acquisitionChannel: channel,
      doNotContact: false,
      sortWeight: weight,
    });
  }

  for (const prospect of prospects) {
    const dueState = dueStateForAuthority(prospect.followUpAt, now);
    const weight = attentionSortWeight({
      inboundReplyAwaiting: false,
      dueState: dueState === "NONE" ? "UPCOMING" : dueState,
      isNewInbound: false,
      qualifiedWithoutOpportunity: false,
      opportunityOverdue: false,
      ageBand: classifyLeadAgeBand(prospect.createdAt, now),
      nurtureUpcoming: dueState === "UPCOMING",
    });
    if (dueState === "OVERDUE") overdue += 1;
    if (dueState === "DUE_TODAY") dueToday += 1;

    const campaignId = prospect.campaignProspects[0]?.campaignId;
    items.push({
      subjectKind: "PROSPECT",
      subjectId: prospect.id,
      title: prospect.businessName,
      href: campaignId
        ? `/reports/prospecting/${campaignId}/prospects/${prospect.id}`
        : `/reports/prospecting`,
      priority: bandFromWeight(weight),
      reason:
        dueState === "OVERDUE"
          ? "Outbound follow-up overdue"
          : dueState === "DUE_TODAY"
            ? "Outbound follow-up due today"
            : "Outbound prospect needs follow-up",
      dueState,
      followUpAt: prospect.followUpAt?.toISOString() ?? null,
      ageBand: classifyLeadAgeBand(prospect.createdAt, now),
      acquisitionChannel: null,
      doNotContact: false,
      sortWeight: weight + 5,
    });
  }

  for (const opportunity of opportunities) {
    const dueState = dueStateForAuthority(opportunity.nextActionAt, now);
    const opportunityOverdue = dueState === "OVERDUE";
    const noNext = !opportunity.nextActionAt;
    if (!opportunityOverdue && !noNext && dueState !== "DUE_TODAY") {
      continue;
    }
    if (dueState === "OVERDUE") overdue += 1;
    if (dueState === "DUE_TODAY") dueToday += 1;

    const weight = attentionSortWeight({
      inboundReplyAwaiting: false,
      dueState: noNext ? "NONE" : dueState,
      isNewInbound: false,
      qualifiedWithoutOpportunity: false,
      opportunityOverdue: opportunityOverdue || noNext,
      ageBand: null,
      nurtureUpcoming: false,
    });

    items.push({
      subjectKind: "OPPORTUNITY",
      subjectId: opportunity.id,
      title: opportunity.name,
      href: `/reports/opportunities/${opportunity.id}`,
      priority: bandFromWeight(weight),
      reason: noNext
        ? "Opportunity has no next action"
        : opportunityOverdue
          ? "Opportunity next action overdue"
          : "Opportunity next action due today",
      dueState: noNext ? "NONE" : dueState,
      followUpAt: opportunity.nextActionAt?.toISOString() ?? null,
      ageBand: null,
      acquisitionChannel: null,
      doNotContact: false,
      sortWeight: weight,
    });
  }

  items.sort((a, b) => a.sortWeight - b.sortWeight || a.title.localeCompare(b.title));
  const trimmed = items.slice(0, limit);

  const group = (band: FollowUpPriorityBand) =>
    trimmed.filter((i) => i.priority === band);

  return {
    now: group("NOW"),
    next: group("NEXT"),
    watch: group("WATCH"),
    counts: { overdue, dueToday, newInbound, nurture },
  };
}

function daysAhead(followUpAt: Date, now: Date): number {
  return Math.floor(
    (followUpAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000),
  );
}

function describeLeadReason(input: {
  inboundReplyAwaiting: boolean;
  dueState: ReturnType<typeof dueStateForAuthority>;
  isNewInbound: boolean;
  qualifiedWithoutOpportunity: boolean;
  ageBand: ReturnType<typeof classifyLeadAgeBand>;
  nurtureUpcoming: boolean;
}): string {
  if (input.inboundReplyAwaiting) return "Inbound reply awaiting response";
  if (input.dueState === "OVERDUE") return "Follow-up overdue";
  if (input.isNewInbound) return "New inbound lead";
  if (input.dueState === "DUE_TODAY") return "Follow-up due today";
  if (input.qualifiedWithoutOpportunity) {
    return "Qualified lead without opportunity";
  }
  if (input.ageBand === "STALE") return "Stale inbound lead";
  if (input.ageBand === "AGING") return "Aging inbound lead";
  if (input.nurtureUpcoming) return "Nurture review upcoming";
  if (input.dueState === "UPCOMING") return "Follow-up upcoming";
  return "Needs review";
}
