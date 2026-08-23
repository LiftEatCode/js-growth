import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";

import { UtmBuilderForm } from "@/components/growth/utm-builder-form";
import { Button, Card, Container } from "@/components/ui";

export const metadata: Metadata = {
  title: "UTM Link Builder",
  description: "Internal UTM builder for consistent campaign tagging.",
  robots: { index: false, follow: false },
};

export default function UtmBuilderPage() {
  return (
    <main className="min-h-screen bg-slate-50/70">
      <Container className="py-10">
        <Button
          size="sm"
          variant="outline"
          nativeButton={false}
          render={<Link href="/reports/growth" />}
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Growth dashboard
        </Button>

        <h1 className="mt-6 font-heading text-3xl font-semibold tracking-tight text-brand">
          UTM link builder
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
          Internal only. Produces lowercase, encoded campaign URLs for Facebook,
          GBP, email, and other external distribution. Never append UTMs to
          ordinary internal navigation.
        </p>

        <Card className="mt-8 p-6 sm:p-8">
          <UtmBuilderForm />
        </Card>
      </Container>
    </main>
  );
}
