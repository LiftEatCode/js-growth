import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { ProposalDocument } from "@/components/opportunities/proposal-document";
import { ProposalEditor } from "@/components/opportunities/proposal-editor";
import { Button, Card, Container } from "@/components/ui";
import { loadCommercialProposalDetail } from "@/lib/commercialization/proposal/load";

interface ProposalDetailPageProps {
  params: Promise<{ opportunityId: string; proposalId: string }>;
  searchParams: Promise<{ preview?: string }>;
}

export const metadata: Metadata = {
  title: "Commercial Proposal",
  description: "Internal commercial proposal workspace.",
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

export default async function ProposalDetailPage({
  params,
  searchParams,
}: ProposalDetailPageProps) {
  const { opportunityId, proposalId } = await params;
  const { preview } = await searchParams;
  const detail = await loadCommercialProposalDetail({ proposalId });

  if (!detail || detail.proposal.opportunityId !== opportunityId) {
    notFound();
  }

  const { proposal, snapshot, staleness } = detail;
  const isPreview = preview === "1";

  return (
    <main className="min-h-screen bg-slate-50/60 print:bg-white">
      <Container className="space-y-6 py-8 sm:py-10 print:py-4">
        {!isPreview ? (
          <div className="flex flex-wrap items-center gap-3 print:hidden">
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={<Link href={proposal.opportunityHref} />}
            >
              <ArrowLeft aria-hidden="true" className="size-4" />
              Opportunity
            </Button>
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={<Link href={proposal.scopeHref} />}
            >
              Scope
            </Button>
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={<Link href={proposal.pricingHref} />}
            >
              Pricing
            </Button>
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={
                <Link
                  href={`/reports/opportunities/${opportunityId}/proposal/${proposalId}?preview=1`}
                />
              }
            >
              Preview Proposal
            </Button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-3 print:hidden">
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={
                <Link
                  href={`/reports/opportunities/${opportunityId}/proposal/${proposalId}`}
                />
              }
            >
              Exit preview
            </Button>
          </div>
        )}

        {!isPreview ? (
          <Card variant="elevated" padding="lg" className="print:hidden">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              Commercial Proposal · {proposal.statusLabel} · Revision{" "}
              {proposal.revision}
            </p>
            <h1 className="mt-2 font-heading text-3xl font-semibold text-brand">
              {proposal.title}
            </h1>
            <p className="mt-2 text-sm text-muted">
              Created {formatDateTime(proposal.createdAt)}
              {proposal.approvedAt
                ? ` · Approved ${formatDateTime(proposal.approvedAt)}`
                : ""}
            </p>
          </Card>
        ) : null}

        {!isPreview && staleness.stale ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 print:hidden">
            <p className="font-medium">Source commercial state: STALE</p>
            <ul className="mt-1 list-disc pl-5">
              {staleness.reasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
            <p className="mt-2">
              This historical Proposal is unchanged. Revise after Scope/Pricing
              are current and approved to create a new draft.
            </p>
          </div>
        ) : null}

        {isPreview ? (
          <Card variant="elevated" padding="lg" className="print:border-0 print:shadow-none">
            <ProposalDocument
              title={proposal.title}
              executiveSummary={proposal.executiveSummary}
              businessContext={proposal.businessContext}
              approachIntro={proposal.approachIntro}
              timelineNote={proposal.timelineNote}
              nextStepText={proposal.nextStepText}
              snapshot={snapshot}
              createdAtLabel={formatDateTime(proposal.createdAt)}
            />
          </Card>
        ) : (
          <>
            <Card variant="elevated" padding="lg" className="print:hidden">
              <h2 className="font-heading text-xl font-semibold text-brand">
                Presentation editor
              </h2>
              <div className="mt-4">
                <ProposalEditor
                  proposalId={proposal.id}
                  editable={proposal.editable}
                  status={proposal.status}
                  initialTitle={proposal.title}
                  initialExecutiveSummary={proposal.executiveSummary}
                  initialBusinessContext={proposal.businessContext ?? ""}
                  initialApproachIntro={proposal.approachIntro ?? ""}
                  initialTimelineNote={proposal.timelineNote ?? ""}
                  initialNextStepText={proposal.nextStepText ?? ""}
                />
              </div>
            </Card>

            <Card variant="elevated" padding="lg">
              <h2 className="mb-6 font-heading text-xl font-semibold text-brand print:hidden">
                Document preview
              </h2>
              <ProposalDocument
                title={proposal.title}
                executiveSummary={proposal.executiveSummary}
                businessContext={proposal.businessContext}
                approachIntro={proposal.approachIntro}
                timelineNote={proposal.timelineNote}
                nextStepText={proposal.nextStepText}
                snapshot={snapshot}
                createdAtLabel={formatDateTime(proposal.createdAt)}
              />
            </Card>
          </>
        )}
      </Container>
    </main>
  );
}
