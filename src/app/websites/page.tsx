import type { Metadata } from "next";
import {
  BenefitsSection,
  CapabilitiesSection,
  CTASection,
  FAQSection,
  IndustriesSection,
  PageHero,
  ProcessSection,
} from "@/components/marketing";

import {
  websiteBenefits,
  websiteCapabilities,
  websiteFAQ,
  websiteIndustries,
  websiteProcess,
} from "@/content/services/websites";

export const metadata: Metadata = {
  title: "Website Development",
  description:
    "High-performance website development for local businesses that need better speed, visibility, user experience, and lead generation.",
};

export default function WebsitesPage() {
  return (
    <>
      <PageHero
        eyebrow="Website Development"
        title="Websites engineered to perform, rank, and convert."
        description="JS Solutions builds fast, scalable websites designed around user experience, technical SEO, accessibility, Core Web Vitals, and lead generation."
      />

      <BenefitsSection
        {...websiteBenefits}
        className="bg-background"
      />

      <CapabilitiesSection
        {...websiteCapabilities}
        className="bg-muted/30"
      />

      <ProcessSection
        {...websiteProcess}
        theme="dark"
      />

      <IndustriesSection
        {...websiteIndustries}
        className="bg-muted/30"
      />

      <FAQSection
        {...websiteFAQ}
        className="bg-background"
      />

      <CTASection
        title="Build a website that works as hard as your business."
        description="Let’s create a fast, professional, and scalable website designed to generate leads and support your long-term growth."
        primaryLabel="Start Your Website Project"
      />
    </>
  );
}
