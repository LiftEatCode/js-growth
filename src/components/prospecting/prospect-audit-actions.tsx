"use client";

import { useState, useTransition } from "react";
import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";

import {
  auditAndQualifyProspect,
  recalculateProspectQualification,
} from "@/app/reports/prospecting/qualification-actions";
import { Button } from "@/components/ui";

interface ProspectAuditActionsProps {
  campaignId: string;
  prospectId: string;
  hasAudit: boolean;
}

export function ProspectAuditActions({
  campaignId,
  prospectId,
  hasAudit,
}: ProspectAuditActionsProps) {
  const router = useRouter();
  const [isAuditing, startAudit] = useTransition();
  const [isRecalculating, startRecalc] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function run(force: boolean) {
    setError(null);
    setMessage(null);

    startAudit(async () => {
      const result = await auditAndQualifyProspect(
        campaignId,
        prospectId,
        force,
      );

      if (!result.success) {
        setError(result.message ?? "The audit could not be completed.");
        return;
      }

      setMessage(result.message ?? "Audit updated.");
      router.refresh();
    });
  }

  function recalculate() {
    setError(null);
    setMessage(null);

    startRecalc(async () => {
      const result = await recalculateProspectQualification(
        campaignId,
        prospectId,
      );

      if (!result.success) {
        setError(result.message ?? "Qualification could not be recalculated.");
        return;
      }

      setMessage(result.message ?? "Qualification recalculated.");
      router.refresh();
    });
  }

  const busy = isAuditing || isRecalculating;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={() => run(false)} disabled={busy}>
          {isAuditing ? (
            <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
          ) : null}
          {hasAudit ? "Run Audit" : "Run Audit"}
        </Button>
        {hasAudit ? (
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => run(true)}
              disabled={busy}
            >
              Re-run Audit
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={recalculate}
              disabled={busy}
            >
              {isRecalculating ? (
                <LoaderCircle
                  aria-hidden="true"
                  className="size-4 animate-spin"
                />
              ) : null}
              Recalculate Qualification
            </Button>
          </>
        ) : null}
      </div>
      {error ? (
        <p className="text-sm text-red-700">{error}</p>
      ) : null}
      {message ? <p className="text-sm text-brand">{message}</p> : null}
    </div>
  );
}
