/**
 * Sprint 6 hardening — AI proposes candidates; humans control the canonical draft.
 *
 * Pure helpers + in-memory state machine for deterministic verification.
 * Persistence lives in content-plan-store.ts.
 */

export const CONTENT_AI_HISTORY_OPERATIONS = [
  "INITIAL_GENERATE",
  "REGENERATE_FROM_BRIEF",
  "REVISE_CURRENT_DRAFT",
  "APPLY_CANDIDATE",
  "DISCARD_CANDIDATE",
  "REOPEN_FOR_REVIEW",
] as const;
export type ContentAiHistoryOperation =
  (typeof CONTENT_AI_HISTORY_OPERATIONS)[number];

export const AI_BUSY_LOCK_MS = 120_000;

export type GenerationHistoryEntry = {
  at: string;
  operation: ContentAiHistoryOperation | string;
  model?: string | null;
  promptVersion?: number | null;
  inputTokens?: number | null;
  outputTokens?: number | null;
  resultStatus?: "ok" | "error" | "applied" | "discarded";
};

export type ContentPlanRevisionState = {
  status: string;
  generationJson: unknown | null;
  humanDraftJson: unknown | null;
  candidateDraftJson: unknown | null;
  generationHistoryJson: GenerationHistoryEntry[];
  aiBusyUntil: Date | null;
};

export function isContentAiHistoryOperation(
  value: string,
): value is ContentAiHistoryOperation {
  return (CONTENT_AI_HISTORY_OPERATIONS as readonly string[]).includes(value);
}

/** APPROVED / PUBLISHED must reopen before AI mutate or apply. */
export function canRunAiMutation(status: string): {
  ok: boolean;
  error?: string;
} {
  if (status === "PUBLISHED") {
    return {
      ok: false,
      error: "Published plans cannot accept AI revisions.",
    };
  }
  if (status === "APPROVED") {
    return {
      ok: false,
      error:
        "Plan is APPROVED. Reopen for review before AI regenerate/revise/apply.",
    };
  }
  return { ok: true };
}

export function canApplyCandidate(input: {
  status: string;
  hasCandidate: boolean;
}): { ok: boolean; error?: string } {
  const gate = canRunAiMutation(input.status);
  if (!gate.ok) {
    return gate;
  }
  if (!input.hasCandidate) {
    return { ok: false, error: "No AI candidate to apply." };
  }
  return { ok: true };
}

export function canDiscardCandidate(input: {
  hasCandidate: boolean;
}): { ok: boolean; error?: string } {
  if (!input.hasCandidate) {
    return { ok: false, error: "No AI candidate to discard." };
  }
  return { ok: true };
}

export function appendGenerationHistory(
  existing: unknown,
  entry: GenerationHistoryEntry,
): GenerationHistoryEntry[] {
  const history = Array.isArray(existing)
    ? ([...existing] as GenerationHistoryEntry[])
    : [];
  history.push(entry);
  return history.slice(-100);
}

export function isAiBusyLockActive(
  aiBusyUntil: Date | string | null | undefined,
  now: Date = new Date(),
): boolean {
  if (!aiBusyUntil) {
    return false;
  }
  const until =
    aiBusyUntil instanceof Date ? aiBusyUntil : new Date(aiBusyUntil);
  if (Number.isNaN(until.getTime())) {
    return false;
  }
  return until.getTime() > now.getTime();
}

export function nextAiBusyUntil(
  now: Date = new Date(),
  lockMs: number = AI_BUSY_LOCK_MS,
): Date {
  return new Date(now.getTime() + lockMs);
}

/**
 * Where AI output lands:
 * - INITIAL with no human → generationJson
 * - REGENERATE / REVISE / INITIAL with human → candidate only
 */
export function resolveAiOutputTarget(input: {
  hasHumanDraft: boolean;
  operation:
    | "INITIAL_GENERATE"
    | "REGENERATE_FROM_BRIEF"
    | "REVISE_CURRENT_DRAFT";
}): "generationJson" | "candidateDraftJson" {
  if (
    input.operation === "REVISE_CURRENT_DRAFT" ||
    input.operation === "REGENERATE_FROM_BRIEF"
  ) {
    return "candidateDraftJson";
  }
  if (input.hasHumanDraft) {
    return "candidateDraftJson";
  }
  return "generationJson";
}

export function assertHumanDraftUnchanged(
  before: unknown,
  after: unknown,
): boolean {
  return JSON.stringify(before ?? null) === JSON.stringify(after ?? null);
}

export function createEmptyRevisionState(
  status = "BRIEF_READY",
): ContentPlanRevisionState {
  return {
    status,
    generationJson: null,
    humanDraftJson: null,
    candidateDraftJson: null,
    generationHistoryJson: [],
    aiBusyUntil: null,
  };
}

export type PersistAiDraftDecision =
  | {
      ok: true;
      target: "generationJson" | "candidateDraftJson";
      nextStatus: "DRAFT" | "IN_REVIEW";
      humanDraftPreserved: true;
    }
  | { ok: false; error: string; code: string };

export function decidePersistAiDraft(input: {
  status: string;
  hasHumanDraft: boolean;
  operation:
    | "INITIAL_GENERATE"
    | "REGENERATE_FROM_BRIEF"
    | "REVISE_CURRENT_DRAFT";
  aiBusyUntil: Date | string | null;
  now?: Date;
}): PersistAiDraftDecision {
  if (isAiBusyLockActive(input.aiBusyUntil, input.now)) {
    return {
      ok: false,
      error: "AI revision already in progress. Wait and retry.",
      code: "AI_BUSY",
    };
  }
  const gate = canRunAiMutation(input.status);
  if (!gate.ok) {
    return { ok: false, error: gate.error!, code: "STATUS_BLOCKED" };
  }
  if (input.operation === "REVISE_CURRENT_DRAFT" && !input.hasHumanDraft) {
    return {
      ok: false,
      error: "Revise requires a current human/canonical draft.",
      code: "NO_HUMAN_DRAFT",
    };
  }
  if (input.operation === "INITIAL_GENERATE" && input.hasHumanDraft) {
    return {
      ok: false,
      error:
        "Human draft exists — use Regenerate from Brief or Revise with AI.",
      code: "USE_CANDIDATE_FLOW",
    };
  }
  const target = resolveAiOutputTarget({
    hasHumanDraft: input.hasHumanDraft,
    operation: input.operation,
  });
  return {
    ok: true,
    target,
    nextStatus: input.hasHumanDraft ? "IN_REVIEW" : "DRAFT",
    humanDraftPreserved: true,
  };
}

/** In-memory apply of AI output (never mutates humanDraftJson). */
export function applyAiOutputInMemory(
  state: ContentPlanRevisionState,
  input: {
    operation:
      | "INITIAL_GENERATE"
      | "REGENERATE_FROM_BRIEF"
      | "REVISE_CURRENT_DRAFT";
    draftPayload: unknown;
    model: string;
    promptVersion: number;
    now?: Date;
  },
):
  | { ok: true; state: ContentPlanRevisionState }
  | { ok: false; error: string; code: string; state: ContentPlanRevisionState } {
  const decision = decidePersistAiDraft({
    status: state.status,
    hasHumanDraft: state.humanDraftJson != null,
    operation: input.operation,
    aiBusyUntil: state.aiBusyUntil,
    now: input.now,
  });
  if (!decision.ok) {
    return {
      ok: false,
      error: decision.error,
      code: decision.code,
      state,
    };
  }

  const humanBefore = state.humanDraftJson;
  const entry: GenerationHistoryEntry = {
    at: (input.now ?? new Date()).toISOString(),
    operation: input.operation,
    model: input.model,
    promptVersion: input.promptVersion,
    resultStatus: "ok",
  };

  const next: ContentPlanRevisionState = {
    ...state,
    status: decision.nextStatus,
    generationHistoryJson: appendGenerationHistory(
      state.generationHistoryJson,
      entry,
    ),
    aiBusyUntil: null,
  };

  if (decision.target === "generationJson") {
    next.generationJson = input.draftPayload;
  } else {
    next.candidateDraftJson = input.draftPayload;
  }

  if (!assertHumanDraftUnchanged(humanBefore, next.humanDraftJson)) {
    return {
      ok: false,
      error: "Invariant violated: human draft changed by AI persist",
      code: "INVARIANT",
      state,
    };
  }

  return { ok: true, state: next };
}

export function applyCandidateInMemory(
  state: ContentPlanRevisionState,
  now: Date = new Date(),
):
  | { ok: true; state: ContentPlanRevisionState }
  | { ok: false; error: string; code: string; state: ContentPlanRevisionState } {
  const gate = canApplyCandidate({
    status: state.status,
    hasCandidate: state.candidateDraftJson != null,
  });
  if (!gate.ok) {
    return {
      ok: false,
      error: gate.error!,
      code: "APPLY_BLOCKED",
      state,
    };
  }

  const next: ContentPlanRevisionState = {
    ...state,
    humanDraftJson: state.candidateDraftJson,
    candidateDraftJson: null,
    status: "IN_REVIEW",
    generationHistoryJson: appendGenerationHistory(
      state.generationHistoryJson,
      {
        at: now.toISOString(),
        operation: "APPLY_CANDIDATE",
        resultStatus: "applied",
      },
    ),
  };

  return { ok: true, state: next };
}

export function discardCandidateInMemory(
  state: ContentPlanRevisionState,
  now: Date = new Date(),
):
  | { ok: true; state: ContentPlanRevisionState }
  | { ok: false; error: string; code: string; state: ContentPlanRevisionState } {
  const gate = canDiscardCandidate({
    hasCandidate: state.candidateDraftJson != null,
  });
  if (!gate.ok) {
    return {
      ok: false,
      error: gate.error!,
      code: "DISCARD_BLOCKED",
      state,
    };
  }

  const humanBefore = state.humanDraftJson;
  const next: ContentPlanRevisionState = {
    ...state,
    candidateDraftJson: null,
    generationHistoryJson: appendGenerationHistory(
      state.generationHistoryJson,
      {
        at: now.toISOString(),
        operation: "DISCARD_CANDIDATE",
        resultStatus: "discarded",
      },
    ),
  };

  if (!assertHumanDraftUnchanged(humanBefore, next.humanDraftJson)) {
    return {
      ok: false,
      error: "Invariant violated on discard",
      code: "INVARIANT",
      state,
    };
  }

  return { ok: true, state: next };
}

export function reopenForReviewInMemory(
  state: ContentPlanRevisionState,
  now: Date = new Date(),
):
  | { ok: true; state: ContentPlanRevisionState }
  | { ok: false; error: string; state: ContentPlanRevisionState } {
  if (state.status !== "APPROVED") {
    return {
      ok: false,
      error: "Only APPROVED plans can reopen for review.",
      state,
    };
  }
  return {
    ok: true,
    state: {
      ...state,
      status: "IN_REVIEW",
      generationHistoryJson: appendGenerationHistory(
        state.generationHistoryJson,
        {
          at: now.toISOString(),
          operation: "REOPEN_FOR_REVIEW",
          resultStatus: "ok",
        },
      ),
    },
  };
}

/** Simulate failed AI: human + candidate unchanged. */
export function recordAiFailureInMemory(
  state: ContentPlanRevisionState,
  operation: ContentAiHistoryOperation,
  now: Date = new Date(),
): ContentPlanRevisionState {
  return {
    ...state,
    aiBusyUntil: null,
    generationHistoryJson: appendGenerationHistory(
      state.generationHistoryJson,
      {
        at: now.toISOString(),
        operation,
        resultStatus: "error",
      },
    ),
  };
}
