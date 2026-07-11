import {
    BarChart3,
    Code2,
    Gauge,
    Search,
    ShieldCheck,
    Workflow,
  } from "lucide-react";
  
  import { FeatureCard, StatCard } from "@/components/marketing";
  import {
    Container,
    GridPattern,
    Section,
    SectionHeader,
  } from "@/components/ui";
  
  const advantages = [
    {
      title: "Software Engineering Expertise",
      description:
        "Your growth systems are designed and built by a Senior Software Engineer, not assembled from generic marketing templates.",
      icon: Code2,
    },
    {
      title: "Performance First",
      description:
        "Websites are engineered around speed, usability, accessibility, and strong Core Web Vitals from the beginning.",
      icon: Gauge,
    },
    {
      title: "SEO Built Into the Foundation",
      description:
        "Technical SEO, semantic structure, metadata, local relevance, and search visibility are considered during development.",
      icon: Search,
    },
    {
      title: "Automation That Saves Time",
      description:
        "We connect tools, remove repetitive work, and build dependable workflows that help your business operate more efficiently.",
      icon: Workflow,
    },
    {
      title: "Data-Driven Decisions",
      description:
        "Analytics and reporting help you understand where leads come from, what customers do, and where growth opportunities exist.",
      icon: BarChart3,
    },
    {
      title: "Built for Long-Term Growth",
      description:
        "Clean architecture and scalable technology make it easier to add portals, dashboards, integrations, and automation later.",
      icon: ShieldCheck,
    },
  ] as const;
  
  const principles = [
    {
      value: "Fast",
      label: "Performance focused",
      description:
        "Every page and component is designed with speed and user experience in mind.",
    },
    {
      value: "Local",
      label: "Built for real markets",
      description:
        "Strategies are shaped around the customers, services, and communities your business serves.",
    },
    {
      value: "Smart",
      label: "Software-driven growth",
      description:
        "Websites, SEO, AI, automation, and analytics work together as one system.",
    },
  ] as const;
  
  export function WhyChooseSection() {
    return (
      <Section className="relative overflow-hidden bg-brand text-white">
        <GridPattern className="opacity-60" />
  
        <div
          aria-hidden="true"
          className="absolute right-0 top-0 size-[32rem] -translate-y-1/3 translate-x-1/3 rounded-full bg-brand-blue/20 blur-3xl"
        />
  
        <div
          aria-hidden="true"
          className="absolute bottom-0 left-0 size-96 -translate-x-1/3 translate-y-1/3 rounded-full bg-brand-cyan/10 blur-3xl"
        />
  
        <Container className="relative">
          <SectionHeader
            eyebrow="Why JS Solutions"
            title="Growth strategy backed by real software engineering."
            description="Most agencies focus on campaigns alone. JS Solutions combines marketing strategy with the technical expertise needed to build faster, smarter, and more scalable growth systems."
            className="[&_h2]:text-white [&_p:last-child]:text-slate-300"
          />
  
          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {advantages.map((advantage) => (
              <FeatureCard
                key={advantage.title}
                title={advantage.title}
                description={advantage.description}
                icon={advantage.icon}
                className="border-white/10 bg-white/5 shadow-none backdrop-blur-xl [&_h3]:text-white [&_p]:text-slate-300 [&>div]:bg-white/10 [&>div]:text-cyan-300"
              />
            ))}
          </div>
  
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {principles.map((principle) => (
              <StatCard
                key={principle.value}
                value={principle.value}
                label={principle.label}
                description={principle.description}
                className="border-white/10 bg-white/5 shadow-none backdrop-blur-xl [&_h3]:text-white [&_p:last-child]:text-slate-300"
              />
            ))}
          </div>
        </Container>
      </Section>
    );
  }