import "server-only";

import { prisma } from "@/lib/prisma";
import { classifyLeadAgeBand, dueStateForAuthority } from "./attention";
import { FOLLOW_UP_OPERATOR_TIMEZONE, LEAD_FOLLOWUP_VERSION } from "./constants";
import {
  daysBetweenCalendar,
  operatorCalendarDateKey,
  parseOperatorFollowUpDate,
} from "./timezone";

export type FollowUpMetricsWindow = {
  days: 7 | 28 | 90;
  periodStart: Date;
  periodEnd: Date;
};

export type FollowUpMetricsReport = {
  version: typeof LEAD_FOLLOWUP_VERSION;
  timezone: typeof FOLLOW_UP_OPERATOR_TIMEZONE;
  window: FollowUpMetricsWindow;
  counts: {
    newInbound: number | "INSUFFICIENT_DATA";
    activitiesRecorded: number;
    followUpsDue: number;
    followUpsOverdue: number;
    followUpsCompleted: number;
    nurtureCount: number;
    qualifiedCount: number;
    staleCount: number;
  };
  firstResponseMedianHours: number | "INSUFFICIENT_DATA" | "NOT_CAPTURED";
  responseRate: "NOT_CAPTURED";
  sample: {
    inboundLeads: number;
    activities: number;
    firstResponsePairs: number;
  };
};

function windowForDays(days: 7 | 28 | 90, now = new Date()): FollowUpMetricsWindow {
  const periodEnd = now;
  const periodStart = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  return { days, periodStart, periodEnd };
}

function median(values: number[]): number | null {
  if (values.length === 0) {
    return null;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1]! + sorted[mid]!) / 2;
  }
  return sorted[mid]!;
}

/**
 * FIRST_RESPONSE_TIME: inbound lead createdAt → first OUTBOUND FollowUpActivity.
 * Only when both timestamps exist. n < 3 → INSUFFICIENT_DATA.
 */
export async function getFollowUpMetrics(
  days: 7 | 28 | 90 = 28,
  now = new Date(),
): Promise<FollowUpMetricsReport> {
  const window = windowForDays(days, now);

  const [leads, activities, overdueLeads, dueTodayLeads, nurtureLeads, qualified] =
    await Promise.all([
      prisma.lead.findMany({
        where: {
          createdAt: { gte: window.periodStart, lt: window.periodEnd },
        },
        select: {
          id: true,
          createdAt: true,
          status: true,
          followUpAt: true,
        },
      }),
      prisma.followUpActivity.findMany({
        where: {
          occurredAt: { gte: window.periodStart, lt: window.periodEnd },
        },
        select: {
          id: true,
          leadId: true,
          direction: true,
          occurredAt: true,
          nextFollowUpAt: true,
        },
      }),
      prisma.lead.count({
        where: {
          status: { notIn: ["WON", "LOST"] },
          followUpAt: { lt: startOfOperatorToday(now) },
        },
      }),
      prisma.lead.count({
        where: {
          status: { notIn: ["WON", "LOST"] },
          followUpAt: {
            gte: startOfOperatorToday(now),
            lt: startOfOperatorTomorrow(now),
          },
        },
      }),
      prisma.lead.count({
        where: {
          status: { notIn: ["WON", "LOST"] },
          followUpAt: {
            gte: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      prisma.lead.count({
        where: {
          status: "QUALIFIED",
          createdAt: { gte: window.periodStart, lt: window.periodEnd },
        },
      }),
    ]);

  let staleCount = 0;
  for (const lead of leads) {
    if (
      lead.status !== "WON" &&
      lead.status !== "LOST" &&
      classifyLeadAgeBand(lead.createdAt, now) === "STALE"
    ) {
      staleCount += 1;
    }
  }

  // Completions: activity on a lead that had a due follow-up at/before activity time
  // Approximation: activity where nextFollowUpAt was set OR lead had followUpAt overdue.
  // Deterministic rule: activity recorded while previous followUpAt was due (OVERDUE/DUE_TODAY)
  // is counted when nextFollowUpAt is set or cleared via the activity row.
  const completed = activities.filter(
    (a) => a.leadId && (a.nextFollowUpAt != null || a.direction === "OUTBOUND"),
  ).length;

  // First response pairs
  const leadIds = leads.map((l) => l.id);
  const firstOutboundByLead = new Map<string, Date>();
  if (leadIds.length > 0) {
    const outbound = await prisma.followUpActivity.findMany({
      where: {
        leadId: { in: leadIds },
        direction: "OUTBOUND",
      },
      orderBy: { occurredAt: "asc" },
      select: { leadId: true, occurredAt: true },
    });
    for (const row of outbound) {
      if (!row.leadId) continue;
      if (!firstOutboundByLead.has(row.leadId)) {
        firstOutboundByLead.set(row.leadId, row.occurredAt);
      }
    }
  }

  const hours: number[] = [];
  for (const lead of leads) {
    const first = firstOutboundByLead.get(lead.id);
    if (!first) continue;
    const h = (first.getTime() - lead.createdAt.getTime()) / (60 * 60 * 1000);
    if (h >= 0) {
      hours.push(h);
    }
  }

  let firstResponseMedianHours:
    | number
    | "INSUFFICIENT_DATA"
    | "NOT_CAPTURED" = "NOT_CAPTURED";
  if (hours.length === 0) {
    firstResponseMedianHours = "NOT_CAPTURED";
  } else if (hours.length < 3) {
    firstResponseMedianHours = "INSUFFICIENT_DATA";
  } else {
    firstResponseMedianHours = Math.round((median(hours) ?? 0) * 10) / 10;
  }

  return {
    version: LEAD_FOLLOWUP_VERSION,
    timezone: FOLLOW_UP_OPERATOR_TIMEZONE,
    window,
    counts: {
      newInbound: leads.length < 1 ? "INSUFFICIENT_DATA" : leads.length,
      activitiesRecorded: activities.length,
      followUpsDue: dueTodayLeads,
      followUpsOverdue: overdueLeads,
      followUpsCompleted: completed,
      nurtureCount: nurtureLeads,
      qualifiedCount: qualified,
      staleCount,
    },
    firstResponseMedianHours,
    responseRate: "NOT_CAPTURED",
    sample: {
      inboundLeads: leads.length,
      activities: activities.length,
      firstResponsePairs: hours.length,
    },
  };
}

function startOfOperatorToday(now: Date): Date {
  const key = operatorCalendarDateKey(now);
  return parseOperatorFollowUpDate(key) ?? now;
}

function startOfOperatorTomorrow(now: Date): Date {
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  return startOfOperatorToday(tomorrow);
}

export function formatFollowUpDueLabel(
  followUpAt: Date | null | undefined,
  now = new Date(),
): string {
  const state = dueStateForAuthority(followUpAt, now);
  if (state === "NONE") return "No follow-up scheduled";
  if (state === "OVERDUE") return "Overdue";
  if (state === "DUE_TODAY") return "Due today";
  const days = followUpAt ? daysBetweenCalendar(now, followUpAt) : 0;
  return `Upcoming (${days}d)`;
}
