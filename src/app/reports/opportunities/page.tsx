import Link from "next/link";
import type { Metadata } from "next";

import { Button, Card, Container, GridPattern } from "@/components/ui";
import { getServiceCapabilityDisplayName } from "@/lib/commercialization/capabilities";
import type { ServiceCapabilityId } from "@/lib/commercialization/capabilities";
import {
  OPPORTUNITY_STAGES,
  opportunityStageLabel,
  type OpportunityStage,
} from "@/lib/commercialization/opportunities/constants";
import { listOpportunities } from "@/lib/commercialization/opportunities/load";

export const metadata: Metadata = {
  title: "Opportunities",
  description: "Internal JS Solutions opportunity pipeline.",
  robots: {
    index: false,
    follow: false,
  },
};

function formatDate(value: Date | null): string {
  if (!value) {
    return "—";
  }
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
  }).format(value);
}

interface OpportunitiesPageProps {
  searchParams: Promise<{
    stage?: string;
    next?: string;
    owner?: string;
    capability?: string;
  }>;
}

export default async function OpportunitiesPage({
  searchParams,
}: OpportunitiesPageProps) {
  const params = await searchParams;
  const stageParam = params.stage ?? "ALL_ACTIVE";
  const nextParam = params.next ?? "any";
  const owner = params.owner?.trim() || null;
  const capability = (params.capability?.trim() ||
    null) as ServiceCapabilityId | null;

  const stageFilter =
    stageParam === "ALL" || stageParam === "ALL_ACTIVE"
      ? (stageParam as "ALL" | "ALL_ACTIVE")
      : OPPORTUNITY_STAGES.includes(stageParam as OpportunityStage)
        ? (stageParam as OpportunityStage)
        : "ALL_ACTIVE";

  const nextActionState =
    nextParam === "overdue" ||
    nextParam === "upcoming" ||
    nextParam === "none" ||
    nextParam === "any"
      ? nextParam
      : "any";

  const opportunities = await listOpportunities({
    stage: stageFilter,
    ownerEmail: owner,
    nextActionState,
    capability,
  });

  return (
    <main className="min-h-screen bg-slate-50/60">
      <section className="relative isolate overflow-hidden bg-brand text-white">
        <GridPattern className="opacity-35" />
        <Container className="relative py-10 sm:py-12 lg:py-14">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-300">
            Internal commercial
          </p>
          <h1 className="mt-5 font-heading text-3xl font-bold tracking-[-0.04em] text-white sm:text-4xl">
            Opportunities
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300 sm:text-lg">
            Human-created commercial pursuits. Intelligence is referenced, not
            recalculated. No pricing, proposals, or automated outreach in V1.
          </p>
        </Container>
      </section>

      <Container className="space-y-6 py-8 sm:py-10">
        <Card variant="elevated" padding="lg">
          <form className="flex flex-wrap items-end gap-3 text-sm">
            <label className="space-y-1">
              <span className="text-muted">Stage</span>
              <select
                name="stage"
                defaultValue={stageFilter}
                className="block rounded-lg border border-border bg-white px-3 py-2"
              >
                <option value="ALL_ACTIVE">Active only</option>
                <option value="ALL">All</option>
                {OPPORTUNITY_STAGES.map((stage) => (
                  <option key={stage} value={stage}>
                    {opportunityStageLabel(stage)}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-muted">Next action</span>
              <select
                name="next"
                defaultValue={nextActionState}
                className="block rounded-lg border border-border bg-white px-3 py-2"
              >
                <option value="any">Any</option>
                <option value="overdue">Overdue</option>
                <option value="upcoming">Upcoming</option>
                <option value="none">None</option>
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-muted">Owner email</span>
              <input
                name="owner"
                defaultValue={owner ?? ""}
                className="block rounded-lg border border-border bg-white px-3 py-2"
                placeholder="optional"
              />
            </label>
            <Button type="submit" variant="outline">
              Filter
            </Button>
          </form>
        </Card>

        {opportunities.length === 0 ? (
          <Card variant="elevated" padding="lg">
            <h2 className="font-heading text-xl font-semibold text-brand">
              No opportunities match
            </h2>
            <p className="mt-2 text-sm text-muted">
              Create an Opportunity from a Prospect detail page when you decide
              to pursue the business commercially.
            </p>
          </Card>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border bg-white">
            <table className="w-full min-w-[56rem] text-left text-sm">
              <thead className="border-b border-border bg-slate-50 text-xs uppercase tracking-[0.08em] text-muted">
                <tr>
                  <th className="px-4 py-3 font-semibold">Business</th>
                  <th className="px-4 py-3 font-semibold">Stage</th>
                  <th className="px-4 py-3 font-semibold">Capabilities</th>
                  <th className="px-4 py-3 font-semibold">Score</th>
                  <th className="px-4 py-3 font-semibold">Next action</th>
                  <th className="px-4 py-3 font-semibold">Owner</th>
                  <th className="px-4 py-3 font-semibold">Updated</th>
                </tr>
              </thead>
              <tbody>
                {opportunities.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-border last:border-b-0"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/reports/opportunities/${row.id}`}
                        className="font-semibold text-brand-blue hover:underline"
                      >
                        {row.businessName}
                      </Link>
                      <p className="text-xs text-muted">
                        {row.locationLabel ?? "—"}
                      </p>
                    </td>
                    <td className="px-4 py-3">{row.stageLabel}</td>
                    <td className="px-4 py-3 text-xs text-muted">
                      {row.capabilities.length > 0
                        ? row.capabilities
                            .map((id) => getServiceCapabilityDisplayName(id))
                            .join(", ")
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {row.overallScore != null ? row.overallScore : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <p>{row.nextAction ?? "—"}</p>
                      <p className="text-xs text-muted">
                        {formatDate(row.nextActionAt)}
                        {row.nextActionState === "overdue" ? " · Overdue" : ""}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-xs">{row.ownerEmail}</td>
                    <td className="px-4 py-3 text-xs">
                      {formatDate(row.lastActivityAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Container>
    </main>
  );
}
