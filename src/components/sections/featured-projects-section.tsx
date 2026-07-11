import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { ProjectCard } from "@/components/marketing";
import { Button } from "@/components/ui/button";
import {
  Container,
  Section,
  SectionHeader,
} from "@/components/ui";

const projects = [
  {
    title: "Tha Shop",
    category: "Automotive",
    description:
      "A growth-focused digital presence designed to improve local visibility, communicate services clearly, and generate more customer inquiries.",
    href: "/projects/tha-shop",
    results: [
      "Local SEO",
      "Content Strategy",
      "Lead Generation",
    ],
  },
  {
    title: "Local Service Growth Platform",
    category: "Web Development",
    description:
      "A high-performance website architecture built around clear service pages, conversion-focused content, and scalable local SEO.",
    href: "/projects/local-service-platform",
    results: [
      "Next.js",
      "Core Web Vitals",
      "Conversion UX",
    ],
  },
  {
    title: "AI Business Automation",
    category: "AI & Automation",
    description:
      "A practical automation system designed to reduce repetitive work, improve customer follow-up, and create more consistent business processes.",
    href: "/projects/ai-business-automation",
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
            description="A selection of websites, marketing systems, and automation solutions designed to help local businesses perform better online."
          />

          <Button
            variant="outline"
            className="w-fit shrink-0"
            nativeButton={false}
            render={<Link href="/projects" />}
          >
            View All Projects
            <ArrowRight
              aria-hidden="true"
              className="ml-2 size-4"
            />
          </Button>
        </div>

        <div className="mt-14 grid gap-8 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard
              key={project.title}
              title={project.title}
              category={project.category}
              description={project.description}
              href={project.href}
              results={project.results}
            />
          ))}
        </div>
      </Container>
    </Section>
  );
}