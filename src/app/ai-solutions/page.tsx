import type { Metadata } from "next";

import { CTASection, PageHero } from "@/components/marketing";

export const metadata: Metadata = {
  title: "AI Solutions",
  description:
    "Practical AI integration and business automation solutions designed to improve workflows, customer communication, and operational efficiency.",
};

export default function AISolutionsPage() {
  return (
    <>
      <PageHero
        eyebrow="AI Solutions"
        title="Practical AI and automation built around your workflow."
        description="JS Solutions integrates AI, automation, reporting, customer communication, and connected workflows into your business without adding unnecessary complexity."
      />

      <CTASection
        title="Automate repetitive work and create better systems."
        description="Tell us where your team loses time, and we’ll help design a practical AI or automation solution around your existing workflow."
        primaryLabel="Explore AI Automation"
      />
    </>
  );
}