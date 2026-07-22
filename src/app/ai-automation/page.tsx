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
  aiAutomationBenefits,
  aiAutomationCapabilities,
  aiAutomationFAQ,
  aiAutomationIndustries,
  aiAutomationProcess,
} from "@/content/services/ai-automation";

export const metadata: Metadata = {
  title: "AI Integration & Business Automation",
  description:
    "AI integration and business automation services that help companies reduce repetitive work, improve communication, connect systems, and scale operations.",
};

export default function AIAutomationPage() {
  return (
    <>
      <PageHero
        eyebrow="AI Integration & Automation"
        title="Practical AI and automation built around your business."
        description="JS Solutions helps businesses reduce repetitive work, improve communication, connect existing systems, and turn everyday workflows into more efficient digital processes."
      />

      <BenefitsSection
        {...aiAutomationBenefits}
        className="bg-background"
      />

      <CapabilitiesSection
        {...aiAutomationCapabilities}
        className="bg-muted/30"
      />

      <ProcessSection
        {...aiAutomationProcess}
        theme="dark"
      />

      <IndustriesSection
        {...aiAutomationIndustries}
        className="bg-muted/30"
      />

      <FAQSection
        {...aiAutomationFAQ}
        className="bg-background"
      />

      <CTASection
        title="Find the right automation opportunity for your business."
        description="Let’s review your workflows, repetitive tasks, communication gaps, and current systems to identify where AI or automation can create practical value."
        primaryLabel="Plan Your Automation"
      />
    </>
  );
}