"use client";

import { useActionState } from "react";
import { LoaderCircle } from "lucide-react";

import {
  approveContentPlanAction,
  generateContentDraftAction,
  markContentPlanPublishedAction,
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
  defaultHumanDraft,
}: {
  planId: string;
  status: string;
  defaultHumanDraft: string;
}) {
  const [genState, genAction, genPending] = useActionState(
    generateContentDraftAction,
    initial,
  );
  const [editState, editAction, editPending] = useActionState(
    saveContentHumanDraftAction,
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

  return (
    <div className="space-y-4 border-t border-border pt-4">
      <form action={genAction} className="space-y-2">
        <input type="hidden" name="planId" value={planId} />
        <label className="block space-y-1 text-xs">
          <span className="font-medium">Operator notes (untrusted data)</span>
          <textarea
            name="operatorNotes"
            rows={2}
            disabled={genPending}
            className="w-full rounded-lg border border-border px-2 py-1 disabled:opacity-60"
            placeholder="Optional notes — treated as data, not instructions"
          />
        </label>
        <div className="flex flex-wrap gap-2">
          <Button
            type="submit"
            name="mode"
            value="openai"
            disabled={genPending}
          >
            {genPending ? "Generating…" : "Generate draft (OpenAI)"}
          </Button>
          <Button
            type="submit"
            name="mode"
            value="skeleton"
            variant="outline"
            disabled={genPending}
          >
            Skeleton draft (0 OpenAI)
          </Button>
        </div>
        <p role="status" className="text-xs text-muted">
          {genState.message}
        </p>
      </form>

      <form action={editAction} className="space-y-2">
        <input type="hidden" name="planId" value={planId} />
        <label className="block space-y-1 text-xs">
          <span className="font-medium">Human draft JSON</span>
          <textarea
            name="humanDraftJson"
            rows={8}
            defaultValue={defaultHumanDraft}
            disabled={editPending}
            className="w-full rounded-lg border border-border px-2 py-1 font-mono text-[11px] disabled:opacity-60"
          />
        </label>
        <Button type="submit" disabled={editPending}>
          {editPending ? "Saving…" : "Save human edit"}
        </Button>
        <p role="status" className="text-xs text-muted">
          {editState.message}
        </p>
      </form>

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
