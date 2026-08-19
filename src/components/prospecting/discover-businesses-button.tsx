"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Search } from "lucide-react";

import { startCampaignDiscovery } from "@/app/reports/prospecting/discovery-actions";
import { Button } from "@/components/ui";

interface DiscoverBusinessesButtonProps {
  campaignId: string;
  disabled?: boolean;
  disabledReason?: string;
}

export function DiscoverBusinessesButton({
  campaignId,
  disabled = false,
  disabledReason,
}: DiscoverBusinessesButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleDiscover() {
    setError(null);

    startTransition(async () => {
      const result = await startCampaignDiscovery(campaignId);

      if (result.runId) {
        router.push(
          `/reports/prospecting/${campaignId}/discovery/${result.runId}`,
        );
        return;
      }

      setError(result.message ?? "Discovery could not be started.");
    });
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        onClick={handleDiscover}
        disabled={disabled || isPending}
      >
        {isPending ? (
          <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
        ) : (
          <Search aria-hidden="true" className="size-4" />
        )}
        {isPending ? "Discovering…" : "Discover Businesses"}
      </Button>
      {disabled && disabledReason ? (
        <p className="max-w-xs text-xs leading-5 text-muted">{disabledReason}</p>
      ) : null}
      {error ? (
        <p className="max-w-xs text-xs leading-5 text-red-700">{error}</p>
      ) : null}
    </div>
  );
}
