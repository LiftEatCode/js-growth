import "server-only";

import { loadLatestCompetitiveComparison } from "@/lib/competitive-intelligence/comparison/load";
import { prisma } from "@/lib/prisma";

import type { ServiceCapabilityId } from "../capabilities/types";
import { serializeFingerprint } from "./fingerprint";
import {
  computeCurrentPlanFingerprint,
  evaluatePlanStaleness,
} from "./staleness";
import type {
  ImplementationPlanFingerprint,
  ImplementationPriority,
  PlanEvidenceItem,
  PreservationConstraint,
  RecommendedAction,
} from "./types";
import type { WorkstreamType } from "./constants";

export interface LoadedPlanWorkstream {
  id: string;
  workstreamType: WorkstreamType;
  priority: ImplementationPriority;
  priorityScore: number;
  title: string;
  summary: string;
  sortOrder: number;
  removed: boolean;
  operatorNote: string | null;
  capabilities: ServiceCapabilityId[];
  evidence: PlanEvidenceItem[];
  actions: RecommendedAction[];
  preservationConstraints: PreservationConstraint[];
}

export interface LoadedImplementationPlan {
  id: string;
  status: "DRAFT" | "REVIEWED" | "APPROVED" | "SUPERSEDED";
  createdAt: Date;
  updatedAt: Date;
  auditReportId: string;
  comparisonSnapshotId: string | null;
  competitiveEvidenceUsed: boolean;
  planVersion: number;
  mappingVersion: number;
  capabilityVersion: number;
  inputFingerprint: string;
  approvedAt: Date | null;
  approvedByEmail: string | null;
  createdByEmail: string;
  operatorNotes: string | null;
  workstreams: LoadedPlanWorkstream[];
}

function parseFingerprint(raw: string): ImplementationPlanFingerprint | null {
  try {
    const parsed = JSON.parse(raw) as ImplementationPlanFingerprint;
    if (
      typeof parsed.auditReportId !== "string" ||
      typeof parsed.planVersion !== "number"
    ) {
      return null;
    }
    return {
      auditReportId: parsed.auditReportId,
      comparisonSnapshotId: parsed.comparisonSnapshotId ?? null,
      planVersion: parsed.planVersion,
      mappingVersion: parsed.mappingVersion,
      capabilityVersion: parsed.capabilityVersion,
    };
  } catch {
    return null;
  }
}

export async function loadLatestImplementationPlan(options: {
  campaignId: string;
  prospectId: string;
}): Promise<{
  plan: LoadedImplementationPlan | null;
  stale: boolean;
  staleReasons: string[];
  canGenerate: boolean;
  generateBlocker: string | null;
}> {
  const membership = await prisma.campaignProspect.findUnique({
    where: {
      campaignId_prospectId: {
        campaignId: options.campaignId,
        prospectId: options.prospectId,
      },
    },
    include: {
      prospect: {
        select: { auditReportId: true },
      },
    },
  });

  if (!membership) {
    return {
      plan: null,
      stale: false,
      staleReasons: [],
      canGenerate: false,
      generateBlocker: "The prospect is not in this campaign.",
    };
  }

  const auditReportId = membership.prospect.auditReportId;

  if (!auditReportId) {
    return {
      plan: null,
      stale: false,
      staleReasons: [],
      canGenerate: false,
      generateBlocker:
        "This prospect does not have a Website Growth Audit yet. Run Audit & Qualify first.",
    };
  }

  const comparisonLoad = await loadLatestCompetitiveComparison({
    campaignId: options.campaignId,
    prospectId: options.prospectId,
  });

  const currentComparisonSnapshotId =
    comparisonLoad.snapshot && !comparisonLoad.stale
      ? comparisonLoad.snapshot.id
      : null;

  const currentFingerprint = computeCurrentPlanFingerprint({
    auditReportId,
    currentComparisonSnapshotId,
  });

  const latest = await prisma.implementationPlan.findFirst({
    where: {
      prospectId: options.prospectId,
      campaignId: options.campaignId,
      status: { not: "SUPERSEDED" },
    },
    orderBy: { createdAt: "desc" },
    include: {
      workstreams: {
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  if (!latest) {
    return {
      plan: null,
      stale: false,
      staleReasons: [],
      canGenerate: true,
      generateBlocker: null,
    };
  }

  const stored =
    parseFingerprint(latest.inputFingerprint) ??
    computeCurrentPlanFingerprint({
      auditReportId: latest.auditReportId,
      currentComparisonSnapshotId: latest.comparisonSnapshotId,
    });

  const staleness = evaluatePlanStaleness({
    stored,
    current: currentFingerprint,
  });

  const plan: LoadedImplementationPlan = {
    id: latest.id,
    status: latest.status,
    createdAt: latest.createdAt,
    updatedAt: latest.updatedAt,
    auditReportId: latest.auditReportId,
    comparisonSnapshotId: latest.comparisonSnapshotId,
    competitiveEvidenceUsed: latest.competitiveEvidenceUsed,
    planVersion: latest.planVersion,
    mappingVersion: latest.mappingVersion,
    capabilityVersion: latest.capabilityVersion,
    inputFingerprint: latest.inputFingerprint,
    approvedAt: latest.approvedAt,
    approvedByEmail: latest.approvedByEmail,
    createdByEmail: latest.createdByEmail,
    operatorNotes: latest.operatorNotes,
    workstreams: latest.workstreams.map((row) => ({
      id: row.id,
      workstreamType: row.workstreamType as WorkstreamType,
      priority: row.priority as ImplementationPriority,
      priorityScore: row.priorityScore,
      title: row.title,
      summary: row.summary,
      sortOrder: row.sortOrder,
      removed: row.removed,
      operatorNote: row.operatorNote,
      capabilities: row.capabilitiesJson as unknown as ServiceCapabilityId[],
      evidence: row.evidenceJson as unknown as PlanEvidenceItem[],
      actions: row.actionsJson as unknown as RecommendedAction[],
      preservationConstraints:
        row.preservationConstraintsJson as unknown as PreservationConstraint[],
    })),
  };

  return {
    plan,
    stale: staleness.stale,
    staleReasons: staleness.reasons,
    canGenerate: true,
    generateBlocker: null,
  };
}

export { serializeFingerprint };
