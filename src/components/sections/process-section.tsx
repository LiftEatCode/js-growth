import {
  BarChart3,
  Code2,
  Lightbulb,
  Rocket,
  SearchCheck,
  Sparkles,
} from "lucide-react";

import {
  Card,
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
    <Section className="relative overflow-hidden bg-background">
      <div
        aria-hidden="true"
        className="absolute left-1/2 top-0 -z-10 h-80 w-[54rem] -translate-x-1/2 rounded-full bg-brand-blue/[0.035] blur-3xl"
      />

      <Container>
        <SectionHeader
          eyebrow="Our Process"
          title="A clear path from business challenge to growth system."
          description="Every project follows a structured process designed to reduce uncertainty, improve execution, and produce solutions that support long-term growth."
          align="center"
          className="mx-auto max-w-3xl"
        />

        <div className="mt-14 flex justify-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-blue/10 bg-brand-blue/[0.045] px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-brand-blue">
            <Sparkles
              aria-hidden="true"
              className="size-3.5"
            />

            Strategy to optimization
          </div>
        </div>

        <ol className="relative mt-10 grid gap-5 lg:grid-cols-5">
          <div
            aria-hidden="true"
            className="absolute left-[10%] right-[10%] top-12 hidden h-px bg-gradient-to-r from-transparent via-brand-blue/20 to-transparent lg:block"
          />

          {processSteps.map((step) => {
            const Icon = step.icon;

            return (
              <li
                key={step.number}
                className="relative"
              >
                <Card
                  variant="elevated"
                  padding="lg"
                  interactive
                  className="h-full"
                >
                  <div className="relative z-10 flex items-center justify-between gap-4">
                    <div className="flex size-11 items-center justify-center rounded-xl border border-brand-blue/10 bg-brand-blue/[0.07] text-brand-blue">
                      <Icon
                        aria-hidden="true"
                        className="size-5"
                      />
                    </div>

                    <span className="font-heading text-sm font-semibold text-brand-blue">
                      {step.number}
                    </span>
                  </div>

                  <h3 className="mt-6 font-heading text-xl font-semibold tracking-tight text-brand">
                    {step.title}
                  </h3>

                  <p className="mt-3 text-sm leading-7 text-muted">
                    {step.description}
                  </p>
                </Card>
              </li>
            );
          })}
        </ol>
      </Container>
    </Section>
  );
}