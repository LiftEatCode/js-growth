import {
  AlertTriangle,
  Clock3,
  Gauge,
  LockKeyhole,
  TrendingUp,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type {
  AuditFinding,
  ReportMode,
} from "@/lib/website-audit/types";

interface AuditCriticalIssuesProps {
  findings: AuditFinding[];
  mode?: ReportMode;
}

function getImpactClasses(
  impact: AuditFinding["businessImpact"],
): string {
  if (impact === "high") {
    return "border-destructive/30 bg-destructive/10 text-destructive";
  }

  if (impact === "medium") {
    return "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400";
  }

  return "border-border bg-muted text-muted-foreground";
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

export function AuditCriticalIssues({
  findings,
  mode = "public",
}: AuditCriticalIssuesProps) {
  const critical = findings
    .filter(
      (finding) =>
        finding.status !== "pass" &&
        (finding.priority === "critical" ||
          finding.businessImpact === "high"),
    )
    .sort((a, b) => {
      const priorityOrder = {
        critical: 4,
        high: 3,
        medium: 2,
        low: 1,
      };

      const priorityDifference =
        priorityOrder[b.priority] -
        priorityOrder[a.priority];

      if (priorityDifference !== 0) {
        return priorityDifference;
      }

      return b.scoreImpact - a.scoreImpact;
    });

  if (critical.length === 0) {
    return null;
  }

  const isPublic = mode === "public";

  const visibleIssues = isPublic
    ? critical.slice(0, 3)
    : critical.slice(0, 6);

  const lockedCount = Math.max(
    critical.length - visibleIssues.length,
    0,
  );

  return (
    <section
      aria-labelledby="critical-issues-heading"
      className="rounded-3xl border border-destructive/20 bg-destructive/5 p-6 shadow-sm sm:p-8"
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-destructive">
            <AlertTriangle
              aria-hidden="true"
              className="size-4"
            />

            Immediate attention
          </div>

          <h2
            id="critical-issues-heading"
            className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl"
          >
            Highest-priority issues
          </h2>

          <p className="mt-3 max-w-3xl leading-7 text-muted-foreground">
            These findings represent the most important
            issues detected during the audit and should
            generally be addressed before lower-priority
            improvements.
          </p>
        </div>

        <Badge
          variant="outline"
          className="border-destructive/30 bg-destructive/10 text-destructive"
        >
          {critical.length} priority{" "}
          {critical.length === 1 ? "issue" : "issues"}
        </Badge>
      </div>

      <div className="mt-6 space-y-4">
        {visibleIssues.map((finding) => (
          <article
            key={finding.id}
            className="rounded-2xl border border-border bg-background p-5"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <h3 className="font-semibold text-foreground">
                  {finding.title}
                </h3>

                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {finding.description}
                </p>
              </div>

              <Badge
                variant="outline"
                className={getImpactClasses(
                  finding.businessImpact,
                )}
              >
                {finding.businessImpact} impact
              </Badge>
            </div>

            {isPublic ? (
              <div className="mt-4 flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
                <LockKeyhole
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0 text-primary"
                />

                <p className="text-sm leading-6 text-muted-foreground">
                  Detailed fix guidance, estimated effort,
                  and implementation recommendations are
                  included in the full strategy review.
                </p>
              </div>
            ) : (
              <>
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <Metric
                    icon={TrendingUp}
                    label="Business impact"
                    value={finding.businessImpact}
                  />

                  <Metric
                    icon={Gauge}
                    label="Score impact"
                    value={`${finding.scoreImpact} pts`}
                  />

                  <Metric
                    icon={Clock3}
                    label="Estimated effort"
                    value={formatMinutes(
                      finding.estimatedFixMinutes,
                    )}
                  />
                </div>

                {finding.recommendation ? (
                  <div className="mt-4 rounded-xl border border-border bg-muted/30 p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Recommendation
                    </p>

                    <p className="mt-2 text-sm leading-6 text-foreground">
                      {finding.recommendation}
                    </p>
                  </div>
                ) : null}
              </>
            )}
          </article>
        ))}
      </div>

      {isPublic && lockedCount > 0 ? (
        <div className="mt-5 flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-5">
          <LockKeyhole
            aria-hidden="true"
            className="mt-0.5 size-5 shrink-0 text-primary"
          />

          <div>
            <p className="font-medium text-foreground">
              {lockedCount} additional priority{" "}
              {lockedCount === 1 ? "issue is" : "issues are"}{" "}
              included in the full strategy review.
            </p>

            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              The full review includes all critical issues,
              recommended fixes, estimated effort, and the
              implementation sequence.
            </p>
          </div>
        </div>
      ) : null}
    </section>
  );
}

interface MetricProps {
  icon: typeof Gauge;
  label: string;
  value: string;
}

function Metric({
  icon: Icon,
  label,
  value,
}: MetricProps) {
  return (
    <div className="rounded-xl border border-border bg-muted/20 p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon
          aria-hidden="true"
          className="size-3.5 text-primary"
        />

        {label}
      </div>

      <p className="mt-2 text-sm font-semibold capitalize text-foreground">
        {value}
      </p>
    </div>
  );
}