"use client";

import { useState, useTransition } from "react";
import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";

import {
  approveOutreachDraft,
  generateProspectDraft,
  rejectOutreachDraft,
  saveOutreachDraft,
} from "@/app/reports/prospecting/outreach-actions";
import { Button } from "@/components/ui";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface OutreachDraftEditorProps {
  campaignId: string;
  prospectId: string;
  canGenerate: boolean;
  draft: {
    id: string;
    toEmail: string;
    subject: string;
    bodyText: string;
    status: string;
    model: string | null;
  } | null;
}

export function OutreachDraftEditor({
  campaignId,
  prospectId,
  canGenerate,
  draft,
}: OutreachDraftEditorProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [subject, setSubject] = useState(draft?.subject ?? "");
  const [body, setBody] = useState(draft?.bodyText ?? "");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function run(action: () => Promise<{ success: boolean; message?: string }>) {
    setError(null);
    setMessage(null);

    startTransition(async () => {
      const result = await action();

      if (!result.success) {
        setError(result.message ?? "The draft could not be updated.");
        return;
      }

      setMessage(result.message ?? "Updated.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <h2 className="font-heading text-xl font-semibold text-brand">
        Outreach draft
      </h2>
      <p className="text-sm leading-6 text-muted">
        No email is sent from this screen in Sprint 4.
      </p>
      {draft ? (
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            run(() =>
              saveOutreachDraft({
                campaignId,
                prospectId,
                messageId: draft.id,
                subject,
                body,
              }),
            );
          }}
        >
          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
              To
            </label>
            <p className="mt-1 text-sm text-brand">{draft.toEmail}</p>
          </div>
          <div>
            <label
              htmlFor="outreach-subject"
              className="text-xs font-semibold uppercase tracking-[0.08em] text-muted"
            >
              Subject
            </label>
            <Input
              id="outreach-subject"
              className="mt-1"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
            />
          </div>
          <div>
            <label
              htmlFor="outreach-body"
              className="text-xs font-semibold uppercase tracking-[0.08em] text-muted"
            >
              Body
            </label>
            <Textarea
              id="outreach-body"
              className="mt-1 min-h-48"
              value={body}
              onChange={(event) => setBody(event.target.value)}
            />
          </div>
          <p className="text-xs text-muted">
            Status: {draft.status.toLowerCase().replaceAll("_", " ")}
            {draft.model ? ` · ${draft.model}` : ""}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <LoaderCircle
                  aria-hidden="true"
                  className="size-4 animate-spin"
                />
              ) : null}
              Save Draft
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() =>
                run(() => generateProspectDraft(campaignId, prospectId, true))
              }
            >
              Regenerate Draft
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() =>
                run(() =>
                  rejectOutreachDraft(campaignId, prospectId, draft.id),
                )
              }
            >
              Reject Draft
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() =>
                run(() =>
                  approveOutreachDraft(campaignId, prospectId, draft.id),
                )
              }
            >
              Mark Approved
            </Button>
          </div>
        </form>
      ) : (
        <div className="space-y-3">
          <p className="text-sm leading-6 text-muted">
            {canGenerate
              ? "No current draft. Generate one only after a public contact and audit finding are in place."
              : "This prospect is not ready for a draft."}
          </p>
          {canGenerate ? (
            <Button
              type="button"
              disabled={isPending}
              onClick={() =>
                run(() => generateProspectDraft(campaignId, prospectId))
              }
            >
              {isPending ? (
                <LoaderCircle
                  aria-hidden="true"
                  className="size-4 animate-spin"
                />
              ) : null}
              Generate Draft
            </Button>
          ) : null}
        </div>
      )}
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      {message ? <p className="text-sm text-brand">{message}</p> : null}
    </div>
  );
}
