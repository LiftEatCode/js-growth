"use client";

import { useState, useTransition } from "react";
import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";

import { setProspectOutreachSelection } from "@/app/reports/prospecting/selection-actions";
import { Button } from "@/components/ui";
import type { OutreachSelectionKind } from "@/lib/prospecting/selection/outreach-selection";
import {
  canToggleManualOutreachSelection,
  isProspectSelectedForOutreach,
  outreachSelectionLabel,
} from "@/lib/prospecting/selection/outreach-selection";

interface ProspectOutreachSelectionControlProps {
  campaignId: string;
  prospectId: string;
  qualificationStatus: string;
  isSelectedTopN: boolean;
  isSelectedForOutreach: boolean;
  variant?: "table" | "detail";
}

export function ProspectOutreachSelectionControl({
  campaignId,
  prospectId,
  qualificationStatus,
  isSelectedTopN,
  isSelectedForOutreach,
  variant = "table",
}: ProspectOutreachSelectionControlProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const effectivelySelected = isProspectSelectedForOutreach({
    isSelectedTopN,
    isSelectedForOutreach,
  });
  const toggleAllowed = canToggleManualOutreachSelection({ qualificationStatus });
  const selectionKind: OutreachSelectionKind = isSelectedTopN
    ? isSelectedForOutreach
      ? "TOP_N_AND_MANUAL"
      : "TOP_N"
    : isSelectedForOutreach
      ? "MANUAL"
      : "NONE";
  const selectionText = outreachSelectionLabel(selectionKind);

  function handleToggle(selected: boolean) {
    setError(null);

    startTransition(async () => {
      const result = await setProspectOutreachSelection(
        campaignId,
        prospectId,
        selected,
      );

      if (!result.success) {
        setError(result.message ?? "Outreach selection could not be updated.");
        return;
      }

      router.refresh();
    });
  }

  if (variant === "detail") {
    if (isSelectedTopN && !isSelectedForOutreach) {
      return (
        <div className="space-y-2">
          <p className="text-sm text-brand">Outreach: Top N recommendation</p>
          <p className="text-xs text-muted">
            This prospect is included automatically by qualification ranking.
          </p>
        </div>
      );
    }

    if (effectivelySelected && isSelectedForOutreach) {
      return (
        <div className="space-y-2">
          <p className="text-sm text-brand">
            Outreach: {selectionText ?? "Selected"}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={() => handleToggle(false)}
          >
            {isPending ? (
              <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
            ) : null}
            Remove from Outreach
          </Button>
          {error ? (
            <p className="text-xs leading-5 text-red-700">{error}</p>
          ) : null}
        </div>
      );
    }

    if (!toggleAllowed.allowed) {
      return (
        <p className="text-sm text-muted">
          Outreach selection is available for qualified prospects only.
        </p>
      );
    }

    return (
      <div className="space-y-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={() => handleToggle(true)}
        >
          {isPending ? (
            <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
          ) : null}
          Select for Outreach
        </Button>
        {error ? (
          <p className="text-xs leading-5 text-red-700">{error}</p>
        ) : null}
      </div>
    );
  }

  const checkboxDisabled =
    isPending || isSelectedTopN || !toggleAllowed.allowed;

  return (
    <div className="space-y-1">
      <label className="inline-flex items-center gap-2">
        <input
          type="checkbox"
          className="size-4 rounded border-border text-brand-blue focus:ring-brand-blue"
          checked={effectivelySelected}
          disabled={checkboxDisabled}
          onChange={(event) => handleToggle(event.target.checked)}
          aria-label={
            effectivelySelected
              ? "Selected for outreach"
              : "Select for outreach"
          }
        />
        <span className="text-sm text-brand">
          {effectivelySelected ? "Selected" : "Not selected"}
        </span>
      </label>
      {selectionText ? (
        <p className="text-xs text-muted">{selectionText}</p>
      ) : null}
      {!toggleAllowed.allowed && !isSelectedTopN ? (
        <p className="text-xs text-muted">Qualified prospects only</p>
      ) : null}
      {error ? (
        <p className="text-xs leading-5 text-red-700">{error}</p>
      ) : null}
    </div>
  );
}
