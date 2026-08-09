import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  Bot,
  Code2,
  Search,
  Sparkles,
  Wrench,
} from "lucide-react";

import { CTASection } from "@/components/marketing";
import {
  Button,
  Card,
  Container,
  GridPattern,
  Section,
  SectionHeader,
} from "@/components/ui";

export const metadata: Metadata = {
  title: "Projects & Case Studies",
  description:
    "Explore websites, Local SEO campaigns, AI automation systems, and business growth projects created by JS Solutions.",
};

const projects = [
  {
    title: "Tha Shop",
    category: "Automotive Growth",
    description:
      "A connected website, Local SEO, content, social media, and lead-generation strategy built for an automotive repair and custom fabrication business in Magnolia, Texas.",
    href: "/projects/tha-shop",
    icon: Wrench,
    status: "Case Study",
    services: [
      "Website Strategy",
      "Local SEO",
      "Content Marketing",
      "Lead Generation",
    ],
  },
  {
    title: "Local Service Growth Platform",
    category: "Website Development",
    description:
      "A scalable website system designed around high-performance service pages, local search visibility, clear conversion paths, and long-term business growth.",
    href: "/projects/local-service-platform",
    icon: Code2,
    status: "Coming Soon",
    services: [
      "Next.js Development",
      "Conversion UX",
      "Technical SEO",
      "Performance",
    ],
  },
  {
    title: "AI Business Automation",
    category: "AI & Automation",
    description:
      "A practical automation system designed to reduce repetitive work, improve customer follow-up, and create more consistent internal processes.",
    href: "/projects/ai-business-automation",
    icon: Bot,
    status: "Coming Soon",
    services: [
      "AI Integration",
      "Workflow Automation",
      "Lead Follow-Up",
      "Operational Efficiency",
    ],
  },
] as const;

const approach = [
  {
    number: "01",
    title: "Understand",
    description:
      "Identify the real business problem, customer journey, operational friction, and growth opportunity.",
  },
  {
    number: "02",
    title: "Design",
    description:
      "Create the right website, visibility, automation, and workflow strategy for the challenge.",
  },
  {
    number: "03",
    title: "Build",
    description:
      "Implement dependable systems using modern software, integrations, and measurable marketing.",
  },
  {
    number: "04",
    title: "Improve",
    description:
      "Measure performance, learn from real usage, and strengthen the system over time.",
  },
] as const;

export default function ProjectsPage() {
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

              Projects & Case Studies
            </div>

            <h1 className="mt-6 font-heading text-4xl font-bold leading-tight tracking-[-0.05em] text-white sm:text-5xl lg:text-6xl">
              Technology built around real business outcomes.
            </h1>

            <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-slate-300 sm:text-xl">
              Explore how JS Solutions combines websites, Local SEO, AI
              automation, content, and software engineering to solve practical
              business problems.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                size="xl"
                nativeButton={false}
                render={<Link href="/contact" />}
              >
                Start a Project

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
            eyebrow="Featured Work"
            title="Connected solutions designed to help businesses grow."
            description="Each project starts with a real business challenge and brings together the right combination of strategy, technology, visibility, and automation."
            align="center"
            className="mx-auto max-w-3xl"
          />

          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {projects.map((project) => {
              const Icon = project.icon;
              const isAvailable = project.status === "Case Study";

              return (
                <Card
                  key={project.title}
                  variant="elevated"
                  padding="none"
                  interactive={isAvailable}
                  className="group flex h-full flex-col overflow-hidden"
                >
                  <div className="relative overflow-hidden border-b border-border bg-gradient-to-br from-slate-950 via-brand to-blue-950 px-7 py-8 text-white">
                    <div
                      aria-hidden="true"
                      className="absolute -right-12 -top-14 size-40 rounded-full bg-brand-blue/25 blur-3xl"
                    />

                    <div className="relative">
                      <div className="flex items-start justify-between gap-4">
                        <span className="flex size-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.08] text-cyan-300 backdrop-blur-xl">
                          <Icon
                            aria-hidden="true"
                            className="size-5"
                          />
                        </span>

                        <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-semibold text-slate-300">
                          {project.status}
                        </span>
                      </div>

                      <p className="mt-8 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">
                        {project.category}
                      </p>

                      <h2 className="mt-2 font-heading text-2xl font-semibold tracking-tight text-white">
                        {project.title}
                      </h2>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col p-7">
                    <p className="leading-7 text-muted">
                      {project.description}
                    </p>

                    <div className="mt-6 flex flex-wrap gap-2">
                      {project.services.map((service) => (
                        <span
                          key={service}
                          className="rounded-full border border-brand-blue/10 bg-brand-blue/[0.045] px-3 py-1.5 text-xs font-medium text-brand-blue"
                        >
                          {service}
                        </span>
                      ))}
                    </div>

                    <div className="mt-auto pt-8">
                      {isAvailable ? (
                        <Button
                          variant="outline"
                          size="lg"
                          className="w-full justify-between"
                          nativeButton={false}
                          render={<Link href={project.href} />}
                        >
                          View Case Study

                          <ArrowRight
                            aria-hidden="true"
                            className="size-4"
                          />
                        </Button>
                      ) : (
                        <div className="flex min-h-12 items-center justify-center rounded-xl border border-dashed border-border bg-slate-50 text-sm font-medium text-muted">
                          Case study in development
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </Container>
      </Section>

      <Section className="relative overflow-hidden border-y border-border bg-slate-50/60">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[0.72fr_1.28fr] lg:items-start lg:gap-20">
            <div className="lg:sticky lg:top-28">
              <span className="flex size-12 items-center justify-center rounded-xl border border-brand-blue/10 bg-brand-blue/[0.07] text-brand-blue">
                <Search
                  aria-hidden="true"
                  className="size-5"
                />
              </span>

              <SectionHeader
                eyebrow="Our Approach"
                title="More than a portfolio."
                description="These case studies explain the business problem, the strategy, what was delivered, and the outcome—not just what the finished design looked like."
                className="mt-6"
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              {approach.map((step) => (
                <Card
                  key={step.number}
                  variant="elevated"
                  padding="lg"
                  interactive
                >
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-heading text-sm font-semibold text-brand-blue">
                      {step.number}
                    </span>

                    <ArrowRight
                      aria-hidden="true"
                      className="size-4 text-slate-300"
                    />
                  </div>

                  <h3 className="mt-6 font-heading text-xl font-semibold text-brand">
                    {step.title}
                  </h3>

                  <p className="mt-3 leading-7 text-muted">
                    {step.description}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        </Container>
      </Section>

      <CTASection
        title="Have a business challenge we can solve?"
        description="Let’s build the website, visibility, automation, and digital systems your business needs to grow."
        primaryLabel="Start a Conversation"
        primaryHref="/contact"
        secondaryLabel="Explore Services"
        secondaryHref="/services"
      />
    </>
  );
}