import {
    BarChart3,
    ClipboardList,
    FileText,
    Link2,
    MapPinCheck,
    Search,
    Star,
    Wrench,
  } from "lucide-react";
  
  import {
    Container,
    Section,
    SectionHeader,
  } from "@/components/ui";
  
  const localSeoProcess = [
    {
      number: "01",
      title: "Local SEO Audit",
      description:
        "We review your website, Google Business Profile, local rankings, citations, reviews, competitors, and technical issues that may be limiting visibility.",
      icon: ClipboardList,
    },
    {
      number: "02",
      title: "Keyword & Competitor Research",
      description:
        "We identify how local customers search for your services, which locations matter most, and where competitors are currently outperforming you.",
      icon: Search,
    },
    {
      number: "03",
      title: "Website Optimization",
      description:
        "We improve page structure, service content, location relevance, metadata, internal linking, technical SEO, and conversion paths.",
      icon: Wrench,
    },
    {
      number: "04",
      title: "Google Business Profile Optimization",
      description:
        "We strengthen categories, services, business details, photos, posts, customer actions, and other important profile elements.",
      icon: MapPinCheck,
    },
    {
      number: "05",
      title: "Citations & Local Signals",
      description:
        "We improve consistency across directories, business listings, industry platforms, and other trusted local sources.",
      icon: Link2,
    },
    {
      number: "06",
      title: "Review Strategy",
      description:
        "We help create a dependable process for requesting reviews, responding professionally, and building stronger customer trust.",
      icon: Star,
    },
    {
      number: "07",
      title: "Local Content",
      description:
        "We create and improve service pages, location content, FAQs, blog articles, and supporting information around real customer searches.",
      icon: FileText,
    },
    {
      number: "08",
      title: "Reporting & Optimization",
      description:
        "We track rankings, traffic, calls, leads, profile actions, and search visibility, then use that data to guide ongoing improvements.",
      icon: BarChart3,
    },
  ] as const;
  
  export function LocalSEOProcessSection() {
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
            eyebrow="Our Local SEO Process"
            title="A structured approach to stronger local visibility."
            description="Local SEO works best when your website, Google Business Profile, reputation, content, and local signals all support the same strategy."
            align="center"
            className="[&_h2]:text-white [&_p:last-child]:text-slate-300"
          />
  
          <ol className="relative mx-auto mt-16 max-w-5xl">
            <div
              aria-hidden="true"
              className="absolute bottom-0 left-6 top-0 hidden w-px bg-gradient-to-b from-brand-blue via-brand-cyan to-transparent md:block"
            />
  
            <div className="space-y-6">
              {localSeoProcess.map((step, index) => {
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
  