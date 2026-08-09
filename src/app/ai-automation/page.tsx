import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  Bot,
  BrainCircuit,
  CheckCircle2,
  FileText,
  Network,
  Sparkles,
  Workflow,
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
import {
  aiAutomationBenefits,
  aiAutomationCapabilities,
  aiAutomationFAQ,
  aiAutomationIndustries,
  aiAutomationProcess,
} from "@/content/services/ai-automation";

export const metadata: Metadata = {
  title: "AI Integration & Business Automation",
  description:
    "AI integration and business automation services that help companies reduce repetitive work, improve communication, connect systems, and scale operations.",
};

const automationHighlights = [
  {
    title: "AI Assistants",
    description:
      "Help teams find information, summarize content, draft responses, and complete routine work faster.",
    icon: Bot,
  },
  {
    title: "Workflow Automation",
    description:
      "Connect forms, databases, email, CRMs, scheduling tools, and internal systems into dependable workflows.",
    icon: Workflow,
  },
  {
    title: "Document Processing",
    description:
      "Extract, classify, summarize, and organize information from business documents and records.",
    icon: FileText,
  },
  {
    title: "Knowledge Systems",
    description:
      "Create secure, searchable internal tools using approved company documentation and business data.",
    icon: BrainCircuit,
  },
] as const;

export default function AIAutomationPage() {
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
                <Bot
                  aria-hidden="true"
                  className="size-4"
                />

                AI Integration & Automation
              </div>

              <h1 className="mt-6 max-w-4xl font-heading text-4xl font-bold leading-tight tracking-[-0.05em] text-white sm:text-5xl lg:text-6xl">
                Practical AI and automation built around your business.
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300 sm:text-xl">
                JS Solutions helps businesses reduce repetitive work, improve
                communication, connect existing systems, and turn everyday
                workflows into more efficient digital processes.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button
                  size="xl"
                  nativeButton={false}
                  render={<Link href="/contact" />}
                >
                  Plan Your Automation

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
                <Sparkles
                  aria-hidden="true"
                  className="size-3.5"
                />

                Practical automation first
              </div>

              <div className="mt-6 space-y-4">
                {[
                  "Reduce repetitive administrative work",
                  "Improve lead and customer follow-up",
                  "Connect disconnected business systems",
                  "Use company data more effectively",
                  "Scale without adding manual work at the same rate",
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
            eyebrow={aiAutomationBenefits.eyebrow}
            title={aiAutomationBenefits.title}
            description={aiAutomationBenefits.description}
            align="center"
            className="mx-auto max-w-3xl"
          />

          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {aiAutomationBenefits.items.map((item) => (
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
          <SectionHeader
            eyebrow={aiAutomationCapabilities.eyebrow}
            title={aiAutomationCapabilities.title}
            description={aiAutomationCapabilities.description}
            align="center"
            className="mx-auto max-w-3xl"
          />

          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {aiAutomationCapabilities.items.map((item) => (
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
            eyebrow={aiAutomationProcess.eyebrow}
            title={aiAutomationProcess.title}
            description={aiAutomationProcess.description}
            className="max-w-3xl [&_h2]:text-white [&_p:last-child]:text-slate-300"
          />

          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {aiAutomationProcess.items.map((item) => {
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

      <Section>
        <Container>
          <SectionHeader
            eyebrow={aiAutomationIndustries.eyebrow}
            title={aiAutomationIndustries.title}
            description={aiAutomationIndustries.description}
            align="center"
            className="mx-auto max-w-3xl"
          />

          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {aiAutomationIndustries.items.map((item) => (
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
          <SectionHeader
            eyebrow="High-Value Automation Opportunities"
            title="Start where automation can create measurable value."
            description="The best place to begin is usually a focused workflow with clear business impact, predictable inputs, and an outcome your team can evaluate."
            align="center"
            className="mx-auto max-w-3xl"
          />

          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {automationHighlights.map((item) => (
              <FeatureCard
                key={item.title}
                title={item.title}
                description={item.description}
                icon={item.icon}
                tone="brand"
              />
            ))}
          </div>

          <Card
            variant="elevated"
            padding="lg"
            className="mx-auto mt-10 max-w-4xl"
          >
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-brand-blue/10 bg-brand-blue/[0.07] text-brand-blue">
                <Network
                  aria-hidden="true"
                  className="size-5"
                />
              </span>

              <div className="flex-1">
                <p className="font-heading text-lg font-semibold text-brand">
                  AI is only one part of the solution.
                </p>

                <p className="mt-2 leading-7 text-muted">
                  Some business problems are best solved with AI, some with
                  traditional automation, and others with custom software. We
                  choose the simplest dependable architecture that solves the
                  actual workflow problem.
                </p>
              </div>
            </div>
          </Card>
        </Container>
      </Section>

      <Section>
        <Container>
          <div className="grid gap-12 lg:grid-cols-[0.75fr_1.25fr] lg:gap-20">
            <SectionHeader
              eyebrow={aiAutomationFAQ.eyebrow}
              title={aiAutomationFAQ.title}
              description={aiAutomationFAQ.description}
            />

            <div className="space-y-4">
              {aiAutomationFAQ.items.map((item) => (
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
        title="Find the right automation opportunity for your business."
        description="Let’s review your workflows, repetitive tasks, communication gaps, and current systems to identify where AI, traditional automation, or custom software can create practical value."
        primaryLabel="Plan Your Automation"
        primaryHref="/contact"
        secondaryLabel="Explore Services"
        secondaryHref="/services"
      />
    </>
  );
}