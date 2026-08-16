import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";

import { Button, GridPattern } from "@/components/ui";
import type { GrowthReportViewModel } from "@/lib/website-audit/report-view";

interface ReportCtasProps {
  view: GrowthReportViewModel;
  reportId?: string;
  children?: React.ReactNode;
}

const PROFESSIONAL_BENEFITS = [
  "Complete issue breakdown",
  "Full recommendations",
  "30–90 day action plan",
  "Technical evidence",
  "Complete quick-win list",
  "Implementation priorities",
];

export function ReportUpgradeCta({
  view,
  children,
}: ReportCtasProps) {
  if (!view.capabilities.showUpgradeCta) {
    return null;
  }

  return (
    <section
      id="unlock-full-report"
      className="print:hidden relative overflow-hidden rounded-[2rem] border border-slate-800 bg-brand p-6 text-white shadow-soft sm:p-8 lg:p-10"
    >
      <GridPattern className="opacity-30" />
      <div className="relative">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-300">
          Professional report
        </p>
        <h2 className="mt-3 max-w-2xl font-heading text-3xl font-bold tracking-tight">
          Unlock the Full Website Growth Report
        </h2>
        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
          This preview already shows real issues. The professional report adds the complete recommendations, action plan, and implementation detail.
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
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button
            size="lg"
            nativeButton={false}
            render={<Link href="/contact" />}
          >
            Get Full Report
            <ArrowRight aria-hidden="true" className="size-4" />
          </Button>
        </div>
        {children ? <div className="mt-8">{children}</div> : null}
      </div>
    </section>
  );
}

export function ReportImplementationCta({ view }: ReportCtasProps) {
  if (!view.capabilities.showImplementationCta) {
    return null;
  }

  return (
    <section className="print:hidden overflow-hidden rounded-[1.75rem] border border-border bg-white p-6 shadow-sm sm:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-blue">
        Next step
      </p>
      <h2 className="mt-3 font-heading text-2xl font-semibold tracking-tight text-brand sm:text-3xl">
        Want help fixing these issues?
      </h2>
      <p className="mt-4 max-w-3xl leading-7 text-muted">
        JS Solutions can help prioritize and implement the improvements identified in this report. We do not guarantee rankings, traffic, or revenue.
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
