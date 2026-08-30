import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  ArrowUpRight,
  BriefcaseBusiness,
  CheckCircle2,
  FileSearch,
  Globe,
  MapPin,
  Search,
  Workflow,
  Wrench,
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
import type { ProjectCaseStudy } from "@/content/projects";

type CaseStudyViewProps = {
  project: ProjectCaseStudy;
};

const relatedServiceIcons: Record<
  string,
  typeof Globe
> = {
  "/websites": Globe,
  "/seo": Search,
  "/local-seo": MapPin,
  "/website-audit": FileSearch,
  "/growth-system": Workflow,
};

export function CaseStudyView({ project }: CaseStudyViewProps) {
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
            <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-sm font-medium text-cyan-200 backdrop-blur-xl">
              <Wrench aria-hidden="true" className="size-4" />
              {project.hero.eyebrow}
            </p>

            <h1 className="mt-6 font-heading text-4xl font-bold leading-tight tracking-[-0.05em] text-white sm:text-5xl lg:text-6xl">
              {project.hero.title}
            </h1>

            <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-slate-300 sm:text-xl">
              {project.hero.description}
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              {project.liveUrl ? (
                <Button
                  size="xl"
                  nativeButton={false}
                  render={
                    <a
                      href={project.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    />
                  }
                >
                  {project.liveUrlLabel ?? "Visit live site"}
                  <ArrowUpRight aria-hidden="true" className="ml-1 size-4" />
                </Button>
              ) : null}

              <Button
                size="xl"
                variant="outline"
                nativeButton={false}
                render={<Link href="/projects" />}
                className="border-white/15 bg-white/[0.04] text-white hover:border-white/25 hover:bg-white/[0.08] hover:text-white"
              >
                All client work
              </Button>
            </div>
          </div>
        </Container>
      </section>

      <Section>
        <Container>
          <div className="grid gap-6 md:grid-cols-3">
            <Card variant="elevated" padding="lg">
              <div className="flex size-11 items-center justify-center rounded-xl border border-brand-blue/10 bg-brand-blue/[0.07] text-brand-blue">
                <BriefcaseBusiness className="size-5" aria-hidden="true" />
              </div>
              <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                Client
              </p>
              <p className="mt-2 font-heading text-lg font-semibold text-brand">
                {project.overview.client}
              </p>
            </Card>

            <Card variant="elevated" padding="lg">
              <div className="flex size-11 items-center justify-center rounded-xl border border-brand-blue/10 bg-brand-blue/[0.07] text-brand-blue">
                <Wrench className="size-5" aria-hidden="true" />
              </div>
              <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                Industry
              </p>
              <p className="mt-2 font-heading text-lg font-semibold text-brand">
                {project.overview.industry}
              </p>
            </Card>

            <Card variant="elevated" padding="lg">
              <div className="flex size-11 items-center justify-center rounded-xl border border-brand-blue/10 bg-brand-blue/[0.07] text-brand-blue">
                <MapPin className="size-5" aria-hidden="true" />
              </div>
              <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                Location
              </p>
              <p className="mt-2 font-heading text-lg font-semibold text-brand">
                {project.overview.location}
              </p>
            </Card>
          </div>

          <Card variant="brand" padding="lg" className="mt-8">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-blue">
              Project type
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              {project.overview.projectTypes.map((type) => (
                <span
                  key={type}
                  className="rounded-full border border-brand-blue/10 bg-white px-4 py-2 text-sm font-medium text-brand"
                >
                  {type}
                </span>
              ))}
            </div>
          </Card>
        </Container>
      </Section>

      {project.image ? (
        <Section spacing="sm">
          <Container>
            <figure className="overflow-hidden rounded-2xl border border-border bg-white shadow-card">
              <Image
                src={project.image.src}
                alt={project.image.alt}
                width={project.image.width}
                height={project.image.height}
                className="h-auto w-full"
                sizes="(min-width: 1280px) 80rem, 100vw"
                priority
              />
            </figure>
          </Container>
        </Section>
      ) : null}

      <Section className="border-y border-border bg-slate-50/60">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-start lg:gap-20">
            <div>
              <SectionHeader
                eyebrow={project.challenge.eyebrow}
                title={project.challenge.title}
              />
              <div className="prose-case-study mt-6 max-w-xl space-y-5 text-base leading-8 text-muted sm:text-lg [&_a]:font-semibold [&_a]:text-brand-blue [&_a]:underline [&_a]:underline-offset-4 [&_p]:leading-8">
                {project.challenge.description}
              </div>
            </div>

            <Card variant="elevated" padding="lg">
              <div className="space-y-5">
                {project.challenge.points.map((point) => (
                  <div key={point} className="flex items-start gap-3">
                    <CheckCircle2
                      className="mt-0.5 size-5 shrink-0 text-brand-blue"
                      aria-hidden="true"
                    />
                    <p className="leading-7 text-muted">{point}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <SectionHeader
            eyebrow={project.solution.eyebrow}
            title={project.solution.title}
            align="center"
            className="mx-auto max-w-3xl"
          />
          <div className="prose-case-study mx-auto mt-6 max-w-3xl space-y-5 text-center text-base leading-8 text-muted sm:text-lg [&_a]:font-semibold [&_a]:text-brand-blue [&_a]:underline [&_a]:underline-offset-4 [&_p]:leading-8">
            {project.solution.description}
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {project.solution.items.map((item, index) => (
              <Card
                key={item.title}
                variant="elevated"
                padding="lg"
                interactive
              >
                <span className="text-sm font-semibold text-brand-blue">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-4 font-heading text-xl font-semibold tracking-tight text-brand">
                  {item.title}
                </h3>
                <div className="mt-3 space-y-3 leading-7 text-muted [&_a]:font-semibold [&_a]:text-brand-blue [&_a]:underline [&_a]:underline-offset-4">
                  {item.description}
                </div>
              </Card>
            ))}
          </div>
        </Container>
      </Section>

      <Section className="border-y border-border bg-slate-50/60">
        <Container>
          <SectionHeader
            eyebrow="Before / After"
            title="What changed in the website foundation."
            description="A concise look at the older website setup versus the platform in place now."
            align="center"
            className="mx-auto max-w-3xl"
          />

          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            <Card variant="elevated" padding="lg">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                {project.beforeAfter.beforeTitle}
              </p>
              <ul className="mt-6 space-y-4">
                {project.beforeAfter.before.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span
                      aria-hidden="true"
                      className="mt-2 size-1.5 shrink-0 rounded-full bg-slate-300"
                    />
                    <span className="leading-7 text-muted">{item}</span>
                  </li>
                ))}
              </ul>
            </Card>

            <Card variant="brand" padding="lg">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-blue">
                {project.beforeAfter.afterTitle}
              </p>
              <ul className="mt-6 space-y-4">
                {project.beforeAfter.after.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle2
                      className="mt-0.5 size-5 shrink-0 text-brand-blue"
                      aria-hidden="true"
                    />
                    <span className="leading-7 text-brand">{item}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </Container>
      </Section>

      {project.sections.map((section, index) => (
        <Section
          key={section.id}
          className={
            index % 2 === 0 ? undefined : "border-y border-border bg-slate-50/60"
          }
        >
          <Container>
            <div
              className={
                section.points || section.items
                  ? "grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-start lg:gap-20"
                  : "mx-auto max-w-3xl"
              }
            >
              <div>
                <SectionHeader
                  eyebrow={section.eyebrow}
                  title={section.title}
                />
                <div className="mt-6 max-w-xl space-y-5 text-base leading-8 text-muted sm:text-lg [&_a]:font-semibold [&_a]:text-brand-blue [&_a]:underline [&_a]:underline-offset-4 [&_p]:leading-8">
                  {section.description}
                </div>
              </div>

              {section.points ? (
                <Card variant="elevated" padding="lg">
                  <div className="space-y-5">
                    {section.points.map((point) => (
                      <div key={point} className="flex items-start gap-3">
                        <CheckCircle2
                          className="mt-0.5 size-5 shrink-0 text-brand-blue"
                          aria-hidden="true"
                        />
                        <p className="leading-7 text-muted">{point}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              ) : null}

              {section.items ? (
                <div className="grid gap-5">
                  {section.items.map((item) => (
                    <Card key={item.title} variant="elevated" padding="lg">
                      <h3 className="font-heading text-lg font-semibold text-brand">
                        {item.title}
                      </h3>
                      <div className="mt-3 leading-7 text-muted [&_a]:font-semibold [&_a]:text-brand-blue [&_a]:underline [&_a]:underline-offset-4">
                        {item.description}
                      </div>
                    </Card>
                  ))}
                </div>
              ) : null}
            </div>
          </Container>
        </Section>
      ))}

      <Section>
        <Container>
          <SectionHeader
            eyebrow="Technology"
            title="Tools chosen for the business outcome."
            description="These are the platforms behind the site. They matter because they make the website easier to host, improve, and expand."
            align="center"
            className="mx-auto max-w-3xl"
          />

          <div className="mt-12 flex flex-wrap justify-center gap-3">
            {project.technologies.map((tech) => (
              <span
                key={tech.name}
                className="rounded-full border border-brand-blue/10 bg-brand-blue/[0.045] px-4 py-2 text-sm font-medium text-brand-blue"
              >
                {tech.name}
              </span>
            ))}
          </div>

          <div className="mx-auto mt-10 grid max-w-4xl gap-4 sm:grid-cols-2">
            {project.technologies.map((tech) => (
              <div
                key={`${tech.name}-outcome`}
                className="rounded-xl border border-border bg-white px-5 py-4"
              >
                <p className="font-heading text-sm font-semibold text-brand">
                  {tech.name}
                </p>
                <p className="mt-1 text-sm leading-6 text-muted">
                  {tech.outcome}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      <Section className="relative overflow-hidden bg-brand text-white">
        <GridPattern className="opacity-35" />

        <Container className="relative">
          <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-start lg:gap-16">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300">
                {project.nextSteps.eyebrow}
              </p>
              <h2 className="mt-4 font-heading text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                {project.nextSteps.title}
              </h2>
              <div className="mt-5 max-w-xl space-y-5 leading-7 text-slate-300 [&_a]:font-semibold [&_a]:text-cyan-300 [&_a]:underline [&_a]:underline-offset-4">
                {project.nextSteps.description}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {project.nextSteps.points.map((point) => (
                <div
                  key={point}
                  className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.06] p-4"
                >
                  <CheckCircle2
                    className="mt-0.5 size-5 shrink-0 text-cyan-300"
                    aria-hidden="true"
                  />
                  <span className="text-sm font-medium leading-6 text-slate-200">
                    {point}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </Section>

      <Section className="border-y border-border bg-slate-50/60">
        <Container>
          <SectionHeader
            eyebrow="Related JS Growth work"
            title="The same building blocks we use for other local businesses."
            description="This case study is one example. These pages explain the services behind the work."
            align="center"
            className="mx-auto max-w-3xl"
          />

          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {project.relatedServices.map((service) => (
              <FeatureCard
                key={service.href}
                title={service.title}
                description={service.description}
                href={service.href}
                linkLabel="Learn more"
                icon={relatedServiceIcons[service.href] ?? ArrowRight}
              />
            ))}
          </div>
        </Container>
      </Section>

      <CTASection
        title={project.cta.title}
        description={project.cta.description}
        primaryLabel={project.cta.primaryLabel}
        primaryHref={project.cta.primaryHref}
        secondaryLabel={project.cta.secondaryLabel}
        secondaryHref={project.cta.secondaryHref}
      />
    </>
  );
}
