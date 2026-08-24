import {
  BarChart3,
  Bot,
  Globe2,
  MapPin,
  Megaphone,
  Search,
  Workflow,
} from "lucide-react";

import {
  Container,
  FeatureCard,
  Section,
  SectionHeader,
} from "@/components/ui";

const featuredServices = [
  {
    title:
      "Website Development",

    description:
      "Fast, modern websites designed to build trust, improve visibility, and turn visitors into qualified leads.",

    icon:
      Globe2,

    href:
      "/websites",

    eyebrow:
      "Web",

    tone:
      "default" as const,
  },

  {
    title:
      "Local SEO",

    description:
      "Improve local rankings and help nearby customers discover your business when they are ready to buy.",

    icon:
      MapPin,

    href:
      "/local-seo",

    eyebrow:
      "Search",

    tone:
      "brand" as const,
  },

  {
    title:
      "SEO",

    description:
      "Strengthen search foundations, service clarity, and measurement — without ranking guarantees.",

    icon:
      Search,

    href:
      "/seo",

    eyebrow:
      "Search",

    tone:
      "default" as const,
  },

  {
    title:
      "AI Integration & Automation",

    description:
      "Use practical AI and connected workflows to improve follow-up, reduce manual work, and scale operations.",

    icon:
      Bot,

    href:
      "/ai-automation",

    eyebrow:
      "AI",

    tone:
      "dark" as const,
  },
] as const;

const supportingServices = [
  {
    title:
      "Business Automation",

    description:
      "Replace repetitive tasks and disconnected processes with dependable software workflows.",

    icon:
      Workflow,

    eyebrow:
      "Operations",
  },

  {
    title:
      "Content Marketing",

    description:
      "Build authority and organic visibility with useful, search-focused content.",

    icon:
      Megaphone,

    eyebrow:
      "Marketing",
  },

  {
    title:
      "Analytics & Reporting",

    description:
      "Understand traffic, rankings, leads, campaigns, and the systems driving growth.",

    icon:
      BarChart3,

    eyebrow:
      "Data",
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

        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {featuredServices.map(
            (service) => (
              <FeatureCard
                key={
                  service.title
                }
                title={
                  service.title
                }
                description={
                  service.description
                }
                icon={
                  service.icon
                }
                href={
                  service.href
                }
                linkLabel="Explore service"
                eyebrow={
                  service.eyebrow
                }
                tone={
                  service.tone
                }
              />
            ),
          )}
        </div>

        <div className="mt-16 border-t border-border pt-12">
          <SectionHeader
            eyebrow="Supporting Services"
            title="Strengthen the rest of your growth system."
            description="Add the capabilities needed to improve operations, build authority, and measure performance."
          />

          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {supportingServices.map(
              (service) => (
                <FeatureCard
                  key={
                    service.title
                  }
                  title={
                    service.title
                  }
                  description={
                    service.description
                  }
                  icon={
                    service.icon
                  }
                  eyebrow={
                    service.eyebrow
                  }
                  tone="default"
                />
              ),
            )}
          </div>
        </div>
      </Container>
    </Section>
  );
}