import {
    BarChart3,
    Code2,
    Lightbulb,
    Rocket,
    SearchCheck,
  } from "lucide-react";
  
  import {
    Container,
    Section,
    SectionHeader,
  } from "@/components/ui";
  
  const processSteps = [
    {
      number: "01",
      title: "Discovery",
      description:
        "We learn how your business operates, who your customers are, where leads come from, and what is currently limiting growth.",
      icon: SearchCheck,
    },
    {
      number: "02",
      title: "Strategy",
      description:
        "We define the right mix of website improvements, Local SEO, content, automation, and analytics for your goals.",
      icon: Lightbulb,
    },
    {
      number: "03",
      title: "Build",
      description:
        "We design and engineer the website, integrations, workflows, and marketing systems using scalable production-quality technology.",
      icon: Code2,
    },
    {
      number: "04",
      title: "Launch",
      description:
        "We test performance, accessibility, SEO, analytics, forms, and user experience before releasing the solution.",
      icon: Rocket,
    },
    {
      number: "05",
      title: "Optimize",
      description:
        "We review real data, improve what is working, identify new opportunities, and continue strengthening the growth system.",
      icon: BarChart3,
    },
  ] as const;
  
  export function ProcessSection() {
    return (
      <Section className="bg-background">
        <Container>
          <SectionHeader
            eyebrow="Our Process"
            title="A clear path from business challenge to growth system."
            description="Every project follows a structured process designed to reduce uncertainty, improve execution, and produce solutions that support long-term growth."
            align="center"
          />
  
          <ol className="relative mt-16 grid gap-6 lg:grid-cols-5">
            <div
              aria-hidden="true"
              className="absolute left-[10%] right-[10%] top-14 hidden h-px bg-border lg:block"
            />
  
            {processSteps.map((step) => {
              const Icon = step.icon;
  
              return (
                <li
                  key={step.number}
                  className="relative rounded-2xl border border-border bg-card p-7 shadow-card"
                >
                  <div className="relative z-10 flex items-center justify-between">
                    <div className="flex size-12 items-center justify-center rounded-xl bg-brand text-white">
                      <Icon aria-hidden="true" className="size-5" />
                    </div>
  
                    <span className="font-heading text-sm font-semibold text-brand-blue">
                      {step.number}
                    </span>
                  </div>
  
                  <h3 className="mt-6 font-heading text-xl font-semibold text-brand">
                    {step.title}
                  </h3>
  
                  <p className="mt-3 text-sm leading-7 text-muted">
                    {step.description}
                  </p>
                </li>
              );
            })}
          </ol>
        </Container>
      </Section>
    );
  }