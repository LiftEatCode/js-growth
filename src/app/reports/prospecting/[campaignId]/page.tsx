import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AlertTriangle, ArrowLeft, Plus } from "lucide-react";

import { Button, Card, Container } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import { findDuplicateHostnames } from "@/lib/prospecting/duplicate-lookup";
import { DUPLICATE_WARNING_NOTICE } from "@/lib/prospecting/constants";
import {
  campaignStatusLabel,
  formatProspectLocation,
  outreachStatusLabel,
  qualificationStatusLabel,
} from "@/lib/prospecting/labels";

interface CampaignPageProps {
  params: Promise<{
    campaignId: string;
  }>;
}

export const metadata: Metadata = {
  title: "Prospecting Campaign",
  description: "Internal prospecting campaign detail.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function ProspectingCampaignPage({
  params,
}: CampaignPageProps) {
  const { campaignId } = await params;

  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: {
      campaignProspects: {
        orderBy: { addedAt: "desc" },
        include: {
          prospect: true,
        },
      },
    },
  });

  if (!campaign) {
    notFound();
  }

  const hostnames = campaign.campaignProspects
    .map((row) => row.prospect.hostname)
    .filter((value): value is string => Boolean(value));
  const duplicateHostnames = await findDuplicateHostnames(hostnames);

  return (
    <main className="min-h-screen bg-slate-50/60">
      <Container className="space-y-8 py-8 sm:py-10 lg:py-12">
        <Button
          variant="outline"
          size="sm"
          nativeButton={false}
          render={<Link href="/reports/prospecting" />}
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          All campaigns
        </Button>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-blue">
              {campaignStatusLabel(campaign.status)}
            </p>
            <h1 className="mt-3 font-heading text-3xl font-semibold text-brand">
              {campaign.name}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
              Target {campaign.desiredQualifiedCount} qualified prospects in{" "}
              {campaign.locationLabel}
              {campaign.radiusMiles ? ` (${campaign.radiusMiles} miles)` : ""}.
              Businesses in this campaign are not Leads.
            </p>
          </div>

          <Button
            nativeButton={false}
            render={
              <Link
                href={`/reports/prospecting/${campaign.id}/prospects/new`}
              />
            }
          >
            <Plus aria-hidden="true" className="size-4" />
            Add Prospect
          </Button>
        </div>

        <Card variant="elevated" padding="lg">
          <h2 className="font-heading text-xl font-semibold text-brand">
            Targeting
          </h2>
          <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
                Location
              </dt>
              <dd className="mt-1 text-sm text-brand">
                {campaign.locationLabel}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
                Industries
              </dt>
              <dd className="mt-1 text-sm text-brand">
                {campaign.industries.join(", ") || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
                Desired qualified
              </dt>
              <dd className="mt-1 text-sm text-brand">
                {campaign.desiredQualifiedCount}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
                Notes
              </dt>
              <dd className="mt-1 text-sm text-brand">
                {campaign.notes || "None"}
              </dd>
            </div>
          </dl>
        </Card>

        {campaign.campaignProspects.length === 0 ? (
          <Card variant="elevated" padding="lg">
            <h2 className="font-heading text-xl font-semibold text-brand">
              No prospects yet
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
              Add businesses by hand. Automatic discovery is not enabled in
              Sprint 1.
            </p>
          </Card>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border bg-white">
            <table className="w-full min-w-[56rem] text-left text-sm">
              <thead className="border-b border-border bg-slate-50 text-xs uppercase tracking-[0.08em] text-muted">
                <tr>
                  <th className="px-4 py-3 font-semibold">Business</th>
                  <th className="px-4 py-3 font-semibold">Website</th>
                  <th className="px-4 py-3 font-semibold">Industry</th>
                  <th className="px-4 py-3 font-semibold">Location</th>
                  <th className="px-4 py-3 font-semibold">Qualification</th>
                  <th className="px-4 py-3 font-semibold">Outreach</th>
                  <th className="px-4 py-3 font-semibold">Duplicates</th>
                </tr>
              </thead>
              <tbody>
                {campaign.campaignProspects.map((row) => {
                  const prospect = row.prospect;
                  const isDuplicate = Boolean(
                    prospect.hostname &&
                      duplicateHostnames.has(prospect.hostname),
                  );

                  return (
                    <tr
                      key={row.id}
                      className="border-b border-border last:border-b-0"
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/reports/prospecting/${campaign.id}/prospects/${prospect.id}`}
                          className="font-semibold text-brand-blue hover:underline"
                        >
                          {prospect.businessName}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        {prospect.website ? (
                          <a
                            href={prospect.website}
                            target="_blank"
                            rel="noreferrer"
                            className="text-brand-blue hover:underline"
                          >
                            {prospect.hostname ?? prospect.website}
                          </a>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {prospect.industry || "—"}
                      </td>
                      <td className="px-4 py-3">
                        {formatProspectLocation(prospect)}
                      </td>
                      <td className="px-4 py-3">
                        {qualificationStatusLabel(
                          prospect.qualificationStatus,
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {outreachStatusLabel(prospect.outreachStatus)}
                      </td>
                      <td className="px-4 py-3">
                        {isDuplicate ? (
                          <span className="inline-flex items-center gap-1.5 text-amber-800">
                            <AlertTriangle
                              aria-hidden="true"
                              className="size-3.5"
                            />
                            Hostname match
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <p className="max-w-3xl text-xs leading-5 text-muted">
          {DUPLICATE_WARNING_NOTICE}
        </p>
      </Container>
    </main>
  );
}
