import { AI_DISCLOSURE } from "@/lib/website-audit/ai-interpretation/constants";
import {
  BUSINESS_IMPACT_LABELS,
  IMPLEMENTATION_AREA_LABELS,
} from "@/lib/website-audit/ai-interpretation/copy";
import type { AiInterpretationView } from "@/lib/website-audit/ai-interpretation/types";
import { ReportSection } from "@/components/website-audit/report-ui";

import { ReportAiEvent } from "./report-ai-event";
import { ReportAiGeneratingRefresh } from "./report-ai-generating-refresh";

interface ReportAiInterpretationProps {
  interpretation: AiInterpretationView | null | undefined;
  showAiInterpretation: boolean;
  reportId?: string;
}

function paragraphs(value: string): string[] {
  return value
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function ReportAiInterpretation({
  interpretation,
  showAiInterpretation,
  reportId,
}: ReportAiInterpretationProps) {
  if (!showAiInterpretation || !interpretation || interpretation.status === "hidden") {
    return null;
  }

  if (interpretation.status === "generating") {
    return (
      <section id="report-ai-analysis" className="scroll-mt-24">
        <ReportSection
          eyebrow="Executive Growth Analysis"
          title="Building your Executive Growth Analysis"
          description="Strategic interpretation of your Website Growth Audit. The rest of your Professional report is ready below."
        >
          <p className="text-sm leading-6 text-muted">
            This usually takes less than a minute. Refresh the page if this
            message is still here shortly.
          </p>
          <ReportAiGeneratingRefresh />
        </ReportSection>
      </section>
    );
  }

  if (interpretation.status === "unavailable" || !interpretation.record) {
    return (
      <section id="report-ai-analysis" className="scroll-mt-24">
        <ReportSection
          eyebrow="Executive Growth Analysis"
          title="Strategic interpretation is temporarily unavailable"
          description="Your full Professional audit remains available."
        >
          <p className="text-sm leading-6 text-muted">
            Scores, findings, competitive measurements, and the action plan
            below were produced by JS Growth&apos;s deterministic audit engine.
            You can still use the Professional report while this section is
            unavailable.
          </p>
          {reportId ? (
            <ReportAiEvent
              reportId={reportId}
              status="unavailable"
              model={interpretation.record?.model}
            />
          ) : null}
        </ReportSection>
      </section>
    );
  }

  const content = interpretation.record.content;
  const competitive = content.competitiveInterpretation;

  return (
    <section id="report-ai-analysis" className="scroll-mt-24 space-y-6">
      {reportId ? (
        <ReportAiEvent
          reportId={reportId}
          status="completed"
          model={interpretation.record.model}
        />
      ) : null}

      <ReportSection
        eyebrow="Executive Growth Analysis"
        title={content.strategicDiagnosis.headline}
        description="Strategic interpretation of your Website Growth Audit."
      >
        <div className="space-y-4">
          {paragraphs(content.executiveSummary).map((paragraph) => (
            <p key={paragraph.slice(0, 48)} className="text-sm leading-7 text-muted sm:text-base">
              {paragraph}
            </p>
          ))}
          <p className="text-sm leading-7 text-brand">{content.strategicDiagnosis.explanation}</p>
          <p className="text-xs leading-5 text-muted">{AI_DISCLOSURE}</p>
        </div>
      </ReportSection>

      <section aria-labelledby="ai-priorities-heading">
        <h2
          id="ai-priorities-heading"
          className="font-heading text-2xl font-semibold tracking-tight text-brand"
        >
          Top strategic priorities
        </h2>
        <ol className="mt-4 grid gap-4">
          {content.topPriorities.map((priority) => (
            <li
              key={`${priority.rank}-${priority.title}`}
              className="rounded-2xl border border-border bg-white p-5 shadow-sm"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-blue">
                Priority {priority.rank}
              </p>
              <h3 className="mt-2 font-heading text-lg font-semibold text-brand">
                {priority.title}
              </h3>
              <p className="mt-3 text-sm leading-6 text-muted">{priority.whyItMatters}</p>
              <p className="mt-3 text-sm leading-6 text-brand">
                <span className="font-semibold">Evidence: </span>
                {priority.evidence}
              </p>
              <p className="mt-2 text-sm leading-6 text-muted">
                <span className="font-semibold text-brand">Direction: </span>
                {priority.recommendedDirection}
              </p>
              <p className="mt-3 text-xs font-medium text-muted">
                Potential impact:{" "}
                {priority.expectedBusinessImpact
                  .map((item) => BUSINESS_IMPACT_LABELS[item])
                  .join(", ")}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="ai-start-heading">
        <h2
          id="ai-start-heading"
          className="font-heading text-2xl font-semibold tracking-tight text-brand"
        >
          Start here this week
        </h2>
        <ul className="mt-4 grid gap-3">
          {content.startThisWeek.map((item) => (
            <li
              key={item}
              className="rounded-xl border border-border bg-slate-50/80 px-4 py-3 text-sm leading-6 text-brand"
            >
              {item}
            </li>
          ))}
        </ul>
      </section>

      {competitive ? (
        <section aria-labelledby="ai-competitive-heading">
          <h2
            id="ai-competitive-heading"
            className="font-heading text-2xl font-semibold tracking-tight text-brand"
          >
            Competitive position
          </h2>
          <p className="mt-3 text-sm leading-7 text-muted">{competitive.positionSummary}</p>
          {competitive.strongestAdvantages.length > 0 ? (
            <div className="mt-4">
              <h3 className="text-sm font-semibold text-brand">Strongest advantages</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-muted">
                {competitive.strongestAdvantages.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {competitive.biggestGaps.length > 0 ? (
            <div className="mt-4">
              <h3 className="text-sm font-semibold text-brand">Biggest gaps</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-muted">
                {competitive.biggestGaps.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      ) : null}

      <section aria-labelledby="ai-strategy-heading">
        <h2
          id="ai-strategy-heading"
          className="font-heading text-2xl font-semibold tracking-tight text-brand"
        >
          30 / 60 / 90 day strategy
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          This is the strategic sequence. The checklist later in the report is
          the deterministic task list from the audit engine.
        </p>
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <PhaseCard
            title="First 30 days"
            items={content.ninetyDayStrategy.first30Days}
          />
          <PhaseCard
            title="Days 31–60"
            items={content.ninetyDayStrategy.days31To60}
          />
          <PhaseCard
            title="Days 61–90"
            items={content.ninetyDayStrategy.days61To90}
          />
        </div>
      </section>

      <section aria-labelledby="ai-implementation-heading">
        <h2
          id="ai-implementation-heading"
          className="font-heading text-2xl font-semibold tracking-tight text-brand"
        >
          Implementation areas
        </h2>
        <ul className="mt-4 grid gap-4 sm:grid-cols-2">
          {content.implementationAreas.map((area) => (
            <li
              key={area.area}
              className="rounded-2xl border border-border bg-white p-5"
            >
              <h3 className="font-heading text-lg font-semibold text-brand">
                {IMPLEMENTATION_AREA_LABELS[area.area]}
              </h3>
              <p className="mt-2 text-sm leading-6 text-muted">{area.whyItMatters}</p>
              <p className="mt-2 text-sm leading-6 text-brand">{area.recommendedDirection}</p>
              {area.professionalHelpMayBeUseful ? (
                <p className="mt-3 text-xs font-medium text-muted">
                  Specialized implementation help may be useful in this area.
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      <p className="text-sm leading-7 text-muted">{content.closingSummary}</p>
    </section>
  );
}

function PhaseCard({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="rounded-2xl border border-border bg-white p-4">
      <h3 className="font-heading text-base font-semibold text-brand">{title}</h3>
      <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6 text-muted">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ol>
    </section>
  );
}
