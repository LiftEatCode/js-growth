"use client";

import { useState, useTransition } from "react";
import { LoaderCircle, Search } from "lucide-react";
import { useRouter } from "next/navigation";

import { startCampaignCompetitorDiscovery } from "@/app/reports/prospecting/competitor-actions";
import { Button } from "@/components/ui";

interface FindCompetitorsButtonProps {
  campaignId: string;
}

export function FindCompetitorsButton({
  campaignId,
}: FindCompetitorsButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    setMessage(null);

    startTransition(async () => {
      const result = await startCampaignCompetitorDiscovery(campaignId);

      if (!result.success) {
        setError(result.message ?? "Competitor discovery could not be started.");
        return;
      }

      setMessage(result.message ?? "Competitor discovery completed.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      <Button type="button" onClick={handleClick} disabled={isPending}>
        {isPending ? (
          <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
        ) : (
          <Search aria-hidden="true" className="size-4" />
        )}
        {isPending ? "Finding competitors…" : "Find Competitors"}
      </Button>
      <p className="max-w-xs text-xs leading-5 text-muted">
        Processes up to 5 selected qualified prospects. Does not audit competitor
        websites or send outreach.
      </p>
      {error ? (
        <p className="max-w-xs text-xs leading-5 text-red-700">{error}</p>
      ) : null}
      {message ? (
        <p className="max-w-xs text-xs leading-5 text-brand">{message}</p>
      ) : null}
    </div>
  );
}
