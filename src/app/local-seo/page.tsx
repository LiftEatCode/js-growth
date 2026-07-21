import type { Metadata } from "next";

import {
  BenefitsSection,
  CTASection,
  FAQSection,
  PageHero,
  ProcessSection,
} from "@/components/marketing";
import { GoogleBusinessProfileSection } from "@/components/sections/google-business-profile-section";
import {
  localSeoBenefits,
  localSeoProcess,
  localSeoFAQ,
} from "@/content/services/local-seo";

export const metadata: Metadata = {
  title: "Local SEO",
  description:
    "Local SEO services that help businesses improve search visibility, strengthen Google Business Profile performance, and attract nearby customers.",
};

export default function LocalSEOPage() {
  return (
    <>
      <PageHero
        eyebrow="Local SEO"
        title="Local SEO that helps nearby customers find your business."
        description="JS Solutions improves your website, Google Business Profile, service-area relevance, local content, reviews, and technical foundation so your business can compete in the markets that matter most."
      />

      <BenefitsSection
        {...localSeoBenefits}
        className="bg-background"
      />

      <GoogleBusinessProfileSection />
      <ProcessSection {...localSeoProcess} theme="dark" />

      <FAQSection
        {...localSeoFAQ}
        className="bg-background"
      />

      <CTASection
        title="Improve your visibility in local search."
        description="Let’s identify the website, Google Business Profile, content, and technical improvements that can help more local customers discover your business."
        primaryLabel="Get a Local SEO Plan"
      />
    </>
  );
}
