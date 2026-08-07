import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  TrendingUp,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import type {
  AuditOpportunity,
  WebsiteAuditResult,
} from "@/lib/website-audit/types";

interface AuditConversionCtaProps {
  opportunity: AuditOpportunity;
  summary: WebsiteAuditResult["summary"];
  websiteUrl: string;
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
}: AuditConversionCtaProps) {
  const hostname = getHostname(websiteUrl);

  const contactHref = `/contact?service=website-optimization&website=${encodeURIComponent(
    websiteUrl,
  )}`;

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
            Turn the audit into a growth plan
          </div>

          <h2
            id="audit-conversion-heading"
            className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl"
          >
            Want JS Solutions to fix the highest-impact issues?
          </h2>

          <p className="mt-4 max-w-2xl text-base leading-7 text-primary-foreground/80 sm:text-lg">
            We can review the findings for {hostname},
            prioritize the work, and create a practical
            implementation plan based on your business goals.
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
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button
              size="lg"
              variant="secondary"
              nativeButton={false}
              render={<Link href={contactHref} />}
            >
              Request an improvement plan
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

          <p className="mt-5 text-xs leading-5 text-primary-foreground/65">
            Estimates are directional and depend on traffic,
            competition, conversion rate, offer quality, and
            implementation.
          </p>
        </div>
      </div>
    </section>
  );
}