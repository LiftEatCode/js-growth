"use client";

import {
  CheckCircle2,
  Gauge,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useRef, useState } from "react";

import { AuditForm } from "@/components/website-audit/audit-form";
import { AuditResults } from "@/components/website-audit/audit-results";
import {
  Card,
  FeatureCard,
} from "@/components/ui";
import type { WebsiteAuditSuccessResponse } from "@/lib/website-audit/types";

const auditCategories = [
  {
    title: "Technical SEO",
    description:
      "Metadata, canonical setup, structured data, mobile configuration, and page architecture.",
    icon: Search,
  },
  {
    title: "Search Optimization",
    description:
      "Titles, descriptions, headings, links, page structure, and search-facing content signals.",
    icon: Gauge,
  },
  {
    title: "Local SEO",
    description:
      "Phone, address, service-area, location, and LocalBusiness signals that support local visibility.",
    icon: Sparkles,
  },
  {
    title: "Accessibility",
    description:
      "Image text, semantic structure, and common accessibility opportunities that affect usability.",
    icon: ShieldCheck,
  },
] as const;

export function WebsiteAuditTool() {
  const [result, setResult] =
    useState<WebsiteAuditSuccessResponse | null>(null);

  const resultsRef = useRef<HTMLDivElement>(null);

  function handleAuditComplete(
    auditResult: WebsiteAuditSuccessResponse,
  ): void {
    setResult(auditResult);

    window.setTimeout(() => {
      resultsRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  }

  return (
    <div className="space-y-14">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)] lg:items-start">
        <Card
          variant="elevated"
          padding="lg"
          className="overflow-hidden"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-blue/10 bg-brand-blue/[0.045] px-3.5 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-brand-blue">
            <Sparkles
              aria-hidden="true"
              className="size-3.5"
            />

            Start your audit
          </div>

          <h2 className="mt-5 font-heading text-3xl font-bold tracking-tight text-brand sm:text-4xl">
            Get a clear picture of what your website needs next.
          </h2>

          <p className="mt-4 max-w-2xl leading-7 text-muted">
            Enter your homepage and we&apos;ll analyze the technical,
            search, local, accessibility, and content signals we can evaluate
            directly from the page.
          </p>

          <div className="mt-8">
            <AuditForm
              onAuditComplete={handleAuditComplete}
            />
          </div>
        </Card>

        <div className="space-y-5">
          <Card
            variant="brand"
            padding="lg"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-blue">
              What you&apos;ll get
            </p>

            <div className="mt-5 space-y-4">
              {[
                "An overall website score and grade",
                "Priority issues that deserve attention first",
                "Category-level SEO and technical scores",
                "A practical recommended improvement roadmap",
                "Detailed findings you can review individually",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-3"
                >
                  <CheckCircle2
                    aria-hidden="true"
                    className="mt-0.5 size-5 shrink-0 text-brand-blue"
                  />

                  <p className="text-sm leading-6 text-muted">
                    {item}
                  </p>
                </div>
              ))}
            </div>
          </Card>

          <Card
            variant="elevated"
            padding="md"
          >
            <p className="font-heading text-lg font-semibold text-brand">
              Safe, read-only analysis
            </p>

            <p className="mt-2 text-sm leading-6 text-muted">
              The audit only analyzes publicly available website information.
              It does not log in, modify content, or make changes to the
              website.
            </p>
          </Card>
        </div>
      </div>

      <div
        ref={resultsRef}
        className="scroll-mt-24"
      >
        {result ? (
          <AuditResults
            result={result}
            reportId={result.reportId}
            mode="public"
          />
        ) : (
          <AuditPreview />
        )}
      </div>
    </div>
  );
}

function AuditPreview() {
  return (
    <section
      aria-labelledby="audit-preview-heading"
      className="rounded-[2rem] border border-border bg-slate-50/60 p-6 sm:p-10"
    >
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-blue">
          Instant analysis
        </p>

        <h2
          id="audit-preview-heading"
          className="mt-3 font-heading text-3xl font-bold tracking-tight text-brand sm:text-4xl"
        >
          See what the audit evaluates before you run it.
        </h2>

        <p className="mt-4 leading-7 text-muted">
          The current audit focuses on the submitted homepage and looks for
          the website signals most likely to affect visibility, usability,
          structure, and lead-generation performance.
        </p>
      </div>

      <div className="mt-10 grid gap-5 md:grid-cols-2">
        {auditCategories.map((category) => (
          <FeatureCard
            key={category.title}
            title={category.title}
            description={category.description}
            icon={category.icon}
            tone="default"
          />
        ))}
      </div>

      <Card
        variant="default"
        padding="md"
        className="mx-auto mt-8 max-w-3xl border-dashed"
      >
        <p className="text-center text-sm leading-6 text-muted">
          This version analyzes the submitted homepage. Full-site crawling,
          browser-based performance testing, and deeper competitive analysis
          can be added as the audit platform continues to expand.
        </p>
      </Card>
    </section>
  );
}