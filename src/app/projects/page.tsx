import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Search, Sparkles } from "lucide-react";

import { CTASection } from "@/components/marketing";
import { ProjectCard } from "@/components/projects/project-card";
import {
  Button,
  Card,
  Container,
  GridPattern,
  Section,
  SectionHeader,
} from "@/components/ui";
import { getPublishedProjects } from "@/content/projects";
import { getAbsoluteUrl } from "@/lib/seo";

const canonicalPath = "/projects";

export const metadata: Metadata = {
  title: "Client Work & Case Studies",
  description:
    "See how JS Growth modernizes local business websites with custom Next.js development, SEO migration, lead generation, and a foundation for continued growth.",
  alternates: {
    canonical: getAbsoluteUrl(canonicalPath),
  },
  openGraph: {
    type: "website",
    title: "Client Work & Case Studies",
    description:
      "See how JS Growth modernizes local business websites with custom Next.js development, SEO migration, lead generation, and a foundation for continued growth.",
    url: getAbsoluteUrl(canonicalPath),
    siteName: "JS Solutions",
  },
  twitter: {
    card: "summary_large_image",
    title: "Client Work & Case Studies",
    description:
      "See how JS Growth modernizes local business websites with custom Next.js development, SEO migration, lead generation, and a foundation for continued growth.",
  },
};

const approach = [
  {
    number: "01",
    title: "Understand",
    description:
      "Identify the real business problem, customer journey, and what the current website cannot support.",
  },
  {
    number: "02",
    title: "Plan the move",
    description:
      "Protect useful URLs and content, then design the site, SEO, and lead paths around how the business actually works.",
  },
  {
    number: "03",
    title: "Build",
    description:
      "Implement a custom website with search structure, content, appointment or lead capture, and a deployment workflow that can keep improving.",
  },
  {
    number: "04",
    title: "Grow from there",
    description:
      "Use the new foundation for service pages, local SEO, content, measurement, and conversion work after launch.",
  },
] as const;

export default function ProjectsPage() {
  const publishedProjects = getPublishedProjects();

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
              <Sparkles aria-hidden="true" className="size-4" />
              Client Work
            </div>

            <h1 className="mt-6 font-heading text-4xl font-bold leading-tight tracking-[-0.05em] text-white sm:text-5xl lg:text-6xl">
              Websites rebuilt as growth platforms.
            </h1>

            <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-slate-300 sm:text-xl">
              JS Growth helps local businesses move off older website setups
              onto custom Next.js sites built for search, leads, content, and
              the next round of work — without throwing away the search equity
              they already have.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                size="xl"
                nativeButton={false}
                render={<Link href="/website-audit" />}
              >
                Run My Free Website Audit
                <ArrowRight aria-hidden="true" className="ml-1 size-4" />
              </Button>

              <Button
                size="xl"
                variant="outline"
                nativeButton={false}
                render={<Link href="/contact" />}
                className="border-white/15 bg-white/[0.04] text-white hover:border-white/25 hover:bg-white/[0.08] hover:text-white"
              >
                Talk About My Website
              </Button>
            </div>
          </div>
        </Container>
      </section>

      <Section>
        <Container>
          <SectionHeader
            eyebrow="Case Studies"
            title="Work built for real local businesses."
            description="Each case study explains the business problem, what we rebuilt, and the foundation left in place. Future projects are added here as they launch."
            align="center"
            className="mx-auto max-w-3xl"
          />

          <div
            className={
              publishedProjects.length === 1
                ? "mx-auto mt-12 max-w-2xl"
                : "mt-12 grid gap-6 lg:grid-cols-2 xl:grid-cols-3"
            }
          >
            {publishedProjects.map((project) => (
              <ProjectCard key={project.slug} project={project} />
            ))}
          </div>
        </Container>
      </Section>

      <Section className="relative overflow-hidden border-y border-border bg-slate-50/60">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[0.72fr_1.28fr] lg:items-start lg:gap-20">
            <div className="lg:sticky lg:top-28">
              <span className="flex size-12 items-center justify-center rounded-xl border border-brand-blue/10 bg-brand-blue/[0.07] text-brand-blue">
                <Search aria-hidden="true" className="size-5" />
              </span>

              <SectionHeader
                eyebrow="Our Approach"
                title="More than a new homepage."
                description="These projects start with the limits of the current website, then rebuild the infrastructure for search, content, leads, and continued development."
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
                  <p className="mt-3 leading-7 text-muted">{step.description}</p>
                </Card>
              ))}
            </div>
          </div>
        </Container>
      </Section>

      <CTASection
        title="Outgrown your current website?"
        description="We can evaluate the site you have now, identify technical, SEO, and conversion limits, and plan a migration that keeps the search equity already earned."
        primaryLabel="Run My Free Website Audit"
        primaryHref="/website-audit"
        secondaryLabel="Talk About My Website"
        secondaryHref="/contact"
      />
    </>
  );
}
