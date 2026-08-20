import "server-only";

import type { LoadedImplementationPlan } from "@/lib/commercialization/implementation-plan/load";
import { prisma } from "@/lib/prisma";
import { getOpenAiAuditModel } from "@/lib/website-audit/ai-interpretation/config";

import {
  IMPLEMENTATION_INTERPRETATION_PROMPT_VERSION,
  IMPLEMENTATION_INTERPRETATION_VERSION,
} from "./constants";
import { fingerprintImplementationAiInput } from "./fingerprint";
import { buildImplementationAiInput } from "./input";
import { evaluateImplementationInterpretationStaleness } from "./staleness";
import type {
  ImplementationInterpretationContent,
  ImplementationInterpretationFailureCode,
} from "./types";

export async function loadLatestImplementationInterpretation(options: {
  campaignId: string;
  prospectId: string;
  plan: LoadedImplementationPlan | null;
  planStale: boolean;
  businessName: string;
  location: string | null;
}): Promise<{
  interpretation: {
    id: string;
    status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";
    implementationPlanId: string;
    createdAt: Date;
    completedAt: Date | null;
    failedAt: Date | null;
    failureCode: ImplementationInterpretationFailureCode | null;
    failureMessage: string | null;
    model: string | null;
    promptVersion: number;
    interpretationVersion: number;
    content: ImplementationInterpretationContent | null;
    inputFingerprint: string;
  } | null;
  latestFailure: {
    id: string;
    failureCode: string | null;
    failureMessage: string | null;
    failedAt: Date | null;
  } | null;
  stale: boolean;
  staleReasons: string[];
  canGenerate: boolean;
  generateBlocker: string | null;
  reusableExists: boolean;
}> {
  const [completed, latestAny] = await Promise.all([
    prisma.implementationPlanInterpretation.findFirst({
      where: {
        prospectId: options.prospectId,
        campaignId: options.campaignId,
        status: "COMPLETED",
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.implementationPlanInterpretation.findFirst({
      where: {
        prospectId: options.prospectId,
        campaignId: options.campaignId,
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const latestFailure =
    latestAny?.status === "FAILED"
      ? {
          id: latestAny.id,
          failureCode: latestAny.failureCode,
          failureMessage: latestAny.failureMessage,
          failedAt: latestAny.failedAt,
        }
      : null;

  const mapCompleted = () => {
    if (!completed) {
      return null;
    }
    const content =
      completed.interpretationJson as unknown as ImplementationInterpretationContent | null;
    return {
      id: completed.id,
      status: completed.status,
      implementationPlanId: completed.implementationPlanId,
      createdAt: completed.createdAt,
      completedAt: completed.completedAt,
      failedAt: completed.failedAt,
      failureCode:
        completed.failureCode as ImplementationInterpretationFailureCode | null,
      failureMessage: completed.failureMessage,
      model: completed.model,
      promptVersion: completed.promptVersion,
      interpretationVersion: completed.interpretationVersion,
      content:
        completed.status === "COMPLETED" && content ? content : null,
      inputFingerprint: completed.inputFingerprint,
    };
  };

  if (!options.plan) {
    return {
      interpretation: mapCompleted(),
      latestFailure,
      stale: Boolean(completed),
      staleReasons: completed
        ? ["No current Implementation Plan is available."]
        : [],
      canGenerate: false,
      generateBlocker:
        "Generate an Implementation Plan before requesting an AI strategy.",
      reusableExists: false,
    };
  }

  if (options.plan.status === "SUPERSEDED") {
    return {
      interpretation: mapCompleted(),
      latestFailure,
      stale: Boolean(completed),
      staleReasons: completed
        ? ["Implementation Plan was superseded."]
        : [],
      canGenerate: false,
      generateBlocker: "Rebuild the Implementation Plan first.",
      reusableExists: false,
    };
  }

  const activeCount = options.plan.workstreams.filter((row) => !row.removed)
    .length;

  if (activeCount === 0) {
    return {
      interpretation: mapCompleted(),
      latestFailure,
      stale: Boolean(completed),
      staleReasons: completed
        ? ["The Implementation Plan has no active workstreams."]
        : [],
      canGenerate: false,
      generateBlocker: "The Implementation Plan has no active workstreams.",
      reusableExists: false,
    };
  }

  if (options.planStale) {
    return {
      interpretation: mapCompleted(),
      latestFailure,
      stale: true,
      staleReasons: [
        "The Implementation Plan is stale. Rebuild it before regenerating AI strategy.",
      ],
      canGenerate: false,
      generateBlocker:
        "The Implementation Plan is stale. Rebuild it before generating an AI strategy.",
      reusableExists: false,
    };
  }

  const model = getOpenAiAuditModel();
  const aiInput = buildImplementationAiInput({
    plan: options.plan,
    businessName: options.businessName,
    location: options.location,
  });
  const currentFingerprint = fingerprintImplementationAiInput({
    input: aiInput,
    model,
  });

  const reusableExists = Boolean(
    await prisma.implementationPlanInterpretation.findFirst({
      where: {
        implementationPlanId: options.plan.id,
        status: "COMPLETED",
        interpretationVersion: IMPLEMENTATION_INTERPRETATION_VERSION,
        promptVersion: IMPLEMENTATION_INTERPRETATION_PROMPT_VERSION,
        model,
        inputFingerprint: currentFingerprint,
      },
      select: { id: true },
    }),
  );

  if (!completed) {
    return {
      interpretation: null,
      latestFailure,
      stale: false,
      staleReasons: [],
      canGenerate: true,
      generateBlocker: null,
      reusableExists,
    };
  }

  const staleness = evaluateImplementationInterpretationStaleness({
    interpretation: {
      implementationPlanId: completed.implementationPlanId,
      interpretationVersion: completed.interpretationVersion,
      promptVersion: completed.promptVersion,
      planVersion: completed.planVersion,
      mappingVersion: completed.mappingVersion,
      model: completed.model,
      inputFingerprint: completed.inputFingerprint,
    },
    currentImplementationPlanId: options.plan.id,
    currentPlanVersion: options.plan.planVersion,
    currentMappingVersion: options.plan.mappingVersion,
    currentFingerprint,
    configuredModel: model,
  });

  return {
    interpretation: mapCompleted(),
    latestFailure,
    stale: staleness.stale,
    staleReasons: staleness.reasons,
    canGenerate: true,
    generateBlocker: null,
    reusableExists,
  };
}
