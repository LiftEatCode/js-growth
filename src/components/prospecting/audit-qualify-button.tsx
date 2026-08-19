"use client";

import { useState, useTransition } from "react";
import { LoaderCircle, ScanSearch } from "lucide-react";
import { useRouter } from "next/navigation";

import { startCampaignQualification } from "@/app/reports/prospecting/qualification-actions";
import { Button } from "@/components/ui";

interface AuditQualifyButtonProps {
  campaignId: string;
  remainingUnaudited: number;
}

export function AuditQualifyButton({
  campaignId,
  remainingUnaudited,
}: AuditQualifyButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    setMessage(null);

    startTransition(async () => {
      const result = await startCampaignQualification(campaignId);

      if (!result.success) {
        setError(result.message ?? "Qualification could not be started.");
        return;
      }

      setMessage(result.message ?? "Qualification completed.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      <Button type="button" onClick={handleClick} disabled={isPending}>
        {isPending ? (
          <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
        ) : (
          <ScanSearch aria-hidden="true" className="size-4" />
        )}
        {isPending ? "Auditing…" : "Audit & Qualify Prospects"}
      </Button>
      {remainingUnaudited > 10 ? (
        <p className="max-w-xs text-xs leading-5 text-muted">
          {remainingUnaudited} unaudited prospects. This run will process 10.
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
