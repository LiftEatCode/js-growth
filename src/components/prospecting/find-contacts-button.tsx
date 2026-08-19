"use client";

import { useState, useTransition } from "react";
import { LoaderCircle, MailSearch } from "lucide-react";
import { useRouter } from "next/navigation";

import { startCampaignContactDiscovery } from "@/app/reports/prospecting/contact-actions";
import { Button } from "@/components/ui";

interface FindContactsButtonProps {
  campaignId: string;
  pendingCount: number;
}

export function FindContactsButton({
  campaignId,
  pendingCount,
}: FindContactsButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    setMessage(null);

    startTransition(async () => {
      const result = await startCampaignContactDiscovery(campaignId);

      if (!result.success) {
        setError(result.message ?? "Contact discovery could not be started.");
        return;
      }

      setMessage(result.message ?? "Contact discovery completed.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      <Button type="button" onClick={handleClick} disabled={isPending}>
        {isPending ? (
          <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
        ) : (
          <MailSearch aria-hidden="true" className="size-4" />
        )}
        {isPending ? "Finding contacts…" : "Find Contacts"}
      </Button>
      {pendingCount > 10 ? (
        <p className="max-w-xs text-xs leading-5 text-muted">
          {pendingCount} selected prospects may need contacts. This run will
          process 10.
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
