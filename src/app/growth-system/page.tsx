import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  BarChart3,
  Bot,
  ChartNoAxesCombined,
  Globe,
  MapPin,
  MessagesSquare,
  Rocket,
  Sparkles,
  Workflow,
} from "lucide-react";

import {
  CTASection,
  GrowthSystemVisual,
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

export const metadata: Metadata = {
  title: "The JS Growth System",
  description:
    "Discover how JS Solutions connects websites, Local SEO, lead generation, AI automation, business workflows, and analytics into one complete growth system.",
};

const growthBenefits = [
  {
    title: "Build Trust",
    description:
      "A professional website gives customers confidence in your business and clearly explains why they should choose you.",
    icon: Globe,
    eyebrow: "Foundation",
  },
  {
    title: "Increase Visibility",
    description:
      "Local SEO helps nearby customers find your business when they are actively searching for your services.",
    icon: MapPin,
    eyebrow: "Search",
  },
  {
    title: "Capture Opportunities",
    description:
      "Clear calls to action and conversion-focused pages turn website traffic into calls, messages, and qualified leads.",
    icon: MessagesSquare,
    eyebrow: "Conversion",
  },
  {
    title: "Respond Faster",
    description:
      "AI-assisted communication and automated follow-up help your business respond before opportunities disappear.",
    icon: Bot,
    eyebrow: "Automation",
  },
  {
    title: "Improve Operations",
    description:
      "Connected workflows reduce repetitive work and help your team manage customers, tasks, and information consistently.",
    icon: Workflow,
    eyebrow: "Operations",
  },
  {
    title: "Measure Growth",
    description:
      "Analytics reveal which channels, pages, campaigns, and systems are producing meaningful business results.",
    icon: BarChart3,
    eyebrow: "Data",
  },
] as const;

const growthProcess = [
  {
    number: "01",
    title: "Build the Foundation",
    description:
      "Create a fast, credible, conversion-focused website that clearly communicates your services and value.",
    icon: Globe,
  },
  {
    number: "02",
    title: "Increase Visibility",
    description:
      "Improve search visibility through Local SEO, technical optimization, content, and location-focused strategies.",
    icon: MapPin,
  },
  {
    number: "03",
    title: "Capture Leads",
    description:
      "Give visitors clear paths to call, request information, schedule service, or begin a conversation.",
    icon: MessagesSquare,
  },
  {
    number: "04",
    title: "Improve Follow-Up",
    description:
      "Use AI and automation to respond faster, qualify opportunities, and keep leads from being forgotten.",
    icon: Bot,
  },
  {
    number: "05",
    title: "Connect Operations",
    description:
      "Integrate customer information, internal workflows, communication, and reporting into dependable systems.",
    icon: Workflow,
  },
  {
    number: "06",
    title: "Measure Performance",
    description:
      "Track visibility, traffic, conversions, leads, and operational results to identify what is driving growth.",
    icon: ChartNoAxesCombined,
  },
  {
    number: "07",
    title: "Optimize and Scale",
    description:
      "Use real performance data to improve the system, remove bottlenecks, and support continued expansion.",
    icon: Rocket,
  },
] as const;

export default function GrowthSystemPage() {
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
          <div className="grid items-center gap-14 lg:grid-cols-[1fr_0.95fr]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-sm font-medium text-cyan-200 backdrop-blur-xl">
                <Sparkles
                  aria-hidden="true"
                  className="size-4"
                />

                The JS Growth System
              </div>

              <h1 className="mt-6 max-w-4xl font-heading text-4xl font-bold leading-tight tracking-[-0.05em] text-white sm:text-5xl lg:text-6xl">
                More than marketing. A connected system for business growth.
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300 sm:text-xl">
                JS Solutions connects your website, search visibility, lead
                generation, AI automation, business workflows, and analytics so
                every part of your digital presence works toward the same goal.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button
                  size="xl"
                  nativeButton={false}
                  render={<Link href="/contact" />}
                >
                  Plan Your Growth

                  <ArrowRight
                    aria-hidden="true"
                    className="ml-1 size-4"
                  />
                </Button>

                <Button
                  size="xl"
                  variant="outline"
                  nativeButton={false}
                  render={<Link href="/website-audit" />}
                  className="border-white/15 bg-white/[0.04] text-white hover:border-white/25 hover:bg-white/[0.08] hover:text-white"
                >
                  Run Website Audit
                </Button>
              </div>
            </div>

            <div className="relative">
              <div
                aria-hidden="true"
                className="absolute -inset-10 -z-10 rounded-full bg-brand-blue/[0.08] blur-3xl"
              />

              <GrowthSystemVisual />
            </div>
          </div>
        </Container>
      </section>

      <Section>
        <Container>
          <SectionHeader
            eyebrow="The Complete System"
            title="Turn disconnected digital tools into one growth engine."
            description="Your website should support your SEO. Your SEO should create opportunities. Your follow-up should convert those opportunities. Your data should show where to improve."
            align="center"
            className="mx-auto max-w-3xl"
          />

          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {growthBenefits.map((benefit) => (
              <FeatureCard
                key={benefit.title}
                title={benefit.title}
                description={benefit.description}
                icon={benefit.icon}
                eyebrow={benefit.eyebrow}
                tone="brand"
              />
            ))}
          </div>
        </Container>
      </Section>

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
            eyebrow="The Framework"
            title="How the JS Growth System works."
            description="Each stage strengthens the next, creating a connected system that attracts customers, improves follow-up, and supports long-term growth."
            className="max-w-3xl [&_h2]:text-white [&_p:last-child]:text-slate-300"
          />

          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {growthProcess.map((step) => {
              const Icon = step.icon;

              return (
                <Card
                  key={step.number}
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
                      {step.number}
                    </span>
                  </div>

                  <h3 className="mt-6 font-heading text-lg font-semibold text-white">
                    {step.title}
                  </h3>

                  <p className="mt-3 text-sm leading-7 text-slate-300">
                    {step.description}
                  </p>
                </Card>
              );
            })}
          </div>
        </Container>
      </Section>

      <Section className="border-y border-border bg-slate-50/60">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[0.72fr_1.28fr] lg:items-center lg:gap-20">
            <SectionHeader
              eyebrow="Why Connected Systems Win"
              title="Each part becomes more valuable when the others support it."
              description="A strong website alone is useful. A strong website connected to search visibility, automation, follow-up, and reporting becomes a business system."
            />

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                {
                  title: "Attract",
                  description:
                    "Search visibility and content bring qualified customers into the system.",
                },
                {
                  title: "Convert",
                  description:
                    "Clear pages and calls to action turn attention into real opportunities.",
                },
                {
                  title: "Follow Up",
                  description:
                    "Automation helps your business respond consistently and quickly.",
                },
                {
                  title: "Improve",
                  description:
                    "Analytics show what works and where the next opportunity exists.",
                },
              ].map((item) => (
                <Card
                  key={item.title}
                  variant="elevated"
                  padding="md"
                  interactive
                >
                  <h3 className="font-heading text-lg font-semibold text-brand">
                    {item.title}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-muted">
                    {item.description}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        </Container>
      </Section>

      <CTASection
        title="Build the right growth system for your business."
        description="Let’s identify your strongest opportunities, biggest bottlenecks, and the digital systems that can create the greatest impact."
        primaryLabel="Plan Your Growth"
        primaryHref="/contact"
        secondaryLabel="Run Website Audit"
        secondaryHref="/website-audit"
      />
    </>
  );
}