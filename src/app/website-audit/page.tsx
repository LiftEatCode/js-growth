import type { Metadata } from "next";
import {
  SearchCheck,
  Sparkles,
} from "lucide-react";

import { CTASection } from "@/components/marketing";
import { AuditTierComparison } from "@/components/website-audit/audit-tier-comparison";
import { WebsiteAuditTool } from "@/components/website-audit/website-audit-tool";
import {
  Container,
  GridPattern,
  Section,
} from "@/components/ui";
import {
  AUDIT_CATEGORY_OVERVIEW,
  FREE_AUDIT_PRODUCT_NAME,
  PROFESSIONAL_AUDIT_PRODUCT_NAME,
  getProfessionalAuditPricePresentation,
} from "@/lib/payments/product";

const title = "Free Website Audit for Small Businesses";
const description =
  "Get a Website Growth Audit that evaluates search visibility, content, conversion opportunities, local SEO, technical health, and performance. No credit card required.";

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    type: "website",
  },
};

export default function WebsiteAuditPage() {
  const pricePresentation = getProfessionalAuditPricePresentation();

  return (
    <>
      <section className="relative isolate overflow-hidden bg-brand text-white">
        <GridPattern className="opacity-45" />

        <div
          aria-hidden="true"
          className="absolute left-1/2 top-0 -z-10 size-[48rem] -translate-x-1/2 -translate-y-[62%] rounded-full bg-brand-blue/25 blur-3xl"
        />

        <Container className="relative py-20 sm:py-24 lg:py-28">
          <div className="mx-auto max-w-4xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-sm font-medium text-cyan-200 backdrop-blur-xl">
              <SearchCheck aria-hidden="true" className="size-4" />
              {FREE_AUDIT_PRODUCT_NAME}
            </div>

            <h1 className="mt-6 font-heading text-4xl font-bold leading-tight tracking-[-0.05em] text-white sm:text-5xl lg:text-6xl">
              Find out what&apos;s holding your website back.
            </h1>

            <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-slate-300 sm:text-xl">
              Get a website growth audit that evaluates search visibility,
              content, conversion opportunities, local SEO, technical health,
              and performance.
            </p>

            <p className="mt-8 text-sm font-medium text-cyan-300">
              <Sparkles aria-hidden="true" className="mr-2 inline size-4" />
              No credit card required.
            </p>
          </div>
        </Container>
      </section>

      <Section className="bg-background">
        <Container>
          <WebsiteAuditTool />
        </Container>
      </Section>

      <Section className="bg-slate-50/80">
        <Container className="space-y-10">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-blue">
              What the audit checks
            </p>
            <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight text-brand sm:text-4xl">
              Built for business owners, not technical auditors.
            </h2>
            <p className="mt-4 text-base leading-7 text-muted">
              The question is simple: is the website helping the business grow,
              and what should be fixed first?
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {AUDIT_CATEGORY_OVERVIEW.map((item) => (
              <div
                key={item.title}
                className="rounded-[1.5rem] border border-border bg-white p-5 shadow-sm"
              >
                <h3 className="font-heading text-lg font-semibold text-brand">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      <Section className="bg-background">
        <Container className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-blue">
              {PROFESSIONAL_AUDIT_PRODUCT_NAME}
            </p>
            <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight text-brand sm:text-4xl">
              See what you get when you unlock the full report.
            </h2>
            <p className="mt-4 max-w-xl text-base leading-7 text-muted">
              The free report shows the score, category results, and first
              priorities. The professional report adds the complete
              recommendations, action plan, evidence, and PDF —{" "}
              {pricePresentation}.
            </p>
          </div>
          <AuditTierComparison />
        </Container>
      </Section>

      <CTASection
        title="Want help implementing the findings?"
        description="JS Solutions can help prioritize and implement the website, SEO, local visibility, conversion, and performance improvements identified in the audit."
        primaryLabel="Request a Consultation"
        primaryHref="/contact"
        secondaryLabel="Run My Free Website Audit"
        secondaryHref="#audit-form"
      />
    </>
  );
}
