import { getAiGenerationTimeoutMs, getOpenAiAuditModel } from "./config";
import { buildAiAuditContext } from "./context";
import { AiGenerationTimeoutError, InvalidAiOutputError } from "./errors";
import { generateAuditInterpretation } from "./generate";
import type {
  AiInterpretationStore,
  AiInterpretationView,
  InterpretationProvider,
} from "./types";
import type { WebsiteAuditResult } from "../types";

export async function ensureAiInterpretation(options: {
  reportId: string;
  audit: WebsiteAuditResult;
  entitled: boolean;
  store: AiInterpretationStore;
  provider: InterpretationProvider;
  model?: string;
  timeoutMs?: number;
  now?: Date;
  configured?: boolean;
}): Promise<AiInterpretationView> {
  const now = options.now ?? new Date();

  if (!options.entitled) {
    return {
      status: "hidden",
      record: null,
      attemptCount: 0,
    };
  }

  const existing = await options.store.get(options.reportId);

  if (existing?.status === "completed" && existing.interpretation) {
    return {
      status: "completed",
      record: existing.interpretation,
      attemptCount: existing.attemptCount,
    };
  }

  if (options.configured === false) {
    return {
      status: "unavailable",
      record: null,
      attemptCount: existing?.attemptCount ?? 0,
    };
  }

  const claim = await options.store.claimGeneration(options.reportId, now);

  if (claim === "completed") {
    const refreshed = await options.store.get(options.reportId);
    return {
      status: "completed",
      record: refreshed?.interpretation ?? null,
      attemptCount: refreshed?.attemptCount ?? existing?.attemptCount ?? 0,
    };
  }

  if (claim === "in-progress") {
    return {
      status: "generating",
      record: null,
      attemptCount: existing?.attemptCount ?? 0,
    };
  }

  if (claim === "exhausted" || claim === "unavailable") {
    return {
      status: "unavailable",
      record: null,
      attemptCount: existing?.attemptCount ?? 0,
    };
  }

  try {
    const context = buildAiAuditContext(options.audit);
    const record = await generateAuditInterpretation({
      context,
      model: options.model ?? getOpenAiAuditModel(),
      timeoutMs: options.timeoutMs ?? getAiGenerationTimeoutMs(),
      provider: options.provider,
    });

    await options.store.saveCompleted(options.reportId, record, new Date());

    console.info("[ai] interpretation generated", {
      reportId: options.reportId,
      version: record.version,
      model: record.model,
      status: "completed",
      inputTokens: record.usage?.inputTokens ?? null,
      outputTokens: record.usage?.outputTokens ?? null,
    });

    return {
      status: "completed",
      record,
      attemptCount: existing?.attemptCount ?? 1,
    };
  } catch (error) {
    await options.store.saveFailed(options.reportId, new Date());

    const category =
      error instanceof AiGenerationTimeoutError
        ? "timeout"
        : error instanceof InvalidAiOutputError
          ? "invalid-output"
          : error instanceof Error && "category" in error
            ? String((error as { category?: string }).category)
            : "provider";
    const message = error instanceof Error ? error.message : String(error);

    console.error(
      `[ai] interpretation failed category=${category} ${message}`,
      {
        reportId: options.reportId,
        version: "v1",
        model: options.model ?? getOpenAiAuditModel(),
        status: "failed",
        category,
        message,
      },
    );

    return {
      status: "unavailable",
      record: null,
      attemptCount: (existing?.attemptCount ?? 0) + 1,
    };
  }
}
