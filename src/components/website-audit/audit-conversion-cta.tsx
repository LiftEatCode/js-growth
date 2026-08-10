import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  DollarSign,
  LockKeyhole,
  TrendingUp,
} from "lucide-react";

import {
  Button,
  GridPattern,
} from "@/components/ui";
import type {
  AuditOpportunity,
  ReportMode,
  WebsiteAuditResult,
} from "@/lib/website-audit/types";

interface AuditConversionCtaProps {
  opportunity: AuditOpportunity;
  summary: WebsiteAuditResult["summary"];
  websiteUrl: string;
  mode?: ReportMode;
}

function formatMinutes(
  minutes: number,
): string {
  if (minutes <= 0) {
    return "No work estimated";
  }

  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(
    minutes / 60,
  );

  const remainingMinutes =
    minutes % 60;

  if (remainingMinutes === 0) {
    return `${hours} hr`;
  }

  return `${hours}h ${remainingMinutes}m`;
}

function formatCurrency(
  value: number,
): string {
  return new Intl.NumberFormat(
    "en-US",
    {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    },
  ).format(value);
}

function getHostname(
  url: string,
): string {
  try {
    return new URL(
      url,
    ).hostname.replace(
      /^www\./,
      "",
    );
  } catch {
    return url;
  }
}

export function AuditConversionCta({
  opportunity,
  summary,
  websiteUrl,
  mode = "public",
}: AuditConversionCtaProps) {
  const hostname =
    getHostname(websiteUrl);

  const contactHref =
    `/contact?service=website-optimization&website=${encodeURIComponent(
      websiteUrl,
    )}`;

  const isPublic =
    mode === "public";

  const isClient =
    mode === "client";

  if (isClient) {
    return (
      <section className="rounded-[1.75rem] border border-brand-blue/15 bg-brand-blue/[0.045] p-6 shadow-sm sm:p-8">
        <div className="flex items-start gap-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-brand-blue/10 bg-white text-brand-blue shadow-sm">
            <TrendingUp
              aria-hidden="true"
              className="size-5"
            />
          </span>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-blue">
              Client Workspace
            </p>

            <h2 className="mt-2 font-heading text-2xl font-semibold tracking-tight text-brand">
              Implementation is ready for planning.
            </h2>

            <p className="mt-3 max-w-3xl leading-7 text-muted">
              The client version of this report will connect audit findings to tasks, AI implementation guidance, progress tracking, and future audit comparisons.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      aria-labelledby="audit-conversion-heading"
      className="relative overflow-hidden rounded-[2rem] border border-slate-800 bg-brand px-6 py-10 text-white shadow-soft sm:px-8 lg:px-10"
    >
      <GridPattern className="opacity-35" />

      <div
        aria-hidden="true"
        className="absolute -right-28 -top-32 size-[28rem] rounded-full bg-brand-blue/25 blur-3xl"
      />

      <div className="relative grid gap-10 lg:grid-cols-[1fr_370px] lg:items-center">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-300">
            <TrendingUp
              aria-hidden="true"
              className="size-3.5"
            />

            Recommended Next Step
          </div>

          <h2
            id="audit-conversion-heading"
            className="mt-5 max-w-3xl font-heading text-3xl font-bold tracking-tight text-white sm:text-4xl"
          >
            Turn this audit into an improvement plan for{" "}
            {hostname}.
          </h2>

          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
            JS Solutions can review the report with you, prioritize the highest-value work, and build a realistic implementation plan around your business goals.
          </p>

          <div className="mt-7 flex flex-wrap gap-x-6 gap-y-3">
            <ResultSummary
              text={`${summary.highImpactFindings} high-impact ${
                summary.highImpactFindings === 1
                  ? "opportunity"
                  : "opportunities"
              }`}
            />

            <ResultSummary
              text={`${summary.quickWins} quick ${
                summary.quickWins === 1
                  ? "win"
                  : "wins"
              }`}
            />

            {!isPublic ? (
              <ResultSummary
                text={`${formatMinutes(
                  summary.estimatedFixMinutes,
                )} estimated work`}
                icon={Clock3}
              />
            ) : null}
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button
              size="xl"
              nativeButton={false}
              render={
                <Link
                  href={contactHref}
                />
              }
            >
              Request a Strategy Review

              <ArrowRight
                aria-hidden="true"
                className="ml-1 size-4"
              />
            </Button>

            <Button
              size="xl"
              variant="outline"
              nativeButton={false}
              render={
                <Link href="/services" />
              }
              className="border-white/15 bg-white/[0.04] text-white hover:border-white/25 hover:bg-white/[0.08] hover:text-white"
            >
              Explore Services
            </Button>
          </div>
        </div>

        {isPublic ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-6 backdrop-blur-xl">
            <span className="flex size-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.07] text-cyan-300">
              <LockKeyhole
                aria-hidden="true"
                className="size-5"
              />
            </span>

            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.14em] text-cyan-300">
              Strategy Review Includes
            </p>

            <ul className="mt-5 space-y-4">
              {[
                "Complete findings review",
                "Detailed recommendations",
                "Implementation effort and priority",
                "Lead and opportunity modeling",
                "Prioritized execution roadmap",
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 text-sm leading-6 text-slate-300"
                >
                  <CheckCircle2
                    aria-hidden="true"
                    className="mt-0.5 size-4 shrink-0 text-emerald-300"
                  />

                  {item}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-6 backdrop-blur-xl">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-cyan-300">
              <DollarSign
                aria-hidden="true"
                className="size-4"
              />

              Modeled Monthly Opportunity
            </div>

            <p className="mt-3 font-heading text-3xl font-bold tracking-tight text-white">
              {formatCurrency(
                opportunity
                  .monthlyRevenueOpportunity
                  .minimum,
              )}
              {" – "}
              {formatCurrency(
                opportunity
                  .monthlyRevenueOpportunity
                  .maximum,
              )}
            </p>

            <div className="mt-6 space-y-4 border-t border-white/10 pt-5">
              <DataRow
                label="Opportunity score"
                value={`${opportunity.score}/100`}
              />

              <DataRow
                label="Confidence"
                value={
                  opportunity.confidence
                }
              />

              <DataRow
                label="Estimated effort"
                value={formatMinutes(
                  opportunity.estimatedFixMinutes,
                )}
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function ResultSummary({
  text,
  icon: Icon = CheckCircle2,
}: {
  text: string;
  icon?: typeof CheckCircle2;
}) {
  return (
    <span className="inline-flex items-center gap-2 text-sm text-slate-300">
      <Icon
        aria-hidden="true"
        className="size-4 text-cyan-300"
      />

      {text}
    </span>
  );
}

function DataRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-slate-400">
        {label}
      </span>

      <span className="text-right text-sm font-semibold capitalize text-white">
        {value}
      </span>
    </div>
  );
}