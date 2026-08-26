import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Search,
  Sparkles,
} from "lucide-react";

import { GrowthTrackedLink } from "@/components/growth/growth-tracked-link";
import { CTASection } from "@/components/marketing";
import {
  Button,
  Card,
  Container,
  FeatureCard,
  GridPattern,
  Section,
  SectionHeader,
} from "@/components/ui";
import {
  seoBenefits,
  seoFaq,
  seoHighlights,
  seoPageMeta,
  seoProcess,
  seoVsLocal,
} from "@/content/services/seo";
import {
  getAbsoluteUrl,
  getServiceBreadcrumbSchema,
  getServiceSchema,
  serializeJsonLd,
} from "@/lib/seo";

export const metadata: Metadata = {
  title: seoPageMeta.title,
  description: seoPageMeta.description,
  alternates: {
    canonical: seoPageMeta.canonicalPath,
  },
  openGraph: {
    title: seoPageMeta.title,
    description: seoPageMeta.description,
    url: getAbsoluteUrl(seoPageMeta.canonicalPath),
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function SeoServicePage() {
  const serviceSchema = getServiceSchema({
    name: seoPageMeta.title,
    description: seoPageMeta.description,
    path: seoPageMeta.canonicalPath,
  });
  const breadcrumbSchema = getServiceBreadcrumbSchema({
    name: "SEO",
    path: seoPageMeta.canonicalPath,
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(serviceSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbSchema) }}
      />

      <section className="relative isolate overflow-hidden bg-brand text-white">
        <GridPattern className="opacity-45" />

        <div
          aria-hidden="true"
          className="absolute left-1/2 top-0 -z-10 size-[48rem] -translate-x-1/2 -translate-y-[62%] rounded-full bg-brand-blue/25 blur-3xl"
        />

        <Container className="relative py-20 sm:py-24 lg:py-28">
          <div className="grid items-center gap-14 lg:grid-cols-[1fr_0.9fr]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-sm font-medium text-cyan-200 backdrop-blur-xl">
                <Search aria-hidden="true" className="size-4" />
                SEO
              </div>

              <h1 className="mt-6 max-w-4xl font-heading text-4xl font-bold leading-tight tracking-[-0.05em] text-white sm:text-5xl lg:text-6xl">
                SEO services for small businesses — without ranking guarantees.
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300 sm:text-xl">
                Many small businesses have a website but still struggle to
                appear for the searches that matter. JS Solutions strengthens
                clarity, technical foundations, content relevance, and
                measurement — starting with evidence, not shortcuts.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button
                  size="xl"
                  nativeButton={false}
                  render={
                    <GrowthTrackedLink
                      href="/contact"
                      growthEvent="service_cta_clicked"
                      placement="service"
                      ctaKind="contact"
                    />
                  }
                >
                  Talk about SEO
                  <ArrowRight aria-hidden="true" className="ml-1 size-4" />
                </Button>

                <Button
                  size="xl"
                  variant="outline"
                  nativeButton={false}
                  render={
                    <GrowthTrackedLink
                      href="/website-audit"
                      growthEvent="service_cta_clicked"
                      placement="service"
                      ctaKind="audit"
                      className="border-white/15 bg-white/[0.04] text-white hover:border-white/25 hover:bg-white/[0.08] hover:text-white"
                    />
                  }
                  className="border-white/15 bg-white/[0.04] text-white hover:border-white/25 hover:bg-white/[0.08] hover:text-white"
                >
                  Run Website Audit
                </Button>
              </div>
            </div>

            <Card
              variant="default"
              padding="lg"
              className="border-white/10 bg-white/[0.055] text-white shadow-soft backdrop-blur-xl"
            >
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-300">
                <Sparkles aria-hidden="true" className="size-3.5" />
                Diagnose-first SEO
              </div>

              <div className="mt-6 space-y-4">
                {[
                  "Technical & indexability foundations",
                  "On-page clarity for services",
                  "Content relevance without stuffing",
                  "Internal links to conversion paths",
                  "Honest Search Console / analytics review",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border border-emerald-300/10 bg-emerald-300/10 text-emerald-300">
                      <CheckCircle2
                        aria-hidden="true"
                        className="size-3.5"
                      />
                    </span>
                    <p className="text-sm leading-6 text-slate-300">{item}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </Container>
      </section>

      <Section>
        <Container>
          <SectionHeader
            eyebrow={seoBenefits.eyebrow}
            title={seoBenefits.title}
            description={seoBenefits.description}
            align="center"
            className="mx-auto max-w-3xl"
          />
          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {seoBenefits.items.map((item) => (
              <FeatureCard
                key={item.title}
                title={item.title}
                description={item.description}
                icon={item.icon}
                tone="default"
              />
            ))}
          </div>
        </Container>
      </Section>

      <Section className="border-y border-border bg-slate-50/60">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="font-heading text-3xl font-semibold text-brand">
              {seoVsLocal.title}
            </h2>
            <p className="mt-4 text-base leading-7 text-muted">
              {seoVsLocal.body}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button
                nativeButton={false}
                render={<Link href={seoVsLocal.localHref} />}
              >
                {seoVsLocal.localLabel}
              </Button>
              <Button
                variant="outline"
                nativeButton={false}
                render={<Link href="/websites" />}
              >
                Website development
              </Button>
            </div>
          </div>
        </Container>
      </Section>

      <Section className="relative overflow-hidden bg-brand text-white">
        <GridPattern className="opacity-35" />
        <Container className="relative">
          <SectionHeader
            eyebrow={seoProcess.eyebrow}
            title={seoProcess.title}
            description={seoProcess.description}
            className="max-w-3xl [&_h2]:text-white [&_p:last-child]:text-slate-300"
          />
          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {seoProcess.items.map((item) => {
              const Icon = item.icon;
              return (
                <Card
                  key={item.number}
                  variant="default"
                  padding="lg"
                  className="border-white/10 bg-white/[0.055] text-white backdrop-blur-xl"
                >
                  <div className="flex items-start justify-between gap-4">
                    <span className="flex size-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.08] text-cyan-300">
                      <Icon aria-hidden="true" className="size-5" />
                    </span>
                    <span className="font-heading text-sm font-semibold text-cyan-300">
                      {item.number}
                    </span>
                  </div>
                  <h3 className="mt-6 font-heading text-lg font-semibold text-white">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-slate-300">
                    {item.description}
                  </p>
                </Card>
              );
            })}
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <SectionHeader
            eyebrow="What you can expect"
            title="Foundations first. Measurement without folklore."
            description="Impressions, clicks, landing-page engagement, and audit/contact actions matter more than average position alone."
            align="center"
            className="mx-auto max-w-3xl"
          />
          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {seoHighlights.map((item) => (
              <FeatureCard
                key={item.title}
                title={item.title}
                description={item.description}
                icon={item.icon}
                tone="brand"
              />
            ))}
          </div>
        </Container>
      </Section>

      <Section className="border-y border-border bg-slate-50/60">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[0.75fr_1.25fr] lg:gap-20">
            <SectionHeader
              eyebrow={seoFaq.eyebrow}
              title={seoFaq.title}
              description={seoFaq.description}
            />
            <div className="space-y-4">
              {seoFaq.items.map((item) => (
                <Card key={item.question} variant="elevated" padding="md">
                  <h3 className="font-heading text-lg font-semibold text-brand">
                    {item.question}
                  </h3>
                  <p className="mt-3 leading-7 text-muted">{item.answer}</p>
                </Card>
              ))}
            </div>
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <SectionHeader
            eyebrow="Further reading"
            title="How much does SEO cost for a small business?"
            description="If you are comparing proposals or retainers, start with buyer education on what SEO spend actually covers—then return here when you want diagnose-first help."
            align="center"
            className="mx-auto max-w-3xl"
          />
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button
              nativeButton={false}
              render={
                <Link href="/blog/how-much-does-seo-cost-small-business" />
              }
            >
              SEO cost for small businesses
              <ArrowRight aria-hidden="true" className="size-4" />
            </Button>
            <Button
              nativeButton={false}
              render={<Link href="/local-seo" />}
            >
              Local SEO
            </Button>
          </div>
        </Container>
      </Section>

      <CTASection
        title="Ready to strengthen your SEO foundations?"
        description="Start with a Website Growth Audit or talk with us about diagnose-first SEO — without ranking guarantees."
        primaryLabel="Run Website Audit"
        primaryHref="/website-audit"
        secondaryLabel="Contact"
        secondaryHref="/contact"
      />
    </>
  );
}
