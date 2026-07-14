import {
    BarChart3,
    MapPin,
    MessageSquareText,
    Search,
    Star,
    Users,
  } from "lucide-react";
  
  import { FeatureCard } from "@/components/marketing";
  import {
    Container,
    Section,
    SectionHeader,
  } from "@/components/ui";
  
  const localSeoBenefits = [
    {
      title: "Higher Local Visibility",
      description:
        "Improve your visibility when nearby customers search for the services your business provides.",
      icon: Search,
    },
    {
      title: "Google Maps Presence",
      description:
        "Strengthen your business presence across Google Maps and location-based search results.",
      icon: MapPin,
    },
    {
      title: "More Qualified Leads",
      description:
        "Reach customers who are actively searching for your services in the areas you serve.",
      icon: Users,
    },
    {
      title: "Stronger Reputation",
      description:
        "Build trust through accurate business information, customer reviews, and consistent local signals.",
      icon: Star,
    },
    {
      title: "Clearer Customer Communication",
      description:
        "Make it easier for customers to understand your services, locations, hours, and contact options.",
      icon: MessageSquareText,
    },
    {
      title: "Measurable Performance",
      description:
        "Track rankings, website traffic, calls, form submissions, and local search improvements.",
      icon: BarChart3,
    },
  ] as const;
  
  export function LocalSEOBenefitsSection() {
    return (
      <Section className="bg-background">
        <Container>
          <SectionHeader
            eyebrow="Local Search Visibility"
            title="Help nearby customers find and choose your business."
            description="Local SEO strengthens the connection between your website, Google Business Profile, service areas, customer reviews, and the searches people make near you."
            align="center"
          />
  
          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {localSeoBenefits.map((benefit) => (
              <FeatureCard
                key={benefit.title}
                title={benefit.title}
                description={benefit.description}
                icon={benefit.icon}
              />
            ))}
          </div>
        </Container>
      </Section>
    );
  }