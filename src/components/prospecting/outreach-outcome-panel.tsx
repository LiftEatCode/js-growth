"use client";

import { useState, useTransition } from "react";
import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";

import { recordOutreachOutcome } from "@/app/reports/prospecting/outcome-actions";
import { Button } from "@/components/ui";
import { Textarea } from "@/components/ui/textarea";
import {
  OUTREACH_OUTCOME_VALUES,
  outreachOutcomeLabel,
  type OutreachOutcomeValue,
} from "@/lib/prospecting/outreach/outcome-types";

interface OutreachOutcomePanelProps {
  campaignId: string;
  prospectId: string;
  sentMessages: Array<{
    id: string;
    toEmail: string;
    subject: string;
    sentAt: string;
  }>;
}

export function OutreachOutcomePanel({
  campaignId,
  prospectId,
  sentMessages,
}: OutreachOutcomePanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [messageId, setMessageId] = useState(sentMessages[0]?.id ?? "");
  const [outcome, setOutcome] = useState<OutreachOutcomeValue>("REPLIED");
  const [notes, setNotes] = useState("");
  const [suppressFutureOutreach, setSuppressFutureOutreach] = useState(false);
  const [explicitOptOut, setExplicitOptOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  if (sentMessages.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h2 className="font-heading text-xl font-semibold text-brand">
        Record outcome
      </h2>
      <p className="text-sm leading-6 text-muted">
        Record what happened after a sent email. Nothing is inferred automatically.
      </p>

      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          setError(null);
          setMessage(null);

          startTransition(async () => {
            const result = await recordOutreachOutcome({
              campaignId,
              prospectId,
              messageId,
              outcome,
              notes,
              suppressFutureOutreach,
              explicitOptOut,
            });

            if (!result.success) {
              setError(result.message ?? "The outcome could not be recorded.");
              router.refresh();
              return;
            }

            setMessage(result.message ?? "Outcome recorded.");
            setNotes("");
            setSuppressFutureOutreach(false);
            setExplicitOptOut(false);
            router.refresh();
          });
        }}
      >
        <div>
          <label
            htmlFor="outcome-message"
            className="text-xs font-semibold uppercase tracking-[0.08em] text-muted"
          >
            Sent message
          </label>
          <select
            id="outcome-message"
            className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-brand"
            value={messageId}
            onChange={(event) => setMessageId(event.target.value)}
          >
            {sentMessages.map((sent) => (
              <option key={sent.id} value={sent.id}>
                {sent.toEmail} · {sent.subject} · {sent.sentAt}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="outcome-type"
            className="text-xs font-semibold uppercase tracking-[0.08em] text-muted"
          >
            Outcome
          </label>
          <select
            id="outcome-type"
            className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-brand"
            value={outcome}
            onChange={(event) =>
              setOutcome(event.target.value as OutreachOutcomeValue)
            }
          >
            {OUTREACH_OUTCOME_VALUES.map((value) => (
              <option key={value} value={value}>
                {outreachOutcomeLabel(value)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="outcome-notes"
            className="text-xs font-semibold uppercase tracking-[0.08em] text-muted"
          >
            Notes (optional)
          </label>
          <Textarea
            id="outcome-notes"
            className="mt-1 min-h-24"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder='Example: "Owner replied asking for pricing and a copy of the audit."'
          />
        </div>

        {outcome === "NOT_INTERESTED" ? (
          <div className="space-y-2 rounded-xl border border-border bg-slate-50 p-4 text-sm text-brand">
            <label className="flex items-start gap-2">
              <input
                type="checkbox"
                checked={suppressFutureOutreach}
                onChange={(event) =>
                  setSuppressFutureOutreach(event.target.checked)
                }
              />
              <span>Suppress future outreach to this business</span>
            </label>
            <label className="flex items-start gap-2">
              <input
                type="checkbox"
                checked={explicitOptOut}
                onChange={(event) => {
                  setExplicitOptOut(event.target.checked);

                  if (event.target.checked) {
                    setSuppressFutureOutreach(true);
                  }
                }}
              />
              <span>
                Recipient explicitly opted out (hard block on hostname and email)
              </span>
            </label>
          </div>
        ) : null}

        <Button type="submit" disabled={isPending || !messageId}>
          {isPending ? (
            <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
          ) : null}
          Save Outcome
        </Button>
      </form>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      {message ? <p className="text-sm text-brand">{message}</p> : null}
    </div>
  );
}
