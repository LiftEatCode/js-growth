import type { Metadata } from "next";

import { CTASection, PageHero } from "@/components/marketing";
import { ServicesSection } from "@/components/sections/services-section";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Explore website development, Local SEO, AI integration, automation, content marketing, and analytics services from JS Solutions.",
};

export default function ServicesPage() {
  return (
    <>
      <PageHero
        eyebrow="Our Services"
        title="Technology and marketing systems built around business growth."
        description="JS Solutions combines software engineering, high-performance websites, Local SEO, AI, automation, and digital strategy into one connected growth system."
      />

      <ServicesSection />

      <CTASection
        title="Build the right growth system for your business."
        description="Tell us where your business is today, and we’ll help identify the website, SEO, automation, and marketing improvements that can move it forward."
      />
    </>
  );
}