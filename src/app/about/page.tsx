import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  CheckCircle2,
  Code2,
  Cpu,
  LineChart,
  Search,
  Sparkles,
} from "lucide-react";

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

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn how JS Solutions combines senior software engineering, Local SEO, AI, automation, and digital marketing to help local businesses grow.",
};

const values = [
  {
    title: "Software First",
    description:
      "Every website and marketing strategy is approached with the same engineering mindset used to build dependable software systems.",
    icon: Code2,
    eyebrow: "Engineering",
  },
  {
    title: "Growth Focused",
    description:
      "The goal is not just launching a website. It is generating leads, improving visibility, and creating measurable business value.",
    icon: LineChart,
    eyebrow: "Strategy",
  },
  {
    title: "Automation Driven",
    description:
      "AI and automation reduce repetitive work so businesses can spend more time serving customers and growing.",
    icon: Cpu,
    eyebrow: "Automation",
  },
  {
    title: "Local SEO Expertise",
    description:
      "Technical SEO, Google Business Profile optimization, useful content, and local relevance work together to improve visibility.",
    icon: Search,
    eyebrow: "Search",
  },
] as const;

const reasons = [
  "Senior software engineering and enterprise application experience",
  "Custom-built websites instead of generic templates",
  "Technical SEO integrated into development",
  "Modern Next.js architecture for speed and scalability",
  "AI automation and workflow integration",
  "Analytics focused on measurable business outcomes",
] as const;

export default function AboutPage() {
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
          <div className="grid items-center gap-14 lg:grid-cols-[1fr_0.88fr]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-sm font-medium text-cyan-200 backdrop-blur-xl">
                <Sparkles
                  aria-hidden="true"
                  className="size-4"
                />

                About JS Solutions
              </div>

              <h1 className="mt-6 max-w-4xl font-heading text-4xl font-bold leading-tight tracking-[-0.05em] text-white sm:text-5xl lg:text-6xl">
                Software engineering expertise applied to business growth.
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300 sm:text-xl">
                JS Solutions was built around a simple idea: businesses deserve
                more than generic websites and disconnected marketing
                services. They need scalable systems engineered around
                performance, visibility, automation, and measurable growth.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button
                  size="xl"
                  nativeButton={false}
                  render={<Link href="/contact" />}
                >
                  Start a Conversation

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

            <Card
              variant="default"
              padding="lg"
              className="border-white/10 bg-white/[0.055] text-white shadow-soft backdrop-blur-xl"
            >
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-300">
                <Code2
                  aria-hidden="true"
                  className="size-4"
                />

                Engineering mindset
              </div>

              <p className="mt-5 font-heading text-2xl font-semibold leading-tight text-white">
                Build systems that solve business problems.
              </p>

              <p className="mt-4 leading-7 text-slate-300">
                Websites, SEO, automation, analytics, and software should not
                exist as isolated services. They should work together around
                the goals and operations of the business.
              </p>

              <div className="mt-6 border-t border-white/10 pt-5">
                <p className="text-sm font-medium text-cyan-300">
                  Strategy + software + measurable execution
                </p>
              </div>
            </Card>
          </div>
        </Container>
      </section>

      <Section>
        <Container>
          <div className="grid gap-12 lg:grid-cols-[0.72fr_1.28fr] lg:gap-20">
            <SectionHeader
              eyebrow="Our Story"
              title="Built by a software engineer who understands business."
              description="JS Solutions bridges the gap between technical engineering and practical business growth."
            />

            <Card
              variant="elevated"
              padding="lg"
            >
              <div className="space-y-6 text-lg leading-8 text-muted">
                <p>
                  JS Solutions was founded to bridge the gap between software
                  engineering and digital marketing. Too many small businesses
                  invest in websites that look good but fail to generate leads,
                  rank in search engines, or support long-term growth.
                </p>

                <p>
                  With experience designing enterprise software and solving
                  complex technical challenges, every project is approached
                  differently. Instead of simply selling a website, the goal is
                  to build systems that help businesses attract customers,
                  automate repetitive work, and create measurable value.
                </p>

                <p>
                  Whether it&apos;s a local contractor, automotive shop,
                  professional service, or growing organization, each solution
                  is designed around the unique goals and workflows of that
                  business rather than a one-size-fits-all template.
                </p>
              </div>
            </Card>
          </div>
        </Container>
      </Section>

      <Section className="border-y border-border bg-slate-50/60">
        <Container>
          <SectionHeader
            eyebrow="What We Believe"
            title="Technology should help businesses grow."
            description="Every service is designed around practical business outcomes rather than technology for technology's sake."
            align="center"
            className="mx-auto max-w-3xl"
          />

          <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {values.map((value) => (
              <FeatureCard
                key={value.title}
                title={value.title}
                description={value.description}
                icon={value.icon}
                eyebrow={value.eyebrow}
                tone="brand"
              />
            ))}
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <div className="grid gap-12 lg:grid-cols-[0.78fr_1.22fr] lg:items-center lg:gap-20">
            <div>
              <SectionHeader
                eyebrow="Why JS Solutions"
                title="More than a web designer."
                description="Many agencies focus on isolated campaigns or surface-level design. JS Solutions focuses on building connected systems that combine development, SEO, AI, automation, analytics, and business strategy."
              />

              <div className="mt-8">
                <Button
                  size="lg"
                  variant="outline"
                  nativeButton={false}
                  render={<Link href="/services" />}
                >
                  View Our Services

                  <ArrowRight
                    aria-hidden="true"
                    className="ml-1 size-4"
                  />
                </Button>
              </div>
            </div>

            <Card
              variant="elevated"
              padding="lg"
            >
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-brand-blue">
                <Sparkles
                  aria-hidden="true"
                  className="size-3.5"
                />

                What you can expect
              </div>

              <ul className="mt-6 space-y-5">
                {reasons.map((reason) => (
                  <li
                    key={reason}
                    className="flex items-start gap-4"
                  >
                    <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-600">
                      <CheckCircle2
                        aria-hidden="true"
                        className="size-4"
                      />
                    </span>

                    <span className="leading-7 text-muted">
                      {reason}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </Container>
      </Section>

      <Section className="relative overflow-hidden bg-brand text-white">
        <GridPattern className="opacity-35" />

        <Container className="relative">
          <div className="mx-auto max-w-4xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3.5 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-300">
              <LineChart
                aria-hidden="true"
                className="size-3.5"
              />

              The bigger picture
            </div>

            <h2 className="mt-5 font-heading text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
              Build the foundation first. Then keep improving it.
            </h2>

            <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-slate-300">
              A strong digital presence is not one project. It is a system that
              can evolve as your business grows, your customers change, and new
              opportunities become available.
            </p>
          </div>
        </Container>
      </Section>

      <CTASection
        title="Ready to build something that supports real growth?"
        description="Whether you need a new website, stronger Local SEO, AI automation, or custom software, let’s identify the solution that makes the most sense for your business."
        primaryLabel="Start a Conversation"
        primaryHref="/contact"
        secondaryLabel="View Our Services"
        secondaryHref="/services"
      />
    </>
  );
}