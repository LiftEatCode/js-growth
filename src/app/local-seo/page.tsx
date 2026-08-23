import type { Metadata } from "next";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  MapPin,
  MapPinned,
  Search,
  Sparkles,
  Star,
  Users,
} from "lucide-react";

import { GrowthTrackedLink } from "@/components/growth/growth-tracked-link";
import { CTASection } from "@/components/marketing";
import { GoogleBusinessProfileSection } from "@/components/sections/google-business-profile-section";
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
  localSeoBenefits,
  localSeoFAQ,
  localSeoProcess,
} from "@/content/services/local-seo";

export const metadata: Metadata = {
  title: "Local SEO",
  description:
    "Local SEO services that help businesses improve search visibility, strengthen Google Business Profile performance, and attract nearby customers.",
};

const localSeoHighlights = [
  {
    title: "Local Search Visibility",
    description:
      "Improve how often your business appears when nearby customers search for the services you provide.",
    icon: Search,
  },
  {
    title: "Google Maps Presence",
    description:
      "Strengthen your visibility in location-based searches and Google Maps results.",
    icon: MapPinned,
  },
  {
    title: "Qualified Local Leads",
    description:
      "Reach customers who are actively looking for businesses like yours in the markets you serve.",
    icon: Users,
  },
  {
    title: "Reputation Signals",
    description:
      "Use reviews, consistent business information, and strong local signals to build trust.",
    icon: Star,
  },
] as const;

export default function LocalSEOPage() {
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
          <div className="grid items-center gap-14 lg:grid-cols-[1fr_0.9fr]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-sm font-medium text-cyan-200 backdrop-blur-xl">
                <MapPin
                  aria-hidden="true"
                  className="size-4"
                />

                Local SEO
              </div>

              <h1 className="mt-6 max-w-4xl font-heading text-4xl font-bold leading-tight tracking-[-0.05em] text-white sm:text-5xl lg:text-6xl">
                Local SEO that helps nearby customers find your business.
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300 sm:text-xl">
                JS Solutions improves your website, Google Business Profile,
                service-area relevance, local content, reviews, and technical
                foundation so your business can compete in the markets that
                matter most.
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
                  Get a Local SEO Plan

                  <ArrowRight
                    aria-hidden="true"
                    className="ml-1 size-4"
                  />
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
                <Sparkles
                  aria-hidden="true"
                  className="size-3.5"
                />

                Local growth signals
              </div>

              <div className="mt-6 space-y-4">
                {[
                  "Google Business Profile optimization",
                  "Local keyword targeting",
                  "Service-area relevance",
                  "Review and reputation strategy",
                  "Local content and technical SEO",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-start gap-3"
                  >
                    <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border border-emerald-300/10 bg-emerald-300/10 text-emerald-300">
                      <CheckCircle2
                        aria-hidden="true"
                        className="size-3.5"
                      />
                    </span>

                    <p className="text-sm leading-6 text-slate-300">
                      {item}
                    </p>
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
            eyebrow={localSeoBenefits.eyebrow}
            title={localSeoBenefits.title}
            description={localSeoBenefits.description}
            align="center"
            className="mx-auto max-w-3xl"
          />

          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {localSeoBenefits.items.map((item) => (
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

      <GoogleBusinessProfileSection />

      <Section className="relative overflow-hidden bg-brand text-white">
        <GridPattern className="opacity-35" />

        <div
          aria-hidden="true"
          className="absolute -left-40 top-1/2 -z-10 size-[34rem] -translate-y-1/2 rounded-full bg-brand-blue/10 blur-3xl"
        />

        <div
          aria-hidden="true"
          className="absolute -right-40 top-0 -z-10 size-[32rem] rounded-full bg-brand-cyan/[0.08] blur-3xl"
        />

        <Container className="relative">
          <SectionHeader
            eyebrow={localSeoProcess.eyebrow}
            title={localSeoProcess.title}
            description={localSeoProcess.description}
            className="max-w-3xl [&_h2]:text-white [&_p:last-child]:text-slate-300"
          />

          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {localSeoProcess.items.map((item) => {
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
                      <Icon
                        aria-hidden="true"
                        className="size-5"
                      />
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

      <Section className="border-y border-border bg-slate-50/60">
        <Container>
          <SectionHeader
            eyebrow="Local Search Strategy"
            title="A strong local presence works across more than one channel."
            description="Search visibility improves when your website, Google Business Profile, reputation, local content, and conversion paths reinforce the same business information and service strategy."
            align="center"
            className="mx-auto max-w-3xl"
          />

          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {localSeoHighlights.map((item) => (
              <FeatureCard
                key={item.title}
                title={item.title}
                description={item.description}
                icon={item.icon}
                tone="brand"
              />
            ))}
          </div>

          <div className="mt-10 flex justify-center">
            <div className="inline-flex items-center gap-3 rounded-2xl border border-brand-blue/10 bg-white px-5 py-4 shadow-sm">
              <BarChart3
                aria-hidden="true"
                className="size-5 text-brand-blue"
              />

              <p className="text-sm leading-6 text-muted">
                Rankings matter, but the real goal is more qualified calls,
                form submissions, website visits, and customer actions.
              </p>
            </div>
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <div className="grid gap-12 lg:grid-cols-[0.75fr_1.25fr] lg:gap-20">
            <SectionHeader
              eyebrow={localSeoFAQ.eyebrow}
              title={localSeoFAQ.title}
              description={localSeoFAQ.description}
            />

            <div className="space-y-4">
              {localSeoFAQ.items.map((item) => (
                <Card
                  key={item.question}
                  variant="elevated"
                  padding="md"
                >
                  <h3 className="font-heading text-lg font-semibold text-brand">
                    {item.question}
                  </h3>

                  <p className="mt-3 leading-7 text-muted">
                    {item.answer}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        </Container>
      </Section>

      <CTASection
        title="Improve your visibility in local search."
        description="Let’s identify the website, Google Business Profile, content, reputation, and technical improvements that can help more local customers discover your business."
        primaryLabel="Get a Local SEO Plan"
        primaryHref="/contact"
        secondaryLabel="Run Website Audit"
        secondaryHref="/website-audit"
      />
    </>
  );
}