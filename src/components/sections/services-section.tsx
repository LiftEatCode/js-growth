import {
  BarChart3,
  Bot,
  Globe,
  MapPin,
  Megaphone,
  Workflow,
} from "lucide-react";

import { FeatureCard } from "@/components/marketing";
import { Container, Section, SectionHeader } from "@/components/ui";

const featuredServices = [
  {
    title: "Custom Website Development",
    description:
      "Fast, modern websites designed to build trust, improve visibility, and turn visitors into qualified leads.",
    icon: Globe,
    href: "/websites",
  },
  {
    title: "Local SEO",
    description:
      "Improve local rankings and help nearby customers discover your business when they are ready to buy.",
    icon: MapPin,
    href: "/local-seo",
  },
  {
    title: "AI Integration & Automation",
    description:
      "Use practical AI and connected workflows to improve follow-up, reduce manual work, and scale operations.",
    icon: Bot,
    href: "/ai-automation",
  },
] as const;

const supportingServices = [
  {
    title: "Business Automation",
    description:
      "Replace repetitive tasks and disconnected processes with dependable software workflows.",
    icon: Workflow,
  },
  {
    title: "Content Marketing",
    description:
      "Build authority and organic visibility with useful, search-focused content.",
    icon: Megaphone,
  },
  {
    title: "Analytics & Reporting",
    description:
      "Understand traffic, rankings, leads, campaigns, and the systems driving growth.",
    icon: BarChart3,
  },
] as const;

export function ServicesSection() {
  return (
    <Section>
      <Container>
        <SectionHeader
          eyebrow="Core Services"
          title="Start with the solution your business needs most."
          description="Each service can create value independently, but the strongest results come when your website, visibility, automation, and data work together."
          align="center"
          className="mx-auto max-w-3xl"
        />

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {featuredServices.map((service) => (
            <FeatureCard key={service.title} {...service} />
          ))}
        </div>

        <div className="mt-16 border-t pt-12">
          <SectionHeader
            eyebrow="Supporting Services"
            title="Strengthen the rest of your growth system."
            description="Add the capabilities needed to improve operations, build authority, and measure performance."
          />

          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {supportingServices.map((service) => (
              <FeatureCard
                key={service.title}
                {...service}
                className="shadow-none"
              />
            ))}
          </div>
        </div>
      </Container>
    </Section>
  );
}