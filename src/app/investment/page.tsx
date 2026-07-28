import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, Sparkles } from "lucide-react";

import { Container } from "@/components/ui/container";
import { PageHero } from "@/components/marketing";
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
      <PageHero
        eyebrow="Investment"
        title="Transparent pricing. Custom solutions."
        description="Every business has different goals, challenges, and technical needs. These packages provide realistic starting points while giving us room to build the right solution for your business."
      />

      <section className="border-b border-border py-16 sm:py-20 lg:py-24">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
              Built for growing businesses
            </p>

            <h2 className="mt-4 font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Choose the level of support that fits your goals
            </h2>

            <p className="mt-5 text-base leading-7 text-muted-foreground sm:text-lg">
              Start with a professional website, add a complete local growth
              strategy, or build a connected system that combines marketing,
              automation, analytics, and software.
            </p>
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {investmentPackages.map((servicePackage) => (
              <article
                key={servicePackage.name}
                className={`relative flex h-full flex-col rounded-2xl border p-6 shadow-sm sm:p-8 ${
                  servicePackage.featured
                    ? "border-primary bg-primary/[0.04] shadow-md"
                    : "border-border bg-card"
                }`}
              >
                {servicePackage.featured ? (
                  <div className="absolute -top-3 left-6 inline-flex items-center gap-2 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                    <Sparkles className="h-3.5 w-3.5" />
                    Most Popular
                  </div>
                ) : null}

                <div>
                  <h3 className="font-heading text-2xl font-semibold text-foreground">
                    {servicePackage.name}
                  </h3>

                  <p className="mt-3 min-h-20 text-sm leading-6 text-muted-foreground">
                    {servicePackage.description}
                  </p>
                </div>

                <div className="mt-7 border-y border-border py-6">
                  <p className="text-sm font-medium text-muted-foreground">
                    Starting at
                  </p>

                  <p className="mt-1 font-heading text-4xl font-semibold tracking-tight text-foreground">
                    {servicePackage.price}
                  </p>
                </div>

                <ul className="mt-7 flex-1 space-y-4">
                  {servicePackage.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-3 text-sm leading-6 text-muted-foreground"
                    >
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Check className="h-3.5 w-3.5" />
                      </span>

                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/contact"
                  className={`mt-8 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-5 text-sm font-semibold transition-colors ${
                    servicePackage.featured
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "border border-border bg-background text-foreground hover:bg-muted"
                  }`}
                >
                  {servicePackage.cta}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </article>
            ))}
          </div>

          <p className="mx-auto mt-8 max-w-3xl text-center text-sm leading-6 text-muted-foreground">
            Package prices are starting points. Your final proposal will reflect
            the exact scope, number of pages, integrations, content needs, and
            technical requirements of your project.
          </p>
        </Container>
      </section>

      <section className="border-b border-border bg-muted/30 py-16 sm:py-20 lg:py-24">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <div className="lg:sticky lg:top-28">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                Flexible options
              </p>

              <h2 className="mt-4 font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                Add services as your business grows
              </h2>

              <p className="mt-5 text-base leading-7 text-muted-foreground">
                These services can be added to a package or quoted separately
                when you only need help with a specific part of your website,
                marketing, or business systems.
              </p>

              <div className="mt-8 rounded-2xl border border-border bg-card p-6">
                <h3 className="font-heading text-lg font-semibold text-foreground">
                  Every project includes
                </h3>

                <ul className="mt-5 space-y-4">
                  {investmentHighlights.map((highlight) => (
                    <li
                      key={highlight}
                      className="flex items-start gap-3 text-sm leading-6 text-muted-foreground"
                    >
                      <Check className="mt-1 h-4 w-4 shrink-0 text-primary" />
                      <span>{highlight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {investmentAddons.map((addon) => (
                <article
                  key={addon.name}
                  className="rounded-2xl border border-border bg-card p-6 shadow-sm"
                >
                  <div className="flex flex-col gap-2">
                    <h3 className="font-heading text-lg font-semibold text-foreground">
                      {addon.name}
                    </h3>

                    <p className="text-sm font-semibold text-primary">
                      {addon.price}
                    </p>
                  </div>

                  <p className="mt-4 text-sm leading-6 text-muted-foreground">
                    {addon.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </Container>
      </section>

      <section className="border-b border-border py-16 sm:py-20 lg:py-24">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
              Frequently asked questions
            </p>

            <h2 className="mt-4 font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              What to expect before your project begins
            </h2>

            <p className="mt-5 text-base leading-7 text-muted-foreground">
              Clear expectations help projects run smoothly. Here are answers to
              some of the most common questions about pricing, ownership,
              support, and the development process.
            </p>
          </div>

          <div className="mx-auto mt-12 max-w-4xl divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
            {investmentFaqs.map((faq) => (
              <details key={faq.question} className="group px-6 py-5 sm:px-8">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 font-heading text-base font-semibold text-foreground sm:text-lg">
                  <span>{faq.question}</span>

                  <span className="relative h-5 w-5 shrink-0">
                    <span className="absolute left-1/2 top-1/2 h-0.5 w-4 -translate-x-1/2 -translate-y-1/2 bg-foreground" />
                    <span className="absolute left-1/2 top-1/2 h-4 w-0.5 -translate-x-1/2 -translate-y-1/2 bg-foreground transition-transform group-open:rotate-90" />
                  </span>
                </summary>

                <p className="max-w-3xl pt-4 text-sm leading-7 text-muted-foreground sm:text-base">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </Container>
      </section>

      <section className="py-16 sm:py-20 lg:py-24">
        <Container>
          <div className="overflow-hidden rounded-3xl border border-border bg-foreground px-6 py-12 text-background sm:px-10 lg:px-16 lg:py-16">
            <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
              <div className="max-w-3xl">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                  Let&apos;s build the right solution
                </p>

                <h2 className="mt-4 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
                  Not sure which package fits your business?
                </h2>

                <p className="mt-5 text-base leading-7 text-background/70 sm:text-lg">
                  Tell us what you are trying to accomplish. We will review your
                  business, current website, goals, and budget before
                  recommending the best path forward.
                </p>
              </div>

              <Link
                href="/contact"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Request a Consultation
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}