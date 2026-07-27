import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Container, Section, SectionHeader } from "@/components/ui";

import type { BusinessProblemsSectionProps } from "./types";

export function BusinessProblemsSection({
  eyebrow = "Where Are You Getting Stuck?",
  title = "Start with the problem, not the service.",
  description = "Choose the challenge that sounds most familiar and see how JS Solutions can help.",
  items,
}: BusinessProblemsSectionProps) {
  return (
    <Section>
      <Container>
        <SectionHeader
          eyebrow={eyebrow}
          title={title}
          description={description}
          align="center"
          className="mx-auto max-w-3xl"
        />

        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.title}
                href={item.href}
                className="group flex h-full flex-col rounded-2xl border bg-card p-6 shadow-soft transition duration-300 hover:-translate-y-1 hover:border-brand/30 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                <div className="flex size-12 items-center justify-center rounded-xl bg-brand/10 text-brand">
                  <Icon className="size-6" />
                </div>

                <h3 className="mt-6 text-xl font-semibold tracking-tight">
                  {item.title}
                </h3>

                <p className="mt-3 leading-7 text-muted-foreground">
                  {item.description}
                </p>

                <div className="mt-auto pt-6">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Recommended solution
                  </span>

                  <span className="mt-2 flex items-center gap-2 font-semibold text-brand">
                    {item.solution}

                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </Container>
    </Section>
  );
}