import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  LockKeyhole,
  Target,
} from "lucide-react";

import {
  InfoPanel,
  ReportSection,
  StatBadge,
} from "@/components/website-audit/report-ui";
import { getReportConfig } from "@/lib/website-audit/report-config";
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
    return "Critical";
  }

  if (priority === "high") {
    return "High priority";
  }

  if (priority === "medium") {
    return "Medium priority";
  }

  return "Low priority";
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

export function AuditRecommendedRoadmap({
  findings,
  mode = "public",
}: AuditRecommendedRoadmapProps) {
  const config =
    getReportConfig(mode);

  const roadmap =
    buildRoadmap(findings);

  const visiblePhases =
    roadmap.slice(
      0,
      config.maximumRoadmapItems,
    );

  const lockedPhaseCount = Math.max(
    roadmap.length -
      visiblePhases.length,
    0,
  );

  return (
    <ReportSection
      eyebrow="Implementation strategy"
      title="Recommended roadmap"
      description="The roadmap organizes detected issues into a practical sequence based on priority, business impact, and implementation effort."
      icon={Target}
    >
      {mode === "public" ? (
        <InfoPanel
          icon={LockKeyhole}
          title="Free roadmap preview"
          description="This report shows the recommended phases and a limited preview of the highest-value actions. Detailed recommendations and implementation guidance are included in the full strategy review."
          tone="primary"
        />
      ) : null}

      <div className="mt-6 space-y-5">
        {visiblePhases.map(
          (phase, index) => {
            const visibleFindings =
              phase.findings.slice(
                0,
                config.maximumRoadmapTasksPerPhase,
              );

            const lockedFindingCount =
              Math.max(
                phase.findings.length -
                  visibleFindings.length,
                0,
              );

            return (
              <article
                key={phase.id}
                className="rounded-2xl border border-border bg-background p-5 sm:p-6"
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatBadge
                        label={`Step ${
                          index + 1
                        }`}
                        tone="default"
                      />

                      <StatBadge
                        label={getPriorityLabel(
                          phase.priority,
                        )}
                        tone={getPriorityTone(
                          phase.priority,
                        )}
                      />

                      <StatBadge
                        label={`${phase.findings.length} ${
                          phase.findings
                            .length === 1
                            ? "action"
                            : "actions"
                        }`}
                        tone="default"
                      />
                    </div>

                    <h3 className="mt-4 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                      {phase.title}
                    </h3>

                    <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                      {phase.description}
                    </p>
                  </div>

                  {config.showEstimatedTime ? (
                    <div className="shrink-0 rounded-xl border border-border bg-card p-4">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <CalendarClock
                          aria-hidden="true"
                          className="size-3.5 text-primary"
                        />

                        Estimated effort
                      </div>

                      <p className="mt-2 text-lg font-semibold text-foreground">
                        {formatMinutes(
                          phase.estimatedFixMinutes,
                        )}
                      </p>
                    </div>
                  ) : null}
                </div>

                <div className="mt-6 space-y-3">
                  {visibleFindings.map(
                    (finding) => (
                      <RoadmapFinding
                        key={finding.id}
                        finding={finding}
                        mode={mode}
                      />
                    ),
                  )}
                </div>

                {lockedFindingCount > 0 ? (
                  <div className="mt-4">
                    <InfoPanel
                      icon={LockKeyhole}
                      title={`${lockedFindingCount} additional ${
                        lockedFindingCount === 1
                          ? "action is"
                          : "actions are"
                      } included in this phase.`}
                      description="The full strategy review includes the complete action list, detailed recommendations, implementation effort, and execution guidance."
                      tone="primary"
                    />
                  </div>
                ) : null}
              </article>
            );
          },
        )}
      </div>

      {lockedPhaseCount > 0 ? (
        <div className="mt-5">
          <InfoPanel
            icon={LockKeyhole}
            title={`${lockedPhaseCount} additional roadmap ${
              lockedPhaseCount === 1
                ? "phase is"
                : "phases are"
            } included in the full strategy review.`}
            description="The complete roadmap covers the full sequence of improvements needed to move from immediate fixes into long-term growth optimization."
            tone="primary"
          />
        </div>
      ) : null}
    </ReportSection>
  );
}

interface RoadmapFindingProps {
  finding: AuditFinding;
  mode: ReportMode;
}

function RoadmapFinding({
  finding,
  mode,
}: RoadmapFindingProps) {
  const config =
    getReportConfig(mode);

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-start gap-3">
        <CheckCircle2
          aria-hidden="true"
          className="mt-0.5 size-4 shrink-0 text-primary"
        />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="font-medium text-foreground">
              {finding.title}
            </h4>

            {config.showQuickWins &&
            finding.quickWin ? (
              <StatBadge
                label="Quick win"
                tone="primary"
              />
            ) : null}
          </div>

          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            {finding.description}
          </p>

          {config.showRecommendations &&
          finding.recommendation ? (
            <div className="mt-3 flex items-start gap-2 text-sm text-primary">
              <ArrowRight
                aria-hidden="true"
                className="mt-0.5 size-3.5 shrink-0"
              />

              <span>
                {finding.recommendation}
              </span>
            </div>
          ) : null}

          {config.showImplementation ? (
            <div className="mt-4">
              <InfoPanel
                icon={Target}
                title="Client implementation guidance"
                description="AI-generated execution steps and technical guidance will appear here once the client AI layer is enabled."
                tone="primary"
              />
            </div>
          ) : null}
        </div>

        {config.showEstimatedTime ? (
          <span className="shrink-0 text-xs text-muted-foreground">
            {formatMinutes(
              finding.estimatedFixMinutes,
            )}
          </span>
        ) : null}
      </div>
    </div>
  );
}