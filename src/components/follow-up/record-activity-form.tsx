"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui";
import {
  FOLLOW_UP_ACTIVITY_TYPES,
  FOLLOW_UP_DIRECTIONS,
  FOLLOW_UP_OUTCOMES,
  type FollowUpSubjectKind,
} from "@/lib/follow-up/constants";
import { recordFollowUpActivityAction } from "@/app/reports/growth/follow-up/actions";

type Props = {
  subjectKind: FollowUpSubjectKind;
  subjectId: string;
  outboundBlocked?: boolean;
  defaultDirection?: "INBOUND" | "OUTBOUND" | "INTERNAL";
};

export function RecordFollowUpActivityForm({
  subjectKind,
  subjectId,
  outboundBlocked = false,
  defaultDirection = "OUTBOUND",
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const locked = useRef(false);
  const idempotencyKey = useRef(
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `fu-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  );

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (locked.current || pending) {
      return;
    }
    locked.current = true;
    setError(null);
    setSuccess(null);

    const formData = new FormData(event.currentTarget);
    formData.set("subjectKind", subjectKind);
    formData.set("subjectId", subjectId);
    formData.set("idempotencyKey", idempotencyKey.current);

    startTransition(async () => {
      const result = await recordFollowUpActivityAction(formData);
      if (!result.ok) {
        setError(
          result.error === "do_not_contact"
            ? "Outbound blocked — do not contact / suppressed."
            : result.error,
        );
        locked.current = false;
        return;
      }
      setSuccess(
        result.deduplicated
          ? "Already recorded (duplicate submit ignored)."
          : "Activity recorded.",
      );
      idempotencyKey.current =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `fu-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      locked.current = false;
      router.refresh();
    });
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-3 rounded-lg border border-border bg-white p-4"
      data-testid="record-follow-up-activity"
    >
      <h3 className="text-sm font-semibold text-brand">Record activity</h3>
      <p className="text-xs text-muted">
        Internal operator history only. Does not send email/SMS. Does not change
        acquisition attribution.
      </p>

      {outboundBlocked ? (
        <p
          className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900"
          data-testid="outbound-blocked"
        >
          Outbound contact is blocked (suppression / do-not-contact). You may
          still add an INTERNAL note.
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-xs font-medium text-brand">
          Channel
          <select
            name="activityType"
            required
            defaultValue="PHONE_CALL"
            className="mt-1 w-full rounded-md border border-border px-2 py-2 text-sm"
            disabled={pending}
          >
            {FOLLOW_UP_ACTIVITY_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs font-medium text-brand">
          Direction
          <select
            name="direction"
            required
            defaultValue={outboundBlocked ? "INTERNAL" : defaultDirection}
            className="mt-1 w-full rounded-md border border-border px-2 py-2 text-sm"
            disabled={pending}
          >
            {FOLLOW_UP_DIRECTIONS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs font-medium text-brand">
          Outcome
          <select
            name="outcome"
            required
            defaultValue="NO_ANSWER"
            className="mt-1 w-full rounded-md border border-border px-2 py-2 text-sm"
            disabled={pending}
          >
            {FOLLOW_UP_OUTCOMES.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs font-medium text-brand">
          Next follow-up (optional)
          <input
            type="date"
            name="nextFollowUpAt"
            className="mt-1 w-full rounded-md border border-border px-2 py-2 text-sm"
            disabled={pending}
          />
        </label>
      </div>

      <label className="flex items-center gap-2 text-xs text-muted">
        <input type="checkbox" name="clearFollowUp" value="1" disabled={pending} />
        No follow-up scheduled (clear date)
      </label>

      <label className="block text-xs font-medium text-brand">
        Summary (internal)
        <textarea
          name="summary"
          required
          rows={3}
          maxLength={4000}
          placeholder="What happened? Internal note only — not a customer message."
          className="mt-1 w-full rounded-md border border-border px-2 py-2 text-sm"
          disabled={pending}
        />
      </label>

      {error ? (
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="text-sm text-green-800" data-testid="activity-success">
          {success}
        </p>
      ) : null}

      <Button type="submit" disabled={pending || locked.current}>
        {pending ? "Saving…" : "Save activity"}
      </Button>
    </form>
  );
}
