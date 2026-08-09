import Link from "next/link";
import {
  ArrowRight,
  Check,
  Sparkles,
} from "lucide-react";

import {
  GrowthSystemVisual,
} from "@/components/marketing";
import {
  Button,
  Container,
  GlassCard,
  Section,
} from "@/components/ui";

const outcomes = [
  "A professional website that builds trust",
  "Search visibility that attracts local customers",
  "Clear paths that convert traffic into leads",
  "Faster follow-up through AI and automation",
  "Connected workflows that reduce manual work",
  "Analytics that reveal what is driving growth",
] as const;

export function HomeGrowthSystemSection() {
  return (
    <Section className="relative overflow-hidden bg-slate-950 text-white">
      <div
        aria-hidden="true"
        className="absolute -left-40 top-1/2 -z-10 size-[34rem] -translate-y-1/2 rounded-full bg-brand-blue/10 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="absolute -right-48 top-0 -z-10 size-[36rem] rounded-full bg-brand-cyan/[0.08] blur-3xl"
      />

      <Container>
        <div className="grid items-center gap-14 lg:grid-cols-[0.88fr_1.12fr] lg:gap-20">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3.5 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-300">
              <Sparkles
                aria-hidden="true"
                className="size-3.5"
              />

              The JS Growth System
            </div>

            <h2 className="mt-5 max-w-xl font-heading text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-5xl">
              Your website, marketing, AI, and operations should work together.
            </h2>

            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">
              Most businesses are using disconnected tools that create more
              work without producing clear results. JS Solutions connects each
              part of your digital presence into one practical system designed
              to attract customers, improve follow-up, and support growth.
            </p>

            <GlassCard
              tone="dark"
              padding="md"
              className="mt-8"
            >
              <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
                {outcomes.map(
                  (outcome) => (
                    <div
                      key={
                        outcome
                      }
                      className="flex items-start gap-3 text-sm leading-6 text-slate-300"
                    >
                      <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border border-emerald-300/10 bg-emerald-300/10 text-emerald-300">
                        <Check
                          aria-hidden="true"
                          className="size-3"
                        />
                      </span>

                      <span>
                        {
                          outcome
                        }
                      </span>
                    </div>
                  ),
                )}
              </div>
            </GlassCard>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Button
                size="lg"
                nativeButton={false}
                render={
                  <Link href="/growth-system" />
                }
              >
                Explore the Growth System

                <ArrowRight
                  aria-hidden="true"
                  className="ml-1 size-4"
                />
              </Button>

              <Button
                size="lg"
                variant="outline"
                nativeButton={false}
                render={
                  <Link href="/contact" />
                }
                className="border-white/15 bg-white/[0.04] text-white hover:border-white/25 hover:bg-white/[0.08] hover:text-white"
              >
                Discuss Your Business
              </Button>
            </div>
          </div>

          <div className="relative">
            <div
              aria-hidden="true"
              className="absolute -inset-10 -z-10 rounded-full bg-brand-blue/[0.08] blur-3xl"
            />

            <GrowthSystemVisual className="lg:ml-auto" />
          </div>
        </div>
      </Container>
    </Section>
  );
}