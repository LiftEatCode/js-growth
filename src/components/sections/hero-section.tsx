import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Bot,
  CheckCircle2,
  Code2,
  FileSearch,
  Globe2,
  MapPin,
  Sparkles,
  TrendingUp,
  Workflow,
} from "lucide-react";

import {
  Button,
  Container,
  GlassCard,
  GridPattern,
  MetricCard,
} from "@/components/ui";

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
      <GridPattern className="opacity-45" />

      <div
        aria-hidden="true"
        className="absolute left-1/2 top-0 -z-10 size-[52rem] -translate-x-1/2 -translate-y-[58%] rounded-full bg-brand-blue/25 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="absolute -right-40 top-1/4 -z-10 size-[34rem] rounded-full bg-brand-cyan/15 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="absolute -bottom-64 -left-40 -z-10 size-[40rem] rounded-full bg-blue-700/20 blur-3xl"
      />

      <Container className="relative">
        <div className="grid min-h-[calc(100vh-4rem)] items-center gap-16 py-20 lg:grid-cols-[1.02fr_0.98fr] lg:py-24">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-medium text-cyan-200 shadow-sm backdrop-blur-xl">
              <Sparkles
                aria-hidden="true"
                className="size-4"
              />

              Software engineering meets business growth
            </div>

            <h1 className="mt-7 max-w-4xl font-heading text-5xl font-bold leading-[1.02] tracking-[-0.055em] text-white sm:text-6xl lg:text-7xl">
              Grow your business.

              <span className="mt-2 block bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-300 bg-clip-text text-transparent">
                We build the systems.
              </span>
            </h1>

            <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-300 sm:text-xl">
              JS Solutions connects modern websites, Local SEO, AI automation,
              business workflows, and analytics into practical systems designed
              to generate leads, save time, and support long-term growth.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Button
                size="xl"
                nativeButton={false}
                render={<Link href="/website-audit" />}
              >
                Run Free Website Audit

                <FileSearch
                  aria-hidden="true"
                  className="ml-1 size-4"
                />
              </Button>

              <Button
                size="xl"
                variant="outline"
                nativeButton={false}
                render={<Link href="/growth-system" />}
                className="border-white/15 bg-white/[0.04] text-white backdrop-blur-xl hover:border-white/25 hover:bg-white/[0.08] hover:text-white"
              >
                See the Growth System

                <ArrowRight
                  aria-hidden="true"
                  className="ml-1 size-4"
                />
              </Button>
            </div>

            <ul className="mt-9 grid max-w-2xl gap-3 text-sm text-slate-300 sm:grid-cols-2">
              {benefits.map((benefit) => (
                <li
                  key={benefit}
                  className="flex items-start gap-2.5"
                >
                  <CheckCircle2
                    aria-hidden="true"
                    className="mt-0.5 size-4 shrink-0 text-cyan-300"
                  />

                  <span>
                    {benefit}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-10 flex items-center gap-4 border-t border-white/10 pt-6">
              <div className="flex size-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] text-cyan-300">
                <Code2
                  aria-hidden="true"
                  className="size-5"
                />
              </div>

              <div>
                <p className="text-sm font-medium text-white">
                  Built with software engineering discipline
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Clean architecture. Real automation. Measurable strategy.
                </p>
              </div>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-xl lg:ml-auto">
            <div
              aria-hidden="true"
              className="absolute -inset-10 -z-10 rounded-full bg-blue-500/10 blur-3xl"
            />

            <GlassCard
              tone="dark"
              padding="lg"
              className="overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-5">
                <div>
                  <p className="text-sm font-semibold text-white">
                    Website Growth Intelligence
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    A connected view of your online growth system
                  </p>
                </div>

                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs font-medium text-emerald-200">
                  <span className="size-1.5 rounded-full bg-emerald-300" />

                  Live
                </span>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <MetricCard
                  label="Website Score"
                  value="82"
                  helper="Strong foundation"
                  icon={TrendingUp}
                  tone="brand"
                  className="border-white/10 bg-slate-950/35 shadow-none"
                />

                <MetricCard
                  label="Growth Opportunity"
                  value="91"
                  helper="High potential"
                  icon={BarChart3}
                  tone="positive"
                  className="border-white/10 bg-slate-950/35 shadow-none"
                />
              </div>

              <div className="mt-5 space-y-2.5">
                {growthPillars.map((pillar, index) => {
                  const Icon =
                    pillar.icon;

                  return (
                    <div
                      key={pillar.title}
                      className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-slate-950/30 p-4 transition duration-200 hover:border-cyan-300/25 hover:bg-white/[0.07]"
                    >
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-blue-400/10 bg-blue-500/15 text-cyan-300">
                        <Icon
                          aria-hidden="true"
                          className="size-[18px]"
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-4">
                          <p className="text-sm font-semibold text-white">
                            {pillar.title}
                          </p>

                          <span className="text-[11px] font-medium text-slate-500">
                            0{index + 1}
                          </span>
                        </div>

                        <p className="mt-1 text-xs leading-5 text-slate-400">
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
            </GlassCard>
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