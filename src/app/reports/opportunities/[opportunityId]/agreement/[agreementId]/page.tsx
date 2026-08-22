import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { AgreementDocument } from "@/components/opportunities/agreement-document";
import { AgreementEditor } from "@/components/opportunities/agreement-editor";
import { Button, Card, Container } from "@/components/ui";
import { loadCommercialAgreementDetail } from "@/lib/commercialization/agreement/load";
import type { AgreementPaymentTermType } from "@/lib/commercialization/agreement/constants";

interface AgreementDetailPageProps {
  params: Promise<{ opportunityId: string; agreementId: string }>;
  searchParams: Promise<{ preview?: string }>;
}

export const metadata: Metadata = {
  title: "Commercial Agreement",
  description: "Internal commercial agreement workspace.",
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

export default async function AgreementDetailPage({
  params,
  searchParams,
}: AgreementDetailPageProps) {
  const { opportunityId, agreementId } = await params;
  const { preview } = await searchParams;
  const detail = await loadCommercialAgreementDetail({ agreementId });

  if (!detail || detail.proposal.opportunityId !== opportunityId) {
    notFound();
  }

  const { agreement, snapshot, proposal } = detail;
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
              render={<Link href={proposal.proposalHref} />}
            >
              Proposal
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
                  href={`/reports/opportunities/${opportunityId}/agreement/${agreementId}?preview=1`}
                />
              }
            >
              Preview Agreement
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
                  href={`/reports/opportunities/${opportunityId}/agreement/${agreementId}`}
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
              Commercial Agreement · {agreement.statusLabel} · Revision{" "}
              {agreement.revision}
            </p>
            <h1 className="mt-2 font-heading text-3xl font-semibold text-brand">
              {agreement.title}
            </h1>
            <p className="mt-2 text-sm text-muted">
              Created {formatDateTime(agreement.createdAt)}
              {agreement.approvedAt
                ? ` · Approved ${formatDateTime(agreement.approvedAt)}`
                : ""}
              {agreement.acceptedAt
                ? ` · Accepted ${formatDateTime(agreement.acceptedAt)}`
                : ""}
            </p>
            {agreement.status === "ACCEPTED" ? (
              <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-950">
                Agreement Accepted — Payment Pending. Client acceptance does not
                mark the Opportunity Won.
              </p>
            ) : null}
          </Card>
        ) : null}

        {!isPreview && agreement.stale ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 print:hidden">
            <p className="font-medium">Source commercial state: STALE</p>
            <ul className="mt-1 list-disc pl-5">
              {agreement.staleReasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
            <p className="mt-2">
              This historical Agreement is unchanged. Revise after the Proposal
              is current and approved to create a new draft.
            </p>
          </div>
        ) : null}

        {isPreview ? (
          <Card
            variant="elevated"
            padding="lg"
            className="print:border-0 print:shadow-none"
          >
            <AgreementDocument snapshot={snapshot} />
          </Card>
        ) : (
          <>
            <Card variant="elevated" padding="lg" className="print:hidden">
              <h2 className="font-heading text-xl font-semibold text-brand">
                Presentation editor
              </h2>
              <div className="mt-4">
                <AgreementEditor
                  agreementId={agreement.id}
                  opportunityId={opportunityId}
                  editable={agreement.editable}
                  status={agreement.status}
                  initialTitle={agreement.title}
                  initialEngagementOverview={agreement.engagementOverview}
                  initialClientResponsibilities={
                    agreement.clientResponsibilities
                  }
                  initialJsResponsibilities={agreement.jsResponsibilities}
                  initialTimelineTerms={agreement.timelineTerms}
                  initialChangeRequestTerms={agreement.changeRequestTerms}
                  initialThirdPartyCostTerms={agreement.thirdPartyCostTerms}
                  initialResultsDisclaimer={agreement.resultsDisclaimer}
                  initialAcceptanceLanguage={agreement.acceptanceLanguage}
                  initialPaymentTermType={
                    agreement.paymentTermType as AgreementPaymentTermType
                  }
                  initialPaymentCustomText={agreement.paymentCustomText ?? ""}
                  initialDepositPercent={agreement.depositPercent}
                />
              </div>
            </Card>

            <Card variant="elevated" padding="lg">
              <h2 className="mb-6 font-heading text-xl font-semibold text-brand print:hidden">
                Document preview
              </h2>
              <AgreementDocument snapshot={snapshot} />
            </Card>
          </>
        )}
      </Container>
    </main>
  );
}
