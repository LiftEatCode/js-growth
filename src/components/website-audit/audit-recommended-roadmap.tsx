import {
    ArrowRight,
    CalendarClock,
    CheckCircle2,
    Clock3,
    LockKeyhole,
    Target,
  } from "lucide-react";
  
  import { Badge } from "@/components/ui/badge";
  import { buildRoadmap } from "@/lib/website-audit/roadmap";
  import type {
    AuditFinding,
    AuditPriority,
    ReportMode,
  } from "@/lib/website-audit/types";
  
  interface AuditRecommendedRoadmapProps {
    findings: AuditFinding[];
    mode?: ReportMode;
  }
  
  const PRIORITY_CLASSES: Record<
    AuditPriority,
    string
  > = {
    critical:
      "border-destructive/30 bg-destructive/10 text-destructive",
    high:
      "border-orange-500/30 bg-orange-500/10 text-orange-700 dark:text-orange-400",
    medium:
      "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
    low:
      "border-border bg-muted text-muted-foreground",
  };
  
  function formatMinutes(
    minutes: number,
  ): string {
    if (minutes <= 0) {
      return "No work";
    }
  
    if (minutes < 60) {
      return `${minutes} min`;
    }
  
    const hours = Math.floor(minutes / 60);
    const remaining = minutes % 60;
  
    if (remaining === 0) {
      return `${hours} hr`;
    }
  
    return `${hours}h ${remaining}m`;
  }
  
  export function AuditRecommendedRoadmap({
    findings,
    mode = "public",
  }: AuditRecommendedRoadmapProps) {
    const roadmap = buildRoadmap(findings);
  
    const isPublic = mode === "public";
    const isClient = mode === "client";
  
    return (
      <section
        aria-labelledby="roadmap-heading"
        className="space-y-6"
      >
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <div className="flex items-center gap-2 text-sm font-medium text-primary">
            <Target
              aria-hidden="true"
              className="size-4"
            />
  
            Implementation strategy
          </div>
  
          <h2
            id="roadmap-heading"
            className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl"
          >
            Recommended roadmap
          </h2>
  
          <p className="mt-3 max-w-3xl leading-7 text-muted-foreground">
            The roadmap organizes detected issues into a
            practical sequence based on priority, business
            impact, and implementation effort.
          </p>
  
          {isPublic ? (
            <div className="mt-5 flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4">
              <LockKeyhole
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0 text-primary"
              />
  
              <div>
                <p className="text-sm font-medium text-foreground">
                  Free report preview
                </p>
  
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  This report shows the recommended phases and
                  key priorities. Detailed implementation
                  recommendations are reserved for the full
                  strategy review.
                </p>
              </div>
            </div>
          ) : null}
        </div>
  
        <div className="space-y-5">
          {roadmap.map((phase, index) => {
            const visibleFindings = isPublic
              ? phase.findings.slice(0, 2)
              : phase.findings;
  
            const lockedCount = Math.max(
              phase.findings.length -
                visibleFindings.length,
              0,
            );
  
            return (
              <article
                key={phase.id}
                className="rounded-2xl border border-border bg-card p-6 shadow-sm"
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <Badge
                        className={
                          PRIORITY_CLASSES[
                            phase.priority
                          ]
                        }
                        variant="outline"
                      >
                        {phase.priority}
                      </Badge>
  
                      <span className="text-sm text-muted-foreground">
                        Step {index + 1}
                      </span>
                    </div>
  
                    <h3 className="mt-3 text-xl font-semibold text-foreground sm:text-2xl">
                      {phase.title}
                    </h3>
  
                    <p className="mt-2 max-w-2xl leading-7 text-muted-foreground">
                      {phase.description}
                    </p>
                  </div>
  
                  {!isPublic ? (
                    <div className="rounded-xl border border-border bg-background p-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CalendarClock
                          aria-hidden="true"
                          className="size-4 text-primary"
                        />
  
                        Estimated effort
                      </div>
  
                      <p className="mt-2 text-xl font-bold text-foreground">
                        {formatMinutes(
                          phase.estimatedFixMinutes,
                        )}
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-border bg-background p-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Issues in this phase
                      </p>
  
                      <p className="mt-2 text-xl font-bold text-foreground">
                        {phase.findings.length}
                      </p>
                    </div>
                  )}
                </div>
  
                <div className="mt-6 space-y-3">
                  {visibleFindings.map(
                    (finding) => (
                      <div
                        key={finding.id}
                        className="flex items-start gap-3 rounded-xl border border-border bg-background p-4"
                      >
                        <CheckCircle2
                          aria-hidden="true"
                          className="mt-0.5 size-4 shrink-0 text-primary"
                        />
  
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="font-medium text-foreground">
                              {finding.title}
                            </h4>
  
                            {!isPublic &&
                            finding.quickWin ? (
                              <Badge variant="secondary">
                                Quick Win
                              </Badge>
                            ) : null}
                          </div>
  
                          <p className="mt-1 text-sm leading-6 text-muted-foreground">
                            {finding.description}
                          </p>
  
                          {!isPublic &&
                          finding.recommendation ? (
                            <div className="mt-3 flex items-start gap-2 text-sm text-primary">
                              <ArrowRight
                                aria-hidden="true"
                                className="mt-0.5 size-3.5 shrink-0"
                              />
  
                              <span>
                                {
                                  finding.recommendation
                                }
                              </span>
                            </div>
                          ) : null}
  
                          {isClient ? (
                            <div className="mt-3 rounded-xl border border-dashed border-primary/30 bg-primary/5 p-3">
                              <p className="text-xs font-medium text-foreground">
                                Client implementation guidance
                              </p>
  
                              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                                AI-generated implementation
                                steps will be shown here once
                                the client AI layer is enabled.
                              </p>
                            </div>
                          ) : null}
                        </div>
  
                        {!isPublic ? (
                          <div className="flex items-center gap-1 whitespace-nowrap text-xs text-muted-foreground">
                            <Clock3
                              aria-hidden="true"
                              className="size-3.5"
                            />
  
                            {formatMinutes(
                              finding.estimatedFixMinutes,
                            )}
                          </div>
                        ) : null}
                      </div>
                    ),
                  )}
                </div>
  
                {isPublic &&
                lockedCount > 0 ? (
                  <div className="mt-4 flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
                    <LockKeyhole
                      aria-hidden="true"
                      className="size-4 shrink-0 text-primary"
                    />
  
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">
                        {lockedCount} additional{" "}
                        {lockedCount === 1
                          ? "action"
                          : "actions"}{" "}
                        locked.
                      </span>{" "}
                      The full strategy review includes
                      detailed recommendations and estimated
                      implementation effort.
                    </p>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      </section>
    );
  }