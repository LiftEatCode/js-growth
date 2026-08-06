import {
    Clock3,
    ExternalLink,
    Globe2,
    ShieldCheck,
    Sparkles,
  } from "lucide-react";
  
  import { Badge } from "@/components/ui/badge";
  import type { ExecutiveSummary } from "@/lib/website-audit/executive-summary";
  import type { WebsiteAuditResult } from "@/lib/website-audit/types";
  
  interface AuditReportHeroProps {
    result: WebsiteAuditResult;
    executiveSummary: ExecutiveSummary;
  }
  
  function getScoreLabel(score: number): string {
    if (score >= 90) {
      return "Excellent";
    }
  
    if (score >= 80) {
      return "Very Good";
    }
  
    if (score >= 70) {
      return "Good";
    }
  
    if (score >= 60) {
      return "Needs Improvement";
    }
  
    return "High Priority";
  }
  
  function getLetterGrade(score: number): string {
    if (score >= 97) return "A+";
    if (score >= 93) return "A";
    if (score >= 90) return "A-";
    if (score >= 87) return "B+";
    if (score >= 83) return "B";
    if (score >= 80) return "B-";
    if (score >= 77) return "C+";
    if (score >= 73) return "C";
    if (score >= 70) return "C-";
    if (score >= 67) return "D+";
    if (score >= 63) return "D";
    if (score >= 60) return "D-";
  
    return "F";
  }
  
  function getScoreClasses(score: number): string {
    if (score >= 90) {
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400";
    }
  
    if (score >= 75) {
      return "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-400";
    }
  
    if (score >= 60) {
      return "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400";
    }
  
    return "border-destructive/30 bg-destructive/10 text-destructive";
  }
  
  function formatDate(value: string): string {
    const date = new Date(value);
  
    if (Number.isNaN(date.getTime())) {
      return "Unknown date";
    }
  
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  }
  
  function formatMinutes(minutes: number): string {
    if (minutes <= 0) {
      return "No estimated work";
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
  
  function getHostname(url: string): string {
    try {
      return new URL(url).hostname.replace(/^www\./, "");
    } catch {
      return url;
    }
  }
  
  export function AuditReportHero({
    result,
    executiveSummary,
  }: AuditReportHeroProps) {
    const hostname = getHostname(
      result.metadata.finalUrl,
    );
  
    return (
      <section
        aria-labelledby="audit-report-heading"
        className="relative overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8 lg:p-10"
      >
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,var(--primary)_0,transparent_30%),radial-gradient(circle_at_bottom_right,var(--muted)_0,transparent_30%)] opacity-10"
        />
  
        <div className="relative grid gap-8 lg:grid-cols-[1fr_280px] lg:items-center">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className="border-primary/30 bg-primary/10 text-primary"
              >
                <Sparkles
                  aria-hidden="true"
                  className="mr-1 size-3.5"
                />
                Website analysis
              </Badge>
  
              <Badge variant="outline">
                HTTP {result.metadata.statusCode}
              </Badge>
  
              <Badge variant="secondary">
                {result.metadata.contentType ??
                  "Unknown content type"}
              </Badge>
            </div>
  
            <div className="mt-6 flex items-center gap-3 text-sm text-muted-foreground">
              <Globe2
                aria-hidden="true"
                className="size-4"
              />
  
              <span className="truncate">
                {hostname}
              </span>
            </div>
  
            <h1
              id="audit-report-heading"
              className="mt-3 break-words text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl"
            >
              {executiveSummary.heading}
            </h1>
  
            <p className="mt-5 max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">
              {executiveSummary.summary}
            </p>
  
            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-2">
                <Clock3
                  aria-hidden="true"
                  className="size-4 text-primary"
                />
  
                Audited{" "}
                {formatDate(
                  result.metadata.fetchedAt,
                )}
              </span>
  
              <span className="inline-flex items-center gap-2">
                <ShieldCheck
                  aria-hidden="true"
                  className="size-4 text-primary"
                />
  
                Read-only public analysis
              </span>
  
              <span className="inline-flex items-center gap-2">
                <Clock3
                  aria-hidden="true"
                  className="size-4 text-primary"
                />
  
                Estimated fixes:{" "}
                {formatMinutes(
                  result.summary
                    .estimatedFixMinutes,
                )}
              </span>
            </div>
  
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <a
                href={result.metadata.finalUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90"
              >
                Open website
  
                <ExternalLink
                  aria-hidden="true"
                  className="size-4"
                />
              </a>
  
              {result.metadata.requestedUrl !==
              result.metadata.finalUrl ? (
                <p className="break-all text-xs text-muted-foreground">
                  Requested:{" "}
                  {result.metadata.requestedUrl}
                </p>
              ) : null}
            </div>
          </div>
  
          <div className="flex justify-center lg:justify-end">
            <div
              className={`flex size-56 flex-col items-center justify-center rounded-full border-8 text-center shadow-inner ${getScoreClasses(
                result.overallScore,
              )}`}
            >
              <span className="text-sm font-medium uppercase tracking-[0.2em]">
                Health score
              </span>
  
              <span className="mt-2 text-6xl font-bold tracking-tight">
                {result.overallScore}
              </span>
  
              <span className="mt-1 text-lg font-semibold">
                {getLetterGrade(
                  result.overallScore,
                )}
              </span>
  
              <span className="mt-1 text-sm">
                {getScoreLabel(
                  result.overallScore,
                )}
              </span>
            </div>
          </div>
        </div>
      </section>
    );
  }