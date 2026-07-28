import type { Metadata } from "next";
import { CheckCircle2, Code2, Cpu, LineChart, Search } from "lucide-react";

import { Container } from "@/components/ui/container";
import { CTASection, PageHero } from "@/components/marketing";

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn how JS Solutions combines senior software engineering, Local SEO, AI, automation, and digital marketing to help local businesses grow.",
};

const values = [
  {
    title: "Software First",
    description:
      "Every website and marketing strategy is built with the same engineering mindset used to develop enterprise software.",
    icon: Code2,
  },
  {
    title: "Growth Focused",
    description:
      "The goal isn't just launching a website—it's generating leads, improving visibility, and helping businesses grow.",
    icon: LineChart,
  },
  {
    title: "Automation Driven",
    description:
      "AI and automation eliminate repetitive work so businesses can spend more time serving customers.",
    icon: Cpu,
  },
  {
    title: "Local SEO Expertise",
    description:
      "Helping businesses dominate local search through technical SEO, Google Business Profile optimization, and high-quality content.",
    icon: Search,
  },
];

const reasons = [
  "Senior Software Engineer with enterprise application experience",
  "Custom-built websites—never generic templates",
  "Technical SEO built into every project",
  "Modern Next.js development for speed and scalability",
  "AI automation and workflow integration",
  "Analytics focused on measurable business results",
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About JS Solutions"
        title="Software engineering expertise applied to business growth."
        description="JS Solutions was built around a simple idea: local businesses deserve more than generic websites and disconnected marketing services. They need scalable systems engineered around performance, visibility, automation, and measurable growth."
      />

      <section className="border-b border-border py-16 sm:py-20 lg:py-24">
        <Container>
          <div className="mx-auto max-w-4xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
              Our Story
            </p>

            <h2 className="mt-4 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
              Built by a software engineer who understands business.
            </h2>

            <div className="mt-8 space-y-6 text-lg leading-8 text-muted-foreground">
              <p>
                JS Solutions was founded to bridge the gap between software
                engineering and digital marketing. Too many small businesses
                invest in websites that look nice but fail to generate leads,
                rank in search engines, or support long-term growth.
              </p>

              <p>
                With years of experience designing enterprise software and
                solving complex technical challenges, I approach every project
                differently. Instead of selling a website, I build systems that
                help businesses attract customers, automate repetitive tasks,
                and create measurable growth.
              </p>

              <p>
                Whether it&apos;s a local contractor, an automotive shop, a
                professional service, or a growing company, every solution is
                designed around the unique goals of that business—not a
                one-size-fits-all template.
              </p>
            </div>
          </div>
        </Container>
      </section>

      <section className="border-b border-border bg-muted/30 py-16 sm:py-20 lg:py-24">
        <Container>
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
              What We Believe
            </p>

            <h2 className="mt-4 font-heading text-3xl font-semibold sm:text-4xl">
              Technology should help businesses grow.
            </h2>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {values.map((value) => {
              const Icon = value.icon;

              return (
                <article
                  key={value.title}
                  className="rounded-2xl border border-border bg-card p-6 shadow-sm"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-6 w-6" />
                  </div>

                  <h3 className="mt-5 font-heading text-xl font-semibold">
                    {value.title}
                  </h3>

                  <p className="mt-3 text-sm leading-7 text-muted-foreground">
                    {value.description}
                  </p>
                </article>
              );
            })}
          </div>
        </Container>
      </section>

      <section className="border-b border-border py-16 sm:py-20 lg:py-24">
        <Container>
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                Why JS Solutions
              </p>

              <h2 className="mt-4 font-heading text-3xl font-semibold sm:text-4xl">
                More than a web designer.
              </h2>

              <p className="mt-6 text-lg leading-8 text-muted-foreground">
                Most agencies focus on design. We focus on building complete
                business systems that combine modern development, SEO, AI,
                automation, analytics, and measurable results.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
              <ul className="space-y-5">
                {reasons.map((reason) => (
                  <li key={reason} className="flex gap-4">
                    <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-primary" />

                    <span className="text-muted-foreground">{reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Container>
      </section>

      <CTASection
        title="Ready to grow your business?"
        description="Whether you need a new website, better Local SEO, AI automation, or custom software, let's build a solution that helps your business grow."
        primaryLabel="Start a Conversation"
        primaryHref="/contact"
        secondaryLabel="View Our Services"
        secondaryHref="/services"
      />
    </>
  );
}