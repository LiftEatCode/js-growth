import "server-only";

import { COMPETITIVE_COMPARISON_VERSION } from "@/lib/competitive-intelligence/comparison/constants";
import type { CompetitiveComparison } from "@/lib/competitive-intelligence/comparison/types";
import { prisma } from "@/lib/prisma";
import { getOpenAiAuditModel } from "@/lib/website-audit/ai-interpretation/config";

import {
  COMPETITIVE_INTERPRETATION_PROMPT_VERSION,
  COMPETITIVE_INTERPRETATION_VERSION,
} from "./constants";
import { fingerprintCompetitiveAiInput } from "./fingerprint";
import { buildCompetitiveAiInput } from "./input";
import { evaluateCompetitiveInterpretationStaleness } from "./staleness";
import type {
  CompetitiveInterpretationContent,
  CompetitiveInterpretationFailureCode,
} from "./types";

export async function loadLatestCompetitiveInterpretation(options: {
  campaignId: string;
  prospectId: string;
  currentComparisonSnapshotId: string | null;
  currentComparison: CompetitiveComparison | null;
  targetBusinessName: string;
}): Promise<{
  interpretation: {
    id: string;
    status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";
    comparisonSnapshotId: string;
    createdAt: Date;
    completedAt: Date | null;
    failedAt: Date | null;
    failureCode: CompetitiveInterpretationFailureCode | null;
    failureMessage: string | null;
    model: string | null;
    promptVersion: number;
    interpretationVersion: number;
    content: CompetitiveInterpretationContent | null;
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
  if (!options.currentComparisonSnapshotId || !options.currentComparison) {
    return {
      interpretation: null,
      latestFailure: null,
      stale: false,
      staleReasons: [],
      canGenerate: false,
      generateBlocker:
        "Generate a competitive comparison before requesting AI interpretation.",
      reusableExists: false,
    };
  }

  if (
    options.currentComparison.comparisonVersion !== COMPETITIVE_COMPARISON_VERSION
  ) {
    return {
      interpretation: null,
      latestFailure: null,
      stale: false,
      staleReasons: [],
      canGenerate: false,
      generateBlocker: "Unsupported comparison version for interpretation.",
      reusableExists: false,
    };
  }

  const model = getOpenAiAuditModel();
  const aiInput = buildCompetitiveAiInput({
    comparison: options.currentComparison,
    comparisonSnapshotId: options.currentComparisonSnapshotId,
    targetBusinessName: options.targetBusinessName,
  });
  const currentFingerprint = fingerprintCompetitiveAiInput({
    input: aiInput,
    model,
  });

  const [completed, latestAny] = await Promise.all([
    prisma.competitiveInterpretation.findFirst({
      where: {
        prospectId: options.prospectId,
        campaignId: options.campaignId,
        status: "COMPLETED",
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.competitiveInterpretation.findFirst({
      where: {
        prospectId: options.prospectId,
        campaignId: options.campaignId,
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const reusableExists = Boolean(
    await prisma.competitiveInterpretation.findFirst({
      where: {
        comparisonSnapshotId: options.currentComparisonSnapshotId,
        status: "COMPLETED",
        interpretationVersion: COMPETITIVE_INTERPRETATION_VERSION,
        promptVersion: COMPETITIVE_INTERPRETATION_PROMPT_VERSION,
        model,
        inputFingerprint: currentFingerprint,
      },
      select: { id: true },
    }),
  );

  const latestFailure =
    latestAny?.status === "FAILED"
      ? {
          id: latestAny.id,
          failureCode: latestAny.failureCode,
          failureMessage: latestAny.failureMessage,
          failedAt: latestAny.failedAt,
        }
      : null;

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

  const freshness = evaluateCompetitiveInterpretationStaleness({
    interpretation: {
      comparisonSnapshotId: completed.comparisonSnapshotId,
      interpretationVersion: completed.interpretationVersion,
      promptVersion: completed.promptVersion,
      model: completed.model,
      inputFingerprint: completed.inputFingerprint,
    },
    currentComparisonSnapshotId: options.currentComparisonSnapshotId,
    currentFingerprint,
    configuredModel: model,
  });

  return {
    interpretation: {
      id: completed.id,
      status: completed.status,
      comparisonSnapshotId: completed.comparisonSnapshotId,
      createdAt: completed.createdAt,
      completedAt: completed.completedAt,
      failedAt: completed.failedAt,
      failureCode: completed.failureCode as CompetitiveInterpretationFailureCode | null,
      failureMessage: completed.failureMessage,
      model: completed.model,
      promptVersion: completed.promptVersion,
      interpretationVersion: completed.interpretationVersion,
      content:
        (completed.interpretationJson as CompetitiveInterpretationContent | null) ??
        null,
      inputFingerprint: completed.inputFingerprint,
    },
    latestFailure,
    stale: freshness.stale,
    staleReasons: freshness.reasons,
    canGenerate: true,
    generateBlocker: null,
    reusableExists,
  };
}
