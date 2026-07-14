import {
    BarChart3,
    CheckCircle2,
    Code2,
    Compass,
    Layers3,
    Palette,
    Rocket,
  } from "lucide-react";
  
  import {
    Container,
    Section,
    SectionHeader,
  } from "@/components/ui";
  
  const websiteProcess = [
    {
      number: "01",
      title: "Discovery",
      description:
        "We learn about your business, services, customers, competitors, current website, and the goals the new website needs to support.",
      icon: Compass,
    },
    {
      number: "02",
      title: "Strategy & Architecture",
      description:
        "We plan the page structure, customer journeys, calls to action, SEO targets, content hierarchy, and technical requirements.",
      icon: Layers3,
    },
    {
      number: "03",
      title: "UX & Visual Design",
      description:
        "We create a mobile-first interface with clear navigation, strong messaging, intentional spacing, and a premium visual system.",
      icon: Palette,
    },
    {
      number: "04",
      title: "Development",
      description:
        "We build the website with reusable components, clean TypeScript, semantic HTML, scalable architecture, and performance in mind.",
      icon: Code2,
    },
    {
      number: "05",
      title: "Testing & Quality Assurance",
      description:
        "We test responsive behavior, accessibility, forms, links, SEO metadata, browser compatibility, performance, and user flows.",
      icon: CheckCircle2,
    },
    {
      number: "06",
      title: "Launch",
      description:
        "We configure production deployment, domains, analytics, Search Console, redirects, forms, and final launch checks.",
      icon: Rocket,
    },
    {
      number: "07",
      title: "Optimize & Grow",
      description:
        "After launch, we use analytics, search data, user behavior, and business feedback to identify ongoing improvements.",
      icon: BarChart3,
    },
  ] as const;
  
  export function WebsiteProcessSection() {
    return (
      <Section className="relative overflow-hidden bg-brand text-white">
        <div
          aria-hidden="true"
          className="absolute right-0 top-0 size-[30rem] -translate-y-1/3 translate-x-1/3 rounded-full bg-brand-blue/20 blur-3xl"
        />
  
        <div
          aria-hidden="true"
          className="absolute bottom-0 left-0 size-96 -translate-x-1/3 translate-y-1/3 rounded-full bg-brand-cyan/10 blur-3xl"
        />
  
        <Container className="relative">
          <SectionHeader
            eyebrow="Website Development Process"
            title="A structured process from strategy to launch."
            description="Every website project follows a clear development process designed to reduce uncertainty, maintain quality, and build the right solution for your business."
            align="center"
            className="[&_h2]:text-white [&_p:last-child]:text-slate-300"
          />
  
          <ol className="relative mx-auto mt-16 max-w-5xl">
            <div
              aria-hidden="true"
              className="absolute bottom-0 left-6 top-0 hidden w-px bg-gradient-to-b from-brand-blue via-brand-cyan to-transparent md:block"
            />
  
            <div className="space-y-6">
              {websiteProcess.map((step, index) => {
                const Icon = step.icon;
                const isEven = index % 2 === 1;
  
                return (
                  <li
                    key={step.number}
                    className="relative md:pl-20"
                  >
                    <div className="absolute left-0 top-7 z-10 hidden size-12 items-center justify-center rounded-2xl border border-white/10 bg-slate-950 text-cyan-300 shadow-xl md:flex">
                      <Icon aria-hidden="true" className="size-5" />
                    </div>
  
                    <article
                      className={[
                        "rounded-2xl border border-white/10 bg-white/[0.05] p-6 shadow-xl backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:bg-white/[0.08]",
                        isEven ? "md:ml-12" : "md:mr-12",
                      ].join(" ")}
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] text-cyan-300 md:hidden">
                          <Icon aria-hidden="true" className="size-5" />
                        </div>
  
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="font-heading text-sm font-semibold text-cyan-300">
                              {step.number}
                            </span>
  
                            <h3 className="font-heading text-xl font-semibold text-white">
                              {step.title}
                            </h3>
                          </div>
  
                          <p className="mt-3 leading-7 text-slate-300">
                            {step.description}
                          </p>
                        </div>
                      </div>
                    </article>
                  </li>
                );
              })}
            </div>
          </ol>
        </Container>
      </Section>
    );
  }