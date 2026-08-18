import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { ProspectEditor } from "@/components/prospecting/prospect-editor";
import { Button, Card, Container } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import {
  outreachStatusLabel,
  qualificationStatusLabel,
  sourceTypeLabel,
} from "@/lib/prospecting/labels";

interface ProspectDetailPageProps {
  params: Promise<{
    campaignId: string;
    prospectId: string;
  }>;
}

export const metadata: Metadata = {
  title: "Prospect",
  description: "Internal prospecting business detail.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function CampaignProspectDetailPage({
  params,
}: ProspectDetailPageProps) {
  const { campaignId, prospectId } = await params;

  const membership = await prisma.campaignProspect.findUnique({
    where: {
      campaignId_prospectId: {
        campaignId,
        prospectId,
      },
    },
    include: {
      campaign: {
        select: {
          id: true,
          name: true,
        },
      },
      prospect: true,
    },
  });

  if (!membership) {
    notFound();
  }

  const prospect = membership.prospect;

  return (
    <main className="min-h-screen bg-slate-50/60">
      <Container className="space-y-8 py-8 sm:py-10 lg:py-12">
        <Button
          variant="outline"
          size="sm"
          nativeButton={false}
          render={
            <Link href={`/reports/prospecting/${membership.campaign.id}`} />
          }
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          {membership.campaign.name}
        </Button>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-blue">
            {sourceTypeLabel(prospect.sourceType)} source
          </p>
          <h1 className="mt-3 font-heading text-3xl font-semibold text-brand">
            {prospect.businessName}
          </h1>
        </div>

        <Card variant="elevated" padding="lg">
          <dl className="grid gap-4 sm:grid-cols-3">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
                Qualification
              </dt>
              <dd className="mt-1 text-sm text-brand">
                {qualificationStatusLabel(prospect.qualificationStatus)}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
                Outreach
              </dt>
              <dd className="mt-1 text-sm text-brand">
                {outreachStatusLabel(prospect.outreachStatus)}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
                Source
              </dt>
              <dd className="mt-1 text-sm text-brand">
                {sourceTypeLabel(prospect.sourceType)}
                {prospect.sourceRef ? ` · ${prospect.sourceRef}` : ""}
              </dd>
            </div>
          </dl>
        </Card>

        <ProspectEditor
          campaignId={membership.campaign.id}
          prospectId={prospect.id}
          businessName={prospect.businessName}
          website={prospect.website}
          hostname={prospect.hostname}
          industry={prospect.industry}
          city={prospect.city}
          state={prospect.state}
          address={prospect.address}
          phone={prospect.phone}
          notes={prospect.notes}
          skipReason={prospect.skipReason}
        />
      </Container>
    </main>
  );
}
