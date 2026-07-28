import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Bot,
  Code2,
  Search,
  Wrench,
} from "lucide-react";

import { CTASection, PageHero } from "@/components/marketing";
import {
  Button,
  Container,
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

export default function ProjectsPage() {
  return (
    <>
      <PageHero
        eyebrow="Projects & Case Studies"
        title="Technology built around real business outcomes."
        description="Explore how JS Solutions combines websites, Local SEO, AI automation, content, and software engineering to solve practical business problems."
      />

      <Section>
        <Container>
          <SectionHeader
            eyebrow="Featured Work"
            title="Connected solutions designed to help businesses grow."
            description="Each project starts with a real business challenge and brings together the right combination of strategy, technology, visibility, and automation."
            className="max-w-3xl"
          />

          <div className="mt-12 grid gap-8 lg:grid-cols-3">
            {projects.map((project) => {
              const Icon = project.icon;
              const isAvailable = project.status === "Case Study";

              return (
                <article
                  key={project.title}
                  className="group flex h-full flex-col rounded-3xl border bg-card p-7 shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex size-12 items-center justify-center rounded-2xl bg-brand/10 text-brand">
                      <Icon aria-hidden="true" className="size-6" />
                    </div>

                    <span className="rounded-full border bg-muted/40 px-3 py-1 text-xs font-semibold text-muted-foreground">
                      {project.status}
                    </span>
                  </div>

                  <p className="mt-7 text-sm font-semibold uppercase tracking-[0.15em] text-brand">
                    {project.category}
                  </p>

                  <h2 className="mt-3 text-2xl font-semibold tracking-tight">
                    {project.title}
                  </h2>

                  <p className="mt-4 leading-7 text-muted-foreground">
                    {project.description}
                  </p>

                  <div className="mt-6 flex flex-wrap gap-2">
                    {project.services.map((service) => (
                      <span
                        key={service}
                        className="rounded-full border bg-background px-3 py-1.5 text-xs font-medium"
                      >
                        {service}
                      </span>
                    ))}
                  </div>

                  <div className="mt-auto pt-8">
                    {isAvailable ? (
                      <Button
                        variant="outline"
                        nativeButton={false}
                        render={<Link href={project.href} />}
                        className="group/button w-full justify-between"
                      >
                        View Case Study

                        <ArrowRight
                          aria-hidden="true"
                          className="size-4 transition-transform duration-300 group-hover/button:translate-x-1"
                        />
                      </Button>
                    ) : (
                      <div className="flex h-10 items-center justify-center rounded-md border border-dashed text-sm font-medium text-muted-foreground">
                        Case study in development
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </Container>
      </Section>

      <Section className="bg-muted/30">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <div>
              <div className="flex size-12 items-center justify-center rounded-2xl bg-brand/10 text-brand">
                <Search aria-hidden="true" className="size-6" />
              </div>

              <h2 className="mt-6 text-3xl font-semibold tracking-tight sm:text-4xl">
                More than a portfolio.
              </h2>

              <p className="mt-5 max-w-xl leading-7 text-muted-foreground">
                These case studies explain the business problem, the strategy,
                what was delivered, and the outcome—not just what the finished
                design looked like.
              </p>
            </div>

            <div className="rounded-3xl border bg-card p-7 shadow-soft md:p-9">
              <p className="text-sm font-semibold uppercase tracking-[0.15em] text-brand">
                Our Approach
              </p>

              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                {[
                  {
                    title: "Understand",
                    description:
                      "Identify the real problem preventing business growth.",
                  },
                  {
                    title: "Design",
                    description:
                      "Create the right website, visibility, and workflow strategy.",
                  },
                  {
                    title: "Build",
                    description:
                      "Implement reliable systems using modern technology.",
                  },
                  {
                    title: "Improve",
                    description:
                      "Measure performance and refine the system over time.",
                  },
                ].map((step) => (
                  <div key={step.title}>
                    <h3 className="font-semibold">{step.title}</h3>

                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Container>
      </Section>

      <CTASection
        title="Have a business challenge we can solve?"
        description="Let’s build the website, visibility, automation, and digital systems your business needs to grow."
        primaryLabel="Start a Conversation"
      />
    </>
  );
}