import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Container,
  GridPattern,
  Section,
} from "@/components/ui";
import { cn } from "@/lib/utils";

type CTASectionProps = {
  eyebrow?: string;
  title: string;
  description: string;
  primaryLabel?: string;
  primaryHref?: string;
  secondaryLabel?: string;
  secondaryHref?: string;
  className?: string;
};

export function CTASection({
  eyebrow = "Ready to grow?",
  title,
  description,
  primaryLabel = "Get a Growth Plan",
  primaryHref = "/contact",
  secondaryLabel,
  secondaryHref,
  className,
}: CTASectionProps) {
  return (
    <Section className={cn("bg-background", className)}>
      <Container>
        <div className="relative overflow-hidden rounded-3xl bg-brand px-6 py-16 text-white shadow-soft sm:px-10 md:py-20 lg:px-16">
          <GridPattern className="opacity-70" />

          <div className="absolute right-0 top-0 size-80 -translate-y-1/2 translate-x-1/3 rounded-full bg-brand-blue/30 blur-3xl" />
          <div className="absolute bottom-0 left-0 size-72 -translate-x-1/3 translate-y-1/2 rounded-full bg-brand-cyan/20 blur-3xl" />

          <div className="relative max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-200">
              {eyebrow}
            </p>

            <h2 className="mt-4 font-heading text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
              {title}
            </h2>

            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
              {description}
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Button
                size="lg"
                nativeButton={false}
                render={<Link href={primaryHref} />}
              >
                {primaryLabel}
                <ArrowRight aria-hidden="true" className="ml-2 size-4" />
              </Button>

              {secondaryLabel && secondaryHref ? (
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                  nativeButton={false}
                  render={<Link href={secondaryHref} />}
                >
                  {secondaryLabel}
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}