import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";

import { GrowthSystemVisual } from "@/components/marketing";
import { Container, Section } from "@/components/ui";

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
    <Section className="overflow-hidden bg-slate-950 text-white">
      <Container>
        <div className="grid items-center gap-14 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-cyan">
              The JS Growth System
            </p>

            <h2 className="mt-4 max-w-xl text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
              Your website, marketing, AI, and operations should work together.
            </h2>

            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">
              Most businesses are using disconnected tools that create more
              work without producing clear results. JS Solutions connects each
              part of your digital presence into one practical system designed
              to attract customers, improve follow-up, and support growth.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {outcomes.map((outcome) => (
                <div
                  key={outcome}
                  className="flex items-start gap-3 text-sm leading-6 text-slate-300"
                >
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-300">
                    <Check className="size-3.5" />
                  </span>

                  <span>{outcome}</span>
                </div>
              ))}
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-5">
              <Link
                href="/growth-system"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
              >
                Explore the Growth System
                <ArrowRight className="size-4" />
              </Link>

              <Link
                href="/contact"
                className="text-sm font-semibold text-white transition hover:text-brand-cyan"
              >
                Discuss your business →
              </Link>
            </div>
          </div>

          <GrowthSystemVisual className="lg:ml-auto" />
        </div>
      </Container>
    </Section>
  );
}