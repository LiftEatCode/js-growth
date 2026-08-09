import type { Metadata } from "next";
import {
  SearchCheck,
  Sparkles,
} from "lucide-react";

import { CTASection } from "@/components/marketing";
import { WebsiteAuditTool } from "@/components/website-audit/website-audit-tool";
import {
  Container,
  GridPattern,
  Section,
} from "@/components/ui";

export const metadata: Metadata = {
  title: "Website Audit",
  description:
    "Run a free website audit to check technical SEO, search optimization, local signals, accessibility, and content issues that may be holding your business back.",
};

export default function WebsiteAuditPage() {
  return (
    <>
      <section className="relative isolate overflow-hidden bg-brand text-white">
        <GridPattern className="opacity-45" />

        <div
          aria-hidden="true"
          className="absolute left-1/2 top-0 -z-10 size-[48rem] -translate-x-1/2 -translate-y-[62%] rounded-full bg-brand-blue/25 blur-3xl"
        />

        <div
          aria-hidden="true"
          className="absolute -right-40 top-1/3 -z-10 size-[30rem] rounded-full bg-brand-cyan/15 blur-3xl"
        />

        <Container className="relative py-20 sm:py-24 lg:py-28">
          <div className="mx-auto max-w-4xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-sm font-medium text-cyan-200 backdrop-blur-xl">
              <SearchCheck
                aria-hidden="true"
                className="size-4"
              />

              Free Website Audit
            </div>

            <h1 className="mt-6 font-heading text-4xl font-bold leading-tight tracking-[-0.05em] text-white sm:text-5xl lg:text-6xl">
              Find what is holding your website back.
            </h1>

            <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-slate-300 sm:text-xl">
              Enter your homepage to get a scored report covering technical
              SEO, search optimization, local signals, accessibility, and
              content — plus practical recommendations you can act on.
            </p>

            <div className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-cyan-300">
              <Sparkles
                aria-hidden="true"
                className="size-4"
              />

              Actionable results in one report
            </div>
          </div>
        </Container>
      </section>

      <Section className="bg-background">
        <Container>
          <WebsiteAuditTool />
        </Container>
      </Section>

      <CTASection
        title="Want help fixing the issues?"
        description="Share your audit results and we will help prioritize the website, Local SEO, and conversion improvements that matter most for your business."
        primaryLabel="Talk with JS Solutions"
        primaryHref="/contact"
      />
    </>
  );
}