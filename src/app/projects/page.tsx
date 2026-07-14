import type { Metadata } from "next";

import { PageHero, ProjectCard } from "@/components/marketing";
import { Container, Section, SectionHeader } from "@/components/ui";

export const metadata: Metadata = {
  title: "Projects",
  description:
    "Explore websites, Local SEO strategies, automation systems, and digital growth projects created by JS Solutions.",
};

const projects = [
  {
    title: "Tha Shop",
    category: "Automotive",
    description:
      "A connected digital growth strategy combining website development, Local SEO, social media, content, and lead generation.",
    href: "/projects/tha-shop",
    results: [
      "Website Development",
      "Local SEO",
      "Social Media",
      "Lead Generation",
    ],
  },
  {
    title: "Local Service Growth Platform",
    category: "Web Development",
    description:
      "A scalable website architecture built around high performance, clear service pages, conversion-focused UX, and local search visibility.",
    href: "/projects/local-service-platform",
    results: ["Next.js", "Core Web Vitals", "Technical SEO"],
  },
  {
    title: "AI Business Automation",
    category: "AI & Automation",
    description:
      "A practical automation system designed to improve follow-up, reduce repetitive work, and create more dependable business workflows.",
    href: "/projects/ai-business-automation",
    results: ["AI Integration", "Automation", "Workflow Design"],
  },
] as const;

export default function ProjectsPage() {
  return (
    <>
      <PageHero
        eyebrow="Featured Work"
        title="Websites and systems built for real businesses."
        description="Explore how JS Solutions combines software engineering, Local SEO, automation, AI, and digital strategy to solve practical business challenges."
      />
 
      <Section>
        <Container>
          <SectionHeader
            eyebrow="Projects"
            title="Technology designed around measurable business goals."
            description="Each project starts with the business challenge and uses the right combination of design, software, SEO, automation, and marketing to solve it."
          />

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
    </>
  );
}