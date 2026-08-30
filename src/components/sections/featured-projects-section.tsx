import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { ProjectCard } from "@/components/projects/project-card";
import {
  Button,
  Container,
  Section,
  SectionHeader,
} from "@/components/ui";
import { getFeaturedProjects } from "@/content/projects";

export function FeaturedProjectsSection() {
  const featuredProjects = getFeaturedProjects();

  if (featuredProjects.length === 0) {
    return null;
  }

  const isSingle = featuredProjects.length === 1;

  return (
    <Section className="bg-white">
      <Container>
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeader
            eyebrow="Recent Work"
            title="Built for real businesses."
            description="Client websites rebuilt as platforms for search, leads, content, and continued growth — not one-time brochure launches."
          />

          <Button
            variant="outline"
            size="lg"
            className="w-fit shrink-0"
            nativeButton={false}
            render={<Link href="/projects" />}
          >
            View All Work
            <ArrowRight aria-hidden="true" className="ml-1 size-4" />
          </Button>
        </div>

        <div
          className={
            isSingle
              ? "mx-auto mt-14 max-w-3xl"
              : "mt-14 grid gap-6 lg:grid-cols-3"
          }
        >
          {featuredProjects.map((project) => (
            <ProjectCard
              key={project.slug}
              project={project}
              variant="featured"
            />
          ))}
        </div>
      </Container>
    </Section>
  );
}
