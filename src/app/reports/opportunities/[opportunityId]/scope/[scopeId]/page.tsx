import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { ScopeEditor } from "@/components/opportunities/scope-editor";
import { Button, Card, Container } from "@/components/ui";
import { getServiceCapabilityDisplayName } from "@/lib/commercialization/capabilities";
import { loadCommercialScopeDetail } from "@/lib/commercialization/scope/load";

interface ScopeDetailPageProps {
  params: Promise<{ opportunityId: string; scopeId: string }>;
  searchParams: Promise<{ preview?: string }>;
}

export const metadata: Metadata = {
  title: "Commercial Scope",
  description: "Internal commercial scope workspace.",
  robots: { index: false, follow: false },
};

function formatDateTime(value: Date | null): string {
  if (!value) {
    return "—";
  }
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

export default async function ScopeDetailPage({
  params,
  searchParams,
}: ScopeDetailPageProps) {
  const { opportunityId, scopeId } = await params;
  const { preview } = await searchParams;
  const detail = await loadCommercialScopeDetail({ scopeId });

  if (!detail || detail.scope.opportunityId !== opportunityId) {
    notFound();
  }

  const { scope, sections, staleness } = detail;
  const isPreview = preview === "1";

  const includedSections = sections.filter((s) => s.isIncluded);
  const optionalSections = sections.filter((s) => s.isOptional && s.isIncluded);

  return (
    <main className="min-h-screen bg-slate-50/60">
      <Container className="space-y-6 py-8 sm:py-10">
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={<Link href={scope.opportunityHref} />}
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            Opportunity
          </Button>
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={
              <Link
                href={
                  isPreview
                    ? `/reports/opportunities/${opportunityId}/scope/${scopeId}`
                    : `/reports/opportunities/${opportunityId}/scope/${scopeId}?preview=1`
                }
              />
            }
          >
            {isPreview ? "Exit preview" : "Preview Scope"}
          </Button>
        </div>

        <Card variant="elevated" padding="lg">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Commercial Scope · {scope.statusLabel} · Revision {scope.revision}
          </p>
          <h1 className="mt-2 font-heading text-3xl font-semibold text-brand">
            {scope.title}
          </h1>
          <p className="mt-2 text-sm text-muted">
            {scope.businessName}
            {scope.implementationPlanId
              ? ` · Source plan ${scope.implementationPlanId.slice(0, 8)}…`
              : " · Manual / no Implementation Plan"}
          </p>
          <p className="mt-1 text-xs text-muted">
            Created {formatDateTime(scope.createdAt)}
            {scope.approvedAt
              ? ` · Approved ${formatDateTime(scope.approvedAt)}${
                  scope.approvedByEmail ? ` by ${scope.approvedByEmail}` : ""
                }`
              : ""}
          </p>
        </Card>

        {staleness.stale ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <p className="font-medium">Source Implementation Plan indicator: STALE</p>
            <ul className="mt-1 list-disc pl-5">
              {staleness.reasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
            <p className="mt-2">
              This Scope is not auto-updated. Revise from the Opportunity if you
              want a new draft from the current plan.
            </p>
          </div>
        ) : null}

        {isPreview ? (
          <Card variant="elevated" padding="lg">
            <h2 className="font-heading text-xl font-semibold text-brand">
              Recommended Scope
            </h2>
            <p className="mt-2 text-sm text-muted">
              Internal client-readable preview only — not a public link or
              proposal.
            </p>
            {scope.summary ? (
              <p className="mt-4 text-sm leading-relaxed text-ink/90">
                {scope.summary}
              </p>
            ) : null}

            <div className="mt-6 space-y-5">
              {includedSections.map((section) => (
                <div key={section.id}>
                  <h3 className="font-heading text-lg font-semibold text-ink">
                    {section.title}
                    {section.isOptional ? " (Optional)" : ""}
                  </h3>
                  <p className="mt-1 text-xs text-muted">
                    {section.capabilities
                      .map((id) => getServiceCapabilityDisplayName(id))
                      .join(" · ")}
                  </p>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink/90">
                    {section.deliverables
                      .filter((d) => d.isIncluded)
                      .map((d) => (
                        <li key={d.id}>
                          {d.title}
                          {d.isOptional ? " (optional)" : ""}
                        </li>
                      ))}
                  </ul>
                </div>
              ))}
            </div>

            {optionalSections.length > 0 ? (
              <p className="mt-4 text-xs text-muted">
                Optional sections are marked above.
              </p>
            ) : null}

            {scope.assumptions.length > 0 ? (
              <div className="mt-6">
                <h3 className="font-heading text-base font-semibold text-brand">
                  Assumptions
                </h3>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink/90">
                  {scope.assumptions.map((item) => (
                    <li key={item.id}>{item.text}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {scope.exclusions.length > 0 ? (
              <div className="mt-6">
                <h3 className="font-heading text-base font-semibold text-brand">
                  Exclusions
                </h3>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink/90">
                  {scope.exclusions.map((item) => (
                    <li key={item.id}>{item.text}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </Card>
        ) : (
          <>
            {scope.considerations.length > 0 ? (
              <Card variant="elevated" padding="lg">
                <h2 className="font-heading text-xl font-semibold text-brand">
                  Implementation considerations
                </h2>
                <p className="mt-1 text-xs text-muted">
                  Preservation constraints from the Implementation Plan — not
                  billable Performance Optimization sections.
                </p>
                <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-ink/90">
                  {scope.considerations.map((item) => (
                    <li key={item.id}>{item.text}</li>
                  ))}
                </ul>
              </Card>
            ) : null}

            <Card variant="elevated" padding="lg">
              <ScopeEditor
                scopeId={scope.id}
                editable={scope.editable}
                status={scope.status}
                initialTitle={scope.title}
                initialSummary={scope.summary ?? ""}
                sections={sections}
                assumptions={scope.assumptions.map((a) => a.text)}
                exclusions={scope.exclusions.map((e) => e.text)}
              />
            </Card>
          </>
        )}
      </Container>
    </main>
  );
}
