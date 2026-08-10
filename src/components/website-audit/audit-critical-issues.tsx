import {
  AlertTriangle,
  ArrowRight,
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
  const config = getReportConfig(
    mode,
  );

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
      eyebrow="Immediate Attention"
      title="Highest-priority issues"
      description="These are the problems most likely to affect visibility, usability, lead generation, or the overall effectiveness of the website."
      icon={AlertTriangle}
      className="border-red-200"
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
            label={`${lockedCount} additional`}
            tone="primary"
          />
        ) : null}
      </div>

      <div className="mt-6 space-y-5">
        {visibleIssues.map(
          (finding, index) => (
            <CriticalIssueCard
              key={finding.id}
              finding={finding}
              mode={mode}
              number={index + 1}
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
                ? "issue"
                : "issues"
            } included in the full strategy review`}
            description="The complete review includes all priority issues, detailed recommendations, estimated implementation effort, and the recommended order of work."
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
  number: number;
}

function CriticalIssueCard({
  finding,
  mode,
  number,
}: CriticalIssueCardProps) {
  const config = getReportConfig(
    mode,
  );

  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
      <div className="flex flex-col gap-5 border-b border-border bg-slate-50/50 p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
        <div className="flex min-w-0 gap-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-red-200 bg-red-50 font-heading text-sm font-semibold text-red-600">
            {String(number).padStart(
              2,
              "0",
            )}
          </span>

          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-red-600">
              Priority issue
            </p>

            <h3 className="mt-2 font-heading text-xl font-semibold tracking-tight text-brand">
              {finding.title}
            </h3>
          </div>
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

      <div className="p-5 sm:p-6">
        <div className="grid gap-5 lg:grid-cols-[1fr_auto]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
              What we found
            </p>

            <p className="mt-2 leading-7 text-muted">
              {finding.description}
            </p>
          </div>

          <div className="flex items-center lg:pt-5">
            <ArrowRight
              aria-hidden="true"
              className="hidden size-5 text-slate-300 lg:block"
            />
          </div>
        </div>

        {mode === "public" ? (
          <div className="mt-5">
            <InfoPanel
              icon={LockKeyhole}
              title="How to fix it"
              description="Detailed implementation recommendations and estimated effort are included in the full strategy review."
              tone="primary"
            />
          </div>
        ) : (
          <>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
              <div className="mt-5">
                <InfoPanel
                  title="Recommended action"
                  description={
                    finding.recommendation
                  }
                  tone="success"
                />
              </div>
            ) : null}

            {config.showImplementation ? (
              <div className="mt-4">
                <InfoPanel
                  icon={TrendingUp}
                  title="Implementation guidance"
                  description="AI-generated technical implementation guidance will appear here once the client AI layer is enabled."
                  tone="primary"
                />
              </div>
            ) : null}
          </>
        )}
      </div>
    </article>
  );
}