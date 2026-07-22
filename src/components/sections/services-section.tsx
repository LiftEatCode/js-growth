import Link from "next/link";
import {
  Bot,
  Globe,
  LineChart,
  MapPin,
  Megaphone,
  Workflow,
} from "lucide-react";

import { FeatureCard } from "@/components/marketing";
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
    href: "/websites",
  },
  {
    title: "Local SEO",
    description:
      "Improve local rankings and get discovered by customers in your service area.",
    icon: MapPin,
    href: "/local-seo",
  },
  {
    title: "AI Integration & Automation",
    description:
      "Add practical AI tools that improve follow-up, save time, connect systems, and automate repetitive work.",
    icon: Bot,
    href: "/ai-automation",
  },
  {
    title: "Business Automation",
    description:
      "Replace repetitive manual tasks with dependable software workflows.",
    icon: Workflow,
    href: "/ai-automation",
  },
  {
    title: "Content Marketing",
    description:
      "Publish useful content that builds authority, trust, and organic traffic.",
    icon: Megaphone,
    href: "/services",
  },
  {
    title: "Analytics & Reporting",
    description:
      "Understand traffic, leads, rankings, campaigns, and what drives growth.",
    icon: LineChart,
    href: "/services",
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
        {services.map((service) => (
          <Link
            key={service.title}
            href={service.href}
            className="block h-full rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
          >
            <FeatureCard
              title={service.title}
              description={service.description}
              icon={service.icon}
              className="h-full"
            />
          </Link>
        ))}
        </div>
      </Container>
    </Section>
  );
}