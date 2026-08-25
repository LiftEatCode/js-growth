import "server-only";

import {
  GBP_EXPERIMENT_SEQUENCE,
  GBP_SUPPORT_CONTENT_SEED,
  LOCAL_GROWTH_VERSION,
  MAGNOLIA_LOCAL_PAGE_DECISION,
  WEBSITE_TO_GBP_DECISION,
  currentGbpExperimentId,
  formatLocalMetricDisplay,
  nextGbpExperimentId,
  reviewVelocityBetweenSnapshots,
  type LocalEvidenceStrength,
  type LocalPerformanceState,
} from "@/lib/growth/local-growth";
import {
  checklistDefaults,
  listChecklistItems,
  listGbpSnapshots,
} from "@/lib/growth/local-growth-store";
import type { GbpSnapshotMetrics } from "@/lib/growth/snapshot";
import { prisma } from "@/lib/prisma";

export type LocalNextAction = {
  band: "NOW" | "NEXT" | "WATCH";
  code: string;
  title: string;
  why: string;
};

export type LocalGrowthDashboardModel = {
  version: typeof LOCAL_GROWTH_VERSION;
  performanceState: LocalPerformanceState;
  evidenceStrength: LocalEvidenceStrength;
  latestSnapshot: {
    id: string;
    periodStart: string;
    periodEnd: string;
    createdAt: string;
    metrics: GbpSnapshotMetrics;
  } | null;
  priorSnapshot: {
    id: string;
    metrics: GbpSnapshotMetrics;
  } | null;
  reviewVelocity: ReturnType<typeof reviewVelocityBetweenSnapshots>;
  checklist: {
    total: number;
    notReviewed: number;
    needsAttention: number;
    ok: number;
    mismatches: number;
    items: Array<{
      key: string;
      section: string;
      status: string;
      factMatch: string;
      observation: string | null;
      observedValue: string | null;
      observationSource: string | null;
    }>;
  };
  attribution: {
    audits: number;
    contacts: number;
    leads: number;
    opportunities: number;
    claimStrength: "ATTRIBUTED" | "OBSERVED" | "DIRECTIONAL" | "UNKNOWN";
  };
  experiments: {
    current: string;
    next: string;
    sequence: readonly string[];
  };
  content: {
    gbpSupportContent: typeof GBP_SUPPORT_CONTENT_SEED;
    magnoliaPage: typeof MAGNOLIA_LOCAL_PAGE_DECISION;
    websiteToGbp: typeof WEBSITE_TO_GBP_DECISION;
  };
  nextActions: LocalNextAction[];
  display: {
    profileViews: string;
    websiteClicks: string;
    callClicks: string;
    directionRequests: string;
    reviewCount: string;
    averageRating: string;
  };
};

function asMetrics(json: unknown): GbpSnapshotMetrics {
  if (!json || typeof json !== "object" || Array.isArray(json)) {
    return {};
  }
  return json as GbpSnapshotMetrics;
}

function daysBetween(a: Date, b: Date): number {
  return Math.round(Math.abs(b.getTime() - a.getTime()) / (24 * 60 * 60 * 1000));
}

function derivePerformanceState(input: {
  snapshotCount: number;
  checklistNeedsAttention: number;
  attributionAudits: number;
}): LocalPerformanceState {
  if (input.checklistNeedsAttention > 0) {
    return "REVIEW_REQUIRED";
  }
  if (input.snapshotCount === 0) {
    return "NO_DATA";
  }
  if (input.snapshotCount === 1) {
    return "BASELINE_ONLY";
  }
  if (input.attributionAudits > 0 || input.snapshotCount >= 3) {
    return "MONITORING";
  }
  return "EARLY_SIGNAL";
}

function deriveEvidenceStrength(input: {
  snapshotCount: number;
  attributionAudits: number;
}): LocalEvidenceStrength {
  if (input.snapshotCount === 0) {
    return "NONE";
  }
  if (input.attributionAudits >= 5 && input.snapshotCount >= 4) {
    return "MEANINGFUL";
  }
  if (input.attributionAudits > 0 || input.snapshotCount >= 3) {
    return "DIRECTIONAL";
  }
  return "WEAK";
}

export function buildLocalNextActions(input: {
  snapshotCount: number;
  notReviewed: number;
  needsAttention: number;
  mismatches: number;
  websiteUtmStatus: string | null;
  attributionAudits: number;
}): LocalNextAction[] {
  const actions: LocalNextAction[] = [];

  if (input.mismatches > 0 || input.needsAttention > 0) {
    actions.push({
      band: "NOW",
      code: "PROFILE_ACCURACY",
      title: "Resolve profile checklist issues",
      why: "GBP-001 requires accurate business representation before content volume experiments.",
    });
  }
  if (input.websiteUtmStatus !== "OK") {
    actions.push({
      band: "NOW",
      code: "WEBSITE_UTM",
      title: "Confirm canonical GBP website UTM",
      why: "GBP-002 makes website clicks first-party classifiable. Historical UNKNOWN stays UNKNOWN.",
    });
  }
  if (input.notReviewed > 0) {
    actions.push({
      band: "NOW",
      code: "CHECKLIST_BACKLOG",
      title: "Finish unanswered profile checklist items",
      why: `${input.notReviewed} item(s) remain NOT_REVIEWED.`,
    });
  }
  if (input.snapshotCount === 0) {
    actions.push({
      band: "NOW",
      code: "CAPTURE_BASELINE",
      title: "Capture first Local Growth baseline snapshot",
      why: "Blank = NOT_CAPTURED; 0 = observed zero. Do not invent metrics.",
    });
  }

  actions.push({
    band: "NEXT",
    code: "GBP_POST",
    title: "Publish next GBP post (manual)",
    why: "After profile + UTM hygiene, use Content Intelligence / GBP_POST plans — no auto-publish.",
  });
  if (input.snapshotCount > 0) {
    actions.push({
      band: "NEXT",
      code: "WEEKLY_SNAPSHOT",
      title: "Capture weekly lightweight GBP snapshot",
      why: "JS_SOLUTIONS_OPERATING_RULE — avoid daily obsession.",
    });
  }
  actions.push({
    band: "NEXT",
    code: "GBP_SUPPORT_CONTENT",
    title: GBP_SUPPORT_CONTENT_SEED.title,
    why: GBP_SUPPORT_CONTENT_SEED.note,
  });

  actions.push({
    band: "WATCH",
    code: "EARLY_ATTRIBUTION",
    title: "Watch GBP-tagged audits/contacts/leads",
    why: `ATTRIBUTED count so far (28d window context): ${input.attributionAudits}. Do not claim causation beyond evidence.`,
  });
  actions.push({
    band: "WATCH",
    code: "REVIEW_GROWTH",
    title: "Monitor review count / rating across snapshots",
    why: "Velocity is observational; tiny samples stay INSUFFICIENT_DATA.",
  });
  actions.push({
    band: "WATCH",
    code: "LOCAL_SEARCH_OPP",
    title: "Local search opportunities via Search Intelligence",
    why: "No doorway city pages. Magnolia page decision: TEST_LATER.",
  });

  return actions.slice(0, 10);
}

function isGbpAttributionJson(raw: unknown): boolean {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return false;
  }
  const rec = raw as Record<string, unknown>;
  const source = typeof rec.source === "string" ? rec.source.toLowerCase() : "";
  const medium = typeof rec.medium === "string" ? rec.medium.toLowerCase() : "";
  return (
    source === "google_business_profile" || medium === "organic_local"
  );
}

async function countGbpAttributed(windowStart: Date): Promise<{
  audits: number;
  contacts: number;
  leads: number;
}> {
  const [audits, contacts, leads] = await Promise.all([
    prisma.auditReport.findMany({
      where: { createdAt: { gte: windowStart } },
      select: { attributionJson: true },
      take: 500,
    }),
    prisma.contactSubmission.findMany({
      where: { createdAt: { gte: windowStart } },
      select: { attributionJson: true },
      take: 500,
    }),
    prisma.lead.findMany({
      where: { createdAt: { gte: windowStart } },
      select: { id: true },
      take: 500,
    }),
  ]);

  // Leads inherit channel via linked AuditReport / ContactSubmission — count audits+contacts primarily.
  const gbpAudits = audits.filter((r) =>
    isGbpAttributionJson(r.attributionJson),
  ).length;
  const gbpContacts = contacts.filter((r) =>
    isGbpAttributionJson(r.attributionJson),
  ).length;

  // Directional lead proxy: leads created in window that have a GBP-tagged audit.
  const gbpAuditLeadIds = new Set(
    (
      await prisma.auditReport.findMany({
        where: {
          createdAt: { gte: windowStart },
          leadId: { not: null },
        },
        select: { leadId: true, attributionJson: true },
        take: 500,
      })
    )
      .filter((r) => isGbpAttributionJson(r.attributionJson) && r.leadId)
      .map((r) => r.leadId as string),
  );
  const gbpLeads = leads.filter((l) => gbpAuditLeadIds.has(l.id)).length;

  return { audits: gbpAudits, contacts: gbpContacts, leads: gbpLeads };
}

export async function getLocalGrowthDashboardModel(): Promise<LocalGrowthDashboardModel> {
  const windowStart = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000);
  const [snapshots, checklistRows, gbpCounts] = await Promise.all([
    listGbpSnapshots(12),
    listChecklistItems(),
    countGbpAttributed(windowStart),
  ]);
  const gbpAudits = gbpCounts.audits;
  const gbpContacts = gbpCounts.contacts;
  const gbpLeads = gbpCounts.leads;

  const defaults = checklistDefaults();
  const byKey = new Map(checklistRows.map((r) => [r.itemKey, r]));
  const items = defaults.map((d) => {
    const row = byKey.get(d.key);
    return {
      key: d.key,
      section: d.section,
      status: row?.status ?? d.status,
      factMatch: row?.factMatch ?? d.factMatch,
      observation: row?.observation ?? null,
      observedValue: row?.observedValue ?? null,
      observationSource:
        (row as { observationSource?: string | null } | undefined)
          ?.observationSource ?? null,
    };
  });

  const notReviewed = items.filter((i) => i.status === "NOT_REVIEWED").length;
  const needsAttention = items.filter(
    (i) => i.status === "NEEDS_ATTENTION",
  ).length;
  const ok = items.filter((i) => i.status === "OK").length;
  const mismatches = items.filter((i) => i.factMatch === "MISMATCH").length;
  const websiteUtm = items.find((i) => i.key === "WEBSITE_UTM");

  const latest = snapshots[0] ?? null;
  const prior = snapshots[1] ?? null;
  const latestMetrics = latest ? asMetrics(latest.metricsJson) : null;
  const priorMetrics = prior ? asMetrics(prior.metricsJson) : null;

  const velocity = reviewVelocityBetweenSnapshots({
    currentReviewCount: latestMetrics?.reviewCount ?? null,
    priorReviewCount: priorMetrics?.reviewCount ?? null,
    daysBetween:
      latest && prior ? daysBetween(prior.createdAt, latest.createdAt) : null,
  });

  const attributionAudits = typeof gbpAudits === "number" ? gbpAudits : 0;
  const attributionContacts =
    typeof gbpContacts === "number" ? gbpContacts : 0;
  const attributionLeads = typeof gbpLeads === "number" ? gbpLeads : 0;

  const claimStrength =
    attributionAudits + attributionContacts + attributionLeads === 0
      ? ("UNKNOWN" as const)
      : attributionAudits + attributionContacts + attributionLeads >= 5
        ? ("ATTRIBUTED" as const)
        : ("DIRECTIONAL" as const);

  const nextActions = buildLocalNextActions({
    snapshotCount: snapshots.length,
    notReviewed,
    needsAttention,
    mismatches,
    websiteUtmStatus: websiteUtm?.status ?? null,
    attributionAudits,
  });

  return {
    version: LOCAL_GROWTH_VERSION,
    performanceState: derivePerformanceState({
      snapshotCount: snapshots.length,
      checklistNeedsAttention: needsAttention + mismatches,
      attributionAudits,
    }),
    evidenceStrength: deriveEvidenceStrength({
      snapshotCount: snapshots.length,
      attributionAudits,
    }),
    latestSnapshot: latest
      ? {
          id: latest.id,
          periodStart: latest.periodStart.toISOString(),
          periodEnd: latest.periodEnd.toISOString(),
          createdAt: latest.createdAt.toISOString(),
          metrics: latestMetrics ?? {},
        }
      : null,
    priorSnapshot: prior
      ? { id: prior.id, metrics: priorMetrics ?? {} }
      : null,
    reviewVelocity: velocity,
    checklist: {
      total: items.length,
      notReviewed,
      needsAttention,
      ok,
      mismatches,
      items,
    },
    attribution: {
      audits: attributionAudits,
      contacts: attributionContacts,
      leads: attributionLeads,
      opportunities: 0,
      claimStrength,
    },
    experiments: {
      current: currentGbpExperimentId(),
      next: nextGbpExperimentId(),
      sequence: GBP_EXPERIMENT_SEQUENCE,
    },
    content: {
      gbpSupportContent: GBP_SUPPORT_CONTENT_SEED,
      magnoliaPage: MAGNOLIA_LOCAL_PAGE_DECISION,
      websiteToGbp: WEBSITE_TO_GBP_DECISION,
    },
    nextActions,
    display: {
      profileViews: formatLocalMetricDisplay(latestMetrics?.profileViews),
      websiteClicks: formatLocalMetricDisplay(latestMetrics?.websiteClicks),
      callClicks: formatLocalMetricDisplay(latestMetrics?.callClicks),
      directionRequests: formatLocalMetricDisplay(
        latestMetrics?.directionRequests,
      ),
      reviewCount: formatLocalMetricDisplay(latestMetrics?.reviewCount),
      averageRating:
        latestMetrics?.averageRating == null
          ? "NOT_CAPTURED"
          : String(latestMetrics.averageRating),
    },
  };
}

/** Compact card payload for /reports/growth — side-effect budget 0. */
export async function getLocalGrowthCompactCard() {
  try {
    const model = await getLocalGrowthDashboardModel();
    const metrics = model.latestSnapshot?.metrics ?? null;
    return {
      version: LOCAL_GROWTH_VERSION,
      hasSnapshot: !!model.latestSnapshot,
      reviewCount: formatLocalMetricDisplay(metrics?.reviewCount),
      averageRating:
        metrics?.averageRating == null
          ? "NOT_CAPTURED"
          : String(metrics.averageRating),
      websiteClicks: formatLocalMetricDisplay(metrics?.websiteClicks),
      attributedAudits: model.attribution.audits,
      attributedLeads: model.attribution.leads,
      profileIssues: model.checklist.needsAttention + model.checklist.mismatches,
      activeExperiment: model.experiments.current,
      performanceState: model.performanceState,
    };
  } catch {
    return {
      version: LOCAL_GROWTH_VERSION,
      hasSnapshot: false,
      reviewCount: "NOT_CAPTURED",
      averageRating: "NOT_CAPTURED",
      websiteClicks: "NOT_CAPTURED",
      attributedAudits: 0,
      attributedLeads: 0,
      profileIssues: 0,
      activeExperiment: "GBP-001",
      performanceState: "NO_DATA" as const,
    };
  }
}
