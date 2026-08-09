import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  Layers3,
  Sparkles,
} from "lucide-react";

import {
  CTASection,
  GrowthSystemVisual,
} from "@/components/marketing";
import { ServicesSection } from "@/components/sections/services-section";
import {
  Button,
  Container,
  GridPattern,
  Section,
  SectionHeader,
} from "@/components/ui";

export const metadata: Metadata = {
  title: "Digital Growth Services",
  description:
    "Explore website development, Local SEO, AI integration, business automation, content marketing, and analytics services from JS Solutions.",
};

export default function ServicesPage() {
  return (
    <>
      <section className="relative isolate overflow-hidden bg-brand text-white">
        <GridPattern className="opacity-45" />

        <div
          aria-hidden="true"
          className="absolute left-1/2 top-0 -z-10 size-[46rem] -translate-x-1/2 -translate-y-[62%] rounded-full bg-brand-blue/25 blur-3xl"
        />

        <div
          aria-hidden="true"
          className="absolute -right-40 top-1/3 -z-10 size-[30rem] rounded-full bg-brand-cyan/15 blur-3xl"
        />

        <Container className="relative py-20 sm:py-24 lg:py-28">
          <div className="mx-auto max-w-4xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-sm font-medium text-cyan-200 backdrop-blur-xl">
              <Sparkles
                aria-hidden="true"
                className="size-4"
              />

              Our Services
            </div>

            <h1 className="mt-6 font-heading text-4xl font-bold leading-tight tracking-[-0.05em] text-white sm:text-5xl lg:text-6xl">
              Connected digital solutions built to grow your business.
            </h1>

            <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-slate-300 sm:text-xl">
              JS Solutions combines modern websites, Local SEO, AI,
              automation, content, and analytics into one connected growth
              system.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                size="xl"
                nativeButton={false}
                render={
                  <Link href="/website-audit" />
                }
              >
                Run Free Website Audit

                <ArrowRight
                  aria-hidden="true"
                  className="ml-1 size-4"
                />
              </Button>

              <Button
                size="xl"
                variant="outline"
                nativeButton={false}
                render={
                  <Link href="/contact" />
                }
                className="border-white/15 bg-white/[0.04] text-white hover:border-white/25 hover:bg-white/[0.08] hover:text-white"
              >
                Start a Conversation
              </Button>
            </div>
          </div>
        </Container>
      </section>

      <ServicesSection />

      <Section className="relative overflow-hidden bg-brand text-white">
        <GridPattern className="opacity-35" />

        <div
          aria-hidden="true"
          className="absolute -left-40 top-1/2 -z-10 size-[34rem] -translate-y-1/2 rounded-full bg-brand-blue/10 blur-3xl"
        />

        <div
          aria-hidden="true"
          className="absolute -right-40 top-0 -z-10 size-[32rem] rounded-full bg-brand-cyan/[0.08] blur-3xl"
        />

        <Container className="relative">
          <div className="grid items-center gap-14 lg:grid-cols-[0.82fr_1.18fr] lg:gap-20">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3.5 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-300">
                <Layers3
                  aria-hidden="true"
                  className="size-3.5"
                />

                The JS Growth System
              </div>

              <SectionHeader
                title="Your digital tools should work together."
                description="A website should not sit alone. Search visibility brings the right visitors, conversion systems capture opportunities, automation improves follow-up, and analytics show what is driving growth."
                className="mt-5 max-w-xl [&_h2]:text-white [&_p:last-child]:text-slate-300"
              />

              <div className="mt-8">
                <Button
                  size="lg"
                  variant="outline"
                  nativeButton={false}
                  render={
                    <Link href="/growth-system" />
                  }
                  className="border-white/15 bg-white/[0.04] text-white hover:border-white/25 hover:bg-white/[0.08] hover:text-white"
                >
                  Explore the Growth System

                  <ArrowRight
                    aria-hidden="true"
                    className="ml-1 size-4"
                  />
                </Button>
              </div>
            </div>

            <div className="relative">
              <div
                aria-hidden="true"
                className="absolute -inset-10 -z-10 rounded-full bg-brand-blue/[0.08] blur-3xl"
              />

              <GrowthSystemVisual />
            </div>
          </div>
        </Container>
      </Section>

      <CTASection
        title="Build a digital system that supports real growth."
        description="Let’s review your website, visibility, customer journey, workflows, and business goals to determine the strongest place to start."
        primaryLabel="Plan Your Growth"
        primaryHref="/contact"
        secondaryLabel="Run Website Audit"
        secondaryHref="/website-audit"
      />
    </>
  );
}