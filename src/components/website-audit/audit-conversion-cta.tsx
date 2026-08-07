import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  LockKeyhole,
  TrendingUp,
} from "lucide-react";

import { Button } from "@/components/ui/button";
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

function formatMinutes(minutes: number): string {
  if (minutes <= 0) {
    return "No work estimated";
  }

  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return `${hours} hr`;
  }

  return `${hours}h ${remainingMinutes}m`;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function getHostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
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
  const hostname = getHostname(websiteUrl);

  const contactHref = `/contact?service=website-optimization&website=${encodeURIComponent(
    websiteUrl,
  )}`;

  const isPublic = mode === "public";
  const isClient = mode === "client";

  if (isClient) {
    return (
      <section className="rounded-3xl border border-primary/20 bg-primary/5 p-6 shadow-sm sm:p-8">
        <div className="flex items-start gap-4">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <TrendingUp
              aria-hidden="true"
              className="size-5"
            />
          </div>

          <div>
            <p className="text-sm font-medium text-primary">
              Client workspace
            </p>

            <h2 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
              Implementation is ready for planning.
            </h2>

            <p className="mt-3 max-w-3xl leading-7 text-muted-foreground">
              The client version of this report will connect
              the audit findings to tasks, AI implementation
              guidance, progress tracking, and future audit
              comparisons.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      aria-labelledby="audit-conversion-heading"
      className="relative overflow-hidden rounded-3xl border border-primary/20 bg-primary px-6 py-10 text-primary-foreground shadow-lg sm:px-8 lg:px-10"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.12),transparent_30%)]"
      />

      <div className="relative grid gap-8 lg:grid-cols-[1fr_360px] lg:items-center">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-primary-foreground/80">
            <TrendingUp
              aria-hidden="true"
              className="size-4"
            />

            Recommended next step
          </div>

          <h2
            id="audit-conversion-heading"
            className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl"
          >
            Turn this audit into a growth plan for{" "}
            {hostname}.
          </h2>

          <p className="mt-4 max-w-2xl text-base leading-7 text-primary-foreground/80 sm:text-lg">
            JS Solutions can review the full audit,
            prioritize the highest-value work, and build an
            implementation plan around your business goals.
          </p>

          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-sm text-primary-foreground/85">
            <span className="inline-flex items-center gap-2">
              <CheckCircle2
                aria-hidden="true"
                className="size-4"
              />

              {summary.highImpactFindings} high-impact{" "}
              {summary.highImpactFindings === 1
                ? "opportunity"
                : "opportunities"}
            </span>

            <span className="inline-flex items-center gap-2">
              <CheckCircle2
                aria-hidden="true"
                className="size-4"
              />

              {summary.quickWins} quick{" "}
              {summary.quickWins === 1 ? "win" : "wins"}
            </span>

            {!isPublic ? (
              <span className="inline-flex items-center gap-2">
                <Clock3
                  aria-hidden="true"
                  className="size-4"
                />

                {formatMinutes(
                  summary.estimatedFixMinutes,
                )}{" "}
                estimated work
              </span>
            ) : null}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button
              size="lg"
              variant="secondary"
              nativeButton={false}
              render={<Link href={contactHref} />}
            >
              Request a strategy review

              <ArrowRight
                aria-hidden="true"
                className="ml-2 size-4"
              />
            </Button>

            <Button
              size="lg"
              variant="outline"
              className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
              nativeButton={false}
              render={<Link href="/services" />}
            >
              View services
            </Button>
          </div>
        </div>

        {isPublic ? (
          <div className="rounded-2xl border border-primary-foreground/20 bg-primary-foreground/10 p-6 backdrop-blur-sm">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary-foreground/10">
              <LockKeyhole
                aria-hidden="true"
                className="size-5"
              />
            </div>

            <p className="mt-4 text-sm text-primary-foreground/75">
              Full strategy review unlocks
            </p>

            <ul className="mt-4 space-y-3 text-sm text-primary-foreground/90">
              <li>Complete findings</li>
              <li>Detailed recommendations</li>
              <li>Estimated implementation effort</li>
              <li>Lead and revenue opportunity model</li>
              <li>Prioritized implementation roadmap</li>
            </ul>
          </div>
        ) : (
          <div className="rounded-2xl border border-primary-foreground/20 bg-primary-foreground/10 p-6 backdrop-blur-sm">
            <p className="text-sm text-primary-foreground/75">
              Modeled monthly opportunity
            </p>

            <p className="mt-2 text-3xl font-bold tracking-tight">
              {formatCurrency(
                opportunity.monthlyRevenueOpportunity.minimum,
              )}
              {" – "}
              {formatCurrency(
                opportunity.monthlyRevenueOpportunity.maximum,
              )}
            </p>

            <div className="mt-6 border-t border-primary-foreground/20 pt-5">
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-primary-foreground/75">
                  Opportunity score
                </span>

                <span className="font-semibold">
                  {opportunity.score}/100
                </span>
              </div>

              <div className="mt-3 flex items-center justify-between gap-4">
                <span className="text-sm text-primary-foreground/75">
                  Confidence
                </span>

                <span className="font-semibold capitalize">
                  {opportunity.confidence}
                </span>
              </div>

              <div className="mt-3 flex items-center justify-between gap-4">
                <span className="text-sm text-primary-foreground/75">
                  Estimated effort
                </span>

                <span className="font-semibold">
                  {formatMinutes(
                    opportunity.estimatedFixMinutes,
                  )}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}