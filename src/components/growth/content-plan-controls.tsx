"use client";

import { useActionState } from "react";
import { LoaderCircle } from "lucide-react";

import {
  applyContentCandidateAction,
  approveContentPlanAction,
  discardContentCandidateAction,
  generateContentDraftAction,
  markContentPlanPublishedAction,
  reopenContentPlanForReviewAction,
  saveContentHumanDraftAction,
  seedInitialContentPlansAction,
  type ContentPlanActionState,
} from "@/app/reports/growth/actions";
import { Button } from "@/components/ui";

const initial: ContentPlanActionState = { success: false, message: "" };

export function SeedContentPlansForm() {
  const [state, action, pending] = useActionState(
    seedInitialContentPlansAction,
    initial,
  );
  return (
    <form action={action} className="flex flex-wrap items-center gap-3">
      <Button type="submit" disabled={pending}>
        {pending ? (
          <>
            <LoaderCircle className="size-4 animate-spin" aria-hidden />
            Seeding…
          </>
        ) : (
          "Seed initial content plans"
        )}
      </Button>
      <p role="status" aria-live="polite" className="text-sm text-muted">
        {state.message}
      </p>
    </form>
  );
}

export function ContentPlanControls({
  planId,
  status,
  hasHumanDraft,
  hasCandidate,
  defaultHumanDraft,
  candidateDraftJson,
  aiBusy,
}: {
  planId: string;
  status: string;
  hasHumanDraft: boolean;
  hasCandidate: boolean;
  defaultHumanDraft: string;
  candidateDraftJson: string | null;
  aiBusy: boolean;
}) {
  const [genState, genAction, genPending] = useActionState(
    generateContentDraftAction,
    initial,
  );
  const [editState, editAction, editPending] = useActionState(
    saveContentHumanDraftAction,
    initial,
  );
  const [applyState, applyAction, applyPending] = useActionState(
    applyContentCandidateAction,
    initial,
  );
  const [discardState, discardAction, discardPending] = useActionState(
    discardContentCandidateAction,
    initial,
  );
  const [reopenState, reopenAction, reopenPending] = useActionState(
    reopenContentPlanForReviewAction,
    initial,
  );
  const [approveState, approveAction, approvePending] = useActionState(
    approveContentPlanAction,
    initial,
  );
  const [pubState, pubAction, pubPending] = useActionState(
    markContentPlanPublishedAction,
    initial,
  );

  const approvedLocked = status === "APPROVED" || status === "PUBLISHED";
  const aiDisabled = genPending || aiBusy || approvedLocked;

  return (
    <div className="space-y-4 border-t border-border pt-4">
      {approvedLocked ? (
        <form action={reopenAction} className="flex flex-wrap items-center gap-2">
          <input type="hidden" name="planId" value={planId} />
          <p className="w-full text-xs text-muted">
            Plan is {status}. Reopen for review before AI revise/apply or human
            edit.
          </p>
          {status === "APPROVED" ? (
            <Button type="submit" variant="outline" disabled={reopenPending}>
              {reopenPending ? "Reopening…" : "Reopen for review"}
            </Button>
          ) : null}
          <p role="status" className="text-xs text-muted">
            {reopenState.message}
          </p>
        </form>
      ) : null}

      <form action={genAction} className="space-y-2">
        <input type="hidden" name="planId" value={planId} />
        <label className="block space-y-1 text-xs">
          <span className="font-medium">Operator notes (untrusted data)</span>
          <textarea
            name="operatorNotes"
            rows={2}
            disabled={aiDisabled}
            className="w-full rounded-lg border border-border px-2 py-1 disabled:opacity-60"
            placeholder="Optional notes — treated as data, not system overrides"
          />
        </label>

        {hasHumanDraft ? (
          <>
            <label className="block space-y-1 text-xs">
              <span className="font-medium">
                AI revision instructions (untrusted)
              </span>
              <textarea
                name="revisionInstruction"
                rows={3}
                disabled={aiDisabled}
                className="w-full rounded-lg border border-border px-2 py-1 disabled:opacity-60"
                placeholder='e.g. Remove the AI automation section, strengthen diagnose-first…'
              />
            </label>
            <div className="flex flex-wrap gap-2">
              <Button
                type="submit"
                name="mode"
                value="revise"
                disabled={aiDisabled}
              >
                {genPending ? "Revising…" : "Revise with AI"}
              </Button>
              <Button
                type="submit"
                name="mode"
                value="regenerate"
                variant="outline"
                disabled={aiDisabled}
              >
                {genPending ? "Generating…" : "Regenerate from Brief"}
              </Button>
              <Button
                type="submit"
                name="mode"
                value="skeleton_regenerate"
                variant="outline"
                disabled={aiDisabled}
              >
                Skeleton candidate (0 OpenAI)
              </Button>
            </div>
            <p className="text-[11px] text-muted">
              AI writes a candidate only. Canonical human draft is never
              overwritten until you Apply.
            </p>
          </>
        ) : (
          <div className="flex flex-wrap gap-2">
            <Button
              type="submit"
              name="mode"
              value="openai"
              disabled={aiDisabled}
            >
              {genPending ? "Generating…" : "Generate draft (OpenAI)"}
            </Button>
            <Button
              type="submit"
              name="mode"
              value="skeleton"
              variant="outline"
              disabled={aiDisabled}
            >
              Skeleton draft (0 OpenAI)
            </Button>
          </div>
        )}
        <p role="status" className="text-xs text-muted">
          {genState.message}
        </p>
      </form>

      <div className="rounded-xl border border-border bg-white p-3">
        <p className="text-xs font-semibold tracking-wide text-brand">
          CURRENT HUMAN / CANONICAL DRAFT
        </p>
        <form action={editAction} className="mt-2 space-y-2">
          <input type="hidden" name="planId" value={planId} />
          <label className="block space-y-1 text-xs">
            <span className="font-medium">Human draft JSON</span>
            <textarea
              name="humanDraftJson"
              rows={8}
              defaultValue={defaultHumanDraft}
              disabled={editPending || approvedLocked}
              className="w-full rounded-lg border border-border px-2 py-1 font-mono text-[11px] disabled:opacity-60"
            />
          </label>
          <Button type="submit" disabled={editPending || approvedLocked}>
            {editPending ? "Saving…" : "Save human edit"}
          </Button>
          <p role="status" className="text-xs text-muted">
            {editState.message}
          </p>
        </form>
      </div>

      {hasCandidate && candidateDraftJson ? (
        <div className="rounded-xl border-2 border-dashed border-amber-600/50 bg-amber-50/40 p-3">
          <p className="text-xs font-semibold tracking-wide text-amber-900">
            AI CANDIDATE (not canonical)
          </p>
          <pre className="mt-2 max-h-48 overflow-auto rounded-lg border border-amber-700/20 bg-white p-2 font-mono text-[11px] text-muted">
            {candidateDraftJson}
          </pre>
          <div className="mt-3 flex flex-wrap gap-2">
            <form action={applyAction}>
              <input type="hidden" name="planId" value={planId} />
              <Button
                type="submit"
                disabled={applyPending || discardPending || approvedLocked}
              >
                {applyPending ? "Applying…" : "Apply AI Revision"}
              </Button>
            </form>
            <form action={discardAction}>
              <input type="hidden" name="planId" value={planId} />
              <Button
                type="submit"
                variant="outline"
                disabled={discardPending || applyPending}
              >
                {discardPending ? "Discarding…" : "Discard Candidate"}
              </Button>
            </form>
          </div>
          <p role="status" className="mt-2 text-xs text-muted">
            {applyState.message || discardState.message}
          </p>
          <p className="mt-1 text-[11px] text-muted">
            Apply/Discard use 0 OpenAI calls. Apply does not approve or publish.
          </p>
        </div>
      ) : null}

      <form action={approveAction} className="flex flex-wrap items-center gap-2">
        <input type="hidden" name="planId" value={planId} />
        <Button type="submit" disabled={approvePending || status === "APPROVED"}>
          {approvePending ? "Approving…" : "Approve (human)"}
        </Button>
        <p role="status" className="text-xs text-muted">
          {approveState.message}
        </p>
      </form>

      <form action={pubAction} className="space-y-2">
        <input type="hidden" name="planId" value={planId} />
        <label className="block space-y-1 text-xs">
          <span className="font-medium">Published URL (manual only)</span>
          <input
            name="publishedUrl"
            placeholder="https://js-growth.com/seo"
            disabled={pubPending}
            className="flex h-9 w-full rounded-lg border border-border px-2 disabled:opacity-60"
          />
        </label>
        <Button type="submit" variant="outline" disabled={pubPending}>
          {pubPending ? "Saving…" : "Mark published"}
        </Button>
        <p role="status" className="text-xs text-muted">
          {pubState.message}
        </p>
      </form>
    </div>
  );
}
