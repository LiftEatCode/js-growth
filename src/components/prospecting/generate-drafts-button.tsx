"use client";

import { useState, useTransition } from "react";
import { LoaderCircle, PenLine } from "lucide-react";
import { useRouter } from "next/navigation";

import { startCampaignOutreachDrafts } from "@/app/reports/prospecting/outreach-actions";
import { Button } from "@/components/ui";

interface GenerateDraftsButtonProps {
  campaignId: string;
  missingCount: number;
}

export function GenerateDraftsButton({
  campaignId,
  missingCount,
}: GenerateDraftsButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    setMessage(null);

    startTransition(async () => {
      const result = await startCampaignOutreachDrafts(campaignId);

      if (!result.success) {
        setError(result.message ?? "Drafts could not be generated.");
        return;
      }

      setMessage(result.message ?? "Drafts updated.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      <Button type="button" onClick={handleClick} disabled={isPending}>
        {isPending ? (
          <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
        ) : (
          <PenLine aria-hidden="true" className="size-4" />
        )}
        {isPending ? "Generating drafts…" : "Generate Missing Drafts"}
      </Button>
      {missingCount > 5 ? (
        <p className="max-w-xs text-xs leading-5 text-muted">
          {missingCount} selected prospects still need drafts. This run will
          process 5.
        </p>
      ) : null}
      {error ? (
        <p className="max-w-xs text-xs leading-5 text-red-700">{error}</p>
      ) : null}
      {message ? (
        <p className="max-w-xs text-xs leading-5 text-brand">{message}</p>
      ) : null}
    </div>
  );
}
