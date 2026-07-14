import {
    Gauge,
    LayoutTemplate,
    Search,
    ShieldCheck,
    Smartphone,
    TrendingUp,
  } from "lucide-react";
  
  import { FeatureCard } from "@/components/marketing";
  import {
    Container,
    Section,
    SectionHeader,
  } from "@/components/ui";
  
  const websiteBenefits = [
    {
      title: "High Performance",
      description:
        "Fast-loading pages built with Core Web Vitals, efficient rendering, and user experience in mind.",
      icon: Gauge,
    },
    {
      title: "Conversion-Focused UX",
      description:
        "Clear navigation, strong calls to action, and intentional layouts that guide visitors toward contacting your business.",
      icon: TrendingUp,
    },
    {
      title: "Technical SEO",
      description:
        "Semantic HTML, metadata, structured content, internal linking, and search-friendly architecture built in from the start.",
      icon: Search,
    },
    {
      title: "Mobile-First Design",
      description:
        "Responsive experiences designed for phones first, where many local customers begin their search.",
      icon: Smartphone,
    },
    {
      title: "Scalable Architecture",
      description:
        "Reusable components and clean application structure make it easier to add new pages, integrations, and features later.",
      icon: LayoutTemplate,
    },
    {
      title: "Accessible and Secure",
      description:
        "Modern accessibility practices, secure integrations, validation, and dependable production architecture.",
      icon: ShieldCheck,
    },
  ] as const;
  
  export function WebsiteBenefitsSection() {
    return (
      <Section className="bg-background">
        <Container>
          <SectionHeader
            eyebrow="Built for Performance"
            title="More than a good-looking website."
            description="Every JS Solutions website is engineered around speed, search visibility, accessibility, conversion, and long-term scalability."
            align="center"
          />
  
          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {websiteBenefits.map((benefit) => (
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