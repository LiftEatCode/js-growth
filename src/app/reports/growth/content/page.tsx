import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";

import {
  ContentPlanControls,
  SeedContentPlansForm,
} from "@/components/growth/content-plan-controls";
import { Button, Card, Container } from "@/components/ui";
import {
  CONTENT_INTELLIGENCE_VERSION,
  FIRST_ACCEPTANCE_PLAN_SLUG,
  INITIAL_CONTENT_PLAN_SEEDS,
  recommendNextContent,
  type ContentBriefV1,
} from "@/lib/growth/content-intelligence";
import { listContentPlans } from "@/lib/growth/content-plan-store";
import { requireInternalSession } from "@/lib/internal-auth";

export const metadata: Metadata = {
  title: "Content Intelligence",
  description:
    "Internal content planning, briefs, and operator-gated AI drafts.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function GrowthContentIntelligencePage() {
  await requireInternalSession();
  const plans = await listContentPlans(50);
  const recommended = recommendNextContent();
  const acceptance =
    plans.find((p) => p.slug === FIRST_ACCEPTANCE_PLAN_SLUG) ?? null;

  return (
    <main className="min-h-screen bg-slate-50/70">
      <Container className="py-10">
        <Button
          size="sm"
          variant="outline"
          nativeButton={false}
          render={<Link href="/reports/growth" />}
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Growth dashboard
        </Button>

        <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-heading text-3xl font-semibold tracking-tight text-brand">
              Content Intelligence
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
              Decide what the business needs to say next — then develop with
              human review. content-intelligence-v{CONTENT_INTELLIGENCE_VERSION}.
              Dashboard load OpenAI calls: <strong>0</strong>. No auto-publish.
              No mass generation.
            </p>
          </div>
          <SeedContentPlansForm />
        </div>

        <section className="mt-8 space-y-3">
          <h2 className="font-heading text-xl font-semibold text-brand">
            Recommended next content
          </h2>
          <div className="grid gap-3 lg:grid-cols-2">
            {recommended.map((item) => (
              <Card key={item.slug} className="space-y-2 p-5">
                <p className="text-sm font-semibold text-brand">
                  {item.priorityBand} · {item.contentType}
                </p>
                <p className="text-sm text-brand">{item.title}</p>
                <ul className="list-disc space-y-1 pl-5 text-xs text-muted">
                  {item.why.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
                <p className="text-xs text-muted">
                  Collision: {item.collisionState}
                </p>
              </Card>
            ))}
          </div>
        </section>

        <section className="mt-10 space-y-3">
          <h2 className="font-heading text-xl font-semibold text-brand">
            Initial seed backlog ({INITIAL_CONTENT_PLAN_SEEDS.length})
          </h2>
          <p className="text-sm text-muted">
            Seed creates BRIEF_READY plans from Sprint 5 opportunities. First
            acceptance plan:{" "}
            <code className="text-xs">{FIRST_ACCEPTANCE_PLAN_SLUG}</code>.
          </p>
        </section>

        <section className="mt-10 space-y-4">
          <h2 className="font-heading text-xl font-semibold text-brand">
            Content plans ({plans.length})
          </h2>
          {plans.length === 0 ? (
            <Card className="p-6 text-sm text-muted">
              No persisted plans yet. Seed the initial backlog above.
            </Card>
          ) : (
            plans.map((plan) => {
              const brief = plan.briefJson as ContentBriefV1 | null;
              const draft =
                plan.humanDraftJson ?? plan.generationJson ?? null;
              const defaultHumanDraft = JSON.stringify(
                draft ?? { bodyMarkdown: "", cta: brief?.cta ?? "" },
                null,
                2,
              );
              return (
                <Card key={plan.id} className="space-y-3 p-6">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="text-sm font-semibold text-brand">
                      {plan.workingTitle}{" "}
                      <span className="font-normal text-muted">
                        ({plan.slug})
                      </span>
                    </p>
                    <p className="text-xs text-muted">
                      {plan.status} · {plan.priorityBand} · {plan.contentType} ·{" "}
                      {plan.sourceType}
                    </p>
                  </div>
                  {plan.searchOpportunitySlug ? (
                    <p className="text-xs text-muted">
                      Provenance: SearchOpportunity{" "}
                      <code>{plan.searchOpportunitySlug}</code>
                    </p>
                  ) : null}
                  {brief ? (
                    <div className="rounded-xl bg-slate-50 p-3 text-xs text-muted">
                      <p className="font-medium text-brand">Why recommended</p>
                      <ul className="mt-1 list-disc pl-5">
                        {(brief.whyRecommended ?? []).map((w) => (
                          <li key={w}>{w}</li>
                        ))}
                      </ul>
                      <p className="mt-2">
                        Intent {brief.primaryIntent} · Topic {brief.topic} · CTA{" "}
                        {brief.cta} · Collision {brief.collisionState}
                      </p>
                    </div>
                  ) : null}
                  {draft ? (
                    <pre className="max-h-48 overflow-auto rounded-xl border border-border bg-white p-3 text-[11px] text-muted">
                      {JSON.stringify(draft, null, 2)}
                    </pre>
                  ) : (
                    <p className="text-xs text-muted">
                      No draft yet. Generate skeleton or OpenAI draft below.
                    </p>
                  )}
                  <ContentPlanControls
                    planId={plan.id}
                    status={plan.status}
                    defaultHumanDraft={defaultHumanDraft}
                  />
                </Card>
              );
            })
          )}
        </section>

        {acceptance ? (
          <section className="mt-10">
            <Card className="space-y-2 p-6">
              <p className="text-sm font-semibold text-brand">
                Sprint 6 acceptance focus
              </p>
              <p className="text-sm text-muted">
                Plan <code>{acceptance.slug}</code> status{" "}
                <strong>{acceptance.status}</strong>. Prove brief → draft →
                human edit → approve. Do not auto-publish the SEO service page.
              </p>
            </Card>
          </section>
        ) : null}
      </Container>
    </main>
  );
}
