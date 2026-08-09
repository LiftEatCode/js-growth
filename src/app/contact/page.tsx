import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  BarChart3,
  Bot,
  CheckCircle2,
  Globe2,
  Mail,
  MapPin,
  Search,
  Sparkles,
  Workflow,
} from "lucide-react";

import { ContactForm } from "@/components/forms/contact-form";
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
  title: "Contact",
  description:
    "Contact JS Solutions to discuss your website, Local SEO, AI automation, digital marketing, or business growth project.",
};

const services = [
  {
    title: "Websites",
    description:
      "High-performance websites designed to build trust and convert visitors into customers.",
    icon: Globe2,
  },
  {
    title: "Local SEO",
    description:
      "Improve your local visibility and help nearby customers find your business.",
    icon: Search,
  },
  {
    title: "AI Automation",
    description:
      "Use AI and automation to respond faster, reduce manual work, and improve operations.",
    icon: Bot,
  },
  {
    title: "Business Systems",
    description:
      "Connect workflows, marketing, reporting, and customer communication into one system.",
    icon: Workflow,
  },
  {
    title: "Analytics",
    description:
      "Understand where leads come from and which marketing efforts are producing results.",
    icon: BarChart3,
  },
] as const;

const nextSteps = [
  "We review your business, goals, and current challenges.",
  "We identify the highest-impact opportunities.",
  "You receive a clear recommendation and next-step plan.",
] as const;

const reasons = [
  "Clear recommendations based on your goals",
  "Modern, scalable technology",
  "Solutions designed around your workflow",
  "Ongoing optimization and measurable reporting",
] as const;

export default function ContactPage() {
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
              <Mail
                aria-hidden="true"
                className="size-4"
              />

              Contact JS Solutions
            </div>

            <h1 className="mt-6 font-heading text-4xl font-bold leading-tight tracking-[-0.05em] text-white sm:text-5xl lg:text-6xl">
              Let&apos;s build a better growth system for your business.
            </h1>

            <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-slate-300 sm:text-xl">
              Tell us what you are working on, where your business is getting
              stuck, and what you want to accomplish. We&apos;ll help identify
              the right website, Local SEO, automation, or marketing solution.
            </p>
          </div>
        </Container>
      </section>

      <Section>
        <Container>
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)] lg:items-start">
            <Card
              variant="elevated"
              padding="lg"
            >
              <div className="mb-8">
                <div className="inline-flex items-center gap-2 rounded-full border border-brand-blue/10 bg-brand-blue/[0.045] px-3.5 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-brand-blue">
                  <Sparkles
                    aria-hidden="true"
                    className="size-3.5"
                  />

                  Start a conversation
                </div>

                <h2 className="mt-5 font-heading text-3xl font-bold tracking-tight text-brand">
                  Tell us about your business.
                </h2>

                <p className="mt-4 max-w-2xl leading-7 text-muted">
                  Complete the form below and provide as much detail as you can.
                  We&apos;ll review your request and follow up with practical
                  next steps.
                </p>
              </div>

              <ContactForm />
            </Card>

            <aside className="space-y-6 lg:sticky lg:top-24">
              <Card
                variant="brand"
                padding="md"
              >
                <h2 className="font-heading text-xl font-semibold text-brand">
                  What happens next?
                </h2>

                <div className="mt-6 space-y-5">
                  {nextSteps.map((step, index) => (
                    <div
                      key={step}
                      className="flex gap-3"
                    >
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-semibold text-white">
                        {index + 1}
                      </div>

                      <p className="text-sm leading-6 text-muted">
                        {step}
                      </p>
                    </div>
                  ))}
                </div>
              </Card>

              <Card
                variant="default"
                padding="md"
                className="border-slate-800 bg-brand text-white"
              >
                <h2 className="font-heading text-xl font-semibold text-white">
                  Prefer email?
                </h2>

                <p className="mt-3 text-sm leading-6 text-slate-300">
                  Send your project details directly and we&apos;ll get back to
                  you as soon as possible.
                </p>

                <a
                  href="mailto:jssolutions.tx@gmail.com"
                  className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-cyan-300 transition hover:text-white"
                >
                  <Mail
                    aria-hidden="true"
                    className="size-4"
                  />

                  jssolutions.tx@gmail.com
                </a>
              </Card>

              <Card
                variant="elevated"
                padding="md"
              >
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-xl border border-brand-blue/10 bg-brand-blue/[0.07] text-brand-blue">
                    <MapPin
                      aria-hidden="true"
                      className="size-5"
                    />
                  </span>

                  <h2 className="font-heading text-lg font-semibold text-brand">
                    Based in Texas
                  </h2>
                </div>

                <p className="mt-4 text-sm leading-6 text-muted">
                  Helping local businesses build stronger websites, better
                  visibility, and more efficient systems.
                </p>
              </Card>
            </aside>
          </div>
        </Container>
      </Section>

      <Section className="border-y border-border bg-slate-50/60">
        <Container>
          <SectionHeader
            eyebrow="How We Help"
            title="One partner for your digital growth."
            description="JS Solutions combines software engineering, marketing strategy, Local SEO, automation, and analytics into practical business systems."
            align="center"
            className="mx-auto max-w-3xl"
          />

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <FeatureCard
                key={service.title}
                title={service.title}
                description={service.description}
                icon={service.icon}
                tone="brand"
              />
            ))}
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <div className="relative overflow-hidden rounded-[2rem] border border-slate-800 bg-brand px-6 py-12 text-white shadow-soft sm:px-10 lg:px-14 lg:py-14">
            <GridPattern className="opacity-35" />

            <div
              aria-hidden="true"
              className="absolute right-0 top-0 size-72 -translate-y-1/2 translate-x-1/3 rounded-full bg-brand-blue/25 blur-3xl"
            />

            <div className="relative grid gap-10 lg:grid-cols-[1fr_0.9fr] lg:items-center">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3.5 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-300">
                  <Sparkles
                    aria-hidden="true"
                    className="size-3.5"
                  />

                  Built for growing businesses
                </div>

                <h2 className="mt-5 font-heading text-3xl font-bold tracking-tight text-white sm:text-4xl">
                  Practical strategy. Modern technology. Clear results.
                </h2>

                <p className="mt-5 max-w-xl leading-7 text-slate-300">
                  You do not need disconnected tools or vague marketing advice.
                  You need a system that helps your business get found, respond
                  faster, build trust, and generate more opportunities.
                </p>

                <div className="mt-8">
                  <Button
                    size="lg"
                    variant="outline"
                    nativeButton={false}
                    render={<Link href="/services" />}
                    className="border-white/15 bg-white/[0.04] text-white hover:border-white/25 hover:bg-white/[0.08] hover:text-white"
                  >
                    Explore Services

                    <ArrowRight
                      aria-hidden="true"
                      className="ml-1 size-4"
                    />
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                {reasons.map((item) => (
                  <div
                    key={item}
                    className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-4"
                  >
                    <CheckCircle2
                      aria-hidden="true"
                      className="mt-0.5 size-5 shrink-0 text-emerald-300"
                    />

                    <p className="text-sm leading-6 text-slate-300">
                      {item}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}