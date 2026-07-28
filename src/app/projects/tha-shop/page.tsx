import type { Metadata } from "next";
import {
  BriefcaseBusiness,
  CheckCircle2,
  MapPin,
  Wrench,
} from "lucide-react";

import {
  CTASection,
  PageHero,
  TestimonialCard,
} from "@/components/marketing";
import { Container, Section, SectionHeader } from "@/components/ui";
import { thaShopCaseStudy } from "@/content/projects/tha-shop";

export const metadata: Metadata = {
  title: "Tha Shop Automotive Marketing Case Study",
  description:
    "See how JS Solutions helped Tha Shop strengthen its website, Local SEO, social media marketing, and lead-generation strategy in Magnolia, Texas.",
};

export default function ThaShopCaseStudyPage() {
  const { hero, overview, challenge, solution, deliverables, results, testimonial, cta } =
    thaShopCaseStudy;

  return (
    <>
      <PageHero
        eyebrow={hero.eyebrow}
        title={hero.title}
        description={hero.description}
      />

      <Section>
        <Container>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border bg-card p-6 shadow-soft">
              <div className="flex size-11 items-center justify-center rounded-xl bg-brand/10 text-brand">
                <BriefcaseBusiness className="size-5" aria-hidden="true" />
              </div>

              <p className="mt-5 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Client
              </p>

              <p className="mt-2 text-lg font-semibold">{overview.client}</p>
            </div>

            <div className="rounded-2xl border bg-card p-6 shadow-soft">
              <div className="flex size-11 items-center justify-center rounded-xl bg-brand/10 text-brand">
                <Wrench className="size-5" aria-hidden="true" />
              </div>

              <p className="mt-5 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Industry
              </p>

              <p className="mt-2 text-lg font-semibold">{overview.industry}</p>
            </div>

            <div className="rounded-2xl border bg-card p-6 shadow-soft">
              <div className="flex size-11 items-center justify-center rounded-xl bg-brand/10 text-brand">
                <MapPin className="size-5" aria-hidden="true" />
              </div>

              <p className="mt-5 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Location
              </p>

              <p className="mt-2 text-lg font-semibold">{overview.location}</p>
            </div>
          </div>

          <div className="mt-10 rounded-2xl border bg-muted/30 p-6 md:p-8">
            <p className="text-sm font-semibold uppercase tracking-wider text-brand">
              Services Provided
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              {overview.services.map((service) => (
                <span
                  key={service}
                  className="rounded-full border bg-background px-4 py-2 text-sm font-medium"
                >
                  {service}
                </span>
              ))}
            </div>
          </div>
        </Container>
      </Section>

      <Section className="bg-muted/30">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
            <SectionHeader
              eyebrow={challenge.eyebrow}
              title={challenge.title}
              description={challenge.description}
              className="max-w-xl"
            />

            <div className="rounded-3xl border bg-card p-7 shadow-soft md:p-9">
              <div className="space-y-5">
                {challenge.points.map((point) => (
                  <div key={point} className="flex items-start gap-3">
                    <CheckCircle2
                      className="mt-0.5 size-5 shrink-0 text-brand"
                      aria-hidden="true"
                    />

                    <p className="leading-7 text-muted-foreground">{point}</p>
                  </div>
                ))}
              </div>
            </div>
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
              <article
                key={item.title}
                className="rounded-2xl border bg-card p-6 shadow-soft"
              >
                <span className="text-sm font-semibold text-brand">
                  {String(index + 1).padStart(2, "0")}
                </span>

                <h3 className="mt-4 text-xl font-semibold tracking-tight">
                  {item.title}
                </h3>

                <p className="mt-3 leading-7 text-muted-foreground">
                  {item.description}
                </p>
              </article>
            ))}
          </div>
        </Container>
      </Section>

      <Section className="bg-brand text-white">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-200">
                What We Delivered
              </p>

              <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
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
              <div
                key={result}
                className="rounded-2xl border bg-card p-6 shadow-soft"
              >
                <CheckCircle2
                  className="size-6 text-brand"
                  aria-hidden="true"
                />

                <p className="mt-4 font-medium leading-7">{result}</p>
              </div>
            ))}
          </div>

          <p className="mx-auto mt-8 max-w-3xl text-center text-sm leading-6 text-muted-foreground">
            These results are currently presented qualitatively. Verified
            performance metrics can be added as campaign, traffic, call, and
            lead data become available.
          </p>
        </Container>
      </Section>

      <Section className="bg-muted/30">
        <Container>
          <div className="mx-auto max-w-3xl">
            <TestimonialCard
              quote={testimonial.quote}
              name={testimonial.name}
              role={testimonial.role}
              company={testimonial.company}
              className="p-8 md:p-10"
            />
          </div>
        </Container>
      </Section>

      <CTASection
        title={cta.title}
        description={cta.description}
        primaryLabel={cta.primaryLabel}
      />
    </>
  );
}