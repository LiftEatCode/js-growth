import {
  Bot,
  Globe,
  LineChart,
  MapPin,
  Megaphone,
  Workflow,
} from "lucide-react";

import {
  Container,
  Section,
  SectionHeader,
} from "@/components/ui";

const services = [
  {
    title: "Custom Website Development",
    description:
      "Fast, modern websites built to turn visitors into qualified leads.",
    icon: Globe,
  },
  {
    title: "Local SEO",
    description:
      "Improve local rankings and get discovered by customers in your service area.",
    icon: MapPin,
  },
  {
    title: "AI Integration",
    description:
      "Add practical AI tools that improve follow-up, save time, and automate work.",
    icon: Bot,
  },
  {
    title: "Business Automation",
    description:
      "Replace repetitive manual tasks with dependable software workflows.",
    icon: Workflow,
  },
  {
    title: "Content Marketing",
    description:
      "Publish useful content that builds authority, trust, and organic traffic.",
    icon: Megaphone,
  },
  {
    title: "Analytics & Reporting",
    description:
      "Understand traffic, leads, rankings, campaigns, and what drives growth.",
    icon: LineChart,
  },
] as const;

export function ServicesSection() {
  return (
    <Section className="bg-background">
      <Container>
        <SectionHeader
          eyebrow="Services"
          title="Everything your local business needs to grow online."
          description="JS Solutions combines software engineering, SEO, AI, automation, and marketing strategy into one connected growth system."
        />

        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => {
            const Icon = service.icon;

            return (
              <article
                key={service.title}
                className="group rounded-2xl border border-border bg-card p-8 shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-soft"
              >
                <div className="mb-6 flex size-12 items-center justify-center rounded-xl bg-blue-50 text-brand-blue transition duration-300 group-hover:bg-brand-blue group-hover:text-white">
                  <Icon aria-hidden="true" className="size-6" />
                </div>

                <h3 className="font-heading text-xl font-semibold text-brand">
                  {service.title}
                </h3>

                <p className="mt-3 leading-7 text-muted">
                  {service.description}
                </p>
              </article>
            );
          })}
        </div>
      </Container>
    </Section>
  );
}