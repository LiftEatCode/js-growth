import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Gauge,
  Lightbulb,
  LockKeyhole,
  Sparkles,
  Wrench,
  XCircle,
} from "lucide-react";

import {
  InfoPanel,
  StatBadge,
} from "@/components/website-audit/report-ui";
import { getFindingVisibility } from "@/lib/website-audit/report-mode";
import type {
  AuditCategory,
  AuditFinding,
  AuditPriority,
  AuditStatus,
  BusinessImpact,
  FixDifficulty,
  ReportMode,
} from "@/lib/website-audit/types";

interface FindingCardProps {
  finding: AuditFinding;
  mode?: ReportMode;
  number?: number;
}

const CATEGORY_LABELS: Record<
  AuditCategory,
  string
> = {
  technical: "Technical SEO",
  seo: "Search Optimization",
  content: "Content",
  cro: "Conversion",
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

function getStatusStyles(
  status: AuditStatus,
): {
  border: string;
  accent: string;
  icon: string;
  badgeTone:
    | "success"
    | "warning"
    | "danger";
} {
  if (status === "pass") {
    return {
      border:
        "border-emerald-200",
      accent:
        "bg-emerald-50",
      icon: "text-emerald-600",
      badgeTone: "success",
    };
  }

  if (status === "warning") {
    return {
      border:
        "border-amber-200",
      accent:
        "bg-amber-50",
      icon: "text-amber-600",
      badgeTone: "warning",
    };
  }

  return {
    border: "border-red-200",
    accent: "bg-red-50",
    icon: "text-red-600",
    badgeTone: "danger",
  };
}

function getPriorityTone(
  priority: AuditPriority,
):
  | "danger"
  | "warning"
  | "primary"
  | "default" {
  if (priority === "critical") {
    return "danger";
  }

  if (priority === "high") {
    return "primary";
  }

  if (priority === "medium") {
    return "warning";
  }

  return "default";
}

function getPriorityLabel(
  priority: AuditPriority,
): string {
  if (priority === "critical") {
    return "Critical priority";
  }

  if (priority === "high") {
    return "High priority";
  }

  if (priority === "medium") {
    return "Medium priority";
  }

  return "Low priority";
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
  mode = "public",
  number,
}: FindingCardProps) {
  const styles =
    getStatusStyles(
      finding.status,
    );

  const visibility =
    getFindingVisibility(
      mode,
    );

  const isActionable =
    finding.status !== "pass";

  return (
    <article
      className={`overflow-hidden rounded-2xl border bg-white shadow-sm ${styles.border}`}
    >
      <div
        className={`border-b border-border/70 p-5 sm:p-6 ${styles.accent}`}
      >
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 gap-4">
            <div
              className={`flex size-11 shrink-0 items-center justify-center rounded-xl border border-white/70 bg-white shadow-sm ${styles.icon}`}
            >
              <StatusIcon
                status={
                  finding.status
                }
                className="size-5"
              />
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                {typeof number ===
                "number" ? (
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                    Finding{" "}
                    {String(
                      number,
                    ).padStart(
                      2,
                      "0",
                    )}
                  </span>
                ) : null}

                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                  {
                    CATEGORY_LABELS[
                      finding.category
                    ]
                  }
                </span>
              </div>

              <h3 className="mt-2 font-heading text-xl font-semibold tracking-tight text-brand">
                {finding.title}
              </h3>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap gap-2">
            <StatBadge
              label={getStatusLabel(
                finding.status,
              )}
              tone={
                styles.badgeTone
              }
            />

            {visibility.showPriority &&
            isActionable ? (
              <StatBadge
                label={getPriorityLabel(
                  finding.priority,
                )}
                tone={getPriorityTone(
                  finding.priority,
                )}
              />
            ) : null}

            {visibility.showQuickWin &&
            finding.quickWin &&
            isActionable ? (
              <StatBadge
                label="Quick win"
                tone="success"
              />
            ) : null}
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
            What we found
          </p>

          <p className="mt-2 leading-7 text-muted">
            {finding.description}
          </p>
        </div>

        {isActionable ? (
          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {visibility.showBusinessImpact ? (
              <FindingMetric
                icon={Gauge}
                label="Business impact"
                value={getImpactLabel(
                  finding.businessImpact,
                )}
              />
            ) : null}

            {visibility.showDifficulty ? (
              <FindingMetric
                icon={Wrench}
                label="Difficulty"
                value={getDifficultyLabel(
                  finding.difficulty,
                )}
              />
            ) : null}

            {visibility.showEstimatedTime ? (
              <FindingMetric
                icon={Clock3}
                label="Estimated time"
                value={formatMinutes(
                  finding.estimatedFixMinutes,
                )}
              />
            ) : null}

            <FindingMetric
              icon={Sparkles}
              label="Score impact"
              value={`${finding.scoreImpact} pts`}
            />
          </div>
        ) : (
          <div className="mt-5">
            <InfoPanel
              icon={CheckCircle2}
              title="This check passed"
              description="No action is currently recommended for this specific audit signal."
              tone="success"
            />
          </div>
        )}

        {finding.recommendation &&
        visibility.showRecommendation ? (
          <div className="mt-5">
            <div className="rounded-2xl border border-brand-blue/10 bg-brand-blue/[0.04] p-5">
              <div className="flex items-start gap-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-brand-blue/10 bg-white text-brand-blue">
                  <Lightbulb
                    aria-hidden="true"
                    className="size-4"
                  />
                </span>

                <div>
                  <p className="font-heading font-semibold text-brand">
                    Recommended action
                  </p>

                  <p className="mt-2 text-sm leading-6 text-muted">
                    {
                      finding.recommendation
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {isActionable &&
        mode === "public" &&
        !visibility.showRecommendation ? (
          <div className="mt-5">
            <InfoPanel
              icon={LockKeyhole}
              title="Detailed recommendation available"
              description="The full strategy review includes the specific implementation recommendation, effort estimate, and priority guidance for this finding."
              tone="primary"
            />
          </div>
        ) : null}

        {visibility.showImplementation &&
        isActionable ? (
          <div className="mt-5">
            <InfoPanel
              icon={Wrench}
              title="Implementation guidance"
              description="AI-generated implementation instructions will appear here once the client AI layer is enabled."
              tone="primary"
            />
          </div>
        ) : null}
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
    <div className="rounded-xl border border-border bg-slate-50/70 p-4">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-muted">
        <Icon
          aria-hidden="true"
          className="size-3.5 text-brand-blue"
        />

        {label}
      </div>

      <p className="mt-2 font-heading text-sm font-semibold text-brand">
        {value}
      </p>
    </div>
  );
}