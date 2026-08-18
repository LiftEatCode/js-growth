import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";

import { CampaignForm } from "@/components/prospecting/campaign-form";
import { Button, Card, Container } from "@/components/ui";

export const metadata: Metadata = {
  title: "New Prospecting Campaign",
  description: "Create an internal JS Solutions prospecting campaign.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function NewProspectingCampaignPage() {
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
          Prospecting
        </Button>

        <Card variant="elevated" padding="lg">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-blue">
            Sprint 1
          </p>
          <h1 className="mt-3 font-heading text-3xl font-semibold text-brand">
            New campaign
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
            Define a location and industry set. You will add businesses
            manually. Automatic discovery is not part of this sprint.
          </p>
          <div className="mt-8">
            <CampaignForm />
          </div>
        </Card>
      </Container>
    </main>
  );
}
