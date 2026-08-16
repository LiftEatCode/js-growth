import "server-only";

import { AiInterpretationStatus, Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import {
  AI_STALE_GENERATING_MS,
  MAX_AI_GENERATION_ATTEMPTS,
} from "./constants";
import { validateAiInterpretationContent } from "./validate";
import type {
  AiInterpretationRecord,
  AiInterpretationStore,
  AiInterpretationStoreRecord,
} from "./types";

function asRecord(
  value: Prisma.JsonValue | null,
): AiInterpretationRecord | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const candidate = value as Partial<AiInterpretationRecord>;
  if (
    candidate.version !== "v1" ||
    typeof candidate.model !== "string" ||
    typeof candidate.generatedAt !== "string" ||
    typeof candidate.inputFingerprint !== "string" ||
    !candidate.content
  ) {
    return null;
  }

  const validated = validateAiInterpretationContent(candidate.content);
  if (!validated.ok) {
    return null;
  }

  return {
    version: "v1",
    model: candidate.model,
    generatedAt: candidate.generatedAt,
    inputFingerprint: candidate.inputFingerprint,
    usage:
      candidate.usage && typeof candidate.usage === "object"
        ? {
            inputTokens: candidate.usage.inputTokens ?? null,
            outputTokens: candidate.usage.outputTokens ?? null,
            totalTokens: candidate.usage.totalTokens ?? null,
          }
        : null,
    content: validated.content,
  };
}

function toStatus(
  status: AiInterpretationStatus | null,
): AiInterpretationStoreRecord["status"] {
  if (status === AiInterpretationStatus.GENERATING) {
    return "generating";
  }

  if (status === AiInterpretationStatus.COMPLETED) {
    return "completed";
  }

  if (status === AiInterpretationStatus.FAILED) {
    return "failed";
  }

  return null;
}

export const prismaAiInterpretationStore: AiInterpretationStore = {
  async get(reportId) {
    const report = await prisma.auditReport.findUnique({
      where: { id: reportId },
      select: {
        aiStatus: true,
        aiAttemptCount: true,
        aiStartedAt: true,
        aiGeneratedAt: true,
        aiInterpretation: true,
      },
    });

    if (!report) {
      return null;
    }

    return {
      status: toStatus(report.aiStatus),
      attemptCount: report.aiAttemptCount,
      startedAt: report.aiStartedAt?.toISOString() ?? null,
      generatedAt: report.aiGeneratedAt?.toISOString() ?? null,
      interpretation: asRecord(report.aiInterpretation),
    };
  },

  async claimGeneration(reportId, now) {
    const existing = await prisma.auditReport.findUnique({
      where: { id: reportId },
      select: {
        aiStatus: true,
        aiAttemptCount: true,
        aiStartedAt: true,
        aiInterpretation: true,
      },
    });

    if (!existing) {
      return "unavailable";
    }

    if (
      existing.aiStatus === AiInterpretationStatus.COMPLETED &&
      asRecord(existing.aiInterpretation)
    ) {
      return "completed";
    }

    const staleCutoff = new Date(now.getTime() - AI_STALE_GENERATING_MS);
    const generatingFresh =
      existing.aiStatus === AiInterpretationStatus.GENERATING &&
      existing.aiStartedAt &&
      existing.aiStartedAt > staleCutoff;

    if (generatingFresh) {
      return "in-progress";
    }

    const staleGenerating =
      existing.aiStatus === AiInterpretationStatus.GENERATING &&
      existing.aiStartedAt &&
      existing.aiStartedAt <= staleCutoff;

    if (
      !staleGenerating &&
      existing.aiAttemptCount >= MAX_AI_GENERATION_ATTEMPTS
    ) {
      return "exhausted";
    }

    const claimed = await prisma.auditReport.updateMany({
      where: {
        id: reportId,
        OR: [
          { aiStatus: null },
          { aiStatus: AiInterpretationStatus.FAILED },
          {
            aiStatus: AiInterpretationStatus.GENERATING,
            aiStartedAt: { lte: staleCutoff },
          },
        ],
        ...(staleGenerating
          ? {}
          : { aiAttemptCount: { lt: MAX_AI_GENERATION_ATTEMPTS } }),
      },
      data: staleGenerating
        ? {
            aiStatus: AiInterpretationStatus.GENERATING,
            aiStartedAt: now,
          }
        : {
            aiStatus: AiInterpretationStatus.GENERATING,
            aiStartedAt: now,
            aiAttemptCount: { increment: 1 },
          },
    });

    if (claimed.count === 1) {
      return "claimed";
    }

    const after = await prisma.auditReport.findUnique({
      where: { id: reportId },
      select: {
        aiStatus: true,
        aiInterpretation: true,
        aiAttemptCount: true,
      },
    });

    if (
      after?.aiStatus === AiInterpretationStatus.COMPLETED &&
      asRecord(after.aiInterpretation)
    ) {
      return "completed";
    }

    if (after?.aiAttemptCount && after.aiAttemptCount >= MAX_AI_GENERATION_ATTEMPTS) {
      return "exhausted";
    }

    return "in-progress";
  },

  async saveCompleted(reportId, record, now) {
    await prisma.auditReport.update({
      where: { id: reportId },
      data: {
        aiStatus: AiInterpretationStatus.COMPLETED,
        aiGeneratedAt: now,
        aiInterpretation: record as unknown as Prisma.InputJsonValue,
      },
    });
  },

  async saveFailed(reportId, now) {
    await prisma.auditReport.update({
      where: { id: reportId },
      data: {
        aiStatus: AiInterpretationStatus.FAILED,
        aiStartedAt: now,
      },
    });
  },
};
