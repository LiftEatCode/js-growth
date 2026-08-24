"use client";

import { useActionState } from "react";
import { LoaderCircle } from "lucide-react";

import {
  applyContentCandidateAction,
  approveContentPlanAction,
  createFacebookDerivativePlanAction,
  createRefreshPlanFromReviewAction,
  discardContentCandidateAction,
  generateContentDraftAction,
  markContentPlanPublishedAction,
  recordContentReviewAction,
  recordContentSearchPerformanceAction,
  reopenContentPlanForReviewAction,
  saveContentHumanDraftAction,
  seedInitialContentPlansAction,
  updateContentIndexingStateAction,
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
  publishedUrl,
  performanceSummary,
  distributionPreview,
  suggestedReviewDecision,
  reviewHistorySummary,
}: {
  planId: string;
  status: string;
  hasHumanDraft: boolean;
  hasCandidate: boolean;
  defaultHumanDraft: string;
  candidateDraftJson: string | null;
  aiBusy: boolean;
  publishedUrl?: string | null;
  performanceSummary?: string | null;
  distributionPreview?: string | null;
  suggestedReviewDecision?: string | null;
  reviewHistorySummary?: string | null;
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
  const [derivState, derivAction, derivPending] = useActionState(
    createFacebookDerivativePlanAction,
    initial,
  );
  const [searchState, searchAction, searchPending] = useActionState(
    recordContentSearchPerformanceAction,
    initial,
  );
  const [indexState, indexAction, indexPending] = useActionState(
    updateContentIndexingStateAction,
    initial,
  );
  const [reviewState, reviewAction, reviewPending] = useActionState(
    recordContentReviewAction,
    initial,
  );
  const [refreshState, refreshAction, refreshPending] = useActionState(
    createRefreshPlanFromReviewAction,
    initial,
  );

  const approvedLocked = status === "APPROVED" || status === "PUBLISHED";
  const aiDisabled = genPending || aiBusy || approvedLocked;
  const canPublish = status === "APPROVED";
  const isPublished = status === "PUBLISHED" || status === "MONITORING";
  const suggestedDecision = suggestedReviewDecision ?? "KEEP_MONITORING";

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
        <Button
          type="submit"
          disabled={
            approvePending || status === "APPROVED" || status === "PUBLISHED"
          }
        >
          {approvePending ? "Approving…" : "Approve (human)"}
        </Button>
        <p role="status" className="text-xs text-muted">
          {approveState.message}
        </p>
      </form>

      <form action={pubAction} className="space-y-2">
        <input type="hidden" name="planId" value={planId} />
        <label className="block space-y-1 text-xs">
          <span className="font-medium">
            Published URL (manual only — requires APPROVED + live asset)
          </span>
          <input
            name="publishedUrl"
            defaultValue={publishedUrl ?? "/seo"}
            placeholder="/seo"
            disabled={pubPending || !canPublish}
            className="flex h-9 w-full rounded-lg border border-border px-2 disabled:opacity-60"
          />
        </label>
        <Button type="submit" variant="outline" disabled={pubPending || !canPublish}>
          {pubPending ? "Saving…" : "Mark published"}
        </Button>
        {!canPublish ? (
          <p className="text-[11px] text-muted">
            Publishing handoff blocked until status is APPROVED.
          </p>
        ) : null}
        <p role="status" className="text-xs text-muted">
          {pubState.message}
        </p>
      </form>

      {performanceSummary ? (
        <div className="rounded-xl border border-border bg-slate-50 p-3 text-xs text-muted">
          <p className="font-semibold text-brand">Content performance</p>
          <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap font-mono text-[11px]">
            {performanceSummary}
          </pre>
        </div>
      ) : null}

      {distributionPreview ? (
        <div className="rounded-xl border border-border bg-white p-3 text-xs text-muted">
          <p className="font-semibold text-brand">
            Distribution plan (deterministic · 0 OpenAI)
          </p>
          <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap font-mono text-[11px]">
            {distributionPreview}
          </pre>
        </div>
      ) : null}

      {isPublished || status === "APPROVED" ? (
        <form action={derivAction} className="flex flex-wrap items-center gap-2">
          <input type="hidden" name="planId" value={planId} />
          <input type="hidden" name="derivative" value="FACEBOOK_COMPANY" />
          <Button type="submit" variant="outline" disabled={derivPending}>
            {derivPending
              ? "Creating…"
              : "Create Facebook company derivative plan"}
          </Button>
          <p role="status" className="text-xs text-muted">
            {derivState.message}
          </p>
        </form>
      ) : null}

      {isPublished ? (
        <form action={searchAction} className="space-y-2 rounded-xl border border-dashed border-border p-3">
          <p className="text-xs font-semibold text-brand">
            Manual Search Console capture (OBSERVED · 0 OpenAI)
          </p>
          <input type="hidden" name="planId" value={planId} />
          <div className="grid gap-2 sm:grid-cols-2">
            <input
              name="windowStart"
              type="date"
              required
              disabled={searchPending}
              className="h-9 rounded-lg border border-border px-2 text-xs"
            />
            <input
              name="windowEnd"
              type="date"
              required
              disabled={searchPending}
              className="h-9 rounded-lg border border-border px-2 text-xs"
            />
            <input
              name="impressions"
              placeholder="impressions (blank = not captured)"
              disabled={searchPending}
              className="h-9 rounded-lg border border-border px-2 text-xs"
            />
            <input
              name="clicks"
              placeholder="clicks"
              disabled={searchPending}
              className="h-9 rounded-lg border border-border px-2 text-xs"
            />
            <input
              name="ctr"
              placeholder="ctr"
              disabled={searchPending}
              className="h-9 rounded-lg border border-border px-2 text-xs"
            />
            <input
              name="averagePosition"
              placeholder="avg position"
              disabled={searchPending}
              className="h-9 rounded-lg border border-border px-2 text-xs"
            />
          </div>
          <select
            name="queryDataStatus"
            defaultValue="NOT_CAPTURED"
            disabled={searchPending}
            className="h-9 w-full rounded-lg border border-border px-2 text-xs"
          >
            <option value="NO_DATA">NO_DATA</option>
            <option value="NOT_CAPTURED">NOT_CAPTURED</option>
            <option value="INSUFFICIENT_DATA">INSUFFICIENT_DATA</option>
            <option value="AVAILABLE">AVAILABLE</option>
          </select>
          <textarea
            name="notes"
            rows={2}
            placeholder="Notes — no private IDs"
            disabled={searchPending}
            className="w-full rounded-lg border border-border px-2 py-1 text-xs"
          />
          <Button type="submit" disabled={searchPending}>
            {searchPending ? "Saving…" : "Save search evidence"}
          </Button>
          <p role="status" className="text-xs text-muted">
            {searchState.message}
          </p>
        </form>
      ) : null}

      {isPublished ? (
        <form
          action={indexAction}
          className="flex flex-wrap items-end gap-2 rounded-xl border border-border p-3"
        >
          <input type="hidden" name="planId" value={planId} />
          <label className="block space-y-1 text-xs">
            <span className="font-medium">Indexing state (manual / GSC)</span>
            <select
              name="indexingState"
              defaultValue="PUBLISHED_NOT_VERIFIED"
              disabled={indexPending}
              className="flex h-9 rounded-lg border border-border px-2 text-xs"
            >
              <option value="PUBLISHED_NOT_VERIFIED">PUBLISHED_NOT_VERIFIED</option>
              <option value="INDEXING_REQUESTED">INDEXING_REQUESTED</option>
              <option value="INDEXED">INDEXED</option>
              <option value="INDEXING_ISSUE">INDEXING_ISSUE</option>
              <option value="UNKNOWN">UNKNOWN</option>
            </select>
          </label>
          <Button type="submit" variant="outline" disabled={indexPending}>
            {indexPending ? "Saving…" : "Save indexing state"}
          </Button>
          <p role="status" className="w-full text-xs text-muted">
            {indexState.message}
          </p>
        </form>
      ) : null}

      {isPublished ? (
        <form
          action={reviewAction}
          className="space-y-2 rounded-xl border border-border bg-slate-50/80 p-3"
        >
          <p className="text-xs font-semibold text-brand">
            Record content review (human decision · 0 OpenAI)
          </p>
          <p className="text-[11px] text-muted">
            Suggested decision from evidence rules:{" "}
            <code>{suggestedDecision}</code>. Prefer KEEP_MONITORING when data is
            thin. Windows are operator checkpoints — not ranking SLAs.
          </p>
          <input type="hidden" name="planId" value={planId} />
          <div className="grid gap-2 sm:grid-cols-2">
            <select
              name="checkpoint"
              defaultValue="INDEXING_CHECK"
              disabled={reviewPending}
              className="h-9 rounded-lg border border-border px-2 text-xs"
            >
              <option value="POST_PUBLISH_QA">POST_PUBLISH_QA</option>
              <option value="INDEXING_CHECK">INDEXING_CHECK</option>
              <option value="DAY_7">DAY_7</option>
              <option value="DAY_28">DAY_28</option>
              <option value="DAY_90">DAY_90</option>
              <option value="MANUAL_REVIEW">MANUAL_REVIEW</option>
            </select>
            <select
              name="decision"
              defaultValue={suggestedDecision}
              disabled={reviewPending}
              className="h-9 rounded-lg border border-border px-2 text-xs"
            >
              <option value="KEEP_MONITORING">KEEP_MONITORING</option>
              <option value="NO_CHANGE">NO_CHANGE</option>
              <option value="DISTRIBUTE_MORE">DISTRIBUTE_MORE</option>
              <option value="ADD_INTERNAL_LINKS">ADD_INTERNAL_LINKS</option>
              <option value="IMPROVE_CTA">IMPROVE_CTA</option>
              <option value="EXPAND_CONTENT">EXPAND_CONTENT</option>
              <option value="REFRESH_CONTENT">REFRESH_CONTENT</option>
              <option value="REPURPOSE">REPURPOSE</option>
              <option value="CONSOLIDATE">CONSOLIDATE</option>
              <option value="ARCHIVE">ARCHIVE</option>
              <option value="INVESTIGATE">INVESTIGATE</option>
            </select>
          </div>
          <textarea
            name="notes"
            rows={2}
            placeholder="Optional notes — FACT / INTERPRETATION / HYPOTHESIS preferred"
            disabled={reviewPending}
            className="w-full rounded-lg border border-border px-2 py-1 text-xs"
          />
          <Button type="submit" disabled={reviewPending}>
            {reviewPending ? "Saving…" : "Record review"}
          </Button>
          <p role="status" className="text-xs text-muted">
            {reviewState.message}
          </p>
          {reviewHistorySummary ? (
            <pre className="max-h-32 overflow-auto whitespace-pre-wrap font-mono text-[11px] text-muted">
              {reviewHistorySummary}
            </pre>
          ) : null}
        </form>
      ) : null}

      {isPublished ? (
        <form action={refreshAction} className="flex flex-wrap items-center gap-2">
          <input type="hidden" name="planId" value={planId} />
          <input
            type="hidden"
            name="reason"
            value="Human refresh after REFRESH_CONTENT review"
          />
          <Button
            type="submit"
            variant="outline"
            disabled={refreshPending}
          >
            {refreshPending ? "Creating…" : "Create refresh plan (after REFRESH decision)"}
          </Button>
          <p role="status" className="text-xs text-muted">
            {refreshState.message}
          </p>
        </form>
      ) : null}
    </div>
  );
}
