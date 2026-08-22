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
}

export function ProposalDocument({
  title,
  executiveSummary,
  businessContext,
  approachIntro,
  timelineNote,
  nextStepText,
  snapshot,
}: ProposalDocumentProps) {
  return (
    <article className="mx-auto max-w-3xl space-y-10 text-ink print:max-w-none">
      <header className="space-y-3 border-b border-border pb-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
          JS Solutions
        </p>
        <h1 className="font-heading text-3xl font-semibold text-brand sm:text-4xl">
          {title}
        </h1>
        {snapshot.locationLabel ? (
          <p className="text-sm text-muted">{snapshot.locationLabel}</p>
        ) : null}
      </header>

      <section className="space-y-3">
        <h2 className="font-heading text-xl font-semibold text-brand">
          Executive Summary
        </h2>
        <p className="text-sm leading-relaxed text-ink/90 whitespace-pre-wrap">
          {executiveSummary}
        </p>
      </section>

      {businessContext ? (
        <section className="space-y-3">
          <h2 className="font-heading text-xl font-semibold text-brand">
            Business Context
          </h2>
          <p className="text-sm leading-relaxed text-ink/90 whitespace-pre-wrap">
            {businessContext}
          </p>
        </section>
      ) : null}

      <section className="space-y-5">
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
            className="space-y-2 print:break-inside-avoid"
          >
            <h3 className="font-heading text-lg font-semibold text-ink">
              {section.title}
            </h3>
            {section.capabilities.length > 0 ? (
              <p className="text-xs text-muted">
                {section.capabilities.join(" · ")}
              </p>
            ) : null}
            {section.description ? (
              <p className="text-sm text-ink/80">{section.description}</p>
            ) : null}
            <ul className="list-disc space-y-1 pl-5 text-sm text-ink/90">
              {section.deliverables.map((d) => (
                <li key={`${section.title}-${d.title}`}>
                  {d.title}
                  {d.isOptional ? " (optional)" : ""}
                </li>
              ))}
            </ul>
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
              <ul className="list-disc space-y-1 pl-5 text-sm text-ink/90">
                {section.deliverables.map((d) => (
                  <li key={`opt-${section.title}-${d.title}`}>{d.title}</li>
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
          <ul className="list-disc space-y-1 pl-5 text-sm text-ink/90">
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

      <section className="space-y-5">
        <h2 className="font-heading text-xl font-semibold text-brand">
          Investment
        </h2>

        {snapshot.includedInvestmentGroups.map((group) => (
          <div key={group.title} className="space-y-2 print:break-inside-avoid">
            <h3 className="font-heading text-base font-semibold text-ink">
              {group.title}
            </h3>
            <ul className="space-y-2 text-sm text-ink/90">
              {group.lines.map((line) => (
                <li
                  key={`${group.title}-${line.title}`}
                  className="flex flex-wrap items-baseline justify-between gap-2"
                >
                  <span>
                    {line.title}
                    {line.quantity > 1 ? ` × ${line.quantity}` : ""}
                    {line.alsoSupports.length > 0 ? (
                      <span className="mt-0.5 block text-xs text-muted">
                        Also supports: {line.alsoSupports.join(" · ")}
                      </span>
                    ) : null}
                  </span>
                  <span className="font-medium tabular-nums">
                    {formatUsdCents(line.lineTotalCents)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}

        {snapshot.engagementAdjustmentCents > 0 ? (
          <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
            <span>Engagement adjustment</span>
            <span className="font-medium tabular-nums">
              {formatUsdCents(snapshot.engagementAdjustmentCents)}
            </span>
          </div>
        ) : null}

        <div className="border-t border-border pt-4">
          <p className="text-sm text-muted">Base Implementation Investment</p>
          <p className="mt-1 font-heading text-3xl font-semibold text-brand tabular-nums">
            {formatUsdCents(snapshot.includedInvestmentCents)}
          </p>
        </div>

        {snapshot.optionalLines.length > 0 ? (
          <div className="space-y-3 border-t border-border pt-4">
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
        <section className="space-y-3 rounded-xl border border-border/80 bg-surface/40 px-5 py-4">
          <h2 className="font-heading text-xl font-semibold text-brand">
            Next Step
          </h2>
          <p className="text-sm leading-relaxed text-ink/90 whitespace-pre-wrap">
            {nextStepText}
          </p>
        </section>
      ) : null}
    </article>
  );
}
