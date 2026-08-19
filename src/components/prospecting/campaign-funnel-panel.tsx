import type { CampaignFunnelMetrics } from "@/lib/prospecting/metrics/campaign-funnel";
import { formatFunnelRate } from "@/lib/prospecting/metrics/campaign-funnel";

interface CampaignFunnelPanelProps {
  metrics: CampaignFunnelMetrics;
}

export function CampaignFunnelPanel({ metrics }: CampaignFunnelPanelProps) {
  const { counts, rates } = metrics;

  return (
    <div className="space-y-4">
      <h2 className="font-heading text-xl font-semibold text-brand">
        Campaign funnel
      </h2>
      <p className="text-sm text-muted">
        Deterministic database counts. Reply and conversion rates use unique
        prospects with sent outreach as the denominator.
      </p>

      <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Discovered" value={counts.discovered} />
        <Metric label="Imported" value={counts.imported} />
        <Metric label="Audited" value={counts.audited} />
        <Metric label="Qualified" value={counts.qualified} />
        <Metric label="Selected top N" value={counts.selectedTopN} />
        <Metric label="Contacts found" value={counts.contactsFound} />
        <Metric label="Drafts generated" value={counts.draftsGenerated} />
        <Metric label="Approved" value={counts.approved} />
        <Metric label="Sent" value={counts.sent} />
        <Metric label="Replied" value={counts.replied} />
        <Metric label="Interested" value={counts.interested} />
        <Metric label="Not interested" value={counts.notInterested} />
        <Metric label="Converted to lead" value={counts.convertedToLead} />
      </dl>

      <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Metric
          label="Contact rate"
          value={formatFunnelRate(rates.contactRate)}
          detail="contacts found / selected top N"
        />
        <Metric
          label="Send rate"
          value={formatFunnelRate(rates.sendRate)}
          detail="sent / contacts found"
        />
        <Metric
          label="Reply rate"
          value={formatFunnelRate(rates.replyRate)}
          detail="replied or interested / sent"
        />
        <Metric
          label="Interest rate"
          value={formatFunnelRate(rates.interestRate)}
          detail="interested / sent"
        />
        <Metric
          label="Lead conversion rate"
          value={formatFunnelRate(rates.leadConversionRate)}
          detail="converted / sent"
        />
      </dl>
    </div>
  );
}

function Metric({
  label,
  value,
  detail,
}: {
  label: string;
  value: number | string;
  detail?: string;
}) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-brand">{value}</dd>
      {detail ? <dd className="mt-1 text-xs text-muted">{detail}</dd> : null}
    </div>
  );
}
