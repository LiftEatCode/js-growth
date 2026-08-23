import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Button, Card, Container } from "@/components/ui";
import { loadClientDetail } from "@/lib/commercialization/onboarding";

interface ClientDetailPageProps {
  params: Promise<{ clientId: string }>;
}

export const metadata: Metadata = {
  title: "Client",
  description: "Internal client detail.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function ClientDetailPage({
  params,
}: ClientDetailPageProps) {
  const { clientId } = await params;
  const client = await loadClientDetail({ clientId });
  if (!client) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-slate-50/60">
      <Container className="space-y-6 py-8 sm:py-10">
        <div>
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={<Link href="/reports/clients" />}
          >
            <ArrowLeft className="size-4" />
            Clients
          </Button>
          <h1 className="mt-4 font-heading text-3xl font-semibold text-brand">
            {client.name}
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Status: {client.status}
          </p>
        </div>

        <Card variant="elevated" padding="lg">
          <h2 className="font-heading text-xl font-semibold text-brand">
            Overview
          </h2>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted">Primary contact</dt>
              <dd className="font-medium text-ink">
                {client.primaryContactName ?? "—"}
                {client.primaryContactEmail
                  ? ` · ${client.primaryContactEmail}`
                  : ""}
              </dd>
            </div>
            <div>
              <dt className="text-muted">Phone</dt>
              <dd className="font-medium text-ink">{client.phone ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted">Website</dt>
              <dd className="font-medium text-ink">{client.website ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted">Location</dt>
              <dd className="font-medium text-ink">
                {[client.city, client.state].filter(Boolean).join(", ") || "—"}
              </dd>
            </div>
            {client.sourceOpportunityId ? (
              <div>
                <dt className="text-muted">Source Opportunity</dt>
                <dd>
                  <Link
                    href={`/reports/opportunities/${client.sourceOpportunityId}`}
                    className="font-medium text-brand underline-offset-2 hover:underline"
                  >
                    View Opportunity
                  </Link>
                </dd>
              </div>
            ) : null}
          </dl>
        </Card>

        <Card variant="elevated" padding="lg">
          <h2 className="font-heading text-xl font-semibold text-brand">
            Projects
          </h2>
          {client.projects.length === 0 ? (
            <p className="mt-3 text-sm text-muted">No projects.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {client.projects.map((project) => (
                <li
                  key={project.id}
                  className="rounded-xl border border-border/80 px-4 py-3 text-sm"
                >
                  <Link
                    href={project.href}
                    className="font-medium text-brand underline-offset-2 hover:underline"
                  >
                    {project.name}
                  </Link>
                  <p className="mt-1 text-xs text-muted">
                    {project.statusLabel} · {project.ownerEmail}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card variant="elevated" padding="lg">
          <h2 className="font-heading text-xl font-semibold text-brand">
            Commercial history
          </h2>
          {client.opportunities.length === 0 ? (
            <p className="mt-3 text-sm text-muted">No linked opportunities.</p>
          ) : (
            <ul className="mt-4 space-y-2 text-sm">
              {client.opportunities.map((opp) => (
                <li key={opp.id}>
                  <Link
                    href={`/reports/opportunities/${opp.id}`}
                    className="text-brand underline-offset-2 hover:underline"
                  >
                    {opp.name}
                  </Link>
                  <span className="text-muted"> · {opp.stage}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </Container>
    </main>
  );
}
