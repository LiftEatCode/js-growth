import Link from "next/link";
import {
  ArrowRight,
  Sparkles,
} from "lucide-react";

import {
  Card,
  Container,
  Section,
  SectionHeader,
} from "@/components/ui";

import type {
  BusinessProblemsSectionProps,
} from "./types";

export function BusinessProblemsSection({
  eyebrow = "Where Are You Getting Stuck?",
  title = "Start with the problem, not the service.",
  description = "Choose the challenge that sounds most familiar and see how JS Solutions can help.",
  items,
}: BusinessProblemsSectionProps) {
  return (
    <Section className="relative overflow-hidden">
      <div
        aria-hidden="true"
        className="absolute left-1/2 top-0 -z-10 h-72 w-[46rem] -translate-x-1/2 rounded-full bg-brand-blue/[0.04] blur-3xl"
      />

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
            const Icon =
              item.icon;

            return (
              <Link
                key={item.title}
                href={item.href}
                className="group block h-full rounded-2xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-blue/15"
              >
                <Card
                  variant="elevated"
                  padding="lg"
                  interactive
                  className="flex h-full flex-col overflow-hidden"
                >
                  <div className="flex items-start justify-between gap-5">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-brand-blue/10 bg-brand-blue/[0.07] text-brand-blue transition duration-200 group-hover:bg-brand-blue/10">
                      <Icon
                        aria-hidden="true"
                        className="size-5"
                      />
                    </span>

                    <ArrowRight
                      aria-hidden="true"
                      className="mt-1 size-5 shrink-0 text-slate-300 transition duration-200 group-hover:translate-x-1 group-hover:text-brand-blue"
                    />
                  </div>

                  <h3 className="mt-6 font-heading text-xl font-semibold tracking-tight text-brand">
                    {item.title}
                  </h3>

                  <p className="mt-3 leading-7 text-muted">
                    {
                      item.description
                    }
                  </p>

                  <div className="mt-auto pt-7">
                    <div className="border-t border-border pt-5">
                      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
                        <Sparkles
                          aria-hidden="true"
                          className="size-3.5 text-brand-blue"
                        />

                        Recommended solution
                      </div>

                      <div className="mt-2 flex items-center gap-2 text-sm font-semibold text-brand-blue">
                        {
                          item.solution
                        }

                        <ArrowRight
                          aria-hidden="true"
                          className="size-4 transition-transform duration-200 group-hover:translate-x-0.5"
                        />
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      </Container>
    </Section>
  );
}