import type { Metadata } from "next";

import { PageHero } from "@/components/marketing";
import { Container, Section } from "@/components/ui";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contact JS Solutions to discuss website development, Local SEO, AI automation, digital marketing, and business growth systems.",
};

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="Let’s build your business growth system."
        description="Tell us about your business, the challenges you are facing, and what you want to improve. We’ll help identify the right combination of website, SEO, AI, automation, and marketing solutions."
      />

      <Section>
        <Container>
          <div className="mx-auto max-w-3xl rounded-2xl border border-border bg-card p-8 shadow-card md:p-12">
            <h2 className="font-heading text-2xl font-semibold text-brand">
              Contact form coming next.
            </h2>

            <p className="mt-4 leading-7 text-muted">
              This section will contain the production contact form using React
              Hook Form, Zod validation, a server action, and Resend email
              delivery.
            </p>
          </div>
        </Container>
      </Section>
    </>
  );
}