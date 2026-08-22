import { formatUsdCents } from "@/lib/commercialization/pricing/constants";
import type { AgreementSnapshot } from "@/lib/commercialization/agreement/types";

export interface AgreementDocumentProps {
  snapshot: AgreementSnapshot;
  showAcceptanceSection?: boolean;
  acceptanceSlot?: React.ReactNode;
}

export function AgreementDocument({
  snapshot,
  showAcceptanceSection = false,
  acceptanceSlot,
}: AgreementDocumentProps) {
  return (
    <article className="mx-auto max-w-3xl space-y-12 text-ink print:max-w-none">
      <header className="space-y-3 border-b border-border pb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
          JS Solutions
        </p>
        <h1 className="font-heading text-3xl font-semibold text-brand sm:text-4xl">
          {snapshot.agreementTitle}
        </h1>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
          <p>
            Client: <span className="text-ink">{snapshot.businessName}</span>
          </p>
          {snapshot.locationLabel ? <p>{snapshot.locationLabel}</p> : null}
          <p>Prepared: {snapshot.preparedDateLabel}</p>
        </div>
        <p className="text-xs text-muted">{snapshot.proposalReference}</p>
      </header>

      <section className="space-y-3">
        <h2 className="font-heading text-xl font-semibold text-brand">
          1. Engagement Overview
        </h2>
        <p className="text-sm leading-relaxed text-ink/90 whitespace-pre-wrap">
          {snapshot.engagementOverview}
        </p>
      </section>

      <section className="space-y-6">
        <h2 className="font-heading text-xl font-semibold text-brand">
          2. Included Services
        </h2>
        {snapshot.sections.map((section) => (
          <div
            key={section.title}
            className="space-y-3 border-b border-border/70 pb-6 last:border-b-0"
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
              <ul className="list-disc space-y-1.5 pl-5 text-sm text-ink/90">
                {section.deliverables.map((d) => (
                  <li key={`${section.title}-${d.title}`}>
                    {d.title}
                    {d.isOptional ? " (optional)" : ""}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ))}
        {snapshot.optionalSections.length > 0 ? (
          <div className="space-y-4">
            <h3 className="font-heading text-lg font-semibold text-ink">
              Optional work
            </h3>
            {snapshot.optionalSections.map((section) => (
              <div key={`opt-${section.title}`} className="space-y-2">
                <h4 className="font-medium text-ink">{section.title}</h4>
                <ul className="list-disc space-y-1 pl-5 text-sm text-ink/90">
                  {section.deliverables.map((d) => (
                    <li key={`${section.title}-${d.title}`}>{d.title}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : null}
      </section>

      {snapshot.considerations.length > 0 ? (
        <section className="space-y-3">
          <h2 className="font-heading text-xl font-semibold text-brand">
            3. Implementation Considerations
          </h2>
          <ul className="list-disc space-y-2 pl-5 text-sm text-ink/90">
            {snapshot.considerations.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {snapshot.assumptions.length > 0 ? (
        <section className="space-y-3">
          <h2 className="font-heading text-xl font-semibold text-brand">
            4. Assumptions
          </h2>
          <ul className="list-disc space-y-2 pl-5 text-sm text-ink/90">
            {snapshot.assumptions.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {snapshot.exclusions.length > 0 ? (
        <section className="space-y-3">
          <h2 className="font-heading text-xl font-semibold text-brand">
            5. Exclusions
          </h2>
          <ul className="list-disc space-y-2 pl-5 text-sm text-ink/90">
            {snapshot.exclusions.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="space-y-3">
        <h2 className="font-heading text-xl font-semibold text-brand">
          6. Client Responsibilities
        </h2>
        <ul className="list-disc space-y-2 pl-5 text-sm text-ink/90">
          {snapshot.clientResponsibilities.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-xl font-semibold text-brand">
          7. JS Solutions Responsibilities
        </h2>
        <ul className="list-disc space-y-2 pl-5 text-sm text-ink/90">
          {snapshot.jsResponsibilities.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="font-heading text-xl font-semibold text-brand">
          8. Investment
        </h2>
        <div className="space-y-2 text-sm text-ink/90">
          <p>
            Base Implementation Investment:{" "}
            <span className="font-semibold text-ink">
              {formatUsdCents(snapshot.investment.includedCents)}
            </span>
          </p>
          {snapshot.investment.optionalCents > 0 ? (
            <p>
              Optional Work:{" "}
              <span className="font-semibold text-ink">
                {formatUsdCents(snapshot.investment.optionalCents)}
              </span>
            </p>
          ) : null}
          <p className="text-base font-semibold text-brand">
            Total Agreement Investment:{" "}
            {formatUsdCents(snapshot.investment.totalCents)}
          </p>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-xl font-semibold text-brand">
          9. Payment Terms
        </h2>
        <p className="text-sm leading-relaxed text-ink/90 whitespace-pre-wrap">
          {snapshot.paymentTerms.displaySummary}
        </p>
        {snapshot.paymentTerms.customText ? (
          <p className="text-sm leading-relaxed text-ink/90 whitespace-pre-wrap">
            {snapshot.paymentTerms.customText}
          </p>
        ) : null}
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-xl font-semibold text-brand">
          10. Timeline / Scheduling
        </h2>
        <p className="text-sm leading-relaxed text-ink/90 whitespace-pre-wrap">
          {snapshot.timelineTerms}
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-xl font-semibold text-brand">
          11. Change Requests / Out-of-Scope Work
        </h2>
        <p className="text-sm leading-relaxed text-ink/90 whitespace-pre-wrap">
          {snapshot.changeRequestTerms}
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-xl font-semibold text-brand">
          12. Third-Party Costs
        </h2>
        <p className="text-sm leading-relaxed text-ink/90 whitespace-pre-wrap">
          {snapshot.thirdPartyCostTerms}
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-xl font-semibold text-brand">
          13. Results Disclaimer
        </h2>
        <p className="text-sm leading-relaxed text-ink/90 whitespace-pre-wrap">
          {snapshot.resultsDisclaimer}
        </p>
      </section>

      {showAcceptanceSection ? (
        <section className="space-y-4 border-t border-border pt-8 print:hidden">
          <h2 className="font-heading text-xl font-semibold text-brand">
            Agreement Acceptance
          </h2>
          {acceptanceSlot}
        </section>
      ) : null}
    </article>
  );
}
