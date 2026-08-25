import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";

import { Button, Card, Container } from "@/components/ui";
import {
  CROSS_CHANNEL_INTELLIGENCE_VERSION,
  CROSS_CHANNEL_SIDE_EFFECT_BUDGET,
} from "@/lib/growth/cross-channel-intelligence";
import { getCrossChannelIntelligence } from "@/lib/growth/cross-channel-metrics";

export const metadata: Metadata = {
  title: "Cross-Channel Intelligence",
  description:
    "Deterministic cross-channel growth priorities from persisted evidence.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

function BandSection({
  label,
  testId,
  items,
}: {
  label: string;
  testId: string;
  items: Array<{
    action: string;
    title: string;
    why: string[];
    evidence: string[];
    strength: string;
    href: string | null;
  }>;
}) {
  return (
    <section className="space-y-3" data-testid={testId}>
      <h2 className="font-heading text-lg font-semibold text-brand">{label}</h2>
      {items.length === 0 ? (
        <p className="text-sm text-muted">None from current evidence.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li
              key={`${item.action}-${item.title}`}
              className="rounded-2xl border border-border bg-white p-4"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-blue">
                {item.action} · {item.strength}
              </p>
              <p className="mt-1 text-sm font-semibold text-brand">
                {item.title}
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-muted">
                {item.why.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
              <p className="mt-2 text-[11px] text-muted">
                Evidence: {item.evidence.join(" · ")}
              </p>
              {item.href ? (
                <Button
                  className="mt-3"
                  nativeButton={false}
                  render={<Link href={item.href} />}
                >
                  Open
                  <ArrowRight aria-hidden="true" className="size-4" />
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default async function CrossChannelIntelligencePage() {
  const report = await getCrossChannelIntelligence();

  return (
    <main className="min-h-screen bg-slate-50/70">
      <Container className="py-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-blue">
              CROSS_CHANNEL_INTELLIGENCE_VERSION ={" "}
              {CROSS_CHANNEL_INTELLIGENCE_VERSION}
            </p>
            <h1 className="mt-2 font-heading text-3xl font-semibold tracking-tight text-brand">
              Cross-Channel Intelligence
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
              What deserves attention next from real evidence — not a vanity
              score. Window {report.windowLabel}. Side-effect budget OPENAI=
              {CROSS_CHANNEL_SIDE_EFFECT_BUDGET.OPENAI} · META=
              {CROSS_CHANNEL_SIDE_EFFECT_BUDGET.META} · GSC=
              {CROSS_CHANNEL_SIDE_EFFECT_BUDGET.GSC} · GBP=
              {CROSS_CHANNEL_SIDE_EFFECT_BUDGET.GBP}.
            </p>
          </div>
          <Button
            nativeButton={false}
            render={<Link href="/reports/growth" />}
          >
            Growth hub
            <ArrowRight aria-hidden="true" className="size-4" />
          </Button>
        </div>

        <Card
          className="mt-6 space-y-2 p-5"
          data-testid="cross-channel-bottlenecks"
        >
          <h2 className="text-sm font-semibold text-brand">
            Current bottlenecks
          </h2>
          {report.bottlenecks.length === 0 ? (
            <p className="text-xs text-muted">
              No bottleneck surfaced — required evidence missing or no clear
              constraint.
            </p>
          ) : (
            <ul className="space-y-2 text-xs text-muted">
              {report.bottlenecks.map((b) => (
                <li key={b.code}>
                  <span className="font-semibold text-brand">{b.code}</span>
                  {" — "}
                  {b.interpretation} ({b.strength}
                  {b.sampleQuality ? ` · ${b.sampleQuality}` : ""})
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          <BandSection
            label="NOW"
            testId="cross-channel-now"
            items={report.recommendations.now}
          />
          <BandSection
            label="NEXT"
            testId="cross-channel-next"
            items={report.recommendations.next}
          />
          <BandSection
            label="WATCH"
            testId="cross-channel-watch"
            items={report.recommendations.watch}
          />
        </div>

        <Card className="mt-8 space-y-3 p-5" data-testid="cross-channel-states">
          <h2 className="text-sm font-semibold text-brand">Channel states</h2>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {report.channelStates.map((s) => (
              <div
                key={s.channel}
                className="rounded-xl border border-border/80 bg-white px-3 py-2"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">
                  {s.channel}
                </p>
                <p className="mt-1 text-sm font-semibold text-brand">
                  {s.state}
                </p>
                <p className="mt-1 text-[11px] text-muted">{s.explanation}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card
          className="mt-6 space-y-2 p-5"
          data-testid="cross-channel-experiments"
        >
          <h2 className="text-sm font-semibold text-brand">
            Active experiments
          </h2>
          {report.activeExperiments.length === 0 ? (
            <p className="text-xs text-muted">None recorded.</p>
          ) : (
            <ul className="space-y-1 text-xs text-muted">
              {report.activeExperiments.map((e) => (
                <li key={e.experimentId}>
                  {e.experimentId} ({e.channel}) — {e.recommendation}
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card
          className="mt-6 space-y-2 p-5"
          data-testid="cross-channel-commercial"
        >
          <h2 className="text-sm font-semibold text-brand">
            Commercial attention
          </h2>
          <p className="text-xs text-muted">
            {report.weeklyReview.commercialAttention}
          </p>
        </Card>

        <Card
          className="mt-6 space-y-2 p-5"
          data-testid="cross-channel-attribution"
        >
          <h2 className="text-sm font-semibold text-brand">
            Attribution health
          </h2>
          <p className="text-xs text-muted">
            {report.attributionHealth.state} · known=
            {report.attributionHealth.knownChannel} · direct=
            {report.attributionHealth.direct} · unknown=
            {report.attributionHealth.unknown} · eligible=
            {report.attributionHealth.eligible}
            {report.attributionHealth.knownRate != null
              ? ` · knownRate=${report.attributionHealth.knownRate}%`
              : ""}
            . {report.attributionHealth.interpretation}
          </p>
        </Card>

        <Card
          className="mt-6 space-y-2 p-5"
          data-testid="cross-channel-evidence-gaps"
        >
          <h2 className="text-sm font-semibold text-brand">Evidence gaps</h2>
          <p className="text-xs text-muted">
            {report.weeklyReview.whatEvidenceWeak}
          </p>
          {report.gbpDependency ? (
            <p className="text-xs text-muted" data-testid="gbp-api-pending-note">
              Dependency: {report.gbpDependency.code} —{" "}
              {report.gbpDependency.interpretation}
            </p>
          ) : null}
        </Card>

        <Card
          className="mt-6 space-y-3 p-5"
          data-testid="cross-channel-weekly-review"
        >
          <h2 className="text-sm font-semibold text-brand">
            Weekly growth review (deterministic)
          </h2>
          <ol className="list-decimal space-y-2 pl-5 text-xs text-muted">
            <li>What changed? {report.weeklyReview.whatChanged}</li>
            <li>What needs action? {report.weeklyReview.whatNeedsAction}</li>
            <li>What are we waiting on? {report.weeklyReview.whatWaitingOn}</li>
            <li>
              What evidence is still weak? {report.weeklyReview.whatEvidenceWeak}
            </li>
            <li>
              Current bottleneck? {report.weeklyReview.currentBottleneck}
            </li>
            <li>
              What should we NOT work on? {report.weeklyReview.whatNotToWorkOn}
            </li>
            <li>
              Active experiments? {report.weeklyReview.activeExperiments}
            </li>
            <li>
              Commercial attention? {report.weeklyReview.commercialAttention}
            </li>
            <li>Reviews due? {report.weeklyReview.reviewsDue}</li>
            <li>
              Attribution coverage improved?{" "}
              {report.weeklyReview.attributionCoverageImproved}
            </li>
          </ol>
        </Card>
      </Container>
    </main>
  );
}
