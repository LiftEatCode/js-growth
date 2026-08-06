import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Gauge,
  Lightbulb,
  Sparkles,
  Wrench,
  XCircle,
  Zap,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type {
  AuditCategory,
  AuditFinding,
  AuditPriority,
  AuditStatus,
  BusinessImpact,
  FixDifficulty,
} from "@/lib/website-audit/types";

interface FindingCardProps {
  finding: AuditFinding;
}

const CATEGORY_LABELS: Record<
  AuditCategory,
  string
> = {
  technical: "Technical SEO",
  seo: "Search Optimization",
  content: "Content",
  accessibility: "Accessibility",
  local: "Local SEO",
  performance: "Performance",
};

function getStatusLabel(
  status: AuditStatus,
): string {
  if (status === "pass") {
    return "Passed";
  }

  if (status === "warning") {
    return "Warning";
  }

  return "Failed";
}

function getStatusClasses(
  status: AuditStatus,
): {
  card: string;
  icon: string;
  badge: string;
} {
  if (status === "pass") {
    return {
      card: "border-emerald-500/20 bg-emerald-500/5",
      icon:
        "text-emerald-600 dark:text-emerald-400",
      badge:
        "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    };
  }

  if (status === "warning") {
    return {
      card: "border-amber-500/20 bg-amber-500/5",
      icon:
        "text-amber-600 dark:text-amber-400",
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

function getDifficultyLabel(
  difficulty: FixDifficulty,
): string {
  if (difficulty === "easy") {
    return "Easy";
  }

  if (difficulty === "medium") {
    return "Moderate";
  }

  return "Advanced";
}

function formatMinutes(
  minutes: number,
): string {
  if (minutes <= 0) {
    return "No work required";
  }

  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(
    minutes / 60,
  );

  const remainingMinutes =
    minutes % 60;

  if (remainingMinutes === 0) {
    return `${hours} hr`;
  }

  return `${hours}h ${remainingMinutes}m`;
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
      <CheckCircle2
        aria-hidden="true"
        className={className}
      />
    );
  }

  if (status === "warning") {
    return (
      <AlertTriangle
        aria-hidden="true"
        className={className}
      />
    );
  }

  return (
    <XCircle
      aria-hidden="true"
      className={className}
    />
  );
}

export function FindingCard({
  finding,
}: FindingCardProps) {
  const classes =
    getStatusClasses(
      finding.status,
    );

  const isActionable =
    finding.status !== "pass";

  return (
    <article
      className={`rounded-2xl border p-5 shadow-sm ${classes.card}`}
    >
      <div className="flex items-start gap-4">
        <div className="mt-0.5 shrink-0">
          <StatusIcon
            status={finding.status}
            className={`size-5 ${classes.icon}`}
          />
        </div>

        <div className="min-w-0 flex-1 space-y-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-foreground">
                {finding.title}
              </h3>

              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {finding.description}
              </p>
            </div>

            <div className="flex shrink-0 flex-wrap gap-2">
              <Badge
                variant="outline"
                className={classes.badge}
              >
                {getStatusLabel(
                  finding.status,
                )}
              </Badge>

              <Badge variant="secondary">
                {
                  CATEGORY_LABELS[
                    finding.category
                  ]
                }
              </Badge>

              {isActionable ? (
                <Badge
                  variant="outline"
                  className={getPriorityClasses(
                    finding.priority,
                  )}
                >
                  {finding.priority}
                </Badge>
              ) : null}

              {finding.quickWin &&
              isActionable ? (
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

          {isActionable ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <FindingMetric
                icon={Gauge}
                label="Business impact"
                value={getImpactLabel(
                  finding.businessImpact,
                )}
              />

              <FindingMetric
                icon={Wrench}
                label="Difficulty"
                value={getDifficultyLabel(
                  finding.difficulty,
                )}
              />

              <FindingMetric
                icon={Clock3}
                label="Estimated time"
                value={formatMinutes(
                  finding.estimatedFixMinutes,
                )}
              />

              <FindingMetric
                icon={Sparkles}
                label="Score impact"
                value={`${finding.scoreImpact} pts`}
              />
            </div>
          ) : null}

          {finding.recommendation ? (
            <div className="flex items-start gap-3 rounded-xl border border-border/70 bg-background/80 p-4">
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

interface FindingMetricProps {
  icon: typeof Gauge;
  label: string;
  value: string;
}

function FindingMetric({
  icon: Icon,
  label,
  value,
}: FindingMetricProps) {
  return (
    <div className="rounded-xl border border-border/70 bg-background/70 p-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon
          aria-hidden="true"
          className="size-3.5 text-primary"
        />

        {label}
      </div>

      <p className="mt-1 text-sm font-semibold text-foreground">
        {value}
      </p>
    </div>
  );
}