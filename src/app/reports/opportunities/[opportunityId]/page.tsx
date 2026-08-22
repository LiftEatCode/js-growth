import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { OpportunityDetailControls } from "@/components/opportunities/opportunity-detail-controls";
import { OpportunityPricingCard } from "@/components/opportunities/opportunity-pricing-card";
import { OpportunityProposalCard } from "@/components/opportunities/opportunity-proposal-card";
import { OpportunityProposalDeliveryCard } from "@/components/opportunities/opportunity-proposal-delivery-card";
import { OpportunityScopeCard } from "@/components/opportunities/opportunity-scope-card";
import { Button, Card, Container } from "@/components/ui";
import { getServiceCapabilityDisplayName } from "@/lib/commercialization/capabilities";
import { loadOpportunityDetail } from "@/lib/commercialization/opportunities/load";
import {
  loadProposalDeliveriesForOpportunity,
  loadProposalDeliveryContactOptions,
} from "@/lib/commercialization/proposal-delivery";
import { loadCurrentPricingForOpportunity } from "@/lib/commercialization/pricing/load";
import { loadCurrentProposalForOpportunity } from "@/lib/commercialization/proposal/load";
import { loadCurrentScopeForOpportunity } from "@/lib/commercialization/scope/load";

interface OpportunityDetailPageProps {
  params: Promise<{ opportunityId: string }>;
}

export const metadata: Metadata = {
  title: "Opportunity",
  description: "Internal opportunity detail.",
  robots: {
    index: false,
    follow: false,
  },
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

function activityLabel(type: string): string {
  return type.replaceAll("_", " ");
}

export default async function OpportunityDetailPage({
  params,
}: OpportunityDetailPageProps) {
  const { opportunityId } = await params;
  const detail = await loadOpportunityDetail({ opportunityId });

  if (!detail) {
    notFound();
  }

  const scopeLoad = await loadCurrentScopeForOpportunity({ opportunityId });
  const pricingLoad = await loadCurrentPricingForOpportunity({ opportunityId });
  const proposalLoad = await loadCurrentProposalForOpportunity({
    opportunityId,
  });
  const [deliveryContacts, deliveries] = await Promise.all([
    loadProposalDeliveryContactOptions({ opportunityId }),
    loadProposalDeliveriesForOpportunity({
      opportunityId,
      currentProposalId: proposalLoad.proposal?.id ?? null,
    }),
  ]);
  const { opportunity, activities, intelligence } = detail;
  const caps = opportunity.capabilitiesSnapshot;

  const hasApprovedScope = scopeLoad.scope?.status === "APPROVED";
  const hasApprovedPricing = pricingLoad.pricing?.status === "APPROVED";
  const pricingComplete = pricingLoad.pricing?.isComplete === true;
  const pricingMatchesScope =
    !!pricingLoad.pricing &&
    !!scopeLoad.scope &&
    pricingLoad.pricing.commercialScopeId === scopeLoad.scope.id;
  const pricingStale = pricingLoad.pricing?.isStale === true;

  let proposalBlockedReason: string | null = null;
  if (!hasApprovedScope) {
    proposalBlockedReason = "Approve a Commercial Scope before creating a Proposal.";
  } else if (!hasApprovedPricing) {
    proposalBlockedReason =
      "Approve Commercial Pricing before creating a Proposal.";
  } else if (!pricingComplete) {
    proposalBlockedReason =
      "Pricing is incomplete. Enter prices for all included work first.";
  } else if (!pricingMatchesScope) {
    proposalBlockedReason =
      "Approved Pricing does not match the approved Scope. Revise Pricing first.";
  } else if (pricingStale) {
    proposalBlockedReason =
      "Approved Pricing is stale relative to Scope. Revise Pricing first.";
  }

  const canCreateProposal =
    hasApprovedScope &&
    hasApprovedPricing &&
    pricingComplete &&
    pricingMatchesScope &&
    !pricingStale;

  return (
    <main className="min-h-screen bg-slate-50/60">
      <Container className="space-y-6 py-8 sm:py-10">
        <div>
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={<Link href="/reports/opportunities" />}
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            Opportunities
          </Button>
        </div>

        <Card variant="elevated" padding="lg">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                Opportunity
              </p>
              <h1 className="mt-2 font-heading text-3xl font-semibold text-brand">
                {opportunity.businessName}
              </h1>
              <p className="mt-2 text-sm text-muted">
                {opportunity.locationLabel ?? "Location unknown"} · Stage{" "}
                {opportunity.stageLabel}
              </p>
            </div>
            <div className="text-sm text-muted">
              <p>Owner {opportunity.ownerEmail}</p>
              <p>Created {formatDateTime(opportunity.createdAt)}</p>
              <p>Updated {formatDateTime(opportunity.updatedAt)}</p>
            </div>
          </div>
          <p className="mt-4">
            <Link
              href={opportunity.prospectHref}
              className="text-sm font-medium text-brand-blue hover:underline"
            >
              Open prospect intelligence
            </Link>
          </p>
        </Card>

        <Card variant="elevated" padding="lg">
          <h2 className="font-heading text-xl font-semibold text-brand">
            Commercial context
          </h2>
          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted">
                Website Growth Score
              </dt>
              <dd className="mt-1 text-sm text-ink">
                {opportunity.overallScore != null
                  ? opportunity.overallScore
                  : "No audit linked"}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted">
                Competitive position
              </dt>
              <dd className="mt-1 text-sm text-ink">
                {intelligence.competitivePosition ?? "No current comparison"}
                {intelligence.comparisonStale ? " · Stale" : ""}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted">
                Implementation Plan
              </dt>
              <dd className="mt-1 text-sm text-ink">
                {opportunity.implementationPlanId
                  ? `Linked ${opportunity.implementationPlanId.slice(0, 8)}…`
                  : "Not linked"}
                {intelligence.planStatus
                  ? ` · Current ${intelligence.planStatus}`
                  : ""}
                {intelligence.staleness.planStale ||
                intelligence.staleness.capabilitiesSourceStale
                  ? " · Source stale"
                  : ""}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted">
                AI Implementation Strategy
              </dt>
              <dd className="mt-1 text-sm text-ink">
                {opportunity.implementationInterpretationId
                  ? "Linked completed strategy"
                  : "Not linked"}
                {intelligence.interpretationStale ||
                intelligence.staleness.interpretationStale
                  ? " · Stale"
                  : ""}
              </dd>
            </div>
          </dl>
          {intelligence.staleness.overallStale ? (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <p className="font-medium">Linked intelligence indicators</p>
              <ul className="mt-1 list-disc pl-5">
                {[
                  ...intelligence.staleness.planReasons,
                  ...intelligence.staleness.interpretationReasons,
                  ...intelligence.staleness.capabilitiesSourceReasons,
                  ...intelligence.staleness.comparisonReasons,
                ].map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
              <p className="mt-2">
                Opportunity commercial state is not auto-updated. Refresh
                capabilities explicitly if needed.
              </p>
            </div>
          ) : null}
        </Card>

        <Card variant="elevated" padding="lg">
          <h2 className="font-heading text-xl font-semibold text-brand">
            Recommended capabilities
          </h2>
          <p className="mt-2 text-sm text-ink/90">
            {caps && caps.capabilities.length > 0
              ? caps.capabilities
                  .map((id) => getServiceCapabilityDisplayName(id))
                  .join(" · ")
              : caps?.noPlanAtSnapshot
                ? "No Implementation Plan was available when this Opportunity was created."
                : "None"}
          </p>
          {caps?.sourcePlanId ? (
            <p className="mt-2 text-xs text-muted">
              Snapshot from plan {caps.sourcePlanId.slice(0, 8)}… at{" "}
              {formatDateTime(new Date(caps.snapshottedAt))}
              {intelligence.staleness.capabilitiesSourceStale ? " · STALE" : ""}
            </p>
          ) : null}
        </Card>

        <Card variant="elevated" padding="lg">
          <h2 className="font-heading text-xl font-semibold text-brand">
            Scope
          </h2>
          <div className="mt-4">
            <OpportunityScopeCard
              opportunityId={opportunity.id}
              scope={
                scopeLoad.scope
                  ? {
                      id: scopeLoad.scope.id,
                      status: scopeLoad.scope.status,
                      statusLabel: scopeLoad.scope.statusLabel,
                      revision: scopeLoad.scope.revision,
                      sectionCount: scopeLoad.scope.sectionCount,
                      deliverableCount: scopeLoad.scope.deliverableCount,
                      approvedAtLabel: scopeLoad.scope.approvedAt
                        ? formatDateTime(scopeLoad.scope.approvedAt)
                        : null,
                    }
                  : null
              }
            />
          </div>
        </Card>

        <Card variant="elevated" padding="lg">
          <h2 className="font-heading text-xl font-semibold text-brand">
            Pricing
          </h2>
          <div className="mt-4">
            <OpportunityPricingCard
              opportunityId={opportunity.id}
              hasApprovedScope={hasApprovedScope}
              pricing={
                pricingLoad.pricing
                  ? {
                      id: pricingLoad.pricing.id,
                      status: pricingLoad.pricing.status,
                      statusLabel: pricingLoad.pricing.statusLabel,
                      revision: pricingLoad.pricing.revision,
                      lineItemCount: pricingLoad.pricing.lineItemCount,
                      finalTotalLabel: pricingLoad.pricing.finalTotalLabel,
                      approvedAtLabel: pricingLoad.pricing.approvedAt
                        ? formatDateTime(pricingLoad.pricing.approvedAt)
                        : null,
                    }
                  : null
              }
            />
          </div>
        </Card>

        <Card variant="elevated" padding="lg">
          <h2 className="font-heading text-xl font-semibold text-brand">
            Proposal
          </h2>
          <div className="mt-4">
            <OpportunityProposalCard
              opportunityId={opportunity.id}
              canCreate={canCreateProposal}
              blockedReason={proposalBlockedReason}
              proposal={
                proposalLoad.proposal
                  ? {
                      id: proposalLoad.proposal.id,
                      status: proposalLoad.proposal.status,
                      statusLabel: proposalLoad.proposal.statusLabel,
                      revision: proposalLoad.proposal.revision,
                      title: proposalLoad.proposal.title,
                      totalInvestmentLabel:
                        proposalLoad.proposal.totalInvestmentLabel,
                      approvedAtLabel: proposalLoad.proposal.approvedAt
                        ? formatDateTime(proposalLoad.proposal.approvedAt)
                        : null,
                      stale: proposalLoad.proposal.stale,
                    }
                  : null
              }
            />
          </div>
        </Card>

        {proposalLoad.proposal?.status === "APPROVED" ? (
          <Card variant="elevated" padding="lg">
            <h2 className="font-heading text-xl font-semibold text-brand">
              Proposal Delivery
            </h2>
            <div className="mt-4">
              <OpportunityProposalDeliveryCard
                opportunityId={opportunity.id}
                proposal={{
                  id: proposalLoad.proposal.id,
                  status: proposalLoad.proposal.status,
                  revision: proposalLoad.proposal.revision,
                  stale: proposalLoad.proposal.stale,
                }}
                contactOptions={deliveryContacts}
                deliveries={deliveries}
              />
            </div>
          </Card>
        ) : null}

        <Card variant="elevated" padding="lg">
          <OpportunityDetailControls
            opportunityId={opportunity.id}
            stage={opportunity.stage}
            nextAction={opportunity.nextAction}
            nextActionAtIso={
              opportunity.nextActionAt
                ? opportunity.nextActionAt.toISOString()
                : null
            }
          />
        </Card>

        <Card variant="elevated" padding="lg">
          <h2 className="font-heading text-xl font-semibold text-brand">
            Activity timeline
          </h2>
          {activities.length === 0 ? (
            <p className="mt-3 text-sm text-muted">No activity yet.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {activities.map((activity) => (
                <li
                  key={activity.id}
                  className="rounded-xl border border-border/80 px-4 py-3 text-sm"
                >
                  <p className="font-medium text-ink">
                    {activityLabel(activity.type)}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    {formatDateTime(activity.createdAt)} · {activity.actorEmail}
                  </p>
                  {activity.note ? (
                    <p className="mt-2 text-ink/90">{activity.note}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </Container>
    </main>
  );
}
