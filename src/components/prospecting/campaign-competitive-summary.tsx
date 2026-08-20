interface CampaignCompetitiveSummaryProps {
  prospectsWithCompetitorSet: number;
  candidatesFound: number;
  validatedCompetitors: number;
  selectedCompetitors: number;
}

export function CampaignCompetitiveSummary({
  prospectsWithCompetitorSet,
  candidatesFound,
  validatedCompetitors,
  selectedCompetitors,
}: CampaignCompetitiveSummaryProps) {
  return (
    <div className="space-y-4">
      <h2 className="font-heading text-xl font-semibold text-brand">
        Competitive landscape
      </h2>
      <p className="text-sm text-muted">
        Research-only. Competitors are not imported as campaign prospects and
        are not contacted from this workflow.
      </p>
      <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric
          label="Prospects with competitor set"
          value={prospectsWithCompetitorSet}
        />
        <Metric label="Candidates found" value={candidatesFound} />
        <Metric label="Validated competitors" value={validatedCompetitors} />
        <Metric label="Selected competitors" value={selectedCompetitors} />
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
