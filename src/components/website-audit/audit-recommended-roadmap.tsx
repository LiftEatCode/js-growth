import {
    CalendarDays,
    Clock3,
    Target,
    Zap,
  } from "lucide-react";
  
  import { AuditPriorityActions } from "@/components/website-audit/audit-priority-actions";
  import { QuickWinsPanel } from "@/components/website-audit/quick-wins-panel";
  import type { AuditFinding } from "@/lib/website-audit/types";
  
  interface AuditRecommendedRoadmapProps {
    findings: AuditFinding[];
  }
  
  function getActionableFindings(
    findings: AuditFinding[],
  ): AuditFinding[] {
    return findings.filter(
      (finding) => finding.status !== "pass",
    );
  }
  
  function getRoadmapSummary(
    findings: AuditFinding[],
  ) {
    const actionable = getActionableFindings(findings);
  
    const estimatedFixMinutes = actionable.reduce(
      (total, finding) =>
        total + finding.estimatedFixMinutes,
      0,
    );
  
    const quickWins = actionable.filter(
      (finding) => finding.quickWin,
    ).length;
  
    const highPriority = actionable.filter(
      (finding) =>
        finding.priority === "critical" ||
        finding.priority === "high",
    ).length;
  
    return {
      actionableCount: actionable.length,
      estimatedFixMinutes,
      quickWins,
      highPriority,
    };
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
  
  export function AuditRecommendedRoadmap({
    findings,
  }: AuditRecommendedRoadmapProps) {
    const summary = getRoadmapSummary(findings);
  
    return (
      <section
        aria-labelledby="recommended-roadmap-heading"
        className="space-y-6"
      >
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-primary">
                <Target
                  aria-hidden="true"
                  className="size-4"
                />
                Recommended implementation plan
              </div>
  
              <h2
                id="recommended-roadmap-heading"
                className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl"
              >
                Recommended roadmap
              </h2>
  
              <p className="mt-3 max-w-3xl leading-7 text-muted-foreground">
                Start with critical and high-impact issues,
                then complete the lower-effort quick wins.
                This sequence prioritizes business value while
                keeping implementation practical.
              </p>
            </div>
  
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <RoadmapMetric
                icon={Target}
                label="Actions"
                value={String(
                  summary.actionableCount,
                )}
              />
  
              <RoadmapMetric
                icon={CalendarDays}
                label="High priority"
                value={String(
                  summary.highPriority,
                )}
              />
  
              <RoadmapMetric
                icon={Zap}
                label="Quick wins"
                value={String(
                  summary.quickWins,
                )}
              />
  
              <RoadmapMetric
                icon={Clock3}
                label="Total effort"
                value={formatMinutes(
                  summary.estimatedFixMinutes,
                )}
              />
            </div>
          </div>
        </div>
  
        <div className="space-y-6">
          <AuditPriorityActions
            findings={findings}
            limit={5}
          />
  
          <QuickWinsPanel
            findings={findings}
          />
        </div>
      </section>
    );
  }
  
  interface RoadmapMetricProps {
    icon: typeof Target;
    label: string;
    value: string;
  }
  
  function RoadmapMetric({
    icon: Icon,
    label,
    value,
  }: RoadmapMetricProps) {
    return (
      <div className="rounded-2xl border border-border bg-background p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Icon
            aria-hidden="true"
            className="size-3.5 text-primary"
          />
  
          {label}
        </div>
  
        <p className="mt-2 text-lg font-semibold text-foreground">
          {value}
        </p>
      </div>
    );
  }