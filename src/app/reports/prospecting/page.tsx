import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, MapPin, Plus, Target } from "lucide-react";

import { Button, Card, Container, GridPattern } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import { campaignStatusLabel } from "@/lib/prospecting/labels";

export const metadata: Metadata = {
  title: "Prospecting",
  description:
    "Internal JS Solutions prospecting campaigns and discovered businesses.",
  robots: {
    index: false,
    follow: false,
  },
};

function formatDate(value: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
  }).format(value);
}

export default async function ProspectingDashboardPage() {
  const campaigns = await prisma.campaign.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: {
          campaignProspects: true,
        },
      },
    },
  });

  return (
    <main className="min-h-screen bg-slate-50/60">
      <section className="relative isolate overflow-hidden bg-brand text-white">
        <GridPattern className="opacity-35" />
        <Container className="relative py-10 sm:py-12 lg:py-14">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-300">
                Internal prospecting
              </p>
              <h1 className="mt-5 font-heading text-3xl font-bold tracking-[-0.04em] text-white sm:text-4xl">
                Prospecting Engine
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300 sm:text-lg">
                Internal prospecting workspace. Businesses here are not Leads
                until they express interest or are explicitly converted.
              </p>
            </div>

            <Button
              size="lg"
              nativeButton={false}
              render={<Link href="/reports/prospecting/new" />}
            >
              <Plus aria-hidden="true" className="size-4" />
              New Campaign
            </Button>
          </div>
        </Container>
      </section>

      <Container className="space-y-8 py-8 sm:py-10 lg:py-12">
        <Card variant="brand" padding="lg">
          <p className="text-sm leading-6 text-brand">
              Optimize for five credible, qualified prospects—not five emails
              sent. Discover businesses, import selected results, then audit
              and qualify. Drafts and sending come later and still require
              human approval.
          </p>
        </Card>

        {campaigns.length === 0 ? (
          <Card variant="elevated" padding="lg">
            <h2 className="font-heading text-2xl font-semibold text-brand">
              No campaigns yet
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
              Create a campaign for a location and industry set, then add
              businesses by hand. These rows stay out of the inbound audit
              pipeline.
            </p>
            <Button
              className="mt-6"
              nativeButton={false}
              render={<Link href="/reports/prospecting/new" />}
            >
              New Campaign
              <ArrowRight aria-hidden="true" className="size-4" />
            </Button>
          </Card>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border bg-white">
            <table className="w-full min-w-[48rem] text-left text-sm">
              <thead className="border-b border-border bg-slate-50 text-xs uppercase tracking-[0.08em] text-muted">
                <tr>
                  <th className="px-4 py-3 font-semibold">Campaign</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Location</th>
                  <th className="px-4 py-3 font-semibold">Industries</th>
                  <th className="px-4 py-3 font-semibold">Desired</th>
                  <th className="px-4 py-3 font-semibold">Prospects</th>
                  <th className="px-4 py-3 font-semibold">Created</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((campaign) => (
                  <tr
                    key={campaign.id}
                    className="border-b border-border last:border-b-0"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/reports/prospecting/${campaign.id}`}
                        className="font-semibold text-brand-blue hover:underline"
                      >
                        {campaign.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      {campaignStatusLabel(campaign.status)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin
                          aria-hidden="true"
                          className="size-3.5 text-muted"
                        />
                        {campaign.locationLabel}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {campaign.industries.join(", ") || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5">
                        <Target
                          aria-hidden="true"
                          className="size-3.5 text-muted"
                        />
                        {campaign.desiredQualifiedCount}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {campaign._count.campaignProspects}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {formatDate(campaign.createdAt)}
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
