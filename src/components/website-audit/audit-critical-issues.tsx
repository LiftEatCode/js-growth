import {
    AlertTriangle,
    ArrowRight,
    Clock3,
    TrendingUp,
  } from "lucide-react";
  
  import { Badge } from "@/components/ui/badge";
  import type { AuditFinding } from "@/lib/website-audit/types";
  
  interface AuditCriticalIssuesProps {
    findings: AuditFinding[];
  }
  
  function getImpactColor(
    impact: AuditFinding["businessImpact"],
  ) {
    switch (impact) {
      case "high":
        return "destructive";
  
      case "medium":
        return "secondary";
  
      default:
        return "outline";
    }
  }
  
  export function AuditCriticalIssues({
    findings,
  }: AuditCriticalIssuesProps) {
    const critical = findings
      .filter(
        (finding) =>
          finding.status !== "pass" &&
          (finding.priority === "critical" ||
            finding.businessImpact === "high"),
      )
      .sort(
        (a, b) =>
          b.scoreImpact - a.scoreImpact,
      )
      .slice(0, 5);
  
    if (!critical.length) {
      return null;
    }
  
    return (
      <section
        aria-labelledby="critical-issues-heading"
        className="rounded-2xl border border-red-200 bg-red-50/40 p-6 dark:border-red-900 dark:bg-red-950/20"
      >
        <div className="flex items-center gap-3">
          <AlertTriangle className="size-6 text-red-500" />
  
          <div>
            <p className="text-sm font-medium text-red-500">
              Immediate attention
            </p>
  
            <h2
              id="critical-issues-heading"
              className="text-2xl font-bold"
            >
              Highest Priority Issues
            </h2>
          </div>
        </div>
  
        <div className="mt-6 space-y-4">
          {critical.map((finding) => (
            <div
              key={finding.id}
              className="rounded-xl border bg-background p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold">
                    {finding.title}
                  </h3>
  
                  <p className="mt-2 text-sm text-muted-foreground">
                    {finding.description}
                  </p>
                </div>
  
                <Badge
                  variant={getImpactColor(
                    finding.businessImpact,
                  )}
                >
                  {finding.businessImpact.toUpperCase()}
                </Badge>
              </div>
  
              <div className="mt-5 flex flex-wrap gap-4 text-sm text-muted-foreground">
  
                <span className="inline-flex items-center gap-2">
                  <TrendingUp className="size-4 text-primary" />
  
                  Impact:
                  {" "}
                  {finding.scoreImpact}
                  {" "}
                  pts
                </span>
  
                <span className="inline-flex items-center gap-2">
                  <Clock3 className="size-4 text-primary" />
  
                  {finding.estimatedFixMinutes}
                  {" "}
                  min
                </span>
  
                <span className="inline-flex items-center gap-2 font-medium text-primary">
                  {finding.recommendation}
  
                  <ArrowRight className="size-4" />
                </span>
  
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }