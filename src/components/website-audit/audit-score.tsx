import {
    AlertTriangle,
    CheckCircle2,
    XCircle,
  } from "lucide-react";
  
  import type {
    AuditCategoryScore,
    WebsiteAuditResult,
  } from "@/lib/website-audit/types";
  
  interface AuditScoreProps {
    overallScore: number;
    categoryScores: AuditCategoryScore[];
    summary: WebsiteAuditResult["summary"];
  }
  
  function getScoreLabel(score: number): string {
    if (score >= 90) {
      return "Excellent";
    }
  
    if (score >= 75) {
      return "Good";
    }
  
    if (score >= 60) {
      return "Needs Improvement";
    }
  
    return "High Priority";
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
  
  function getProgressClasses(score: number): string {
    if (score >= 90) {
      return "bg-emerald-500";
    }
  
    if (score >= 75) {
      return "bg-blue-500";
    }
  
    if (score >= 60) {
      return "bg-amber-500";
    }
  
    return "bg-destructive";
  }
  
  export function AuditScore({
    overallScore,
    categoryScores,
    summary,
  }: AuditScoreProps) {
    return (
      <section
        aria-labelledby="audit-score-heading"
        className="rounded-2xl border border-border bg-card p-6 shadow-sm"
      >
        <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
          <div className="flex flex-col items-center justify-center text-center">
            <div
              className={`flex size-40 flex-col items-center justify-center rounded-full border-8 ${getScoreClasses(
                overallScore,
              )}`}
            >
              <span className="text-5xl font-bold tracking-tight">
                {overallScore}
              </span>
  
              <span className="text-sm font-medium">
                out of 100
              </span>
            </div>
  
            <h2
              id="audit-score-heading"
              className="mt-4 text-xl font-semibold text-foreground"
            >
              {getScoreLabel(overallScore)}
            </h2>
  
            <p className="mt-2 max-w-xs text-sm leading-6 text-muted-foreground">
              This score summarizes the homepage&apos;s
              technical, search, content, accessibility,
              local SEO, and basic performance signals.
            </p>
          </div>
  
          <div className="space-y-6">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                <CheckCircle2
                  aria-hidden="true"
                  className="size-5 text-emerald-600 dark:text-emerald-400"
                />
  
                <div>
                  <p className="text-2xl font-semibold text-foreground">
                    {summary.passed}
                  </p>
  
                  <p className="text-sm text-muted-foreground">
                    Passed
                  </p>
                </div>
              </div>
  
              <div className="flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                <AlertTriangle
                  aria-hidden="true"
                  className="size-5 text-amber-600 dark:text-amber-400"
                />
  
                <div>
                  <p className="text-2xl font-semibold text-foreground">
                    {summary.warnings}
                  </p>
  
                  <p className="text-sm text-muted-foreground">
                    Warnings
                  </p>
                </div>
              </div>
  
              <div className="flex items-center gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-4">
                <XCircle
                  aria-hidden="true"
                  className="size-5 text-destructive"
                />
  
                <div>
                  <p className="text-2xl font-semibold text-foreground">
                    {summary.failed}
                  </p>
  
                  <p className="text-sm text-muted-foreground">
                    Failed
                  </p>
                </div>
              </div>
            </div>
  
            <div className="space-y-4">
              {categoryScores.map((categoryScore) => {
                const percentage =
                  categoryScore.maxScore === 0
                    ? 0
                    : Math.round(
                        (categoryScore.score /
                          categoryScore.maxScore) *
                          100,
                      );
  
                return (
                  <div
                    key={categoryScore.category}
                    className="space-y-2"
                  >
                    <div className="flex items-center justify-between gap-4 text-sm">
                      <span className="font-medium text-foreground">
                        {categoryScore.label}
                      </span>
  
                      <span className="text-muted-foreground">
                        {categoryScore.score}/
                        {categoryScore.maxScore}
                      </span>
                    </div>
  
                    <div
                      role="progressbar"
                      aria-label={`${categoryScore.label} score`}
                      aria-valuemin={0}
                      aria-valuemax={categoryScore.maxScore}
                      aria-valuenow={categoryScore.score}
                      className="h-2.5 overflow-hidden rounded-full bg-muted"
                    >
                      <div
                        className={`h-full rounded-full transition-[width] duration-500 ${getProgressClasses(
                          percentage,
                        )}`}
                        style={{
                          width: `${percentage}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    );
  }