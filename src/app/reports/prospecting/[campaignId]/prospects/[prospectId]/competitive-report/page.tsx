import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { CompetitiveGrowthReportView } from "@/components/prospecting/competitive-growth-report-view";
import { Button, Container } from "@/components/ui";
import { loadCompetitiveGrowthReport } from "@/lib/competitive-intelligence/report/load";

interface CompetitiveReportPageProps {
  params: Promise<{
    campaignId: string;
    prospectId: string;
  }>;
}

export const metadata: Metadata = {
  title: "Competitive Growth Analysis",
  description: "Internal client-ready Competitive Growth Analysis preview.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function CompetitiveReportPage({
  params,
}: CompetitiveReportPageProps) {
  const { campaignId, prospectId } = await params;
  const loaded = await loadCompetitiveGrowthReport({
    campaignId,
    prospectId,
  });

  if (!loaded.prospectBusinessName) {
    notFound();
  }

  const backHref = `/reports/prospecting/${campaignId}/prospects/${prospectId}`;

  return (
    <div className="bg-surface py-8 print:bg-white print:py-0">
      <Container className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={<Link href={backHref} />}
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            Back to prospect
          </Button>
          <p className="text-xs text-muted">
            Internal preview · not publicly accessible
          </p>
        </div>

        {!loaded.readiness.ready || !loaded.report ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-6 text-amber-950">
            <h1 className="font-heading text-xl font-semibold">
              Competitive Growth Analysis not ready
            </h1>
            <p className="mt-2 text-sm">{loaded.readiness.message}</p>
            {loaded.readiness.comparisonStaleReasons.length > 0 ? (
              <ul className="mt-3 list-disc pl-5 text-sm">
                {loaded.readiness.comparisonStaleReasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            ) : null}
            {loaded.readiness.interpretationStaleReasons.length > 0 ? (
              <ul className="mt-3 list-disc pl-5 text-sm">
                {loaded.readiness.interpretationStaleReasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            ) : null}
            <div className="mt-4">
              <Button
                variant="outline"
                nativeButton={false}
                render={<Link href={backHref} />}
              >
                Return to prospect detail
              </Button>
            </div>
          </div>
        ) : (
          <CompetitiveGrowthReportView report={loaded.report} />
        )}
      </Container>
    </div>
  );
}
