import type { ReactNode } from "react";

import {
  Container,
  GridPattern,
  Section,
} from "@/components/ui";
import { cn } from "@/lib/utils";

type PageHeroProps = {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: ReactNode;
  className?: string;
};

export function PageHero({
  eyebrow,
  title,
  description,
  actions,
  className,
}: PageHeroProps) {
  return (
    <Section
      spacing="lg"
      className={cn(
        "relative overflow-hidden bg-brand text-white",
        className,
      )}
    >
      <GridPattern className="opacity-50" />

      <div
        aria-hidden="true"
        className="absolute right-0 top-0 size-[30rem] -translate-y-1/3 translate-x-1/3 rounded-full bg-brand-blue/20 blur-3xl"
      />

      <Container className="relative">
        <div className="max-w-4xl">
          {eyebrow ? (
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-200">
              {eyebrow}
            </p>
          ) : null}

          <h1 className="mt-4 font-heading text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl">
            {title}
          </h1>

          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">
            {description}
          </p>

          {actions ? (
            <div className="mt-8 flex flex-wrap gap-4">
              {actions}
            </div>
          ) : null}
        </div>
      </Container>
    </Section>
  );
}