import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Link2,
} from "lucide-react";

import { Button } from "@/components/ui";

interface SavedReportLinkProps {
  reportId: string;
}

export function SavedReportLink({
  reportId,
}: SavedReportLinkProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-emerald-200 bg-emerald-50/60 shadow-sm">
      <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex items-start gap-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-emerald-200 bg-white text-emerald-600 shadow-sm">
            <CheckCircle2
              aria-hidden="true"
              className="size-5"
            />
          </span>

          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
              <Link2
                aria-hidden="true"
                className="size-3.5"
              />

              Saved Report
            </div>

            <p className="mt-2 font-heading text-lg font-semibold text-brand">
              Your website audit has been saved.
            </p>

            <p className="mt-1 text-sm leading-6 text-muted">
              You can return to this audit using its unique report link.
            </p>
          </div>
        </div>

        <Button
          size="lg"
          variant="outline"
          nativeButton={false}
          render={
            <Link
              href={`/report/${reportId}`}
            />
          }
          className="shrink-0 bg-white"
        >
          Open Saved Report

          <ArrowRight
            aria-hidden="true"
            className="ml-1 size-4"
          />
        </Button>
      </div>
    </div>
  );
}