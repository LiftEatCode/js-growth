import "server-only";

import { loadLatestCompetitiveComparison } from "@/lib/competitive-intelligence/comparison/load";
import { loadLatestCompetitiveInterpretation } from "@/lib/competitive-intelligence/interpretation/load";
import type { CompetitiveInterpretationContent } from "@/lib/competitive-intelligence/interpretation/types";
import { prisma } from "@/lib/prisma";

import { buildCompetitiveGrowthReport } from "./build-report";
import { getCompetitiveReportReadiness } from "./readiness";
import type {
  CompetitiveGrowthReportViewModel,
  CompetitiveReportReadiness,
} from "./types";

export async function loadCompetitiveGrowthReport(options: {
  campaignId: string;
  prospectId: string;
}): Promise<{
  readiness: CompetitiveReportReadiness;
  report: CompetitiveGrowthReportViewModel | null;
  prospectBusinessName: string | null;
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
        select: {
          id: true,
          businessName: true,
          city: true,
          state: true,
          auditReportId: true,
        },
      },
      campaign: {
        select: {
          locationLabel: true,
        },
      },
    },
  });

  if (!membership) {
    return {
      readiness: getCompetitiveReportReadiness({
        hasTargetAudit: false,
        hasComparison: false,
        comparisonStale: false,
        hasCompletedInterpretation: false,
        interpretationStale: false,
        interpretationMatchesComparison: false,
      }),
      report: null,
      prospectBusinessName: null,
    };
  }

  const prospect = membership.prospect;
  const comparisonState = await loadLatestCompetitiveComparison({
    campaignId: options.campaignId,
    prospectId: options.prospectId,
  });

  const interpretationState = await loadLatestCompetitiveInterpretation({
    campaignId: options.campaignId,
    prospectId: options.prospectId,
    currentComparisonSnapshotId: comparisonState.snapshot?.id ?? null,
    currentComparison: comparisonState.snapshot?.comparison ?? null,
    targetBusinessName: prospect.businessName,
  });

  const interpretation = interpretationState.interpretation;
  const interpretationMatchesComparison = Boolean(
    interpretation &&
      comparisonState.snapshot &&
      interpretation.comparisonSnapshotId === comparisonState.snapshot.id &&
      interpretation.status === "COMPLETED" &&
      interpretation.content,
  );

  const readiness = getCompetitiveReportReadiness({
    hasTargetAudit: Boolean(prospect.auditReportId),
    hasComparison: Boolean(comparisonState.snapshot),
    comparisonStale: comparisonState.stale,
    comparisonStaleReasons: comparisonState.staleReasons,
    hasCompletedInterpretation: Boolean(
      interpretation?.status === "COMPLETED" && interpretation.content,
    ),
    interpretationStale: interpretationState.stale,
    interpretationStaleReasons: interpretationState.staleReasons,
    interpretationMatchesComparison,
  });

  if (!readiness.ready || !comparisonState.snapshot || !interpretation?.content) {
    return {
      readiness,
      report: null,
      prospectBusinessName: prospect.businessName,
    };
  }

  const locationParts = [prospect.city, prospect.state].filter(Boolean);
  const locationLabel =
    locationParts.length > 0
      ? locationParts.join(", ")
      : membership.campaign.locationLabel;

  const report = buildCompetitiveGrowthReport({
    businessName: prospect.businessName,
    locationLabel,
    analysisDate:
      interpretation.completedAt ??
      comparisonState.snapshot.createdAt ??
      new Date(),
    comparison: comparisonState.snapshot.comparison,
    interpretation: interpretation.content as CompetitiveInterpretationContent,
  });

  return {
    readiness,
    report,
    prospectBusinessName: prospect.businessName,
  };
}
