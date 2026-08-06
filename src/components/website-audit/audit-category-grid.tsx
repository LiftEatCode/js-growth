import {
    Accessibility,
    FileText,
    Gauge,
    MapPin,
    Search,
    Settings2,
  } from "lucide-react";
  
  import type {
    AuditCategory,
    AuditCategoryScore,
    AuditFinding,
  } from "@/lib/website-audit/types";
  
  interface AuditCategoryGridProps {
    categoryScores: AuditCategoryScore[];
    findings: AuditFinding[];
  }
  
  const CATEGORY_ICONS = {
    technical: Settings2,
    seo: Search,
    content: FileText,
    accessibility: Accessibility,
    local: MapPin,
    performance: Gauge,
  } satisfies Record<AuditCategory, typeof Search>;
  
  function getScoreLabel(percent: number): string {
    if (percent >= 90) {
      return "Excellent";
    }
  
    if (percent >= 75) {
      return "Strong";
    }
  
    if (percent >= 60) {
      return "Needs attention";
    }
  
    return "High priority";
  }
  
  function getProgressClasses(percent: number): string {
    if (percent >= 90) {
      return "bg-emerald-500";
    }
  
    if (percent >= 75) {
      return "bg-blue-500";
    }
  
    if (percent >= 60) {
      return "bg-amber-500";
    }
  
    return "bg-destructive";
  }
  
  export function AuditCategoryGrid({
    categoryScores,
    findings,
  }: AuditCategoryGridProps) {
    return (
      <section
        aria-labelledby="category-scores-heading"
        className="space-y-5"
      >
        <div>
          <p className="text-sm font-medium text-primary">
            Category performance
          </p>
  
          <h2
            id="category-scores-heading"
            className="mt-1 text-2xl font-semibold tracking-tight text-foreground"
          >
            Audit score breakdown
          </h2>
        </div>
  
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {categoryScores.map((categoryScore) => {
            const Icon =
              CATEGORY_ICONS[
                categoryScore.category
              ];
  
            const percentage =
              categoryScore.maxScore === 0
                ? 0
                : Math.round(
                    (categoryScore.score /
                      categoryScore.maxScore) *
                      100,
                  );
  
            const issueCount = findings.filter(
              (finding) =>
                finding.category ===
                  categoryScore.category &&
                finding.status !== "pass",
            ).length;
  
            return (
              <article
                key={categoryScore.category}
                className="rounded-2xl border border-border bg-card p-6 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon
                        aria-hidden="true"
                        className="size-5"
                      />
                    </div>
  
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {categoryScore.label}
                      </h3>
  
                      <p className="mt-1 text-xs text-muted-foreground">
                        {issueCount} actionable{" "}
                        {issueCount === 1
                          ? "issue"
                          : "issues"}
                      </p>
                    </div>
                  </div>
  
                  <div className="text-right">
                    <p className="text-2xl font-bold tracking-tight text-foreground">
                      {percentage}%
                    </p>
  
                    <p className="text-xs text-muted-foreground">
                      {categoryScore.score}/
                      {categoryScore.maxScore}
                    </p>
                  </div>
                </div>
  
                <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full transition-[width] duration-500 ${getProgressClasses(
                      percentage,
                    )}`}
                    style={{
                      width: `${percentage}%`,
                    }}
                  />
                </div>
  
                <p className="mt-3 text-sm font-medium text-foreground">
                  {getScoreLabel(percentage)}
                </p>
              </article>
            );
          })}
        </div>
      </section>
    );
  }