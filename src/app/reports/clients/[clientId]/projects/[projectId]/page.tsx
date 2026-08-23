import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { ProjectWorkspaceControls } from "@/components/opportunities/project-workspace-controls";
import { Button, Card, Container } from "@/components/ui";
import { loadProjectDetail } from "@/lib/commercialization/onboarding";

interface ProjectPageProps {
  params: Promise<{ clientId: string; projectId: string }>;
}

export const metadata: Metadata = {
  title: "Project",
  description: "Internal client project workspace.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function ProjectDetailPage({ params }: ProjectPageProps) {
  const { clientId, projectId } = await params;
  const detail = await loadProjectDetail({ projectId });
  if (!detail || detail.project.clientId !== clientId) {
    notFound();
  }

  const { project, snapshot, onboardingItems, workstreams, deliveryTasks } =
    detail;

  return (
    <main className="min-h-screen bg-slate-50/60">
      <Container className="space-y-6 py-8 sm:py-10">
        <div>
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={<Link href={`/reports/clients/${clientId}`} />}
          >
            <ArrowLeft className="size-4" />
            Client
          </Button>
          <h1 className="mt-4 font-heading text-3xl font-semibold text-brand">
            {project.name}
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            {project.statusLabel} · Owner {project.ownerEmail}
          </p>
        </div>

        <Card variant="elevated" padding="lg">
          <h2 className="font-heading text-xl font-semibold text-brand">
            Project header
          </h2>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted">Client</dt>
              <dd className="font-medium text-ink">{project.clientName}</dd>
            </div>
            <div>
              <dt className="text-muted">Onboarding</dt>
              <dd className="font-medium text-ink">
                {project.onboardingStateLabel}
              </dd>
            </div>
            <div>
              <dt className="text-muted">Investment</dt>
              <dd className="font-medium text-ink">{project.totalLabel}</dd>
            </div>
            <div>
              <dt className="text-muted">Deposit</dt>
              <dd className="font-medium text-ink">{project.depositLabel}</dd>
            </div>
            <div>
              <dt className="text-muted">Balance</dt>
              <dd
                className={`font-medium ${project.balanceOutstandingCents > 0 ? "text-amber-800" : "text-ink"}`}
              >
                {project.balanceLabel}
              </dd>
            </div>
            <div>
              <dt className="text-muted">Source Agreement</dt>
              <dd>
                <Link
                  href={project.commercialLinks.agreement}
                  className="text-brand underline-offset-2 hover:underline"
                >
                  View Agreement
                </Link>
              </dd>
            </div>
          </dl>
          {project.finalHandoffBlockedByBalance ? (
            <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              FINAL_HANDOFF_BLOCKED_BY_BALANCE — delivery may finish
              implementation, but final handoff requires balance paid.
            </p>
          ) : null}
        </Card>

        <Card variant="elevated" padding="lg">
          <ProjectWorkspaceControls
            opportunityId={project.opportunityId}
            clientId={project.clientId}
            projectId={project.id}
            canStart={project.canStart}
            canComplete={project.canComplete}
            finalHandoffBlockedByBalance={project.finalHandoffBlockedByBalance}
            onboardingItems={onboardingItems}
            deliveryTasks={deliveryTasks}
          />
        </Card>

        <Card variant="elevated" padding="lg">
          <h2 className="font-heading text-xl font-semibold text-brand">
            Delivery workstreams
          </h2>
          <ul className="mt-4 space-y-4">
            {workstreams.map((ws) => (
              <li key={ws.id} className="rounded-xl border border-border/80 p-4">
                <p className="font-medium text-ink">{ws.title}</p>
                <p className="mt-1 text-xs text-muted">{ws.status}</p>
                <ul className="mt-3 space-y-1 text-sm text-slate-700">
                  {ws.deliverables.map((d) => (
                    <li key={d.id}>
                      {d.title}
                      {d.sourceActionKey ? (
                        <span className="text-xs text-muted">
                          {" "}
                          · {d.sourceActionKey}
                        </span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </Card>

        {snapshot ? (
          <Card variant="elevated" padding="lg">
            <h2 className="font-heading text-xl font-semibold text-brand">
              Commercial snapshot
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Immutable delivery facts captured at conversion. Do not edit sold
              scope here — future change orders will handle commercial changes.
            </p>
            <p className="mt-3 text-sm text-slate-700">
              {snapshot.paymentTermsSummary}
            </p>
            <div className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <h3 className="font-semibold text-slate-900">Assumptions</h3>
                <pre className="mt-2 overflow-x-auto whitespace-pre-wrap rounded bg-slate-50 p-2 text-xs text-slate-700">
                  {JSON.stringify(snapshot.assumptions, null, 2)}
                </pre>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Exclusions</h3>
                <pre className="mt-2 overflow-x-auto whitespace-pre-wrap rounded bg-slate-50 p-2 text-xs text-slate-700">
                  {JSON.stringify(snapshot.exclusions, null, 2)}
                </pre>
              </div>
            </div>
          </Card>
        ) : null}

        <Card variant="elevated" padding="lg">
          <h2 className="font-heading text-xl font-semibold text-brand">
            Commercial source links
          </h2>
          <ul className="mt-3 flex flex-wrap gap-3 text-sm">
            {(
              [
                ["Opportunity", project.commercialLinks.opportunity],
                ["Scope", project.commercialLinks.scope],
                ["Pricing", project.commercialLinks.pricing],
                ["Proposal", project.commercialLinks.proposal],
                ["Agreement", project.commercialLinks.agreement],
              ] as const
            ).map(([label, href]) => (
              <li key={label}>
                <Link
                  href={href}
                  className="text-brand underline-offset-2 hover:underline"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </Container>
    </main>
  );
}
