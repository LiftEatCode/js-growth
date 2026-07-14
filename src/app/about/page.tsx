import type { Metadata } from "next";

import { CTASection, PageHero } from "@/components/marketing";

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn how JS Solutions combines senior software engineering, Local SEO, AI, automation, and digital marketing to help local businesses grow.",
};

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About JS Solutions"
        title="Software engineering expertise applied to business growth."
        description="JS Solutions was built around a simple idea: local businesses deserve more than generic websites and disconnected marketing services. They need scalable systems engineered around performance, visibility, automation, and measurable growth."
      />

      <CTASection
        title="Work with a technical partner who understands growth."
        description="Let’s discuss your business, your current challenges, and the systems that could help you operate and grow more effectively."
        primaryLabel="Start a Conversation"
      />
    </>
  );
}