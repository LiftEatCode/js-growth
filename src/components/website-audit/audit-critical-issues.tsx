import {
  AlertTriangle,
  Clock3,
  Gauge,
  LockKeyhole,
  TrendingUp,
} from "lucide-react";

import {
  InfoPanel,
  MetricCard,
  ReportSection,
  StatBadge,
} from "@/components/website-audit/report-ui";
import { getReportConfig } from "@/lib/website-audit/report-config";
import type {
  AuditFinding,
  ReportMode,
} from "@/lib/website-audit/types";

interface AuditCriticalIssuesProps {
  findings: AuditFinding[];
  mode?: ReportMode;
}

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
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return `${hours} hr`;
  }

  return `${hours}h ${remainingMinutes}m`;
}

function getImpactTone(
  impact: AuditFinding["businessImpact"],
):
  | "danger"
  | "warning"
  | "default" {
  if (impact === "high") {
    return "danger";
  }

  if (impact === "medium") {
    return "warning";
  }

  return "default";
}

function getImpactLabel(
  impact: AuditFinding["businessImpact"],
): string {
  if (impact === "high") {
    return "High impact";
  }

  if (impact === "medium") {
    return "Medium impact";
  }

  return "Low impact";
}

function getPriorityWeight(
  finding: AuditFinding,
): number {
  const priorityWeight = {
    critical: 4,
    high: 3,
    medium: 2,
    low: 1,
  }[finding.priority];

  const impactWeight = {
    high: 3,
    medium: 2,
    low: 1,
  }[finding.businessImpact];

  return (
    priorityWeight * 100 +
    impactWeight * 10 +
    finding.scoreImpact
  );
}

export function AuditCriticalIssues({
  findings,
  mode = "public",
}: AuditCriticalIssuesProps) {
  const config =
    getReportConfig(mode);

  const criticalIssues = findings
    .filter(
      (finding) =>
        finding.status !== "pass" &&
        (finding.priority === "critical" ||
          finding.businessImpact === "high"),
    )
    .sort(
      (a, b) =>
        getPriorityWeight(b) -
        getPriorityWeight(a),
    );

  if (criticalIssues.length === 0) {
    return null;
  }

  const visibleIssues =
    criticalIssues.slice(
      0,
      config.maximumCriticalIssues,
    );

  const lockedCount = Math.max(
    criticalIssues.length -
      visibleIssues.length,
    0,
  );

  return (
    <ReportSection
      eyebrow="Immediate attention"
      title="Highest-priority issues"
      description="These findings represent the most important issues detected during the audit and should generally be addressed before lower-priority improvements."
      icon={AlertTriangle}
      className="border-destructive/20 bg-destructive/5"
    >
      <div className="flex flex-wrap items-center gap-2">
        <StatBadge
          label={`${criticalIssues.length} priority ${
            criticalIssues.length === 1
              ? "issue"
              : "issues"
          }`}
          tone="danger"
        />

        {lockedCount > 0 ? (
          <StatBadge
            label={`${lockedCount} locked`}
            tone="primary"
          />
        ) : null}
      </div>

      <div className="mt-6 space-y-4">
        {visibleIssues.map(
          (finding) => (
            <CriticalIssueCard
              key={finding.id}
              finding={finding}
              mode={mode}
            />
          ),
        )}
      </div>

      {lockedCount > 0 ? (
        <div className="mt-5">
          <InfoPanel
            icon={LockKeyhole}
            title={`${lockedCount} additional priority ${
              lockedCount === 1
                ? "issue is"
                : "issues are"
            } included in the full strategy review.`}
            description="The complete review includes all priority issues, detailed recommendations, implementation effort, and the recommended order of work."
            tone="primary"
          />
        </div>
      ) : null}
    </ReportSection>
  );
}

interface CriticalIssueCardProps {
  finding: AuditFinding;
  mode: ReportMode;
}

function CriticalIssueCard({
  finding,
  mode,
}: CriticalIssueCardProps) {
  const config =
    getReportConfig(mode);

  return (
    <article className="rounded-2xl border border-border bg-background p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h3 className="font-semibold text-foreground">
            {finding.title}
          </h3>

          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {finding.description}
          </p>
        </div>

        {config.showBusinessImpact ? (
          <StatBadge
            label={getImpactLabel(
              finding.businessImpact,
            )}
            tone={getImpactTone(
              finding.businessImpact,
            )}
          />
        ) : null}
      </div>

      {mode === "public" ? (
        <div className="mt-4">
          <InfoPanel
            icon={LockKeyhole}
            title="Detailed fix guidance locked"
            description="Estimated effort and implementation recommendations are included in the full strategy review."
            tone="primary"
          />
        </div>
      ) : (
        <>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {config.showBusinessImpact ? (
              <MetricCard
                icon={TrendingUp}
                label="Business impact"
                value={getImpactLabel(
                  finding.businessImpact,
                )}
              />
            ) : null}

            <MetricCard
              icon={Gauge}
              label="Score impact"
              value={`${finding.scoreImpact} pts`}
            />

            {config.showEstimatedTime ? (
              <MetricCard
                icon={Clock3}
                label="Estimated effort"
                value={formatMinutes(
                  finding.estimatedFixMinutes,
                )}
              />
            ) : null}
          </div>

          {config.showRecommendations &&
          finding.recommendation ? (
            <div className="mt-4">
              <InfoPanel
                title="Recommendation"
                description={
                  finding.recommendation
                }
                tone="default"
              />
            </div>
          ) : null}

          {config.showImplementation ? (
            <div className="mt-4">
              <InfoPanel
                icon={TrendingUp}
                title="Client implementation guidance"
                description="AI-generated technical implementation guidance will appear here once the client AI layer is enabled."
                tone="primary"
              />
            </div>
          ) : null}
        </>
      )}
    </article>
  );
}