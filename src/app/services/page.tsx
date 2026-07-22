import Link from "next/link";
import type { Metadata } from "next";

import {
  CTASection,
  GrowthSystemVisual,
  PageHero,
} from "@/components/marketing";
import { ServicesSection } from "@/components/sections/services-section";
import {
  Container,
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
      <PageHero
        eyebrow="Our Services"
        title="Connected digital solutions built to grow your business."
        description="JS Solutions combines modern websites, Local SEO, AI, automation, content, and analytics into one connected growth system."
      />

      <ServicesSection />

      <Section className="overflow-hidden bg-brand text-white">
        <Container>
          <div className="grid items-center gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <SectionHeader
            eyebrow="The JS Growth System"
            title="Your digital tools should work together."
            description="A website should not sit alone. Search visibility brings the right visitors, conversion systems capture opportunities, automation improves follow-up, and analytics show what is driving growth."
            className="max-w-xl [&_*]:text-white"
          />
            <GrowthSystemVisual />
            <div className="mt-8">
              <Link
                href="/growth-system"
                className="inline-flex items-center text-sm font-semibold text-white transition hover:opacity-80"
              >
                Explore the complete growth system →
              </Link>
            </div>
          </div>
        </Container>
      </Section>

      <CTASection
        title="Build a digital system that supports real growth."
        description="Let’s review your website, visibility, customer journey, workflows, and business goals to determine the strongest place to start."
        primaryLabel="Plan Your Growth"
      />
    </>
  );
}