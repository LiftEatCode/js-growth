import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Button, Card, Container } from "@/components/ui";
import { ImportDiscoveryForm } from "@/components/prospecting/import-discovery-form";
import { prisma } from "@/lib/prisma";

export const maxDuration = 60;

interface DiscoveryRunPageProps {
  params: Promise<{
    campaignId: string;
    runId: string;
  }>;
}

export const metadata: Metadata = {
  title: "Discovery Review",
  description: "Internal Google Places discovery candidate review.",
  robots: {
    index: false,
    follow: false,
  },
};

function formatDate(value: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

export default async function DiscoveryRunPage({
  params,
}: DiscoveryRunPageProps) {
  const { campaignId, runId } = await params;

  const run = await prisma.prospectDiscoveryRun.findFirst({
    where: {
      id: runId,
      campaignId,
    },
    include: {
      campaign: {
        select: {
          id: true,
          name: true,
        },
      },
      candidates: {
        orderBy: [{ status: "asc" }, { businessName: "asc" }],
      },
    },
  });

  if (!run) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-slate-50/60">
      <Container className="space-y-8 py-8 sm:py-10 lg:py-12">
        <Button
          variant="outline"
          size="sm"
          nativeButton={false}
          render={<Link href={`/reports/prospecting/${campaignId}`} />}
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Back to campaign
        </Button>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-blue">
            {run.status === "RUNNING"
              ? "Discovery running"
              : run.status === "FAILED"
                ? "Discovery failed"
                : "Discovery review"}
          </p>
          <h1 className="mt-3 font-heading text-3xl font-semibold text-brand">
            {run.campaign.name}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
            Review Google Places candidates for {run.requestedLocation}
            {run.radiusMiles ? ` (${run.radiusMiles} miles)` : ""}. Import
            selected eligible businesses only. Website audits are not run from
            this screen.
          </p>
        </div>

        <Card variant="elevated" padding="lg">
          <h2 className="font-heading text-xl font-semibold text-brand">
            Run statistics
          </h2>
          <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
                Provider
              </dt>
              <dd className="mt-1 text-sm text-brand">{run.provider}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
                Provider requests
              </dt>
              <dd className="mt-1 text-sm text-brand">
                {run.providerRequestCount}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
                Returned
              </dt>
              <dd className="mt-1 text-sm text-brand">{run.returnedCount}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
                Eligible
              </dt>
              <dd className="mt-1 text-sm text-brand">{run.eligibleCount}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
                Duplicates filtered
              </dt>
              <dd className="mt-1 text-sm text-brand">
                {run.skippedDuplicateCount}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
                Suppressed
              </dt>
              <dd className="mt-1 text-sm text-brand">
                {run.skippedSuppressedCount}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
                No website
              </dt>
              <dd className="mt-1 text-sm text-brand">
                {run.skippedNoWebsiteCount}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
                Imported
              </dt>
              <dd className="mt-1 text-sm text-brand">{run.importedCount}</dd>
            </div>
          </dl>
          <p className="mt-4 text-xs text-muted">
            Started {formatDate(run.startedAt)}
            {run.completedAt ? ` · Completed ${formatDate(run.completedAt)}` : ""}
            {` · Limit ${run.requestedLimit}`}
          </p>
          {run.errorMessage ? (
            <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
              {run.errorMessage}
            </p>
          ) : null}
        </Card>

        {run.status === "RUNNING" ? (
          <Card variant="elevated" padding="lg">
            <h2 className="font-heading text-xl font-semibold text-brand">
              Discovery in progress
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
              Refresh this page in a moment. A second discovery run cannot
              start until this one finishes.
            </p>
          </Card>
        ) : (
          <ImportDiscoveryForm
            campaignId={campaignId}
            runId={runId}
            candidates={run.candidates}
          />
        )}
      </Container>
    </main>
  );
}
