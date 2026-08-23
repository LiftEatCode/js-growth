import "server-only";

import { Prisma as PrismaNamespace } from "@/generated/prisma/client";

import {
  AUDIT_FUNNEL_VERSION,
  parseAuditFunnelContextFromUnknown,
} from "@/lib/growth/audit-funnel";
import {
  FUNNEL_METRIC_STATUS,
  type FunnelCountMetric,
  type FunnelRateMetric,
} from "@/lib/growth/audit-funnel-display";
import { prisma } from "@/lib/prisma";

export {
  FUNNEL_METRIC_STATUS,
  formatFunnelCount,
  formatFunnelRate,
  type FunnelMetricStatus,
  type FunnelCountMetric,
  type FunnelRateMetric,
} from "@/lib/growth/audit-funnel-display";

export type AuditFunnelDashboardMetrics = {
  periodStart: Date;
  periodEnd: Date;
  funnelVersion: typeof AUDIT_FUNNEL_VERSION;
  landingViews: FunnelCountMetric;
  auditStarts: FunnelCountMetric;
  auditSubmissions: FunnelCountMetric;
  auditCompletions: FunnelCountMetric;
  reportViews: FunnelCountMetric;
  professionalCtaClicks: FunnelCountMetric;
  contactSubmissions: FunnelCountMetric;
  leadsProspects: FunnelCountMetric;
  rates: {
    landingToStart: FunnelRateMetric;
    startToSubmit: FunnelRateMetric;
    submitToComplete: FunnelRateMetric;
    completeToReportView: FunnelRateMetric;
    reportToCta: FunnelRateMetric;
    ctaToLead: FunnelRateMetric;
  };
  attributionBySource: Array<{
    source: string;
    medium: string | null;
    count: number;
  }>;
};

const MIN_SAMPLE_FOR_RATE = 5;

function periodFilter(periodStart: Date, periodEnd: Date) {
  return {
    gte: periodStart,
    lt: periodEnd,
  };
}

function countMetric(
  value: number,
  captured: boolean,
): FunnelCountMetric {
  if (!captured) {
    return { status: FUNNEL_METRIC_STATUS.NOT_CAPTURED, value: null };
  }
  if (value === 0) {
    return { status: FUNNEL_METRIC_STATUS.ZERO, value: 0 };
  }
  return { status: FUNNEL_METRIC_STATUS.AVAILABLE, value };
}

function rateMetric(
  numerator: number | null,
  denominator: number | null,
  numeratorCaptured: boolean,
  denominatorCaptured: boolean,
): FunnelRateMetric {
  if (!numeratorCaptured || !denominatorCaptured) {
    return { status: FUNNEL_METRIC_STATUS.NOT_CAPTURED, value: null };
  }
  if (numerator === null || denominator === null) {
    return { status: FUNNEL_METRIC_STATUS.UNKNOWN, value: null };
  }
  if (denominator === 0 && numerator === 0) {
    return { status: FUNNEL_METRIC_STATUS.ZERO, value: 0 };
  }
  if (denominator < MIN_SAMPLE_FOR_RATE) {
    return { status: FUNNEL_METRIC_STATUS.INSUFFICIENT_DATA, value: null };
  }
  if (denominator === 0) {
    return { status: FUNNEL_METRIC_STATUS.UNKNOWN, value: null };
  }
  return {
    status: FUNNEL_METRIC_STATUS.AVAILABLE,
    value: Math.round((numerator / denominator) * 1000) / 10,
  };
}

function extractFunnelMilestone(
  attributionJson: unknown,
  field: "landingViewAt" | "startedAt" | "submittedAt",
): boolean {
  if (!attributionJson || typeof attributionJson !== "object" || Array.isArray(attributionJson)) {
    return false;
  }
  const funnel = (attributionJson as Record<string, unknown>).funnel;
  const parsed = parseAuditFunnelContextFromUnknown(funnel);
  return Boolean(parsed?.[field]);
}

export async function getAuditFunnelDashboardMetrics(input: {
  periodStart: Date;
  periodEnd: Date;
}): Promise<AuditFunnelDashboardMetrics> {
  const createdAt = periodFilter(input.periodStart, input.periodEnd);

  const [publicAudits, prospectsCreated, attributedReports] = await Promise.all([
    prisma.auditReport.findMany({
      where: {
        source: "PUBLIC_FUNNEL",
        createdAt,
      },
      select: { attributionJson: true },
    }),
    prisma.prospect.count({ where: { createdAt } }),
    prisma.auditReport.findMany({
      where: {
        source: "PUBLIC_FUNNEL",
        createdAt,
        attributionJson: { not: PrismaNamespace.DbNull },
      },
      select: { attributionJson: true },
      take: 5000,
    }),
  ]);

  const auditSubmissions = publicAudits.length;
  const auditCompletions = auditSubmissions;

  let landingViews = 0;
  let auditStarts = 0;
  let funnelMilestoneRows = 0;

  for (const row of publicAudits) {
    const hasLanding = extractFunnelMilestone(row.attributionJson, "landingViewAt");
    const hasStarted = extractFunnelMilestone(row.attributionJson, "startedAt");
    const hasSubmitted = extractFunnelMilestone(row.attributionJson, "submittedAt");

    if (hasLanding || hasStarted || hasSubmitted) {
      funnelMilestoneRows += 1;
    }
    if (hasLanding) {
      landingViews += 1;
    }
    if (hasStarted) {
      auditStarts += 1;
    }
  }

  const funnelMilestonesCaptured = funnelMilestoneRows > 0;

  const attributionCounts = new Map<string, number>();
  for (const row of attributedReports) {
    const raw = row.attributionJson;
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
      continue;
    }
    const record = raw as Record<string, unknown>;
    const source =
      typeof record.source === "string" && record.source
        ? record.source
        : "(none)";
    const medium =
      typeof record.medium === "string" && record.medium ? record.medium : null;
    const key = `${source}||${medium ?? ""}`;
    attributionCounts.set(key, (attributionCounts.get(key) ?? 0) + 1);
  }

  const attributionBySource = [...attributionCounts.entries()]
    .map(([key, count]) => {
      const [source, medium] = key.split("||");
      return { source, medium: medium || null, count };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);

  return {
    periodStart: input.periodStart,
    periodEnd: input.periodEnd,
    funnelVersion: AUDIT_FUNNEL_VERSION,
    landingViews: countMetric(landingViews, funnelMilestonesCaptured),
    auditStarts: countMetric(auditStarts, funnelMilestonesCaptured),
    auditSubmissions: countMetric(auditSubmissions, true),
    auditCompletions: countMetric(auditCompletions, true),
    reportViews: {
      status: FUNNEL_METRIC_STATUS.NOT_CAPTURED,
      value: null,
    },
    professionalCtaClicks: {
      status: FUNNEL_METRIC_STATUS.NOT_CAPTURED,
      value: null,
    },
    contactSubmissions: {
      status: FUNNEL_METRIC_STATUS.NOT_CAPTURED,
      value: null,
    },
    leadsProspects: countMetric(prospectsCreated, true),
    rates: {
      landingToStart: rateMetric(
        auditStarts,
        landingViews,
        funnelMilestonesCaptured,
        funnelMilestonesCaptured,
      ),
      startToSubmit: rateMetric(
        auditSubmissions,
        auditStarts,
        true,
        funnelMilestonesCaptured,
      ),
      submitToComplete: rateMetric(
        auditCompletions,
        auditSubmissions,
        true,
        true,
      ),
      completeToReportView: rateMetric(null, null, false, false),
      reportToCta: rateMetric(null, null, false, false),
      ctaToLead: rateMetric(null, null, false, false),
    },
    attributionBySource,
  };
}
