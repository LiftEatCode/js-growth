import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

import {
  Button,
  Container,
  GlassCard,
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

const benefits = [
  "Clear next steps",
  "No generic packages",
  "Built around your business",
] as const;

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
    <Section
      className={cn(
        "bg-background",
        className,
      )}
    >
      <Container>
        <div className="relative overflow-hidden rounded-[2rem] border border-slate-800 bg-brand px-6 py-14 text-white shadow-soft sm:px-10 md:py-16 lg:px-14">
          <GridPattern className="opacity-55" />

          <div
            aria-hidden="true"
            className="absolute right-0 top-0 size-[26rem] -translate-y-1/2 translate-x-1/3 rounded-full bg-brand-blue/30 blur-3xl"
          />

          <div
            aria-hidden="true"
            className="absolute bottom-0 left-0 size-[24rem] -translate-x-1/3 translate-y-1/2 rounded-full bg-brand-cyan/15 blur-3xl"
          />

          <div className="relative grid gap-10 lg:grid-cols-[1fr_360px] lg:items-center lg:gap-14">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3.5 py-2 text-xs font-semibold uppercase tracking-[0.17em] text-cyan-300 backdrop-blur-xl">
                <Sparkles
                  aria-hidden="true"
                  className="size-3.5"
                />

                {eyebrow}
              </div>

              <h2 className="mt-5 font-heading text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
                {title}
              </h2>

              <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
                {description}
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button
                  size="xl"
                  nativeButton={false}
                  render={
                    <Link
                      href={
                        primaryHref
                      }
                    />
                  }
                >
                  {primaryLabel}

                  <ArrowRight
                    aria-hidden="true"
                    className="ml-1 size-4"
                  />
                </Button>

                {secondaryLabel &&
                secondaryHref ? (
                  <Button
                    size="xl"
                    variant="outline"
                    className="border-white/15 bg-white/[0.04] text-white hover:border-white/25 hover:bg-white/[0.08] hover:text-white"
                    nativeButton={false}
                    render={
                      <Link
                        href={
                          secondaryHref
                        }
                      />
                    }
                  >
                    {
                      secondaryLabel
                    }
                  </Button>
                ) : null}
              </div>
            </div>

            <GlassCard
              tone="dark"
              padding="md"
              className="border-white/10 bg-white/[0.045]"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-300">
                What to expect
              </p>

              <div className="mt-5 space-y-4">
                {benefits.map(
                  (benefit) => (
                    <div
                      key={
                        benefit
                      }
                      className="flex items-center gap-3"
                    >
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-emerald-300/10 bg-emerald-300/10 text-emerald-300">
                        <CheckCircle2
                          aria-hidden="true"
                          className="size-4"
                        />
                      </span>

                      <p className="text-sm font-medium text-slate-200">
                        {
                          benefit
                        }
                      </p>
                    </div>
                  ),
                )}
              </div>

              <div className="mt-6 border-t border-white/10 pt-5">
                <p className="text-xs leading-5 text-slate-400">
                  Start with a conversation or website audit. We&apos;ll
                  identify the most useful next step based on where your
                  business is today.
                </p>
              </div>
            </GlassCard>
          </div>
        </div>
      </Container>
    </Section>
  );
}