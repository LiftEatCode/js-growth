import Link from "next/link";
import { ArrowRight, ArrowUpRight, Wrench } from "lucide-react";

import { ProjectLiveSiteLink } from "@/components/projects/project-live-site-link";
import { Button, Card } from "@/components/ui";
import type { ProjectCaseStudy } from "@/content/projects";
import { getProjectPath } from "@/content/projects";

type ProjectCardProps = {
  project: ProjectCaseStudy;
  variant?: "index" | "featured";
};

export function ProjectCard({
  project,
  variant = "index",
}: ProjectCardProps) {
  const href = getProjectPath(project.slug);
  const isFeatured = variant === "featured";

  return (
    <Card
      variant="elevated"
      padding="none"
      interactive
      className="group flex h-full flex-col overflow-hidden"
    >
      <div className="relative overflow-hidden border-b border-border bg-gradient-to-br from-slate-950 via-brand to-blue-950 px-7 py-8 text-white">
        <div
          aria-hidden="true"
          className="absolute -right-12 -top-14 size-40 rounded-full bg-brand-blue/25 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-20 -left-12 size-40 rounded-full bg-brand-cyan/10 blur-3xl"
        />

        <div className="relative">
          <div className="flex items-start justify-between gap-4">
            <span className="flex size-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.08] text-cyan-300 backdrop-blur-xl">
              <Wrench aria-hidden="true" className="size-5" />
            </span>
            <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-semibold text-slate-300">
              Case Study
            </span>
          </div>

          <p className="mt-8 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">
            {project.industry} • {project.location}
          </p>

          <h3
            className={
              isFeatured
                ? "mt-2 font-heading text-3xl font-semibold tracking-tight text-white sm:text-4xl"
                : "mt-2 font-heading text-2xl font-semibold tracking-tight text-white"
            }
          >
            {project.client}
          </h3>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-7">
        <p className="leading-7 text-muted">{project.cardSummary}</p>

        <div className="mt-6 flex flex-wrap gap-2">
          {project.projectTypes.slice(0, isFeatured ? 4 : 3).map((type) => (
            <span
              key={type}
              className="rounded-full border border-brand-blue/10 bg-brand-blue/[0.045] px-3 py-1.5 text-xs font-medium text-brand-blue"
            >
              {type}
            </span>
          ))}
        </div>

        <div className="mt-auto flex flex-col gap-3 pt-8 sm:flex-row">
          <Button
            variant={isFeatured ? "default" : "outline"}
            size="lg"
            className="w-full justify-between sm:flex-1"
            nativeButton={false}
            render={<Link href={href} />}
          >
            View Case Study
            <ArrowRight aria-hidden="true" className="size-4" />
          </Button>

          {project.liveUrl ? (
            <Button
              variant="outline"
              size="lg"
              className="w-full justify-between sm:w-auto"
              nativeButton={false}
              render={
                <ProjectLiveSiteLink
                  href={project.liveUrl}
                  project={project.liveSiteId}
                  surface="project-card"
                  aria-label={`Visit website for ${project.client} (opens in a new tab)`}
                />
              }
            >
              Visit Website
              <ArrowUpRight aria-hidden="true" className="size-4" />
            </Button>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
