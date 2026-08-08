"use client";

import { useState, useTransition } from "react";
import {
  AlertTriangle,
  LoaderCircle,
  Trash2,
  X,
} from "lucide-react";

import { deleteReport } from "@/app/reports/actions";
import { Button } from "@/components/ui/button";

interface ReportDeleteButtonProps {
  reportId: string;
  hostname: string;
}

export function ReportDeleteButton({
  reportId,
  hostname,
}: ReportDeleteButtonProps) {
  const [isConfirming, setIsConfirming] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [isPending, startTransition] =
    useTransition();

  function handleDelete(): void {
    setError(null);

    startTransition(async () => {
      const result =
        await deleteReport(reportId);

      if (!result.success) {
        setError(
          result.message ??
            "The report could not be deleted.",
        );

        return;
      }

      setIsConfirming(false);
    });
  }

  if (!isConfirming) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() =>
          setIsConfirming(true)
        }
      >
        <Trash2
          aria-hidden="true"
          className="size-4"
        />

        Delete
      </Button>
    );
  }

  return (
    <div className="w-full max-w-sm rounded-xl border border-destructive/20 bg-destructive/5 p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle
          aria-hidden="true"
          className="mt-0.5 size-4 shrink-0 text-destructive"
        />

        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground">
            Delete this report?
          </p>

          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            This will permanently delete
            the saved report for{" "}
            <span className="font-medium text-foreground">
              {hostname}
            </span>
            .
          </p>

          {error ? (
            <p className="mt-2 text-xs text-destructive">
              {error}
            </p>
          ) : null}

          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="destructive"
              disabled={isPending}
              onClick={handleDelete}
            >
              {isPending ? (
                <>
                  <LoaderCircle
                    aria-hidden="true"
                    className="size-4 animate-spin"
                  />
                  Deleting
                </>
              ) : (
                <>
                  <Trash2
                    aria-hidden="true"
                    className="size-4"
                  />
                  Confirm delete
                </>
              )}
            </Button>

            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={isPending}
              onClick={() => {
                setIsConfirming(false);
                setError(null);
              }}
            >
              <X
                aria-hidden="true"
                className="size-4"
              />

              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}