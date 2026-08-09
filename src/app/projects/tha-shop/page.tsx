import type { Metadata } from "next";
import {
  BriefcaseBusiness,
  CheckCircle2,
  MapPin,
  Quote,
  Sparkles,
  Star,
  Wrench,
} from "lucide-react";

import { CTASection } from "@/components/marketing";
import {
  Card,
  Container,
  GridPattern,
  Section,
  SectionHeader,
} from "@/components/ui";
import { thaShopCaseStudy } from "@/content/projects/tha-shop";

export const metadata: Metadata = {
  title: "Tha Shop Automotive Marketing Case Study",
  description:
    "See how JS Solutions helped Tha Shop strengthen its website, Local SEO, social media marketing, and lead-generation strategy in Magnolia, Texas.",
};

export default function ThaShopCaseStudyPage() {
  const {
    hero,
    overview,
    challenge,
    solution,
    deliverables,
    results,
    testimonial,
    cta,
  } = thaShopCaseStudy;

  return (
    <>
      <section className="relative isolate overflow-hidden bg-brand text-white">
        <GridPattern className="opacity-45" />

        <div
          aria-hidden="true"
          className="absolute left-1/2 top-0 -z-10 size-[48rem] -translate-x-1/2 -translate-y-[62%] rounded-full bg-brand-blue/25 blur-3xl"
        />

        <div
          aria-hidden="true"
          className="absolute -right-40 top-1/3 -z-10 size-[30rem] rounded-full bg-brand-cyan/15 blur-3xl"
        />

        <Container className="relative py-20 sm:py-24 lg:py-28">
          <div className="mx-auto max-w-4xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-sm font-medium text-cyan-200 backdrop-blur-xl">
              <Sparkles
                aria-hidden="true"
                className="size-4"
              />

              {hero.eyebrow}
            </div>

            <h1 className="mt-6 font-heading text-4xl font-bold leading-tight tracking-[-0.05em] text-white sm:text-5xl lg:text-6xl">
              {hero.title}
            </h1>

            <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-slate-300 sm:text-xl">
              {hero.description}
            </p>
          </div>
        </Container>
      </section>

      <Section>
        <Container>
          <div className="grid gap-6 md:grid-cols-3">
            <Card
              variant="elevated"
              padding="lg"
            >
              <div className="flex size-11 items-center justify-center rounded-xl border border-brand-blue/10 bg-brand-blue/[0.07] text-brand-blue">
                <BriefcaseBusiness
                  className="size-5"
                  aria-hidden="true"
                />
              </div>

              <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                Client
              </p>

              <p className="mt-2 font-heading text-lg font-semibold text-brand">
                {overview.client}
              </p>
            </Card>

            <Card
              variant="elevated"
              padding="lg"
            >
              <div className="flex size-11 items-center justify-center rounded-xl border border-brand-blue/10 bg-brand-blue/[0.07] text-brand-blue">
                <Wrench
                  className="size-5"
                  aria-hidden="true"
                />
              </div>

              <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                Industry
              </p>

              <p className="mt-2 font-heading text-lg font-semibold text-brand">
                {overview.industry}
              </p>
            </Card>

            <Card
              variant="elevated"
              padding="lg"
            >
              <div className="flex size-11 items-center justify-center rounded-xl border border-brand-blue/10 bg-brand-blue/[0.07] text-brand-blue">
                <MapPin
                  className="size-5"
                  aria-hidden="true"
                />
              </div>

              <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                Location
              </p>

              <p className="mt-2 font-heading text-lg font-semibold text-brand">
                {overview.location}
              </p>
            </Card>
          </div>

          <Card
            variant="brand"
            padding="lg"
            className="mt-8"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-blue">
              Services Provided
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              {overview.services.map((service) => (
                <span
                  key={service}
                  className="rounded-full border border-brand-blue/10 bg-white px-4 py-2 text-sm font-medium text-brand"
                >
                  {service}
                </span>
              ))}
            </div>
          </Card>
        </Container>
      </Section>

      <Section className="border-y border-border bg-slate-50/60">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-start lg:gap-20">
            <SectionHeader
              eyebrow={challenge.eyebrow}
              title={challenge.title}
              description={challenge.description}
              className="max-w-xl"
            />

            <Card
              variant="elevated"
              padding="lg"
            >
              <div className="space-y-5">
                {challenge.points.map((point) => (
                  <div
                    key={point}
                    className="flex items-start gap-3"
                  >
                    <CheckCircle2
                      className="mt-0.5 size-5 shrink-0 text-brand-blue"
                      aria-hidden="true"
                    />

                    <p className="leading-7 text-muted">
                      {point}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <SectionHeader
            eyebrow={solution.eyebrow}
            title={solution.title}
            description={solution.description}
            align="center"
            className="mx-auto max-w-3xl"
          />

          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {solution.items.map((item, index) => (
              <Card
                key={item.title}
                variant="elevated"
                padding="lg"
                interactive
              >
                <span className="text-sm font-semibold text-brand-blue">
                  {String(index + 1).padStart(2, "0")}
                </span>

                <h3 className="mt-4 font-heading text-xl font-semibold tracking-tight text-brand">
                  {item.title}
                </h3>

                <p className="mt-3 leading-7 text-muted">
                  {item.description}
                </p>
              </Card>
            ))}
          </div>
        </Container>
      </Section>

      <Section className="relative overflow-hidden bg-brand text-white">
        <GridPattern className="opacity-35" />

        <Container className="relative">
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300">
                What We Delivered
              </p>

              <h2 className="mt-4 font-heading text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                A repeatable digital marketing foundation.
              </h2>

              <p className="mt-5 max-w-xl leading-7 text-slate-300">
                The project created a connected system for communicating
                services, reaching local customers, maintaining consistent
                content, and improving future marketing decisions.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {deliverables.map((deliverable) => (
                <div
                  key={deliverable}
                  className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.06] p-4"
                >
                  <CheckCircle2
                    className="mt-0.5 size-5 shrink-0 text-cyan-300"
                    aria-hidden="true"
                  />

                  <span className="text-sm font-medium leading-6 text-slate-200">
                    {deliverable}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <SectionHeader
            eyebrow={results.eyebrow}
            title={results.title}
            description={results.description}
            align="center"
            className="mx-auto max-w-3xl"
          />

          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {results.items.map((result) => (
              <Card
                key={result}
                variant="elevated"
                padding="lg"
              >
                <CheckCircle2
                  className="size-6 text-brand-blue"
                  aria-hidden="true"
                />

                <p className="mt-4 font-medium leading-7 text-brand">
                  {result}
                </p>
              </Card>
            ))}
          </div>

          <p className="mx-auto mt-8 max-w-3xl text-center text-sm leading-6 text-muted">
            These results are currently presented qualitatively. Verified
            performance metrics can be added as campaign, traffic, call, and
            lead data become available.
          </p>
        </Container>
      </Section>

      <Section className="border-y border-border bg-slate-50/60">
        <Container>
          <Card
            as="figure"
            variant="elevated"
            padding="lg"
            className="mx-auto max-w-3xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div
                className="flex gap-1"
                aria-label="5 out of 5 stars"
              >
                {Array.from({ length: 5 }, (_, index) => (
                  <Star
                    key={index}
                    aria-hidden="true"
                    className="size-4 fill-brand-blue text-brand-blue"
                  />
                ))}
              </div>

              <span className="flex size-10 items-center justify-center rounded-xl border border-brand-blue/10 bg-brand-blue/[0.07] text-brand-blue">
                <Quote
                  aria-hidden="true"
                  className="size-5"
                />
              </span>
            </div>

            <blockquote className="mt-6 text-lg leading-8 text-foreground">
              “{testimonial.quote}”
            </blockquote>

            <figcaption className="mt-8 border-t border-border pt-6">
              <p className="font-heading text-lg font-semibold text-brand">
                {testimonial.name}
              </p>

              <p className="mt-1 text-sm text-muted">
                {[testimonial.role, testimonial.company]
                  .filter(Boolean)
                  .join(" • ")}
              </p>
            </figcaption>
          </Card>
        </Container>
      </Section>

      <CTASection
        title={cta.title}
        description={cta.description}
        primaryLabel={cta.primaryLabel}
        primaryHref="/contact"
      />
    </>
  );
}