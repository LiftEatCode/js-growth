import {
    AlertTriangle,
    CheckCircle2,
    Lightbulb,
    XCircle,
  } from "lucide-react";
  
  import { Badge } from "@/components/ui/badge";
  import type {
    AuditCategory,
    AuditFinding,
    AuditStatus,
  } from "@/lib/website-audit/types";
  
  interface FindingCardProps {
    finding: AuditFinding;
  }
  
  const CATEGORY_LABELS: Record<AuditCategory, string> = {
    technical: "Technical SEO",
    seo: "Search Optimization",
    content: "Content",
    accessibility: "Accessibility",
    local: "Local SEO",
    performance: "Performance",
  };
  
  function getStatusLabel(status: AuditStatus): string {
    if (status === "pass") {
      return "Passed";
    }
  
    if (status === "warning") {
      return "Warning";
    }
  
    return "Failed";
  }
  
  function getStatusClasses(status: AuditStatus): {
    card: string;
    icon: string;
    badge: string;
  } {
    if (status === "pass") {
      return {
        card: "border-emerald-500/20 bg-emerald-500/5",
        icon: "text-emerald-600 dark:text-emerald-400",
        badge:
          "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
      };
    }
  
    if (status === "warning") {
      return {
        card: "border-amber-500/20 bg-amber-500/5",
        icon: "text-amber-600 dark:text-amber-400",
        badge:
          "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
      };
    }
  
    return {
      card: "border-destructive/20 bg-destructive/5",
      icon: "text-destructive",
      badge:
        "border-destructive/30 bg-destructive/10 text-destructive",
    };
  }
  
  function StatusIcon({
    status,
    className,
  }: {
    status: AuditStatus;
    className?: string;
  }) {
    if (status === "pass") {
      return (
        <CheckCircle2 aria-hidden="true" className={className} />
      );
    }
  
    if (status === "warning") {
      return (
        <AlertTriangle aria-hidden="true" className={className} />
      );
    }
  
    return <XCircle aria-hidden="true" className={className} />;
  }
  
  export function FindingCard({
    finding,
  }: FindingCardProps) {
    const classes = getStatusClasses(finding.status);
  
    return (
      <article
        className={`rounded-2xl border p-5 ${classes.card}`}
      >
        <div className="flex items-start gap-4">
          <div className="mt-0.5 shrink-0">
            <StatusIcon
              status={finding.status}
              className={`size-5 ${classes.icon}`}
            />
          </div>
  
          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  {finding.title}
                </h3>
  
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {finding.description}
                </p>
              </div>
  
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant="outline"
                  className={classes.badge}
                >
                  {getStatusLabel(finding.status)}
                </Badge>
  
                <Badge variant="secondary">
                  {CATEGORY_LABELS[finding.category]}
                </Badge>
              </div>
            </div>
  
            {finding.recommendation ? (
              <div className="flex items-start gap-3 rounded-xl border border-border/70 bg-background/70 p-4">
                <Lightbulb
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0 text-primary"
                />
  
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Recommendation
                  </p>
  
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    {finding.recommendation}
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </article>
    );
  }