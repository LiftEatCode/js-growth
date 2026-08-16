import {
  AI_STALE_GENERATING_MS,
  MAX_AI_GENERATION_ATTEMPTS,
} from "./constants";
import type {
  AiInterpretationRecord,
  AiInterpretationStore,
  AiInterpretationStoreRecord,
} from "./types";

export function createMemoryAiInterpretationStore(): AiInterpretationStore {
  const records = new Map<string, AiInterpretationStoreRecord>();

  return {
    async get(reportId) {
      return records.get(reportId) ?? null;
    },

    async claimGeneration(reportId, now) {
      const current = records.get(reportId);

      if (current?.status === "completed" && current.interpretation) {
        return "completed";
      }

      if (
        current?.status === "generating" &&
        current.startedAt &&
        now.getTime() - Date.parse(current.startedAt) < AI_STALE_GENERATING_MS
      ) {
        return "in-progress";
      }

      const attemptCount = current?.attemptCount ?? 0;
      const staleGenerating =
        current?.status === "generating" &&
        current.startedAt &&
        now.getTime() - Date.parse(current.startedAt) >= AI_STALE_GENERATING_MS;

      if (!staleGenerating && attemptCount >= MAX_AI_GENERATION_ATTEMPTS) {
        return "exhausted";
      }

      records.set(reportId, {
        status: "generating",
        attemptCount: staleGenerating ? attemptCount : attemptCount + 1,
        startedAt: now.toISOString(),
        generatedAt: null,
        interpretation: current?.interpretation ?? null,
      });

      return "claimed";
    },

    async saveCompleted(reportId, record: AiInterpretationRecord, now) {
      const current = records.get(reportId);
      records.set(reportId, {
        status: "completed",
        attemptCount: current?.attemptCount ?? 1,
        startedAt: current?.startedAt ?? now.toISOString(),
        generatedAt: now.toISOString(),
        interpretation: record,
      });
    },

    async saveFailed(reportId, now) {
      const current = records.get(reportId);
      records.set(reportId, {
        status: "failed",
        attemptCount: current?.attemptCount ?? 1,
        startedAt: current?.startedAt ?? now.toISOString(),
        generatedAt: null,
        interpretation: null,
      });
    },
  };
}
