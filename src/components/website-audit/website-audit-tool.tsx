"use client";

import {
  CheckCircle2,
  FileSearch,
  MousePointerClick,
  Search,
  ShieldCheck,
  Sparkles,
  Timer,
} from "lucide-react";
import { useRef, useState } from "react";

import { AuditForm } from "@/components/website-audit/audit-form";
import { AuditResults } from "@/components/website-audit/audit-results";
import {
  Card,
  FeatureCard,
} from "@/components/ui";
import {
  AUDIT_CATEGORY_OVERVIEW,
  FREE_AUDIT_PRODUCT_NAME,
} from "@/lib/payments/product";
import { trackCommercialEvent, COMMERCIAL_EVENTS } from "@/lib/analytics/commercial-events";
import type { WebsiteAuditSuccessResponse } from "@/lib/website-audit/types";

const categoryIcons = [
  Search,
  ShieldCheck,
  FileSearch,
  MousePointerClick,
  Sparkles,
  Timer,
] as const;

export function WebsiteAuditTool() {
  const [result, setResult] =
    useState<WebsiteAuditSuccessResponse | null>(null);

  const resultsRef = useRef<HTMLDivElement>(null);

  function handleAuditComplete(
    auditResult: WebsiteAuditSuccessResponse,
  ): void {
    setResult(auditResult);
    trackCommercialEvent(COMMERCIAL_EVENTS.auditCompleted, {
      report_id: auditResult.reportId,
      pages_scanned: auditResult.siteData?.crawl.crawledCount ?? 1,
      site_scan_truncated: Boolean(auditResult.siteData?.crawl.truncated),
    });

    if (auditResult.siteData) {
      trackCommercialEvent(COMMERCIAL_EVENTS.multiPageAuditCompleted, {
        report_id: auditResult.reportId,
        pages_discovered: auditResult.siteData.crawl.discoveredCount,
        pages_scanned: auditResult.siteData.crawl.crawledCount,
        truncated: auditResult.siteData.crawl.truncated,
      });
    }

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
          id="audit-form"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-blue/10 bg-brand-blue/[0.045] px-3.5 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-brand-blue">
            <Sparkles
              aria-hidden="true"
              className="size-3.5"
            />

            {FREE_AUDIT_PRODUCT_NAME}
          </div>

          <h2 className="mt-5 font-heading text-3xl font-bold tracking-tight text-brand sm:text-4xl">
            Enter your website and get a clear first picture.
          </h2>

          <p className="mt-4 max-w-2xl leading-7 text-muted">
            We run a representative multi-page scan of the public site you
            submit. You&apos;ll see a Website Growth Score, category results,
            and the first issues to work on.
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
              Your free audit includes
            </p>

            <div className="mt-5 space-y-4">
              {[
                "Website Growth Score",
                "Category scores",
                "Top priority opportunities",
                "Quick wins",
                "A basic website health assessment",
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
              No credit card required
            </p>

            <p className="mt-2 text-sm leading-6 text-muted">
              The audit only reads publicly available website information. It
              does not log in, change the site, or require an account.
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
          What we review
        </p>

        <h2
          id="audit-preview-heading"
          className="mt-3 font-heading text-3xl font-bold tracking-tight text-brand sm:text-4xl"
        >
          A practical look at whether the website is helping the business grow.
        </h2>

        <p className="mt-4 leading-7 text-muted">
          This scan is a prioritized sample of important pages. It is a
          prioritization tool, not a Google ranking score or a complete crawl of
          every URL.
        </p>
      </div>

      <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {AUDIT_CATEGORY_OVERVIEW.map((category, index) => {
          const Icon = categoryIcons[index] ?? Search;

          return (
            <FeatureCard
              key={category.title}
              title={category.title}
              description={category.description}
              icon={Icon}
              tone="default"
            />
          );
        })}
      </div>
    </section>
  );
}
