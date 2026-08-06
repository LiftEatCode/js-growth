import {
    ArrowRight,
    Clock3,
    Gauge,
    Sparkles,
    Target,
    Zap,
  } from "lucide-react";
  
  import { Badge } from "@/components/ui/badge";
  import type {
    AuditFinding,
    AuditPriority,
    BusinessImpact,
  } from "@/lib/website-audit/types";
  
  interface AuditPriorityActionsProps {
    findings: AuditFinding[];
    limit?: number;
  }
  
  const PRIORITY_ORDER: Record<AuditPriority, number> = {
    critical: 4,
    high: 3,
    medium: 2,
    low: 1,
  };
  
  const IMPACT_ORDER: Record<BusinessImpact, number> = {
    high: 3,
    medium: 2,
    low: 1,
  };
  
  function sortPriorityFindings(
    findings: AuditFinding[],
  ): AuditFinding[] {
    return [...findings]
      .filter((finding) => finding.status !== "pass")
      .sort((a, b) => {
        const priorityDifference =
          PRIORITY_ORDER[b.priority] -
          PRIORITY_ORDER[a.priority];
  
        if (priorityDifference !== 0) {
          return priorityDifference;
        }
  
        const impactDifference =
          IMPACT_ORDER[b.businessImpact] -
          IMPACT_ORDER[a.businessImpact];
  
        if (impactDifference !== 0) {
          return impactDifference;
        }
  
        if (a.quickWin !== b.quickWin) {
          return Number(b.quickWin) - Number(a.quickWin);
        }
  
        const scoreDifference =
          b.scoreImpact - a.scoreImpact;
  
        if (scoreDifference !== 0) {
          return scoreDifference;
        }
  
        return (
          a.estimatedFixMinutes -
          b.estimatedFixMinutes
        );
      });
  }
  
  function formatMinutes(minutes: number): string {
    if (minutes <= 0) {
      return "No work required";
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
  
  function getPriorityClasses(
    priority: AuditPriority,
  ): string {
    if (priority === "critical") {
      return "border-destructive/30 bg-destructive/10 text-destructive";
    }
  
    if (priority === "high") {
      return "border-orange-500/30 bg-orange-500/10 text-orange-700 dark:text-orange-400";
    }
  
    if (priority === "medium") {
      return "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400";
    }
  
    return "border-border bg-muted text-muted-foreground";
  }
  
  function getImpactLabel(
    impact: BusinessImpact,
  ): string {
    if (impact === "high") {
      return "High impact";
    }
  
    if (impact === "medium") {
      return "Medium impact";
    }
  
    return "Low impact";
  }
  
  export function AuditPriorityActions({
    findings,
    limit = 5,
  }: AuditPriorityActionsProps) {
    const priorityFindings = sortPriorityFindings(
      findings,
    ).slice(0, limit);
  
    const totalFixMinutes = priorityFindings.reduce(
      (total, finding) =>
        total + finding.estimatedFixMinutes,
      0,
    );
  
    if (priorityFindings.length === 0) {
      return (
        <section className="rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-8">
          <div className="flex items-start gap-4">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Sparkles
                aria-hidden="true"
                className="size-5"
              />
            </div>
  
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                No priority issues detected
              </h2>
  
              <p className="mt-2 leading-7 text-muted-foreground">
                The current homepage checks did not identify
                any failed or warning findings requiring
                immediate attention.
              </p>
            </div>
          </div>
        </section>
      );
    }
  
    return (
      <section
        aria-labelledby="priority-actions-heading"
        className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8"
      >
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-primary">
              <Target
                aria-hidden="true"
                className="size-4"
              />
              Recommended work plan
            </div>
  
            <h2
              id="priority-actions-heading"
              className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl"
            >
              Top priority actions
            </h2>
  
            <p className="mt-3 max-w-3xl leading-7 text-muted-foreground">
              These are the highest-value improvements based
              on priority, business impact, scoring weight,
              effort, and quick-win potential.
            </p>
          </div>
  
          <div className="flex items-center gap-2 rounded-2xl border border-border bg-background px-4 py-3">
            <Clock3
              aria-hidden="true"
              className="size-4 text-primary"
            />
  
            <div>
              <p className="text-xs text-muted-foreground">
                Estimated work
              </p>
  
              <p className="text-sm font-semibold text-foreground">
                {formatMinutes(totalFixMinutes)}
              </p>
            </div>
          </div>
        </div>
  
        <ol className="mt-8 space-y-4">
          {priorityFindings.map((finding, index) => (
            <li
              key={finding.id}
              className="group rounded-2xl border border-border bg-background p-5 transition-colors hover:border-primary/30"
            >
              <div className="flex items-start gap-4">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-semibold text-primary">
                  {index + 1}
                </div>
  
                <div className="min-w-0 flex-1">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {finding.title}
                      </h3>
  
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        {finding.description}
                      </p>
                    </div>
  
                    <div className="flex shrink-0 flex-wrap gap-2">
                      <Badge
                        variant="outline"
                        className={getPriorityClasses(
                          finding.priority,
                        )}
                      >
                        {finding.priority}
                      </Badge>
  
                      {finding.quickWin ? (
                        <Badge
                          variant="outline"
                          className="border-primary/30 bg-primary/10 text-primary"
                        >
                          <Zap
                            aria-hidden="true"
                            className="mr-1 size-3"
                          />
                          Quick win
                        </Badge>
                      ) : null}
                    </div>
                  </div>
  
                  <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <Gauge
                        aria-hidden="true"
                        className="size-3.5"
                      />
                      {getImpactLabel(
                        finding.businessImpact,
                      )}
                    </span>
  
                    <span className="inline-flex items-center gap-1.5">
                      <Clock3
                        aria-hidden="true"
                        className="size-3.5"
                      />
                      {formatMinutes(
                        finding.estimatedFixMinutes,
                      )}
                    </span>
  
                    <span>
                      Difficulty: {finding.difficulty}
                    </span>
                  </div>
  
                  {finding.recommendation ? (
                    <div className="mt-4 flex items-start gap-2 rounded-xl bg-muted/50 p-4">
                      <ArrowRight
                        aria-hidden="true"
                        className="mt-0.5 size-4 shrink-0 text-primary"
                      />
  
                      <p className="text-sm leading-6 text-foreground">
                        {finding.recommendation}
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ol>
      </section>
    );
  }