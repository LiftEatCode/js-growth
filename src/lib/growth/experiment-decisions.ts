import "server-only";

import {
  GROWTH_EXPERIMENT_DECISIONS,
  isGrowthExperimentDecisionKind,
  type GrowthExperimentDecisionKind,
} from "@/lib/growth/facebook-execution";
import { prisma } from "@/lib/prisma";

export async function createGrowthExperimentDecision(input: {
  experimentId: string;
  hypothesis?: string;
  primaryMetric?: string;
  secondaryMetrics?: string;
  observations: string;
  sampleSize?: number | null;
  result?: string;
  confidence?: string;
  decision: GrowthExperimentDecisionKind;
  createdByEmail: string;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const experimentId = input.experimentId.trim();
  if (!/^[0-9]{4}-[0-9]{3}$/.test(experimentId)) {
    return { ok: false, error: "experimentId must look like 2026-012" };
  }
  if (!isGrowthExperimentDecisionKind(input.decision)) {
    return { ok: false, error: "Invalid decision" };
  }
  if (!input.observations.trim() || input.observations.trim().length > 4000) {
    return { ok: false, error: "observations required (max 4000)" };
  }
  if (
    input.sampleSize != null &&
    (!Number.isInteger(input.sampleSize) || input.sampleSize < 0)
  ) {
    return { ok: false, error: "sampleSize must be a non-negative integer" };
  }

  try {
    const created = await prisma.growthExperimentDecision.create({
      data: {
        experimentId,
        hypothesis: input.hypothesis?.trim().slice(0, 1000) || null,
        primaryMetric: input.primaryMetric?.trim().slice(0, 120) || null,
        secondaryMetrics: input.secondaryMetrics?.trim().slice(0, 500) || null,
        observations: input.observations.trim().slice(0, 4000),
        sampleSize: input.sampleSize ?? null,
        result: input.result?.trim().slice(0, 2000) || null,
        confidence: input.confidence?.trim().slice(0, 20) || null,
        decision: input.decision,
        createdByEmail: input.createdByEmail,
      },
    });
    return { ok: true, id: created.id };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to save experiment decision",
    };
  }
}

export async function listGrowthExperimentDecisions(limit = 20) {
  return prisma.growthExperimentDecision.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export { GROWTH_EXPERIMENT_DECISIONS };
