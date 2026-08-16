import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";

import { Button, Container, GridPattern } from "@/components/ui";
import {
  FREE_AUDIT_PRODUCT_NAME,
} from "@/lib/payments/product";

export function HomeWebsiteAuditSection() {
  return (
    <section className="relative isolate overflow-hidden bg-slate-50">
      <GridPattern className="opacity-20" />
      <Container className="relative py-16 sm:py-20">
        <div className="overflow-hidden rounded-[2rem] border border-border bg-white p-6 shadow-sm sm:p-10 lg:grid lg:grid-cols-[1.2fr_0.8fr] lg:items-center lg:gap-12">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-blue">
              {FREE_AUDIT_PRODUCT_NAME}
            </p>
            <h2 className="mt-3 max-w-2xl font-heading text-3xl font-bold tracking-tight text-brand sm:text-4xl">
              Not sure what&apos;s holding your website back?
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-muted">
              Start with a free Website Growth Audit. You&apos;ll get a score,
              category results, and the first issues worth fixing — no credit
              card required.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Button
                size="lg"
                nativeButton={false}
                render={<Link href="/website-audit" />}
              >
                Run My Free Website Audit
                <ArrowRight aria-hidden="true" className="size-4" />
              </Button>
            </div>
          </div>
          <div className="mt-8 rounded-2xl border border-brand-blue/10 bg-brand-blue/[0.04] p-5 lg:mt-0">
            <p className="inline-flex items-center gap-2 text-sm font-medium text-brand">
              <ShieldCheck aria-hidden="true" className="size-4 text-brand-blue" />
              Read-only public analysis
            </p>
            <p className="mt-3 text-sm leading-6 text-muted">
              The audit evaluates search visibility, content, conversion paths,
              local signals, technical health, and performance from a
              representative multi-page scan of the public website you submit.
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}
