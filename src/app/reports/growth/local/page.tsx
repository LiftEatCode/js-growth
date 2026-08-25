import Link from "next/link";
import type { Metadata } from "next";

import { GbpChecklistItemForm } from "@/components/growth/gbp-checklist-form";
import { GbpConnectionPanel } from "@/components/growth/gbp-connection-panel";
import { GbpSnapshotForm } from "@/components/growth/gbp-snapshot-form";
import { GbpUtmPresets } from "@/components/growth/gbp-utm-presets";
import { CreateGbpContentButtons } from "@/components/growth/gbp-content-actions";
import { Button, Card, Container } from "@/components/ui";
import {
  CLIENT_SAFE_LOCAL_LANGUAGE,
  GBP_EXPERIMENTS,
  GBP_EXPERIMENTAL_POST_CADENCE,
  JS_SOLUTIONS_LOCAL_FACTS,
  LOCAL_API_SIDE_EFFECT_BUDGET,
  LOCAL_EVIDENCE_LAYERS,
  LOCAL_GROWTH_VERSION,
  LOCAL_SNAPSHOT_CADENCE,
  REVIEW_REQUEST_SAFETY,
  REVIEW_RESPONSE_TEMPLATES,
} from "@/lib/growth/local-growth";
import { getLocalGrowthDashboardModel } from "@/lib/growth/local-growth-metrics";
import { getGbpConnectionPanelModel } from "@/lib/gbp/connection-store";
import { GBP_READ_INTEGRATION_VERSION } from "@/lib/gbp/constants";
import { requireInternalSession } from "@/lib/internal-auth";

export const metadata: Metadata = {
  title: "Local Growth / GBP",
  description:
    "Local Search and Google Business Profile intelligence — manual V1.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

function StatusBadge({ status }: { status: string }) {
  return (
    <span className="rounded-md border border-border bg-slate-50 px-2 py-0.5 font-mono text-xs text-muted">
      {status}
    </span>
  );
}

export default async function LocalGrowthPage() {
  await requireInternalSession();
  const [model, gbpConnection] = await Promise.all([
    getLocalGrowthDashboardModel(),
    getGbpConnectionPanelModel(),
  ]);

  const canonicalHints: Record<string, string | null> = {
    BUSINESS_NAME: JS_SOLUTIONS_LOCAL_FACTS.companyName,
    BUSINESS_DESCRIPTION: JS_SOLUTIONS_LOCAL_FACTS.positioning,
    WEBSITE: JS_SOLUTIONS_LOCAL_FACTS.siteUrl,
    PHONE: JS_SOLUTIONS_LOCAL_FACTS.phone ?? "NOT_CAPTURED in facts",
    ADDRESS_OR_SERVICE_AREA: JS_SOLUTIONS_LOCAL_FACTS.serviceAreaLabel,
  };

  return (
    <main className="py-10" data-testid="local-growth-page">
      <Container className="space-y-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              Growth · Local / GBP · v{LOCAL_GROWTH_VERSION} · Read Integration v
              {GBP_READ_INTEGRATION_VERSION}
            </p>
            <h1 className="font-heading text-3xl font-semibold text-brand">
              Local Growth Intelligence
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted">
              Read-first Google Business Profile integration. Sync Profile /
              Performance on demand — never on dashboard load. Blank metrics stay
              NOT_CAPTURED; 0 means observed zero. No automatic GBP writes.
            </p>
          </div>
          <Button
            nativeButton={false}
            render={<Link href="/reports/growth" />}
          >
            Back to Growth
          </Button>
        </div>

        <GbpConnectionPanel model={gbpConnection} />

        <Card className="space-y-3 p-6" data-testid="local-growth-overview">
          <h2 className="font-heading text-xl font-semibold text-brand">
            Local Growth Overview
          </h2>
          <p className="text-sm text-muted">
            Performance state:{" "}
            <StatusBadge status={model.performanceState} /> · Evidence:{" "}
            <StatusBadge status={model.evidenceStrength} />
          </p>
          <p className="text-xs text-muted">
            Evidence layers (kept separate — no fake GBP score):{" "}
            {LOCAL_EVIDENCE_LAYERS.join(" · ")}
          </p>
          <p className="text-xs text-muted">
            Cadence: {LOCAL_SNAPSHOT_CADENCE.weekly} /{" "}
            {LOCAL_SNAPSHOT_CADENCE.monthly} (
            {LOCAL_SNAPSHOT_CADENCE.label})
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <p className="text-xs text-muted">Profile views</p>
              <p className="font-mono text-sm" data-testid="metric-profile-views">
                {model.display.profileViews}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted">Website clicks (GBP Insights)</p>
              <p className="font-mono text-sm" data-testid="metric-website-clicks">
                {model.display.websiteClicks}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted">Calls</p>
              <p className="font-mono text-sm">{model.display.callClicks}</p>
            </div>
            <div>
              <p className="text-xs text-muted">Directions</p>
              <p className="font-mono text-sm">
                {model.display.directionRequests}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted">Reviews</p>
              <p className="font-mono text-sm" data-testid="metric-review-count">
                {model.display.reviewCount}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted">Rating</p>
              <p className="font-mono text-sm" data-testid="metric-rating">
                {model.display.averageRating}
              </p>
            </div>
          </div>
          <p className="text-xs text-muted">
            Side-effect budget: OpenAI={LOCAL_API_SIDE_EFFECT_BUDGET.OPENAI} ·
            Meta={LOCAL_API_SIDE_EFFECT_BUDGET.META} · GSC=
            {LOCAL_API_SIDE_EFFECT_BUDGET.GSC_API} · GBP API=
            {LOCAL_API_SIDE_EFFECT_BUDGET.GBP_API} · Places=
            {LOCAL_API_SIDE_EFFECT_BUDGET.PLACES}
          </p>
        </Card>

        <section className="space-y-4" data-testid="local-gbp-snapshot">
          <h2 className="font-heading text-xl font-semibold text-brand">
            GBP Snapshot
          </h2>
          <GbpSnapshotForm />
          {model.latestSnapshot ? (
            <Card className="space-y-2 p-4" data-testid="latest-gbp-snapshot">
              <p className="text-sm font-semibold">Latest snapshot</p>
              <p className="font-mono text-xs text-muted">
                id={model.latestSnapshot.id} ·{" "}
                {model.latestSnapshot.periodStart.slice(0, 10)} →{" "}
                {model.latestSnapshot.periodEnd.slice(0, 10)} · provenance=
                {model.latestSnapshot.metrics.provenance ?? "MANUAL"}
              </p>
              <p className="text-xs text-muted">
                Website clicks:{" "}
                {model.latestSnapshot.metrics.websiteClicks === undefined
                  ? "NOT_CAPTURED"
                  : model.latestSnapshot.metrics.websiteClicks}{" "}
                · Calls:{" "}
                {model.latestSnapshot.metrics.callClicks === undefined
                  ? "NOT_CAPTURED"
                  : model.latestSnapshot.metrics.callClicks}
              </p>
            </Card>
          ) : (
            <p className="text-sm text-muted" data-testid="no-gbp-baseline">
              No Local Growth baseline yet — NOT_CAPTURED for all Insights
              metrics until the operator captures one.
            </p>
          )}
        </section>

        <section className="space-y-4" data-testid="local-profile-checklist">
          <h2 className="font-heading text-xl font-semibold text-brand">
            Profile Checklist
          </h2>
          <p className="text-xs text-muted">
            Compares observations to JS_SOLUTIONS_BUSINESS_FACTS / local facts.
            Never mutates canonical facts. Service-area: addressPublic=
            {String(JS_SOLUTIONS_LOCAL_FACTS.addressPublic)}.
          </p>
          <p className="text-xs text-muted">
            Not reviewed: {model.checklist.notReviewed} · Needs attention:{" "}
            {model.checklist.needsAttention} · OK: {model.checklist.ok} ·
            Mismatches: {model.checklist.mismatches}
          </p>
          <div className="grid gap-3 lg:grid-cols-2">
            {model.checklist.items.map((item) => (
              <GbpChecklistItemForm
                key={item.key}
                itemKey={item.key as Parameters<
                  typeof GbpChecklistItemForm
                >[0]["itemKey"]}
                section={item.section}
                status={item.status}
                factMatch={item.factMatch}
                observation={item.observation}
                observedValue={item.observedValue}
                observationSource={item.observationSource}
                canonicalHint={canonicalHints[item.key] ?? null}
              />
            ))}
          </div>
        </section>

        <Card className="space-y-3 p-6" data-testid="local-reputation">
          <h2 className="font-heading text-xl font-semibold text-brand">
            Reputation
          </h2>
          <p className="text-sm text-muted">
            Review velocity: {model.reviewVelocity.status}
            {model.reviewVelocity.reviewsGained != null
              ? ` · gained ${model.reviewVelocity.reviewsGained}`
              : ""}
            {model.reviewVelocity.reviewsPerMonthApprox != null
              ? ` · ~${model.reviewVelocity.reviewsPerMonthApprox}/mo (observational)`
              : ""}
          </p>
          <p className="text-xs text-muted">
            No review text or reviewer PII stored. Auto review requests:{" "}
            {String(REVIEW_REQUEST_SAFETY.autoSendInSprint12)}.
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            {(
              [
                REVIEW_RESPONSE_TEMPLATES.positive,
                REVIEW_RESPONSE_TEMPLATES.neutral,
                REVIEW_RESPONSE_TEMPLATES.negative,
              ] as const
            ).map((t) => (
              <div key={t.label} className="rounded-xl border border-border p-3">
                <p className="text-sm font-semibold">{t.label}</p>
                <p className="mt-1 text-xs text-muted">{t.guidance}</p>
                <p className="mt-2 text-xs italic text-muted">{t.draftHint}</p>
              </div>
            ))}
          </div>
        </Card>

        <section className="space-y-4" data-testid="local-content">
          <h2 className="font-heading text-xl font-semibold text-brand">
            Content
          </h2>
          <p className="text-sm text-muted">
            Recommended: {model.content.gbpSupportContent.title} —{" "}
            {model.content.gbpSupportContent.note}
          </p>
          <p className="text-xs text-muted">
            Experimental post cadence:{" "}
            {GBP_EXPERIMENTAL_POST_CADENCE.postsPerWeekMin}–
            {GBP_EXPERIMENTAL_POST_CADENCE.postsPerWeekMax}/week (
            {GBP_EXPERIMENTAL_POST_CADENCE.label})
          </p>
          <p className="text-xs text-muted">
            Magnolia page: {model.content.magnoliaPage.decision} —{" "}
            {model.content.magnoliaPage.reasoning}
          </p>
          <p className="text-xs text-muted">
            Website→GBP: {model.content.websiteToGbp.decision} —{" "}
            {model.content.websiteToGbp.reasoning}
          </p>
          <CreateGbpContentButtons />
        </section>

        <section className="space-y-4" data-testid="local-attribution">
          <h2 className="font-heading text-xl font-semibold text-brand">
            Attribution
          </h2>
          <p className="text-sm text-muted">
            First-party GBP-tagged (28d): audits={model.attribution.audits} ·
            contacts={model.attribution.contacts} · leads=
            {model.attribution.leads} · claim strength={" "}
            <StatusBadge status={model.attribution.claimStrength} />
          </p>
          <p className="text-xs text-muted">
            GBP Insights website clicks ≠ first-party UTM sessions. Calls /
            directions stay platform metrics — not ContactSubmission/Lead counts.
            Generic google.com referrer is ORGANIC_SEARCH, never GBP.
          </p>
          <GbpUtmPresets />
        </section>

        <Card className="space-y-3 p-6" data-testid="local-experiments">
          <h2 className="font-heading text-xl font-semibold text-brand">
            Experiments
          </h2>
          <p className="text-sm text-muted">
            Current: <StatusBadge status={model.experiments.current} /> · Next:{" "}
            <StatusBadge status={model.experiments.next} />
          </p>
          <p className="text-xs text-muted">
            Sequence: {model.experiments.sequence.join(" → ")}
          </p>
          <ul className="space-y-2 text-sm">
            {GBP_EXPERIMENTS.map((exp) => (
              <li key={exp.id} className="rounded-lg border border-border p-3">
                <p className="font-semibold">
                  {exp.label}: {exp.title}{" "}
                  <StatusBadge status={exp.defaultStatus} />
                </p>
                <p className="text-xs text-muted">{exp.goal}</p>
                <p className="text-xs text-muted">Measure: {exp.measurement}</p>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="space-y-3 p-6" data-testid="local-search-opportunities">
          <h2 className="font-heading text-xl font-semibold text-brand">
            Search Opportunities
          </h2>
          <p className="text-sm text-muted">
            Extend Search Intelligence — no mass city clusters. Doorway
            protection active. Evaluate opportunities on Content / Search
            dashboards with DISTINCT_USER_VALUE + collision rules.
          </p>
          <Button
            nativeButton={false}
            render={<Link href="/reports/growth/content" />}
          >
            Open Content Intelligence
          </Button>
        </Card>

        <Card className="space-y-3 p-6" data-testid="local-next-actions">
          <h2 className="font-heading text-xl font-semibold text-brand">
            Next Actions
          </h2>
          <ul className="space-y-2">
            {model.nextActions.map((action) => (
              <li
                key={action.code}
                className="rounded-lg border border-border p-3"
                data-testid={`next-action-${action.code}`}
              >
                <p className="text-sm font-semibold">
                  <StatusBadge status={action.band} /> {action.title}
                </p>
                <p className="text-xs text-muted">{action.why}</p>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="space-y-2 p-6">
          <h2 className="font-heading text-lg font-semibold text-brand">
            Client-safe language
          </h2>
          <ul className="list-disc pl-5 text-xs text-muted">
            {CLIENT_SAFE_LOCAL_LANGUAGE.safe.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
          <p className="text-xs font-semibold text-red-700">Avoid:</p>
          <ul className="list-disc pl-5 text-xs text-muted">
            {CLIENT_SAFE_LOCAL_LANGUAGE.unsafe.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </Card>
      </Container>
    </main>
  );
}
