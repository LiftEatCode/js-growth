"use client";

import { useRef, useState } from "react";

import { AuditForm } from "@/components/website-audit/audit-form";
import { AuditResults } from "@/components/website-audit/audit-results";
import type {
  WebsiteAuditSuccessResponse,
} from "@/lib/website-audit/types";

export function WebsiteAuditTool() {
  const [result, setResult] =
    useState<WebsiteAuditSuccessResponse | null>(
      null,
    );

  const resultsRef =
    useRef<HTMLDivElement>(null);

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
      <div className="mx-auto max-w-3xl rounded-3xl border border-border/70 bg-card/90 p-5 shadow-2xl shadow-primary/5 backdrop-blur sm:p-8">
        <AuditForm
          onAuditComplete={handleAuditComplete}
        />
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
  const categories = [
    {
      title: "Technical SEO",
      description:
        "Review metadata, canonical URLs, mobile setup, structured data, and page architecture.",
    },
    {
      title: "Search Optimization",
      description:
        "Evaluate titles, descriptions, internal links, headings, and social-sharing metadata.",
    },
    {
      title: "Local SEO",
      description:
        "Look for phone, location, service-area, address, and LocalBusiness signals.",
    },
    {
      title: "Accessibility",
      description:
        "Identify missing image text and basic accessibility opportunities.",
    },
  ];

  return (
    <section
      aria-labelledby="audit-preview-heading"
      className="rounded-3xl border border-dashed border-border bg-card/40 p-6 sm:p-10"
    >
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
          Instant analysis
        </p>

        <h2
          id="audit-preview-heading"
          className="mt-3 text-3xl font-semibold tracking-tight text-foreground"
        >
          See what may be holding your website back.
        </h2>

        <p className="mt-4 leading-7 text-muted-foreground">
          Enter your homepage above to receive a scored
          report, prioritized findings, and practical
          recommendations.
        </p>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {categories.map((category) => (
          <article
            key={category.title}
            className="rounded-2xl border border-border bg-background/80 p-5"
          >
            <h3 className="font-semibold text-foreground">
              {category.title}
            </h3>

            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {category.description}
            </p>
          </article>
        ))}
      </div>

      <p className="mt-6 text-center text-xs leading-5 text-muted-foreground">
        This MVP analyzes the submitted homepage. Full-site
        crawling and browser-based performance testing will
        be added in later versions.
      </p>
    </section>
  );
}