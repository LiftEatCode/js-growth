import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { COMPETITOR_AUDIT_ENGINE_VERSION } from "@/lib/competitive-intelligence/audits/constants";
import { prisma } from "@/lib/prisma";
import { AUDIT_REPORT_VERSION } from "@/lib/website-audit/storage/types";
import type { WebsiteAuditResult } from "@/lib/website-audit/types";

import { buildCompetitiveComparison } from "./compare";
import {
  COMPETITIVE_COMPARISON_VERSION,
  MAX_COMPETITORS_COMPARED,
} from "./constants";
import {
  buildComparisonFingerprint,
  type ComparisonFingerprint,
  fingerprintsMatch,
} from "./fingerprint";
import { normalizeStoredAuditJson } from "./normalize";
import type {
  ComparisonCompetitorInput,
  CompetitiveComparison,
} from "./types";

export type ComparisonLoadErrorCode =
  | "missing_target_audit"
  | "incompatible_target_audit"
  | "no_compatible_competitor_audits"
  | "not_found";

export type { ComparisonFingerprint };
export { buildComparisonFingerprint, fingerprintsMatch };

export async function loadComparisonInputs(options: {
  campaignId: string;
  prospectId: string;
}): Promise<
  | {
      ok: true;
      targetLabel: string;
      auditReportId: string;
      targetAuditEngineVersion: number;
      target: NonNullable<ReturnType<typeof normalizeStoredAuditJson>>;
      competitors: ComparisonCompetitorInput[];
      fingerprint: ComparisonFingerprint;
      skippedCompetitors: Array<{
        prospectCompetitorId: string;
        businessName: string;
        reason: string;
      }>;
    }
  | { ok: false; code: ComparisonLoadErrorCode; message: string }
> {
  const membership = await prisma.campaignProspect.findUnique({
    where: {
      campaignId_prospectId: {
        campaignId: options.campaignId,
        prospectId: options.prospectId,
      },
    },
    include: {
      prospect: {
        include: {
          auditReport: true,
          competitors: {
            where: { status: "SELECTED" },
            orderBy: [{ validationScore: "desc" }, { businessName: "asc" }],
            take: MAX_COMPETITORS_COMPARED,
            include: {
              audits: {
                where: { status: "COMPLETED" },
                orderBy: [{ completedAt: "desc" }, { createdAt: "desc" }],
                take: 5,
              },
            },
          },
        },
      },
    },
  });

  if (!membership) {
    return {
      ok: false,
      code: "not_found",
      message: "The prospect is not in this campaign.",
    };
  }

  const prospect = membership.prospect;
  const report = prospect.auditReport;

  if (!report) {
    return {
      ok: false,
      code: "missing_target_audit",
      message:
        "This prospect does not have a Website Growth Audit yet. Run Audit & Qualify first.",
    };
  }

  if (report.version !== AUDIT_REPORT_VERSION) {
    return {
      ok: false,
      code: "incompatible_target_audit",
      message:
        "The prospect audit uses an incompatible audit engine version and cannot be compared.",
    };
  }

  const target = normalizeStoredAuditJson(
    report.audit,
    report.version,
    report.overallScore,
  );

  if (!target) {
    return {
      ok: false,
      code: "missing_target_audit",
      message: "The prospect audit payload could not be read.",
    };
  }

  const skippedCompetitors: Array<{
    prospectCompetitorId: string;
    businessName: string;
    reason: string;
  }> = [];
  const competitors: ComparisonCompetitorInput[] = [];

  for (const competitor of prospect.competitors) {
    const compatible = competitor.audits.find(
      (audit) =>
        audit.status === "COMPLETED" &&
        audit.auditEngineVersion === COMPETITOR_AUDIT_ENGINE_VERSION &&
        audit.auditEngineVersion === report.version,
    );

    if (!compatible) {
      skippedCompetitors.push({
        prospectCompetitorId: competitor.id,
        businessName: competitor.businessName,
        reason: competitor.audits.length
          ? "No compatible COMPLETED competitor audit (engine version or payload)."
          : "No COMPLETED competitor website audit yet.",
      });
      continue;
    }

    const audit = normalizeStoredAuditJson(
      compatible.auditResultJson,
      compatible.auditEngineVersion,
      compatible.overallScore,
    );

    if (!audit) {
      skippedCompetitors.push({
        prospectCompetitorId: competitor.id,
        businessName: competitor.businessName,
        reason: "Competitor audit payload could not be read.",
      });
      continue;
    }

    competitors.push({
      prospectCompetitorId: competitor.id,
      competitorAuditId: compatible.id,
      businessName: competitor.businessName,
      website: competitor.website,
      competitiveRelevanceScore: competitor.validationScore,
      distanceMiles: competitor.distanceMiles,
      auditedAt: compatible.completedAt?.toISOString() ?? null,
      audit,
    });
  }

  if (competitors.length === 0) {
    return {
      ok: false,
      code: "no_compatible_competitor_audits",
      message:
        "No selected competitors have a compatible COMPLETED website audit. Audit selected competitors first.",
    };
  }

  const fingerprint = buildComparisonFingerprint({
    auditReportId: report.id,
    auditEngineVersion: report.version,
    selectedCompetitorIds: prospect.competitors.map((row) => row.id),
    competitorAuditIds: competitors.map((row) => row.competitorAuditId),
  });

  return {
    ok: true,
    targetLabel: prospect.businessName,
    auditReportId: report.id,
    targetAuditEngineVersion: report.version,
    target,
    competitors,
    fingerprint,
    skippedCompetitors,
  };
}

export async function generateCompetitiveComparisonSnapshot(options: {
  campaignId: string;
  prospectId: string;
  createdByEmail: string;
}): Promise<
  | {
      ok: true;
      snapshotId: string;
      comparison: CompetitiveComparison;
      stale: false;
      skippedCompetitors: Array<{
        prospectCompetitorId: string;
        businessName: string;
        reason: string;
      }>;
    }
  | { ok: false; code: ComparisonLoadErrorCode; message: string }
> {
  const loaded = await loadComparisonInputs(options);

  if (!loaded.ok) {
    return loaded;
  }

  const comparison = buildCompetitiveComparison({
    prospectId: options.prospectId,
    campaignId: options.campaignId,
    auditReportId: loaded.auditReportId,
    targetLabel: loaded.targetLabel,
    target: loaded.target,
    competitors: loaded.competitors,
  });

  const snapshot = await prisma.competitiveComparisonSnapshot.create({
    data: {
      prospectId: options.prospectId,
      campaignId: options.campaignId,
      auditReportId: loaded.auditReportId,
      auditEngineVersion: loaded.targetAuditEngineVersion,
      comparisonVersion: COMPETITIVE_COMPARISON_VERSION,
      comparisonJson: comparison as unknown as Prisma.InputJsonValue,
      competitorAuditIdsJson: loaded.fingerprint
        .competitorAuditIds as unknown as Prisma.InputJsonValue,
      selectedCompetitorIdsJson: loaded.fingerprint
        .selectedCompetitorIds as unknown as Prisma.InputJsonValue,
      createdByEmail: options.createdByEmail,
    },
  });

  return {
    ok: true,
    snapshotId: snapshot.id,
    comparison,
    stale: false,
    skippedCompetitors: loaded.skippedCompetitors,
  };
}

export async function loadLatestCompetitiveComparison(options: {
  campaignId: string;
  prospectId: string;
}): Promise<{
  snapshot: {
    id: string;
    createdAt: Date;
    createdByEmail: string;
    comparison: CompetitiveComparison;
  } | null;
  stale: boolean;
  staleReasons: string[];
  canGenerate: boolean;
  generateBlocker: string | null;
  skippedCompetitors: Array<{
    prospectCompetitorId: string;
    businessName: string;
    reason: string;
  }>;
}> {
  const loaded = await loadComparisonInputs(options);
  const latest = await prisma.competitiveComparisonSnapshot.findFirst({
    where: {
      prospectId: options.prospectId,
      campaignId: options.campaignId,
    },
    orderBy: { createdAt: "desc" },
  });

  if (!loaded.ok) {
    return {
      snapshot: latest
        ? {
            id: latest.id,
            createdAt: latest.createdAt,
            createdByEmail: latest.createdByEmail,
            comparison: latest.comparisonJson as unknown as CompetitiveComparison,
          }
        : null,
      stale: Boolean(latest),
      staleReasons: latest
        ? [loaded.message]
        : [],
      canGenerate: false,
      generateBlocker: loaded.message,
      skippedCompetitors: [],
    };
  }

  if (!latest) {
    return {
      snapshot: null,
      stale: false,
      staleReasons: [],
      canGenerate: true,
      generateBlocker: null,
      skippedCompetitors: loaded.skippedCompetitors,
    };
  }

  const storedFingerprint = buildComparisonFingerprint({
    auditReportId: latest.auditReportId,
    auditEngineVersion: latest.auditEngineVersion,
    selectedCompetitorIds: Array.isArray(latest.selectedCompetitorIdsJson)
      ? (latest.selectedCompetitorIdsJson as string[])
      : [],
    competitorAuditIds: Array.isArray(latest.competitorAuditIdsJson)
      ? (latest.competitorAuditIdsJson as string[])
      : [],
  });

  // Also stale if comparison algorithm version on the row differs.
  const algorithmStale =
    latest.comparisonVersion !== COMPETITIVE_COMPARISON_VERSION;

  const currentFingerprint = {
    ...loaded.fingerprint,
    comparisonVersion: COMPETITIVE_COMPARISON_VERSION,
  };

  const staleReasons: string[] = [];

  if (algorithmStale) {
    staleReasons.push("Comparison algorithm version has changed.");
  }

  if (storedFingerprint.auditReportId !== currentFingerprint.auditReportId) {
    staleReasons.push("Prospect Website Growth Audit has changed.");
  }

  if (
    storedFingerprint.auditEngineVersion !== currentFingerprint.auditEngineVersion
  ) {
    staleReasons.push("Audit engine version has changed.");
  }

  if (
    storedFingerprint.selectedCompetitorIds.join("|") !==
    currentFingerprint.selectedCompetitorIds.join("|")
  ) {
    staleReasons.push("Selected competitors have changed.");
  }

  if (
    storedFingerprint.competitorAuditIds.join("|") !==
    currentFingerprint.competitorAuditIds.join("|")
  ) {
    staleReasons.push("Competitor website audits have changed.");
  }

  return {
    snapshot: {
      id: latest.id,
      createdAt: latest.createdAt,
      createdByEmail: latest.createdByEmail,
      comparison: latest.comparisonJson as unknown as CompetitiveComparison,
    },
    stale: staleReasons.length > 0,
    staleReasons,
    canGenerate: true,
    generateBlocker: null,
    skippedCompetitors: loaded.skippedCompetitors,
  };
}

export type { WebsiteAuditResult };
