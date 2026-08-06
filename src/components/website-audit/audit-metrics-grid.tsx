import {
    AlertTriangle,
    Clock3,
    TrendingUp,
    Zap,
  } from "lucide-react";
  
  import type { WebsiteAuditResult } from "@/lib/website-audit/types";
  
  interface AuditMetricsGridProps {
    summary: WebsiteAuditResult["summary"];
  }
  
  function formatMinutes(minutes: number): string {
    if (minutes <= 0) {
      return "No work";
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
  
  export function AuditMetricsGrid({
    summary,
  }: AuditMetricsGridProps) {
    const metrics = [
      {
        label: "Critical issues",
        value: summary.criticalIssues,
        description: "Require immediate attention",
        icon: AlertTriangle,
      },
      {
        label: "Quick wins",
        value: summary.quickWins,
        description: "High-value, lower-effort fixes",
        icon: Zap,
      },
      {
        label: "High impact",
        value: summary.highImpactFindings,
        description: "Strongest business opportunities",
        icon: TrendingUp,
      },
      {
        label: "Estimated fix time",
        value: formatMinutes(
          summary.estimatedFixMinutes,
        ),
        description: "Total actionable effort",
        icon: Clock3,
      },
    ];
  
    return (
      <section
        aria-label="Audit summary metrics"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        {metrics.map(
          ({
            label,
            value,
            description,
            icon: Icon,
          }) => (
            <article
              key={label}
              className="rounded-2xl border border-border bg-card p-6 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {label}
                  </p>
  
                  <p className="mt-2 text-3xl font-bold tracking-tight text-foreground">
                    {value}
                  </p>
                </div>
  
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon
                    aria-hidden="true"
                    className="size-5"
                  />
                </div>
              </div>
  
              <p className="mt-4 text-xs leading-5 text-muted-foreground">
                {description}
              </p>
            </article>
          ),
        )}
      </section>
    );
  }