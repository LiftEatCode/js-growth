import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  Check,
  CircleDollarSign,
  Sparkles,
} from "lucide-react";

import {
  Button,
  Card,
  Container,
  GridPattern,
  Section,
  SectionHeader,
} from "@/components/ui";
import {
  investmentAddons,
  investmentFaqs,
  investmentHighlights,
  investmentPackages,
} from "@/content/investment";

export const metadata: Metadata = {
  title: "Investment",
  description:
    "Explore website, Local SEO, AI automation, and business growth packages from JS Solutions.",
};

export default function InvestmentPage() {
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
              <CircleDollarSign
                aria-hidden="true"
                className="size-4"
              />

              Investment
            </div>

            <h1 className="mt-6 font-heading text-4xl font-bold leading-tight tracking-[-0.05em] text-white sm:text-5xl lg:text-6xl">
              Transparent pricing. Custom solutions.
            </h1>

            <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-slate-300 sm:text-xl">
              Every business has different goals, challenges, and technical
              needs. These packages provide realistic starting points while
              giving us room to build the right solution for your business.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                size="xl"
                nativeButton={false}
                render={<Link href="/contact" />}
              >
                Request a Consultation

                <ArrowRight
                  aria-hidden="true"
                  className="ml-1 size-4"
                />
              </Button>

              <Button
                size="xl"
                variant="outline"
                nativeButton={false}
                render={<Link href="/services" />}
                className="border-white/15 bg-white/[0.04] text-white hover:border-white/25 hover:bg-white/[0.08] hover:text-white"
              >
                Explore Services
              </Button>
            </div>
          </div>
        </Container>
      </section>

      <Section>
        <Container>
          <SectionHeader
            eyebrow="Built for Growing Businesses"
            title="Choose the level of support that fits your goals."
            description="Start with a professional website, add a complete local growth strategy, or build a connected system that combines marketing, automation, analytics, and software."
            align="center"
            className="mx-auto max-w-3xl"
          />

          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {investmentPackages.map((servicePackage) => (
              <Card
                key={servicePackage.name}
                variant={servicePackage.featured ? "brand" : "elevated"}
                padding="lg"
                className="relative flex h-full flex-col"
              >
                {servicePackage.featured ? (
                  <div className="absolute -top-3 left-6 inline-flex items-center gap-2 rounded-full bg-brand-blue px-3 py-1 text-xs font-semibold text-white shadow-sm">
                    <Sparkles
                      aria-hidden="true"
                      className="size-3.5"
                    />

                    Most Popular
                  </div>
                ) : null}

                <div>
                  <h3 className="font-heading text-2xl font-semibold tracking-tight text-brand">
                    {servicePackage.name}
                  </h3>

                  <p className="mt-3 min-h-20 text-sm leading-6 text-muted">
                    {servicePackage.description}
                  </p>
                </div>

                <div className="mt-7 border-y border-border py-6">
                  <p className="text-sm font-medium text-muted">
                    Starting at
                  </p>

                  <p className="mt-1 font-heading text-4xl font-bold tracking-tight text-brand">
                    {servicePackage.price}
                  </p>
                </div>

                <ul className="mt-7 flex-1 space-y-4">
                  {servicePackage.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-3 text-sm leading-6 text-muted"
                    >
                      <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-600">
                        <Check
                          aria-hidden="true"
                          className="size-3.5"
                        />
                      </span>

                      <span>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <Button
                  size="lg"
                  variant={
                    servicePackage.featured
                      ? "default"
                      : "outline"
                  }
                  className="mt-8 w-full"
                  nativeButton={false}
                  render={<Link href="/contact" />}
                >
                  {servicePackage.cta}

                  <ArrowRight
                    aria-hidden="true"
                    className="ml-1 size-4"
                  />
                </Button>
              </Card>
            ))}
          </div>

          <p className="mx-auto mt-8 max-w-3xl text-center text-sm leading-6 text-muted">
            Package prices are starting points. Your final proposal will reflect
            the exact scope, number of pages, integrations, content needs, and
            technical requirements of your project.
          </p>
        </Container>
      </Section>

      <Section className="border-y border-border bg-slate-50/60">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[0.75fr_1.25fr] lg:items-start lg:gap-20">
            <div className="lg:sticky lg:top-28">
              <SectionHeader
                eyebrow="Flexible Options"
                title="Add services as your business grows."
                description="These services can be added to a package or quoted separately when you only need help with a specific part of your website, marketing, or business systems."
              />

              <Card
                variant="brand"
                padding="md"
                className="mt-8"
              >
                <p className="font-heading text-lg font-semibold text-brand">
                  Every project includes
                </p>

                <ul className="mt-5 space-y-4">
                  {investmentHighlights.map((highlight) => (
                    <li
                      key={highlight}
                      className="flex items-start gap-3 text-sm leading-6 text-muted"
                    >
                      <Check
                        aria-hidden="true"
                        className="mt-1 size-4 shrink-0 text-brand-blue"
                      />

                      <span>
                        {highlight}
                      </span>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {investmentAddons.map((addon) => (
                <Card
                  key={addon.name}
                  variant="elevated"
                  padding="md"
                  interactive
                >
                  <div className="flex flex-col gap-2">
                    <h3 className="font-heading text-lg font-semibold text-brand">
                      {addon.name}
                    </h3>

                    <p className="text-sm font-semibold text-brand-blue">
                      {addon.price}
                    </p>
                  </div>

                  <p className="mt-4 text-sm leading-6 text-muted">
                    {addon.description}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <SectionHeader
            eyebrow="Frequently Asked Questions"
            title="What to expect before your project begins."
            description="Clear expectations help projects run smoothly. Here are answers to some of the most common questions about pricing, ownership, support, and the development process."
            align="center"
            className="mx-auto max-w-3xl"
          />

          <Card
            variant="elevated"
            padding="none"
            className="mx-auto mt-12 max-w-4xl overflow-hidden"
          >
            <div className="divide-y divide-border">
              {investmentFaqs.map((faq) => (
                <details
                  key={faq.question}
                  className="group px-6 py-5 sm:px-8"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-6 font-heading text-base font-semibold text-brand sm:text-lg">
                    <span>
                      {faq.question}
                    </span>

                    <span className="relative size-5 shrink-0">
                      <span className="absolute left-1/2 top-1/2 h-0.5 w-4 -translate-x-1/2 -translate-y-1/2 bg-brand" />

                      <span className="absolute left-1/2 top-1/2 h-4 w-0.5 -translate-x-1/2 -translate-y-1/2 bg-brand transition-transform duration-200 group-open:rotate-90" />
                    </span>
                  </summary>

                  <p className="max-w-3xl pt-4 text-sm leading-7 text-muted sm:text-base">
                    {faq.answer}
                  </p>
                </details>
              ))}
            </div>
          </Card>
        </Container>
      </Section>

      <Section className="bg-background">
        <Container>
          <div className="relative overflow-hidden rounded-[2rem] border border-slate-800 bg-brand px-6 py-12 text-white shadow-soft sm:px-10 lg:px-14 lg:py-14">
            <GridPattern className="opacity-45" />

            <div
              aria-hidden="true"
              className="absolute right-0 top-0 size-72 -translate-y-1/2 translate-x-1/3 rounded-full bg-brand-blue/25 blur-3xl"
            />

            <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3.5 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-300">
                  <Sparkles
                    aria-hidden="true"
                    className="size-3.5"
                  />

                  Let&apos;s build the right solution
                </div>

                <h2 className="mt-5 font-heading text-3xl font-bold tracking-tight text-white sm:text-4xl">
                  Not sure which package fits your business?
                </h2>

                <p className="mt-5 text-base leading-7 text-slate-300 sm:text-lg">
                  Tell us what you are trying to accomplish. We&apos;ll review
                  your business, current website, goals, and budget before
                  recommending the strongest path forward.
                </p>
              </div>

              <Button
                size="xl"
                nativeButton={false}
                render={<Link href="/contact" />}
              >
                Request a Consultation

                <ArrowRight
                  aria-hidden="true"
                  className="ml-1 size-4"
                />
              </Button>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}