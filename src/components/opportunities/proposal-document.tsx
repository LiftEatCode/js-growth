import { formatUsdCents } from "@/lib/commercialization/pricing/constants";
import type { ProposalSnapshot } from "@/lib/commercialization/proposal/types";

export interface ProposalDocumentProps {
  title: string;
  executiveSummary: string;
  businessContext: string | null;
  approachIntro: string | null;
  timelineNote: string | null;
  nextStepText: string | null;
  snapshot: ProposalSnapshot;
  createdAtLabel?: string | null;
}

export function ProposalDocument({
  title,
  executiveSummary,
  businessContext,
  approachIntro,
  timelineNote,
  nextStepText,
  snapshot,
  createdAtLabel,
}: ProposalDocumentProps) {
  return (
    <article className="mx-auto max-w-3xl space-y-12 text-ink print:max-w-none">
      <header className="space-y-3 border-b border-border pb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
          JS Solutions
        </p>
        <h1 className="font-heading text-3xl font-semibold text-brand sm:text-4xl">
          {title}
        </h1>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
          {snapshot.locationLabel ? <p>{snapshot.locationLabel}</p> : null}
          {createdAtLabel ? <p>{createdAtLabel}</p> : null}
        </div>
      </header>

      <section className="space-y-3">
        <h2 className="font-heading text-xl font-semibold text-brand">
          Executive Summary
        </h2>
        <div className="space-y-3 text-sm leading-relaxed text-ink/90 whitespace-pre-wrap">
          {executiveSummary}
        </div>
      </section>

      {businessContext ? (
        <section className="space-y-3">
          <h2 className="font-heading text-xl font-semibold text-brand">
            Business Context
          </h2>
          <div className="space-y-3 text-sm leading-relaxed text-ink/90 whitespace-pre-wrap">
            {businessContext}
          </div>
        </section>
      ) : null}

      <section className="space-y-8">
        <div className="space-y-2">
          <h2 className="font-heading text-xl font-semibold text-brand">
            Recommended Approach
          </h2>
          {approachIntro ? (
            <p className="text-sm leading-relaxed text-ink/90 whitespace-pre-wrap">
              {approachIntro}
            </p>
          ) : null}
        </div>

        {snapshot.sections.map((section) => (
          <div
            key={section.title}
            className="space-y-3 border-b border-border/70 pb-6 last:border-b-0 last:pb-0 print:break-inside-avoid"
          >
            <h3 className="font-heading text-lg font-semibold text-ink">
              {section.title}
            </h3>
            {section.clientValueExplanation ? (
              <p className="text-sm leading-relaxed text-ink/85">
                {section.clientValueExplanation}
              </p>
            ) : null}
            {section.deliverables.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                  What we&apos;ll do
                </p>
                <ul className="list-disc space-y-1.5 pl-5 text-sm text-ink/90">
                  {section.deliverables.map((d) => (
                    <li key={`${section.title}-${d.sourceTitle}`}>
                      {d.title}
                      {d.isOptional ? " (optional)" : ""}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ))}
      </section>

      {snapshot.optionalSections.length > 0 ? (
        <section className="space-y-4">
          <h2 className="font-heading text-xl font-semibold text-brand">
            Optional Enhancements
          </h2>
          {snapshot.optionalSections.map((section) => (
            <div key={`opt-${section.title}`} className="space-y-2">
              <h3 className="font-heading text-lg font-semibold text-ink">
                {section.title}
              </h3>
              {section.clientValueExplanation ? (
                <p className="text-sm leading-relaxed text-ink/85">
                  {section.clientValueExplanation}
                </p>
              ) : null}
              <ul className="list-disc space-y-1 pl-5 text-sm text-ink/90">
                {section.deliverables.map((d) => (
                  <li key={`opt-${section.title}-${d.sourceTitle}`}>{d.title}</li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      ) : null}

      {snapshot.considerations.length > 0 ? (
        <section className="space-y-3">
          <h2 className="font-heading text-xl font-semibold text-brand">
            Implementation Considerations
          </h2>
          <ul className="list-disc space-y-1.5 pl-5 text-sm text-ink/90">
            {snapshot.considerations.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {snapshot.assumptions.length > 0 ? (
        <section className="space-y-3">
          <h2 className="font-heading text-xl font-semibold text-brand">
            Assumptions
          </h2>
          <ul className="list-disc space-y-1 pl-5 text-sm text-ink/90">
            {snapshot.assumptions.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {snapshot.exclusions.length > 0 ? (
        <section className="space-y-3">
          <h2 className="font-heading text-xl font-semibold text-brand">
            Exclusions
          </h2>
          <ul className="list-disc space-y-1 pl-5 text-sm text-ink/90">
            {snapshot.exclusions.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="space-y-6">
        <div className="space-y-2">
          <h2 className="font-heading text-xl font-semibold text-brand">
            Investment
          </h2>
          <p className="text-sm leading-relaxed text-ink/85">
            {snapshot.investmentIntro}
          </p>
        </div>

        <div className="space-y-4">
          {snapshot.includedInvestmentGroups.map((group) => (
            <div
              key={group.title}
              className="rounded-xl border border-border/80 bg-surface/30 px-4 py-4 print:break-inside-avoid print:border-border"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="font-heading text-base font-semibold text-ink">
                  {group.title}
                </h3>
                <p className="font-heading text-lg font-semibold tabular-nums text-brand">
                  {formatUsdCents(group.subtotalCents)}
                </p>
              </div>
              {group.includeLabels.length > 0 ? (
                <div className="mt-3 space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                    Includes
                  </p>
                  <ul className="list-disc space-y-1 pl-5 text-sm text-ink/85">
                    {group.includeLabels.map((label) => (
                      <li key={`${group.title}-${label}`}>{label}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ))}
        </div>

        {snapshot.engagementAdjustmentCents > 0 ? (
          <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
            <span>Engagement adjustment</span>
            <span className="font-medium tabular-nums">
              {formatUsdCents(snapshot.engagementAdjustmentCents)}
            </span>
          </div>
        ) : null}

        <div className="border-t border-border pt-5">
          <p className="text-sm text-muted">Base Implementation Investment</p>
          <p className="mt-1 font-heading text-3xl font-semibold text-brand tabular-nums">
            {formatUsdCents(snapshot.includedInvestmentCents)}
          </p>
        </div>

        {snapshot.optionalLines.length > 0 ? (
          <div className="space-y-3 border-t border-border pt-5">
            <h3 className="font-heading text-base font-semibold text-ink">
              Optional Enhancements
            </h3>
            <ul className="space-y-2 text-sm text-ink/90">
              {snapshot.optionalLines.map((line) => (
                <li
                  key={`opt-price-${line.title}`}
                  className="flex flex-wrap items-baseline justify-between gap-2"
                >
                  <span>{line.title}</span>
                  <span className="font-medium tabular-nums">
                    {formatUsdCents(line.lineTotalCents)}
                  </span>
                </li>
              ))}
            </ul>
            <p className="text-sm text-muted">
              Optional enhancements:{" "}
              {formatUsdCents(snapshot.optionalInvestmentCents)} (not included
              in base investment)
            </p>
            <p className="text-sm text-ink">
              Potential total with selected options:{" "}
              <span className="font-semibold tabular-nums">
                {formatUsdCents(snapshot.totalInvestmentCents)}
              </span>
            </p>
          </div>
        ) : null}
      </section>

      {timelineNote ? (
        <section className="space-y-3">
          <h2 className="font-heading text-xl font-semibold text-brand">
            Timeline
          </h2>
          <p className="text-sm leading-relaxed text-ink/90 whitespace-pre-wrap">
            {timelineNote}
          </p>
        </section>
      ) : null}

      {nextStepText ? (
        <section className="space-y-3 rounded-xl border border-border/80 bg-surface/40 px-5 py-5">
          <h2 className="font-heading text-xl font-semibold text-brand">
            Next Step
          </h2>
          <p className="text-sm leading-relaxed text-ink/90 whitespace-pre-wrap">
            {nextStepText}
          </p>
        </section>
      ) : null}

      <footer className="border-t border-border pt-4 text-xs leading-relaxed text-muted">
        {snapshot.methodologyFooter}
      </footer>
    </article>
  );
}
