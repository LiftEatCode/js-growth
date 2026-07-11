import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Code2,
  Sparkles,
} from "lucide-react";

import { GrowthSystemVisual } from "@/components/marketing";
import { Button } from "@/components/ui/button";
import {
  Container,
  GridPattern,
} from "@/components/ui";

const benefits = [
  "Senior software engineering expertise",
  "SEO built into the technical foundation",
  "Automation designed around your workflow",
] as const;

export function HeroSection() {
  return (
    <section className="relative isolate overflow-hidden bg-brand text-white">
      <GridPattern className="opacity-50" />

      <div
        aria-hidden="true"
        className="absolute left-1/2 top-0 -z-10 size-[50rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-blue/25 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="absolute -right-48 top-1/3 -z-10 size-[32rem] rounded-full bg-brand-cyan/15 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="absolute -bottom-64 -left-32 -z-10 size-[38rem] rounded-full bg-blue-700/20 blur-3xl"
      />

      <Container className="relative">
        <div className="grid min-h-[calc(100vh-4rem)] items-center gap-16 py-20 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-sm text-cyan-200 shadow-lg backdrop-blur-xl">
              <Sparkles aria-hidden="true" className="size-4" />
              Software engineering meets business growth
            </div>

            <h1 className="mt-7 max-w-4xl font-heading text-5xl font-bold leading-[1.02] tracking-[-0.05em] text-white sm:text-6xl lg:text-7xl">
              Growth systems engineered for{" "}
              <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-300 bg-clip-text text-transparent">
                local businesses.
              </span>
            </h1>

            <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-300 sm:text-xl">
              JS Solutions combines high-performance websites, Local SEO,
              AI automation, and data-driven marketing into one connected
              system built to generate leads and support long-term growth.
            </p>

            <div className="mt-9 flex flex-col gap-4 sm:flex-row">
              <Button
                size="lg"
                nativeButton={false}
                render={<Link href="/contact" />}
                className="group h-12 bg-brand-blue px-6 text-white shadow-[0_12px_40px_rgba(37,99,235,0.35)] transition duration-300 hover:-translate-y-0.5 hover:bg-blue-500"
              >
                Get a Growth Plan

                <ArrowRight
                  aria-hidden="true"
                  className="ml-2 size-4 transition-transform duration-300 group-hover:translate-x-1"
                />
              </Button>

              <Button
                size="lg"
                variant="outline"
                nativeButton={false}
                render={<Link href="/services" />}
                className="h-12 border-white/15 bg-white/[0.05] px-6 text-white backdrop-blur-xl transition duration-300 hover:-translate-y-0.5 hover:bg-white/10 hover:text-white"
              >
                Explore Our Solutions
                </Button>
            </div>

            <ul className="mt-9 grid max-w-2xl gap-3 text-sm text-slate-300 sm:grid-cols-2">
              {benefits.map((benefit) => (
                <li key={benefit} className="flex items-start gap-2">
                  <CheckCircle2
                    aria-hidden="true"
                    className="mt-0.5 size-4 shrink-0 text-cyan-300"
                  />

                  <span>{benefit}</span>
                </li>
              ))}
            </ul>

            <div className="mt-10 flex items-center gap-4 border-t border-white/10 pt-6">
              <div className="flex size-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] text-cyan-300">
                <Code2 aria-hidden="true" className="size-5" />
              </div>

              <div>
                <p className="text-sm font-medium text-white">
                  Built by a Senior Software Engineer
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Clean architecture. Real automation. Measurable strategy.
                </p>
              </div>
            </div>
          </div>

          <GrowthSystemVisual />
        </div>
      </Container>

      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-950/40 to-transparent"
      />
    </section>
  );
}