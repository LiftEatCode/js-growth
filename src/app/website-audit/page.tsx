import type { Metadata } from "next";

import { CTASection, PageHero } from "@/components/marketing";
import { WebsiteAuditTool } from "@/components/website-audit/website-audit-tool";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";

export const metadata: Metadata = {
  title: "Website Audit",
  description:
    "Run a free website audit to check technical SEO, search optimization, local signals, accessibility, and content issues that may be holding your business back.",
};

export default function WebsiteAuditPage() {
  return (
    <>
      <PageHero
        eyebrow="Free Website Audit"
        title="Find what is holding your website back."
        description="Enter your homepage to get a scored report covering technical SEO, search optimization, local signals, accessibility, and content — plus practical recommendations you can act on."
      />

      <Section className="bg-background">
        <Container>
          <WebsiteAuditTool />
        </Container>
      </Section>

      <CTASection
        title="Want help fixing the issues?"
        description="Share your audit results and we will help prioritize the website, Local SEO, and conversion improvements that matter most for your business."
        primaryLabel="Talk with JS Solutions"
      />
    </>
  );
}
