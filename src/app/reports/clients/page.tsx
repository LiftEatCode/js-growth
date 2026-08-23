import Link from "next/link";
import type { Metadata } from "next";

import { Button, Card, Container } from "@/components/ui";
import { loadClientList } from "@/lib/commercialization/onboarding";

export const metadata: Metadata = {
  title: "Clients",
  description: "Internal JS Solutions client records.",
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

export default async function ClientsPage() {
  const clients = await loadClientList();

  return (
    <main className="min-h-screen bg-slate-50/60">
      <Container className="space-y-6 py-8 sm:py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-700">
              Internal delivery
            </p>
            <h1 className="font-heading text-3xl font-semibold text-brand">
              Clients
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              Prospect ≠ Opportunity ≠ Client. Clients are created only after an
              accepted Agreement meets payment eligibility and an operator
              converts the Opportunity.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={<Link href="/reports/opportunities" />}
          >
            Opportunities
          </Button>
        </div>

        <Card variant="elevated" padding="lg">
          {clients.length === 0 ? (
            <p className="text-sm text-muted">No clients yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
                    <th className="pb-2 pr-3 font-semibold">Client</th>
                    <th className="pb-2 pr-3 font-semibold">Location</th>
                    <th className="pb-2 pr-3 font-semibold">Website</th>
                    <th className="pb-2 pr-3 font-semibold">Active projects</th>
                    <th className="pb-2 pr-3 font-semibold">Project status</th>
                    <th className="pb-2 pr-3 font-semibold">Owner</th>
                    <th className="pb-2 font-semibold">Last activity</th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map((client) => (
                    <tr
                      key={client.id}
                      className="border-b border-border/60 last:border-0"
                    >
                      <td className="py-3 pr-3">
                        <Link
                          href={`/reports/clients/${client.id}`}
                          className="font-medium text-brand underline-offset-2 hover:underline"
                        >
                          {client.name}
                        </Link>
                      </td>
                      <td className="py-3 pr-3 text-slate-700">
                        {[client.city, client.state].filter(Boolean).join(", ") ||
                          "—"}
                      </td>
                      <td className="py-3 pr-3 text-slate-700">
                        {client.website ?? "—"}
                      </td>
                      <td className="py-3 pr-3 text-slate-700">
                        {client.activeProjectCount}
                      </td>
                      <td className="py-3 pr-3 text-slate-700">
                        {client.latestProjectStatus ?? "—"}
                      </td>
                      <td className="py-3 pr-3 text-slate-700">
                        {client.ownerEmail ?? "—"}
                      </td>
                      <td className="py-3 text-slate-700">
                        {formatDate(client.updatedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </Container>
    </main>
  );
}
