import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  CheckCircle2,
  Code2,
  Gauge,
  Globe2,
  Layers3,
  Search,
  ShieldCheck,
  Sparkles,
  Workflow,
} from "lucide-react";

import {
  CTASection,
} from "@/components/marketing";
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
  websiteBenefits,
  websiteCapabilities,
  websiteFAQ,
  websiteIndustries,
  websiteProcess,
} from "@/content/services/websites";

export const metadata: Metadata = {
  title: "Website Development",
  description:
    "High-performance website development for local businesses that need better speed, visibility, user experience, and lead generation.",
};

const coreCapabilities = [
  {
    title:
      "Performance Engineering",
    description:
      "Fast-loading pages, efficient architecture, and strong Core Web Vitals designed into the foundation.",
    icon:
      Gauge,
    eyebrow:
      "Performance",
  },
  {
    title:
      "Technical SEO",
    description:
      "Semantic structure, metadata, crawlability, internal linking, and search visibility built into development.",
    icon:
      Search,
    eyebrow:
      "Search",
  },
  {
    title:
      "Conversion Architecture",
    description:
      "Clear page structure, intentional calls to action, and user journeys designed to turn visits into opportunities.",
    icon:
      Workflow,
    eyebrow:
      "Conversion",
  },
  {
    title:
      "Scalable Development",
    description:
      "Clean, reusable architecture that can grow into portals, dashboards, integrations, and future business tools.",
    icon:
      Code2,
    eyebrow:
      "Software",
  },
  {
    title:
      "Accessibility",
    description:
      "Interfaces designed around usability, semantic structure, keyboard navigation, and inclusive user experience.",
    icon:
      ShieldCheck,
    eyebrow:
      "Quality",
  },
  {
    title:
      "Business Integration",
    description:
      "Forms, analytics, CRM connections, automation, and other systems connected around how your business operates.",
    icon:
      Layers3,
    eyebrow:
      "Systems",
  },
] as const;

export default function WebsitesPage() {
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
                <Globe2
                  aria-hidden="true"
                  className="size-4"
                />

                Website Development
              </div>

              <h1 className="mt-6 max-w-4xl font-heading text-4xl font-bold leading-tight tracking-[-0.05em] text-white sm:text-5xl lg:text-6xl">
                Websites engineered to perform, rank, and convert.
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300 sm:text-xl">
                JS Solutions builds fast, scalable websites designed around
                user experience, technical SEO, accessibility, Core Web
                Vitals, and lead generation.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button
                  size="xl"
                  nativeButton={false}
                  render={
                    <Link href="/contact" />
                  }
                >
                  Start Your Website Project

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
                    <Link href="/website-audit" />
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

                Built for growth
              </div>

              <div className="mt-6 space-y-4">
                {[
                  "Fast, modern user experience",
                  "Technical SEO built in",
                  "Clear conversion paths",
                  "Scalable architecture",
                  "Analytics and integrations ready",
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
            eyebrow="Why Better Websites Matter"
            title={websiteBenefits.title}
            description={websiteBenefits.description}
            align="center"
            className="mx-auto max-w-3xl"
          />

          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {websiteBenefits.items.map(
              (item) => {
                const Icon =
                  item.icon;

                return (
                  <FeatureCard
                    key={
                      item.title
                    }
                    title={
                      item.title
                    }
                    description={
                      item.description
                    }
                    icon={
                      Icon
                    }
                    tone="default"
                  />
                );
              },
            )}
          </div>
        </Container>
      </Section>

      <Section className="border-y border-border bg-slate-50/60">
        <Container>
          <SectionHeader
            eyebrow="Website Capabilities"
            title="Everything your website needs to support growth."
            description="Strong websites are not just attractive. They combine performance, search visibility, conversion strategy, scalable technology, and business systems."
            align="center"
            className="mx-auto max-w-3xl"
          />

          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {coreCapabilities.map(
              (capability) => (
                <FeatureCard
                  key={
                    capability.title
                  }
                  title={
                    capability.title
                  }
                  description={
                    capability.description
                  }
                  icon={
                    capability.icon
                  }
                  eyebrow={
                    capability.eyebrow
                  }
                  tone="brand"
                />
              ),
            )}
          </div>

          <div className="mt-10 text-center">
            <p className="mx-auto max-w-3xl text-sm leading-7 text-muted">
              {
                websiteCapabilities.description
              }
            </p>
          </div>
        </Container>
      </Section>

      <Section className="relative overflow-hidden bg-brand text-white">
        <GridPattern className="opacity-35" />

        <div
          aria-hidden="true"
          className="absolute -left-40 top-1/2 -z-10 size-[34rem] -translate-y-1/2 rounded-full bg-brand-blue/10 blur-3xl"
        />

        <Container className="relative">
          <SectionHeader
            eyebrow="Our Process"
            title={websiteProcess.title}
            description={websiteProcess.description}
            className="max-w-3xl [&_h2]:text-white [&_p:last-child]:text-slate-300"
          />

          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {websiteProcess.items.map(
              (item, index) => {
                const Icon =
                  item.icon;

                return (
                  <Card
                    key={
                      item.title
                    }
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
                        0{index + 1}
                      </span>
                    </div>

                    <h3 className="mt-6 font-heading text-xl font-semibold text-white">
                      {
                        item.title
                      }
                    </h3>

                    <p className="mt-3 leading-7 text-slate-300">
                      {
                        item.description
                      }
                    </p>
                  </Card>
                );
              },
            )}
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <SectionHeader
            eyebrow="Who We Build For"
            title={websiteIndustries.title}
            description={websiteIndustries.description}
            align="center"
            className="mx-auto max-w-3xl"
          />

          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {websiteIndustries.items.map(
              (item) => {
                const Icon =
                  item.icon;

                return (
                  <FeatureCard
                    key={
                      item.title
                    }
                    title={
                      item.title
                    }
                    description={
                      item.description
                    }
                    icon={
                      Icon
                    }
                    tone="default"
                  />
                );
              },
            )}
          </div>
        </Container>
      </Section>

      <Section className="border-y border-border bg-slate-50/60">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[0.75fr_1.25fr] lg:gap-20">
            <SectionHeader
              eyebrow="Website Development FAQ"
              title={websiteFAQ.title}
              description={websiteFAQ.description}
            />

            <div className="space-y-4">
              {websiteFAQ.items.map(
                (item) => (
                  <Card
                    key={
                      item.question
                    }
                    variant="elevated"
                    padding="md"
                  >
                    <h3 className="font-heading text-lg font-semibold text-brand">
                      {
                        item.question
                      }
                    </h3>

                    <p className="mt-3 leading-7 text-muted">
                      {
                        item.answer
                      }
                    </p>
                  </Card>
                ),
              )}
            </div>
          </div>
        </Container>
      </Section>

      <CTASection
        title="Build a website that works as hard as your business."
        description="Let’s create a fast, professional, and scalable website designed to generate leads and support your long-term growth."
        primaryLabel="Start Your Website Project"
        primaryHref="/contact"
        secondaryLabel="Run Website Audit"
        secondaryHref="/website-audit"
      />
    </>
  );
}