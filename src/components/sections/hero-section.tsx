import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Bot,
  CheckCircle2,
  Code2,
  Globe2,
  MapPin,
  Sparkles,
  Workflow,
} from "lucide-react";

import { Button, Container, GridPattern } from "@/components/ui";

const benefits = [
  "Senior software engineering expertise",
  "Strategy built around measurable business outcomes",
  "Solutions designed to work together and scale",
] as const;

const growthPillars = [
  {
    title: "Build Trust",
    description: "High-performance websites",
    icon: Globe2,
  },
  {
    title: "Get Found",
    description: "Local SEO and visibility",
    icon: MapPin,
  },
  {
    title: "Respond Faster",
    description: "AI-assisted communication",
    icon: Bot,
  },
  {
    title: "Save Time",
    description: "Connected automation",
    icon: Workflow,
  },
  {
    title: "Measure Results",
    description: "Analytics and reporting",
    icon: BarChart3,
  },
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
        <div className="grid min-h-[calc(100vh-4rem)] items-center gap-14 py-20 lg:grid-cols-[1.08fr_0.92fr] lg:py-24">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-sm text-cyan-200 shadow-lg backdrop-blur-xl">
              <Sparkles aria-hidden="true" className="size-4" />
              Software engineering meets business growth
            </div>

            <h1 className="mt-7 max-w-4xl font-heading text-5xl font-bold leading-[1.02] tracking-[-0.05em] text-white sm:text-6xl lg:text-7xl">
              Grow your business.
              <span className="mt-2 block bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-300 bg-clip-text text-transparent">
                We build the systems.
              </span>
            </h1>

            <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-300 sm:text-xl">
              JS Solutions connects modern websites, Local SEO, AI automation,
              business workflows, and analytics into one practical system
              designed to generate leads, save time, and support growth.
            </p>

            <div className="mt-9 flex flex-col gap-4 sm:flex-row">
              <Button
                size="lg"
                nativeButton={false}
                render={<Link href="/growth-system" />}
                className="group h-12 bg-brand-blue px-6 text-white shadow-[0_12px_40px_rgba(37,99,235,0.35)] transition duration-300 hover:-translate-y-0.5 hover:bg-blue-500"
              >
                See the Growth System

                <ArrowRight
                  aria-hidden="true"
                  className="ml-2 size-4 transition-transform duration-300 group-hover:translate-x-1"
                />
              </Button>

              <Button
                size="lg"
                variant="outline"
                nativeButton={false}
                render={<Link href="/contact" />}
                className="h-12 border-white/15 bg-white/[0.05] px-6 text-white backdrop-blur-xl transition duration-300 hover:-translate-y-0.5 hover:bg-white/10 hover:text-white"
              >
                Start a Conversation
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

          <div className="relative mx-auto w-full max-w-xl lg:ml-auto">
            <div className="absolute -inset-8 -z-10 rounded-full bg-blue-500/10 blur-3xl" />

            <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5 shadow-2xl backdrop-blur-xl sm:p-7">
              <div className="flex items-center justify-between border-b border-white/10 pb-5">
                <div>
                  <p className="text-sm font-semibold text-white">
                    The JS Growth System
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    Everything working toward one goal
                  </p>
                </div>

                <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs font-medium text-emerald-200">
                  Connected
                </span>
              </div>

              <div className="mt-5 space-y-3">
                {growthPillars.map((pillar, index) => {
                  const Icon = pillar.icon;

                  return (
                    <div
                      key={pillar.title}
                      className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-slate-950/30 p-4 transition duration-300 hover:border-cyan-300/30 hover:bg-white/[0.08]"
                    >
                      <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-blue-500/15 text-cyan-300">
                        <Icon aria-hidden="true" className="size-5" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-4">
                          <p className="font-semibold text-white">
                            {pillar.title}
                          </p>

                          <span className="text-xs font-medium text-slate-500">
                            0{index + 1}
                          </span>
                        </div>

                        <p className="mt-1 text-sm text-slate-400">
                          {pillar.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-5 rounded-2xl border border-cyan-300/15 bg-gradient-to-r from-blue-500/15 to-cyan-300/10 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200">
                  The Outcome
                </p>

                <p className="mt-2 text-lg font-semibold text-white">
                  More customers. Better systems. Smarter growth.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Container>

      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-950/40 to-transparent"
      />
    </section>
  );
}