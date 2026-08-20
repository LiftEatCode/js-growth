import type { CampaignDeliveryHealthCounts } from "@/lib/prospecting/metrics/load-campaign-delivery";

interface CampaignDeliveryHealthPanelProps {
  counts: CampaignDeliveryHealthCounts;
}

export function CampaignDeliveryHealthPanel({
  counts,
}: CampaignDeliveryHealthPanelProps) {
  return (
    <div className="space-y-4">
      <h2 className="font-heading text-xl font-semibold text-brand">
        Email delivery health
      </h2>
      <p className="text-sm text-muted">
        Operational Resend delivery counts for email outreach in this campaign.
        These are message-level health metrics, separate from reply and conversion
        funnel rates.
      </p>

      <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Sent" value={counts.sent} />
        <Metric label="Delivered" value={counts.delivered} />
        <Metric label="Delayed" value={counts.delayed} />
        <Metric label="Failed" value={counts.failed} />
        <Metric label="Bounced" value={counts.bounced} />
        <Metric label="Complaints" value={counts.complained} />
        <Metric label="Suppressed" value={counts.suppressed} />
      </dl>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-brand">{value}</dd>
    </div>
  );
}
