"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui";
import { scheduleNurtureAction } from "@/app/reports/growth/follow-up/actions";
import type { FollowUpSubjectKind } from "@/lib/follow-up/constants";

type Props = {
  subjectKind: FollowUpSubjectKind;
  subjectId: string;
};

export function NurtureScheduleForm({ subjectKind, subjectId }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const locked = useRef(false);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (locked.current || pending) return;
    locked.current = true;
    setError(null);
    const formData = new FormData(event.currentTarget);
    formData.set("subjectKind", subjectKind);
    formData.set("subjectId", subjectId);
    formData.set(
      "idempotencyKey",
      `nurture:${subjectKind}:${subjectId}:${formData.get("nurtureDays")}:${Date.now()}`,
    );

    startTransition(async () => {
      const result = await scheduleNurtureAction(formData);
      locked.current = false;
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-2 rounded-lg border border-border bg-white p-4"
      data-testid="nurture-schedule"
    >
      <h3 className="text-sm font-semibold text-brand">Nurture</h3>
      <p className="text-xs text-muted">
        Operator-selected future review. Not an automatic drip campaign.
      </p>
      <label className="block text-xs font-medium text-brand">
        Review in
        <select
          name="nurtureDays"
          defaultValue="30"
          className="mt-1 w-full rounded-md border border-border px-2 py-2 text-sm"
          disabled={pending}
        >
          <option value="30">30 days</option>
          <option value="60">60 days</option>
          <option value="90">90 days</option>
        </select>
      </label>
      {error ? (
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Scheduling…" : "Move to nurture"}
      </Button>
    </form>
  );
}
