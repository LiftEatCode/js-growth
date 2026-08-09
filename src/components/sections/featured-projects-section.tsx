import Link from "next/link";
import {
  ArrowRight,
  Bot,
  Code2,
  MapPin,
} from "lucide-react";

import {
  Button,
  Card,
  Container,
  Section,
  SectionHeader,
} from "@/components/ui";

const projects = [
  {
    title:
      "Tha Shop",

    category:
      "Automotive Growth",

    description:
      "A growth-focused digital presence designed to improve local visibility, communicate services clearly, and generate more customer inquiries.",

    href:
      "/projects/tha-shop",

    icon:
      MapPin,

    results: [
      "Local SEO",
      "Content Strategy",
      "Lead Generation",
    ],
  },

  {
    title:
      "Local Service Growth Platform",

    category:
      "Web Development",

    description:
      "A high-performance website architecture built around clear service pages, conversion-focused content, and scalable local SEO.",

    href:
      "/projects/local-service-platform",

    icon:
      Code2,

    results: [
      "Next.js",
      "Core Web Vitals",
      "Conversion UX",
    ],
  },

  {
    title:
      "AI Business Automation",

    category:
      "AI & Automation",

    description:
      "A practical automation system designed to reduce repetitive work, improve customer follow-up, and create more consistent business processes.",

    href:
      "/projects/ai-business-automation",

    icon:
      Bot,

    results: [
      "AI Integration",
      "Workflow Automation",
      "Operational Efficiency",
    ],
  },
] as const;

export function FeaturedProjectsSection() {
  return (
    <Section className="bg-white">
      <Container>
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeader
            eyebrow="Featured Projects"
            title="Technology built around real business growth."
            description="A selection of websites, marketing systems, and automation solutions designed to help businesses perform better online."
          />

          <Button
            variant="outline"
            size="lg"
            className="w-fit shrink-0"
            nativeButton={false}
            render={
              <Link href="/projects" />
            }
          >
            View All Projects

            <ArrowRight
              aria-hidden="true"
              className="ml-1 size-4"
            />
          </Button>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {projects.map(
            (project) => {
              const Icon =
                project.icon;

              return (
                <Link
                  key={
                    project.title
                  }
                  href={
                    project.href
                  }
                  className="group block h-full rounded-2xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-blue/15"
                >
                  <Card
                    variant="elevated"
                    padding="none"
                    interactive
                    className="flex h-full flex-col overflow-hidden"
                  >
                    <div className="relative overflow-hidden border-b border-border bg-gradient-to-br from-slate-950 via-brand to-blue-950 px-6 py-8 text-white">
                      <div
                        aria-hidden="true"
                        className="absolute -right-12 -top-14 size-40 rounded-full bg-brand-blue/25 blur-3xl"
                      />

                      <div
                        aria-hidden="true"
                        className="absolute -bottom-20 -left-12 size-40 rounded-full bg-brand-cyan/10 blur-3xl"
                      />

                      <div className="relative">
                        <div className="flex items-start justify-between gap-5">
                          <span className="flex size-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.08] text-cyan-300 backdrop-blur-xl">
                            <Icon
                              aria-hidden="true"
                              className="size-5"
                            />
                          </span>

                          <ArrowRight
                            aria-hidden="true"
                            className="size-5 text-white/30 transition duration-200 group-hover:translate-x-1 group-hover:text-cyan-300"
                          />
                        </div>

                        <p className="mt-8 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">
                          {
                            project.category
                          }
                        </p>

                        <h3 className="mt-2 font-heading text-2xl font-semibold tracking-tight text-white">
                          {
                            project.title
                          }
                        </h3>
                      </div>
                    </div>

                    <div className="flex flex-1 flex-col p-6">
                      <p className="leading-7 text-muted">
                        {
                          project.description
                        }
                      </p>

                      <div className="mt-6 flex flex-wrap gap-2">
                        {project.results.map(
                          (
                            result,
                          ) => (
                            <span
                              key={
                                result
                              }
                              className="rounded-full border border-brand-blue/10 bg-brand-blue/[0.05] px-3 py-1.5 text-xs font-medium text-brand-blue"
                            >
                              {
                                result
                              }
                            </span>
                          ),
                        )}
                      </div>

                      <div className="mt-auto pt-7">
                        <div className="flex items-center gap-2 border-t border-border pt-5 text-sm font-semibold text-brand-blue">
                          View project

                          <ArrowRight
                            aria-hidden="true"
                            className="size-4 transition-transform duration-200 group-hover:translate-x-0.5"
                          />
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            },
          )}
        </div>
      </Container>
    </Section>
  );
}