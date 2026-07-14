import {
    Accessibility,
    BarChart3,
    Braces,
    Cloud,
    Database,
    Gauge,
    LockKeyhole,
    PlugZap,
    Search,
    Workflow,
  } from "lucide-react";
  
  import {
    Container,
    Section,
    SectionHeader,
  } from "@/components/ui";
  
  const capabilities = [
    {
      title: "Modern Application Architecture",
      description:
        "Built with Next.js, TypeScript, reusable components, and a scalable structure that supports future features and integrations.",
      icon: Braces,
    },
    {
      title: "Performance Optimization",
      description:
        "Efficient rendering, optimized assets, image handling, caching strategies, and Core Web Vitals improvements are considered from the start.",
      icon: Gauge,
    },
    {
      title: "Technical SEO Foundation",
      description:
        "Metadata, semantic HTML, internal linking, structured data, crawlable content, and search-friendly routing are built into the application.",
      icon: Search,
    },
    {
      title: "Analytics and Reporting",
      description:
        "Support for Google Analytics, Search Console, Vercel Analytics, Microsoft Clarity, conversion tracking, and custom reporting.",
      icon: BarChart3,
    },
    {
      title: "API and CRM Integrations",
      description:
        "Connect forms, CRMs, scheduling platforms, email systems, databases, and third-party business tools through secure integrations.",
      icon: PlugZap,
    },
    {
      title: "Business Automation",
      description:
        "Automate lead routing, notifications, follow-up, reporting, and repetitive internal workflows around your existing processes.",
      icon: Workflow,
    },
    {
      title: "Secure Data Handling",
      description:
        "Server-side validation, secure environment variables, protected integrations, and careful handling of sensitive form and customer data.",
      icon: LockKeyhole,
    },
    {
      title: "Accessible Experiences",
      description:
        "Semantic structure, keyboard support, readable contrast, clear focus states, and accessibility-conscious components.",
      icon: Accessibility,
    },
    {
      title: "Cloud Deployment",
      description:
        "Production deployments through Vercel with preview environments, automated builds, monitoring, and dependable delivery workflows.",
      icon: Cloud,
    },
    {
      title: "Database Ready",
      description:
        "The architecture can expand to support customer portals, dashboards, secure accounts, reporting, CRM data, and application workflows.",
      icon: Database,
    },
  ] as const;
  
  export function WebsiteCapabilitiesSection() {
    return (
      <Section className="bg-white">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
            <SectionHeader
              eyebrow="Technical Capabilities"
              title="Built on a foundation that can grow with your business."
              description="Your website should not become a limitation when your business needs new pages, integrations, reporting, automation, or secure customer features."
            />
  
            <div className="grid gap-4 sm:grid-cols-2">
              {capabilities.map((capability) => {
                const Icon = capability.icon;
  
                return (
                  <article
                    key={capability.title}
                    className="group rounded-2xl border border-border bg-background p-6 transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:bg-white hover:shadow-card"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-brand-blue transition duration-300 group-hover:bg-brand-blue group-hover:text-white">
                        <Icon aria-hidden="true" className="size-5" />
                      </div>
  
                      <div>
                        <h3 className="font-heading text-lg font-semibold text-brand">
                          {capability.title}
                        </h3>
  
                        <p className="mt-2 text-sm leading-6 text-muted">
                          {capability.description}
                        </p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </Container>
      </Section>
    );
  }