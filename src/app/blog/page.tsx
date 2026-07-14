import type { Metadata } from "next";

import { PageHero } from "@/components/marketing";
import { Container, Section } from "@/components/ui";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Insights from JS Solutions about websites, Local SEO, AI integration, business automation, analytics, and digital growth.",
};

export default function BlogPage() {
  return (
    <>
      <PageHero
        eyebrow="Insights"
        title="Websites, SEO, AI, and automation explained."
        description="Practical insights for local businesses that want stronger online visibility, better technology, smarter workflows, and more consistent lead generation."
      />

      <Section>
        <Container>
          <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-card md:p-12">
            <h2 className="font-heading text-2xl font-semibold text-brand">
              Articles are coming soon.
            </h2>

            <p className="mx-auto mt-4 max-w-2xl leading-7 text-muted">
              We are building a library of practical guides covering website
              performance, Local SEO, AI, automation, analytics, and digital
              growth for local businesses.
            </p>
          </div>
        </Container>
      </Section>
    </>
  );
}