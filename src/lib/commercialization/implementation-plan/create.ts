import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { loadLatestCompetitiveComparison } from "@/lib/competitive-intelligence/comparison/load";
import { prisma } from "@/lib/prisma";
import type { WebsiteAuditResult } from "@/lib/website-audit/types";

import { SERVICE_CAPABILITY_VERSION } from "../capabilities/types";
import {
  IMPLEMENTATION_MAPPING_VERSION,
  IMPLEMENTATION_PLAN_VERSION,
} from "./constants";
import { serializeFingerprint } from "./fingerprint";
import { generateImplementationPlanFromEvidence } from "./generate";
import { computeCurrentPlanFingerprint } from "./staleness";
import type { GeneratedWorkstream } from "./types";

export type CreatePlanErrorCode =
  | "not_found"
  | "missing_audit"
  | "unauthorized";

function workstreamCreateData(
  planId: string,
  row: GeneratedWorkstream,
): Prisma.ImplementationPlanWorkstreamCreateManyInput {
  return {
    implementationPlanId: planId,
    workstreamType: row.workstreamType,
    priority: row.priority,
    priorityScore: row.priorityScore,
    title: row.title,
    summary: row.summary,
    sortOrder: row.sortOrder,
    removed: false,
    capabilitiesJson: row.capabilities as unknown as Prisma.InputJsonValue,
    evidenceJson: row.evidence as unknown as Prisma.InputJsonValue,
    actionsJson: row.actions as unknown as Prisma.InputJsonValue,
    preservationConstraintsJson:
      row.preservationConstraints as unknown as Prisma.InputJsonValue,
  };
}

export async function createImplementationPlanSnapshot(options: {
  campaignId: string;
  prospectId: string;
  createdByEmail: string;
}): Promise<
  | { ok: true; planId: string; workstreamCount: number }
  | { ok: false; code: CreatePlanErrorCode; message: string }
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
      code: "missing_audit",
      message:
        "This prospect does not have a Website Growth Audit yet. Run Audit & Qualify first.",
    };
  }

  const audit = report.audit as unknown as WebsiteAuditResult;
  const comparisonLoad = await loadLatestCompetitiveComparison({
    campaignId: options.campaignId,
    prospectId: options.prospectId,
  });

  const useCompetitive =
    Boolean(comparisonLoad.snapshot) && !comparisonLoad.stale;

  const generated = generateImplementationPlanFromEvidence({
    audit,
    auditReportId: report.id,
    comparison: useCompetitive ? comparisonLoad.snapshot!.comparison : null,
    comparisonSnapshotId: useCompetitive
      ? comparisonLoad.snapshot!.id
      : null,
    useCompetitiveEvidence: useCompetitive,
  });

  const fingerprint = computeCurrentPlanFingerprint({
    auditReportId: report.id,
    currentComparisonSnapshotId: useCompetitive
      ? comparisonLoad.snapshot!.id
      : null,
  });

  const result = await prisma.$transaction(async (tx) => {
    // Supersede prior non-superseded plans for this prospect+campaign
    await tx.implementationPlan.updateMany({
      where: {
        prospectId: options.prospectId,
        campaignId: options.campaignId,
        status: { in: ["DRAFT", "REVIEWED", "APPROVED"] },
      },
      data: {
        status: "SUPERSEDED",
        supersededAt: new Date(),
      },
    });

    const plan = await tx.implementationPlan.create({
      data: {
        prospectId: options.prospectId,
        campaignId: options.campaignId,
        leadId: prospect.leadId,
        auditReportId: report.id,
        comparisonSnapshotId: generated.comparisonSnapshotId,
        status: "DRAFT",
        planVersion: IMPLEMENTATION_PLAN_VERSION,
        mappingVersion: IMPLEMENTATION_MAPPING_VERSION,
        capabilityVersion: SERVICE_CAPABILITY_VERSION,
        inputFingerprint: serializeFingerprint(fingerprint),
        competitiveEvidenceUsed: generated.competitiveEvidenceUsed,
        createdByEmail: options.createdByEmail,
      },
    });

    if (generated.workstreams.length > 0) {
      await tx.implementationPlanWorkstream.createMany({
        data: generated.workstreams.map((row) =>
          workstreamCreateData(plan.id, row),
        ),
      });
    }

    return plan;
  });

  return {
    ok: true,
    planId: result.id,
    workstreamCount: generated.workstreams.length,
  };
}
