import Link from "next/link";
import {
  ArrowRight,
  Link2,
} from "lucide-react";

import { Button } from "@/components/ui/button";

interface SavedReportLinkProps {
  reportId: string;
}

export function SavedReportLink({
  reportId,
}: SavedReportLinkProps) {
  return (
    <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Link2
              aria-hidden="true"
              className="size-5"
            />
          </div>

          <div>
            <p className="font-semibold text-foreground">
              Your report has been saved
            </p>

            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Open the saved report using its unique report
              link.
            </p>
          </div>
        </div>

        <Button
          nativeButton={false}
          render={
            <Link href={`/report/${reportId}`} />
          }
        >
          Open saved report

          <ArrowRight
            aria-hidden="true"
            className="ml-2 size-4"
          />
        </Button>
      </div>
    </div>
  );
}