import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { AddProspectForm } from "@/components/prospecting/add-prospect-form";
import { Button, Card, Container } from "@/components/ui";
import { prisma } from "@/lib/prisma";

interface NewProspectPageProps {
  params: Promise<{
    campaignId: string;
  }>;
}

export const metadata: Metadata = {
  title: "Add Prospect",
  description: "Manually add a business to an internal prospecting campaign.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function NewCampaignProspectPage({
  params,
}: NewProspectPageProps) {
  const { campaignId } = await params;

  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: {
      id: true,
      name: true,
      industries: true,
    },
  });

  if (!campaign) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-slate-50/60">
      <Container className="space-y-8 py-8 sm:py-10 lg:py-12">
        <Button
          variant="outline"
          size="sm"
          nativeButton={false}
          render={<Link href={`/reports/prospecting/${campaign.id}`} />}
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          {campaign.name}
        </Button>

        <Card variant="elevated" padding="lg">
          <h1 className="font-heading text-3xl font-semibold text-brand">
            Add prospect
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
            Enter a public business. If the normalized hostname already exists,
            you will see a warning before a duplicate is created.
          </p>
          <div className="mt-8">
            <AddProspectForm
              campaignId={campaign.id}
              campaignIndustries={campaign.industries}
            />
          </div>
        </Card>
      </Container>
    </main>
  );
}
