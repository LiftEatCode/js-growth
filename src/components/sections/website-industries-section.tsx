import {
    BriefcaseBusiness,
    Car,
    ChefHat,
    HeartPulse,
    Home,
    Store,
    Wrench,
  } from "lucide-react";
  
  import { FeatureCard } from "@/components/marketing";
  import {
    Container,
    Section,
    SectionHeader,
  } from "@/components/ui";
  
  const industries = [
    {
      title: "Automotive Shops",
      description:
        "Websites for repair shops, performance shops, fabrication businesses, motorcycle shops, detailers, and other automotive service companies.",
      icon: Car,
    },
    {
      title: "Contractors",
      description:
        "Lead-focused websites for HVAC, plumbing, electrical, roofing, remodeling, welding, landscaping, and other home-service businesses.",
      icon: Wrench,
    },
    {
      title: "Local Service Businesses",
      description:
        "Scalable websites for businesses that depend on local visibility, service-area pages, reviews, calls, and appointment requests.",
      icon: Home,
    },
    {
      title: "Restaurants",
      description:
        "Modern websites that clearly present menus, locations, hours, online ordering, reservations, events, and local search information.",
      icon: ChefHat,
    },
    {
      title: "Medical Offices",
      description:
        "Professional, accessible websites for clinics, dental offices, wellness practices, and healthcare providers that need trust and clarity.",
      icon: HeartPulse,
    },
    {
      title: "Professional Services",
      description:
        "High-quality websites for consultants, accountants, legal professionals, real estate businesses, and other expertise-driven companies.",
      icon: BriefcaseBusiness,
    },
    {
      title: "Retail and Local Brands",
      description:
        "Digital platforms for local retailers and growing brands that need stronger product presentation, visibility, and customer engagement.",
      icon: Store,
    },
  ] as const;
  
  export function WebsiteIndustriesSection() {
    return (
      <Section className="bg-background">
        <Container>
          <SectionHeader
            eyebrow="Who We Build For"
            title="Websites designed around how your business actually grows."
            description="Different industries need different customer journeys, content strategies, integrations, and calls to action. We design each website around the way your customers search, evaluate, and contact your business."
            align="center"
          />
  
          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {industries.map((industry) => (
              <FeatureCard
                key={industry.title}
                title={industry.title}
                description={industry.description}
                icon={industry.icon}
              />
            ))}
          </div>
  
          <div className="mt-8 rounded-2xl border border-border bg-white p-6 text-center shadow-card md:p-8">
            <p className="font-heading text-lg font-semibold text-brand">
              Don&apos;t see your industry listed?
            </p>
  
            <p className="mx-auto mt-3 max-w-2xl leading-7 text-muted">
              JS Solutions works with businesses that need stronger visibility,
              better lead generation, modern technology, and scalable digital
              systems. The right solution is designed around your goals rather
              than forced into a generic industry template.
            </p>
          </div>
        </Container>
      </Section>
    );
  }