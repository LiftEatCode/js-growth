import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";

import { Button, Container } from "@/components/ui";
import { PROFESSIONAL_AUDIT_PRODUCT_NAME } from "@/lib/payments/product";

interface PurchaseStatusScreenProps {
  title: string;
  description: string;
  reportId: string;
  tone?: "success" | "pending" | "neutral";
  primaryLabel?: string;
  primaryHref?: string;
  retryCheckout?: boolean;
}

export function PurchaseStatusScreen({
  title,
  description,
  reportId,
  tone = "neutral",
  primaryLabel = "Return to Report",
  primaryHref,
  retryCheckout = false,
}: PurchaseStatusScreenProps) {
  const reportHref = `/report/${reportId}`;
  const href = primaryHref ?? reportHref;
  const Icon = tone === "success" ? CheckCircle2 : ArrowLeft;

  return (
    <main className="min-h-screen bg-slate-50/60">
      <Container className="py-16 sm:py-24">
        <div className="mx-auto max-w-2xl rounded-[2rem] border border-border bg-white p-8 shadow-sm sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-blue">
            {PROFESSIONAL_AUDIT_PRODUCT_NAME}
          </p>
          <div className="mt-5 flex items-start gap-4">
            <span
              className={`flex size-12 shrink-0 items-center justify-center rounded-xl border ${
                tone === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-brand-blue/10 bg-brand-blue/[0.06] text-brand-blue"
              }`}
            >
              <Icon aria-hidden="true" className="size-6" />
            </span>
            <div>
              <h1 className="font-heading text-3xl font-semibold tracking-tight text-brand">
                {title}
              </h1>
              <p className="mt-3 text-base leading-7 text-muted">{description}</p>
            </div>
          </div>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button nativeButton={false} render={<Link href={href} />}>
              {primaryLabel}
              {tone === "success" ? (
                <ArrowRight aria-hidden="true" className="size-4" />
              ) : null}
            </Button>
            {retryCheckout ? (
              <form action={`/api/reports/${reportId}/checkout`} method="post">
                <Button type="submit" variant="outline">
                  Try Again
                </Button>
              </form>
            ) : null}
          </div>
        </div>
      </Container>
    </main>
  );
}
