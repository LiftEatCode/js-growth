import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";

import { Button, Card, Container } from "@/components/ui";
import {
  formatFunnelCount,
  formatFunnelRate,
  type FunnelCountMetric,
  type FunnelRateMetric,
} from "@/lib/growth/audit-funnel-display";
import {
  LEAD_CONVERSION_INTELLIGENCE_VERSION,
  formatCentsUsd,
  type CountObservation,
  type RateObservation,
} from "@/lib/growth/lead-conversion-intelligence";
import { getLeadConversionIntelligence } from "@/lib/growth/lead-conversion-metrics";
import { lastNDaysEndingNow } from "@/lib/growth/funnel-metrics";
import { requireInternalSession } from "@/lib/internal-auth";

export const metadata: Metadata = {
  title: "Lead Conversion Intelligence",
  description:
    "Observe inbound vs outbound pipeline, attribution coverage, and operator attention.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

function asCount(obs: CountObservation): FunnelCountMetric {
  return { status: obs.status, value: obs.value };
}

function asRate(obs: RateObservation): FunnelRateMetric {
  return { status: obs.status, value: obs.value };
}

async function WindowReport({
  label,
  days,
}: {
  label: string;
  days: 7 | 28 | 90;
}) {
  const report = await getLeadConversionIntelligence(lastNDaysEndingNow(days));
  return (
      <section className="space-y-4">
        <h2 className="font-heading text-xl font-semibold text-brand">
          {label}
        </h2>
        <p className="text-xs text-muted">
          Sample: inbound {report.sample.inbound} · outbound{" "}
          {report.sample.outbound} · audits {report.sample.audits}. ROI{" "}
          {report.money.roiStatus}. First/latest touch: not modeled in
          first-party.
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric
            label="Inbound leads"
            value={formatFunnelCount(asCount(report.counts.inboundLeads))}
          />
          <Metric
            label="Outbound prospects"
            value={formatFunnelCount(asCount(report.counts.outboundProspects))}
          />
          <Metric
            label="Opportunities"
            value={formatFunnelCount(asCount(report.counts.opportunities))}
          />
          <Metric
            label="Proposals"
            value={formatFunnelCount(asCount(report.counts.proposals))}
          />
          <Metric
            label="Agreements accepted"
            value={formatFunnelCount(asCount(report.counts.agreementsAccepted))}
          />
          <Metric
            label="Payments paid"
            value={formatFunnelCount(asCount(report.counts.paymentsPaid))}
          />
          <Metric
            label="Clients"
            value={formatFunnelCount(asCount(report.counts.clients))}
          />
          <Metric
            label="Public audits"
            value={formatFunnelCount(asCount(report.counts.publicAudits))}
          />
        </div>
        <Card className="space-y-2 p-5">
          <p className="text-sm font-semibold text-brand">Conversion rates</p>
          <ul className="space-y-1 text-sm text-muted">
            <li>
              Audit → inbound lead:{" "}
              {formatFunnelRate(asRate(report.rates.auditToInboundLead))}
            </li>
            <li>
              Inbound lead → opportunity (leadId join):{" "}
              {formatFunnelRate(asRate(report.rates.inboundLeadToOpportunity))}
            </li>
            <li>
              Opportunity → proposal:{" "}
              {formatFunnelRate(asRate(report.rates.opportunityToProposal))}
            </li>
            <li>
              Proposal → agreement:{" "}
              {formatFunnelRate(asRate(report.rates.proposalToAgreement))}
            </li>
            <li>
              Agreement → payment:{" "}
              {formatFunnelRate(asRate(report.rates.agreementToPayment))}
            </li>
            <li>
              Clients / page views:{" "}
              {formatFunnelRate(asRate(report.rates.clientsPerPageView))}{" "}
              (not justified)
            </li>
          </ul>
        </Card>
        <Card className="space-y-2 p-5">
          <p className="text-sm font-semibold text-brand">
            Channel audits (first-party UTM)
          </p>
          <ul className="space-y-1 text-sm text-muted">
            {report.channels.map((row) => (
              <li key={row.channel}>
                {row.channel}: {formatFunnelCount(asCount(row.audits))}
                {row.channel === "GBP" ? ` · ${row.statusNote}` : ""}
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted">
            UTM coverage {report.attributionCoverage.auditsWithUtm} · unknown
            attribution {report.attributionCoverage.auditsUnknown} · DIRECT and
            UNKNOWN stay explicit.
          </p>
        </Card>
        <Card className="space-y-2 p-5">
          <p className="text-sm font-semibold text-brand">Money (read-only)</p>
          <ul className="space-y-1 text-sm text-muted">
            <li>
              Open approved proposal pipeline:{" "}
              {formatCentsUsd(report.money.pipelineApprovedProposalCents)}{" "}
              (latest approved per active opportunity; no double-count)
            </li>
            <li>
              Accepted agreements in window:{" "}
              {formatCentsUsd(report.money.acceptedAgreementCents)}
            </li>
            <li>
              Paid commercial (amountPaidCents):{" "}
              {formatCentsUsd(report.money.paidCommercialCents)} ·{" "}
              {report.money.revenueKind}
            </li>
            <li>
              Attributed revenue (payment → opportunity.lead → public audit
              UTM): {formatCentsUsd(report.money.attributedRevenueCents)}
            </li>
            <li>ROI: {report.money.roiStatus}</li>
          </ul>
        </Card>
        <Card className="space-y-2 p-5">
          <p className="text-sm font-semibold text-brand">
            Content / channel business signals
          </p>
          <p className="text-sm text-muted">
            Facebook audits {report.facebookPipeline.attributedAudits} · inbound
            leads {report.facebookPipeline.inboundLeads} ·{" "}
            {report.facebookPipeline.signal}
          </p>
          <p className="text-sm text-muted">
            /seo landing audits {report.searchPipeline.seoLandingAudits} ·
            inbound leads {report.searchPipeline.inboundLeads} ·{" "}
            {report.searchPipeline.signal}
          </p>
          {report.contentPipeline.length === 0 ? (
            <p className="text-sm text-muted">
              No public-safe content identifiers observed in this window.
            </p>
          ) : (
            <ul className="space-y-1 text-sm text-muted">
              {report.contentPipeline.map((row) => (
                <li key={row.publicSlug}>
                  {row.publicSlug}: {row.audits} audits · {row.inboundLeads}{" "}
                  inbound leads · {row.signal}
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card className="space-y-2 p-5">
          <p className="text-sm font-semibold text-brand">Velocity (median days)</p>
          <ul className="space-y-1 text-sm text-muted">
            <li>
              Prospect → opportunity:{" "}
              {report.velocity.prospectToOpportunity.status === "AVAILABLE"
                ? `${report.velocity.prospectToOpportunity.medianDays}d (n=${report.velocity.prospectToOpportunity.count})`
                : "INSUFFICIENT DATA"}
            </li>
            <li>
              Opportunity → proposal:{" "}
              {report.velocity.opportunityToProposal.status === "AVAILABLE"
                ? `${report.velocity.opportunityToProposal.medianDays}d (n=${report.velocity.opportunityToProposal.count})`
                : "INSUFFICIENT DATA"}
            </li>
            <li>
              Proposal → agreement:{" "}
              {report.velocity.proposalToAgreement.status === "AVAILABLE"
                ? `${report.velocity.proposalToAgreement.medianDays}d (n=${report.velocity.proposalToAgreement.count})`
                : "INSUFFICIENT DATA"}
            </li>
            <li>
              Agreement → payment:{" "}
              {report.velocity.agreementToPayment.status === "AVAILABLE"
                ? `${report.velocity.agreementToPayment.medianDays}d (n=${report.velocity.agreementToPayment.count})`
                : "INSUFFICIENT DATA"}
            </li>
          </ul>
        </Card>
        <Card className="space-y-2 p-5">
          <p className="text-sm font-semibold text-brand">NOW / NEXT / WATCH</p>
          {report.priorityActions.length === 0 ? (
            <p className="text-sm text-muted">No bounded actions this window.</p>
          ) : (
            <ul className="space-y-1 text-sm text-muted">
              {report.priorityActions.map((item) => (
                <li key={`${item.band}-${item.action}-${item.reason}`}>
                  {item.band}: {item.action} — {item.reason}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
        {label}
      </p>
      <p className="mt-2 font-heading text-2xl text-brand">{value}</p>
    </div>
  );
}

export default async function LeadConversionPage() {
  await requireInternalSession();
  const primary = await getLeadConversionIntelligence(lastNDaysEndingNow(28));

  return (
    <Container className="py-10">
      <Button nativeButton={false} render={<Link href="/reports/growth" />}>
        <ArrowLeft aria-hidden="true" className="size-4" />
        Growth dashboard
      </Button>
      <h1 className="mt-6 font-heading text-3xl font-semibold text-brand">
        Lead Conversion Intelligence
      </h1>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
        Version {LEAD_CONVERSION_INTELLIGENCE_VERSION}. Observation only —
        commercial records stay authoritative. Inbound leads and outbound
        prospects are never mixed. Contact submissions and qualified visits are
        NOT CAPTURED in this first-party join. Dashboard OpenAI/Meta/GSC = 0.
      </p>

      <Card className="mt-6 space-y-3 p-5">
        <p className="text-sm font-semibold text-brand">Attention needed</p>
        {primary.attention.length === 0 ? (
          <p className="text-sm text-muted">
            No operator attention items from supported commercial states.
          </p>
        ) : (
          <ul className="space-y-2 text-sm">
            {primary.attention.map((item) => (
              <li key={`${item.kind}-${item.href}-${item.title}`}>
                <Link className="text-brand underline" href={item.href}>
                  {item.kind}
                </Link>
                : {item.title} → {item.recommendedAction}
                {item.ageBand ? ` · ${item.ageBand}` : ""}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="mt-10 space-y-12">
        <WindowReport label="Last 28 days" days={28} />
        <WindowReport label="Last 7 days" days={7} />
        <WindowReport label="Last 90 days" days={90} />
      </div>
    </Container>
  );
}
