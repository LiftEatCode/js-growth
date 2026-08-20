import Link from "next/link";

import { Button } from "@/components/ui";
import type { CompetitiveReportReadiness } from "@/lib/competitive-intelligence/report/types";

export function CompetitiveReportPreviewLink(props: {
  campaignId: string;
  prospectId: string;
  readiness: CompetitiveReportReadiness;
}) {
  const href = `/reports/prospecting/${props.campaignId}/prospects/${props.prospectId}/competitive-report`;

  if (!props.readiness.ready) {
    return (
      <div className="rounded-xl border border-border/80 bg-surface/40 px-4 py-3">
        <p className="text-sm font-medium text-brand">
          Competitive Growth Analysis
        </p>
        <p className="mt-1 text-sm text-muted">{props.readiness.message}</p>
        <Button type="button" variant="outline" className="mt-3" disabled>
          Preview Competitive Growth Analysis
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/80 bg-surface/40 px-4 py-3">
      <p className="text-sm font-medium text-brand">
        Competitive Growth Analysis
      </p>
      <p className="mt-1 text-sm text-muted">
        Client-ready preview using the current comparison and interpretation.
      </p>
      <Button
        className="mt-3"
        nativeButton={false}
        render={<Link href={href} />}
      >
        Preview Competitive Growth Analysis
      </Button>
    </div>
  );
}
