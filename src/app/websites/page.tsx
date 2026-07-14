import type { Metadata } from "next";

import { CTASection, PageHero } from "@/components/marketing";
import { WebsiteBenefitsSection } from "@/components/sections/website-benefits-section";
import { WebsiteCapabilitiesSection } from "@/components/sections/website-capabilities-section";
import { WebsiteFAQSection } from "@/components/sections/website-faq-section";
import { WebsiteIndustriesSection } from "@/components/sections/website-industries-section";
import { WebsiteProcessSection } from "@/components/sections/website-process-section";

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

      <WebsiteBenefitsSection />
      <WebsiteCapabilitiesSection />
      <WebsiteProcessSection />
      <WebsiteIndustriesSection />
      <WebsiteFAQSection />

      <CTASection
        title="Build a website that works as hard as your business."
        description="Let’s create a fast, professional, and scalable website designed to generate leads and support your long-term growth."
        primaryLabel="Start Your Website Project"
      />
    </>
  );
}