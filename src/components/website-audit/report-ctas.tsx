"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";

import { Button, GridPattern } from "@/components/ui";
import { POLICY_ROUTES } from "@/content/legal/policy-meta";
import { COMMERCIAL_EVENTS, trackCommercialEvent } from "@/lib/analytics/commercial-events";
import {
  getProfessionalAuditPricePresentation,
  PROFESSIONAL_AUDIT_PRODUCT_NAME,
  PROFESSIONAL_AUDIT_TAX_DISCLOSURE,
} from "@/lib/payments/product";
import { FREE_AI_CAPABILITY_COPY } from "@/lib/website-audit/ai-interpretation/copy";

interface ReportUpgradeCtaProps {
  showUpgradeCta: boolean;
  reportId?: string;
  children?: React.ReactNode;
}

interface ReportImplementationCtaProps {
  showImplementationCta: boolean;
}

const PROFESSIONAL_BENEFITS = [
  "Complete issue breakdown",
  "Full recommendations",
  "Executive growth analysis",
  "30–90 day action plan",
  "Complete quick-win list",
  "Technical evidence",
  "Estimated implementation effort",
  "Competitive comparison",
  "Professional report / PDF access",
];

export function ReportUpgradeCta({
  showUpgradeCta,
  reportId,
  children,
}: ReportUpgradeCtaProps) {
  const [checkoutStarted, setCheckoutStarted] = useState(false);

  if (!showUpgradeCta) {
    return null;
  }

  const pricePresentation = getProfessionalAuditPricePresentation();

  return (
    <section
      id="unlock-full-report"
      className="print:hidden relative overflow-hidden rounded-[2rem] border border-slate-800 bg-brand p-6 text-white shadow-soft sm:p-8 lg:p-10"
    >
      <GridPattern className="opacity-30" />
      <div className="relative">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-300">
          {PROFESSIONAL_AUDIT_PRODUCT_NAME}
        </p>
        <h2 className="mt-3 max-w-2xl font-heading text-3xl font-bold tracking-tight">
          Unlock your Professional Website Growth Audit
        </h2>
        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
          This free report already shows real issues. The professional report
          gives you the complete roadmap: full recommendations, an action plan,
          evidence, and a PDF you can keep.
        </p>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300">
          {FREE_AI_CAPABILITY_COPY}
        </p>
        <p className="mt-4 text-lg font-semibold text-white">
          {pricePresentation}
        </p>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-400">
          {PROFESSIONAL_AUDIT_TAX_DISCLOSURE}
        </p>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {PROFESSIONAL_BENEFITS.map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-slate-200">
              <CheckCircle2
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0 text-cyan-300"
              />
              {item}
            </li>
          ))}
        </ul>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          {reportId ? (
            <form
              action={`/api/reports/${reportId}/checkout`}
              method="post"
              onSubmit={(event) => {
                if (checkoutStarted) {
                  event.preventDefault();
                  return;
                }

                setCheckoutStarted(true);
                trackCommercialEvent(
                  COMMERCIAL_EVENTS.professionalCheckoutStarted,
                );
              }}
            >
              <Button
                size="lg"
                type="submit"
                className="w-full sm:w-auto"
                disabled={checkoutStarted}
              >
                Unlock Full Report
                <ArrowRight aria-hidden="true" className="size-4" />
              </Button>
            </form>
          ) : (
            <Button
              size="lg"
              nativeButton={false}
              render={<Link href="/contact" />}
            >
              Get Full Report
              <ArrowRight aria-hidden="true" className="size-4" />
            </Button>
          )}
        </div>
        <p className="mt-4 text-sm text-slate-400">
          Payment is securely processed through Stripe Checkout. One-time
          purchase — not a subscription.
        </p>
        <p className="mt-2 max-w-2xl text-xs leading-6 text-slate-400">
          By purchasing, you agree to the{" "}
          <Link
            href={POLICY_ROUTES.terms}
            className="text-cyan-200 underline underline-offset-2 hover:text-white"
          >
            Terms
          </Link>{" "}
          and{" "}
          <Link
            href={POLICY_ROUTES.refund}
            className="text-cyan-200 underline underline-offset-2 hover:text-white"
          >
            Refund Policy
          </Link>
          . See our{" "}
          <Link
            href={POLICY_ROUTES.privacy}
            className="text-cyan-200 underline underline-offset-2 hover:text-white"
          >
            Privacy Policy
          </Link>
          .
        </p>
        {children ? <div className="mt-8">{children}</div> : null}
      </div>
    </section>
  );
}

export function ReportImplementationCta({
  showImplementationCta,
}: ReportImplementationCtaProps) {
  if (!showImplementationCta) {
    return null;
  }

  return (
    <section className="print:hidden overflow-hidden rounded-[1.75rem] border border-border bg-white p-6 shadow-sm sm:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-blue">
        Next step
      </p>
      <h2 className="mt-3 font-heading text-2xl font-semibold tracking-tight text-brand sm:text-3xl">
        Want help implementing these improvements?
      </h2>
      <p className="mt-4 max-w-3xl leading-7 text-muted">
        JS Solutions can help prioritize and implement the website, SEO, local
        visibility, conversion, and performance improvements identified in this
        audit. We do not guarantee rankings, traffic, or revenue.
      </p>
      <div className="mt-6">
        <Button nativeButton={false} render={<Link href="/contact" />}>
          Request a Consultation
          <ArrowRight aria-hidden="true" className="size-4" />
        </Button>
      </div>
    </section>
  );
}
