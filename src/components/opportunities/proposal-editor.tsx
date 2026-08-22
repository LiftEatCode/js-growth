"use client";

import { useState, useTransition } from "react";
import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";

import {
  approveProposalAction,
  markProposalReviewedAction,
  updateProposalPresentationAction,
} from "@/app/reports/opportunities/proposal-actions";
import { Button } from "@/components/ui";

export interface ProposalEditorProps {
  proposalId: string;
  editable: boolean;
  status: string;
  initialTitle: string;
  initialExecutiveSummary: string;
  initialBusinessContext: string;
  initialApproachIntro: string;
  initialTimelineNote: string;
  initialNextStepText: string;
}

export function ProposalEditor({
  proposalId,
  editable,
  status,
  initialTitle,
  initialExecutiveSummary,
  initialBusinessContext,
  initialApproachIntro,
  initialTimelineNote,
  initialNextStepText,
}: ProposalEditorProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState(initialTitle);
  const [executiveSummary, setExecutiveSummary] = useState(
    initialExecutiveSummary,
  );
  const [businessContext, setBusinessContext] = useState(
    initialBusinessContext,
  );
  const [approachIntro, setApproachIntro] = useState(initialApproachIntro);
  const [timelineNote, setTimelineNote] = useState(initialTimelineNote);
  const [nextStepText, setNextStepText] = useState(initialNextStepText);

  function run(action: () => Promise<{ success: boolean; message?: string }>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.success) {
        setError(result.message ?? "Update failed.");
        return;
      }
      router.refresh();
    });
  }

  if (!editable) {
    return (
      <p className="text-sm text-muted">
        This Proposal is {status.toLowerCase()} and immutable. Scope and Pricing
        facts cannot be edited here. Use Revise after updating upstream
        commercial approvals.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
          {error}
        </p>
      ) : null}

      <p className="text-xs text-muted">
        Presentation fields only. Deliverables, quantities, and prices come from
        approved Scope and Pricing and cannot be changed here.
      </p>

      <label className="block space-y-1 text-sm">
        <span className="text-xs font-medium text-muted">Title</span>
        <input
          className="w-full rounded-lg border border-border bg-white px-3 py-2"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </label>

      <label className="block space-y-1 text-sm">
        <span className="text-xs font-medium text-muted">Executive summary</span>
        <textarea
          className="min-h-28 w-full rounded-lg border border-border bg-white px-3 py-2"
          value={executiveSummary}
          onChange={(e) => setExecutiveSummary(e.target.value)}
        />
      </label>

      <label className="block space-y-1 text-sm">
        <span className="text-xs font-medium text-muted">Business context</span>
        <textarea
          className="min-h-24 w-full rounded-lg border border-border bg-white px-3 py-2"
          value={businessContext}
          onChange={(e) => setBusinessContext(e.target.value)}
        />
      </label>

      <label className="block space-y-1 text-sm">
        <span className="text-xs font-medium text-muted">
          Approach introduction
        </span>
        <textarea
          className="min-h-20 w-full rounded-lg border border-border bg-white px-3 py-2"
          value={approachIntro}
          onChange={(e) => setApproachIntro(e.target.value)}
        />
      </label>

      <label className="block space-y-1 text-sm">
        <span className="text-xs font-medium text-muted">Timeline note</span>
        <textarea
          className="min-h-16 w-full rounded-lg border border-border bg-white px-3 py-2"
          value={timelineNote}
          onChange={(e) => setTimelineNote(e.target.value)}
        />
      </label>

      <label className="block space-y-1 text-sm">
        <span className="text-xs font-medium text-muted">Next step</span>
        <textarea
          className="min-h-20 w-full rounded-lg border border-border bg-white px-3 py-2"
          value={nextStepText}
          onChange={(e) => setNextStepText(e.target.value)}
        />
      </label>

      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          variant="outline"
          disabled={isPending}
          onClick={() =>
            run(() =>
              updateProposalPresentationAction(proposalId, {
                title,
                executiveSummary,
                businessContext,
                approachIntro,
                timelineNote,
                nextStepText,
              }),
            )
          }
        >
          Save presentation
        </Button>
        {status === "DRAFT" ? (
          <Button
            type="button"
            disabled={isPending}
            onClick={() => run(() => markProposalReviewedAction(proposalId))}
          >
            {isPending ? (
              <LoaderCircle
                aria-hidden="true"
                className="size-4 animate-spin"
              />
            ) : null}
            Mark reviewed
          </Button>
        ) : null}
        {status === "REVIEWED" ? (
          <Button
            type="button"
            disabled={isPending}
            onClick={() => run(() => approveProposalAction(proposalId))}
          >
            {isPending ? (
              <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
            ) : null}
            Approve proposal
          </Button>
        ) : null}
      </div>
    </div>
  );
}
