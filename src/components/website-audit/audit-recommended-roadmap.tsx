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
  const config = getReportConfig(
    mode,
  );

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

  if (roadmap.length === 0) {
    return null;
  }

  return (
    <ReportSection
      eyebrow="Recommended Sequence"
      title="Your improvement roadmap"
      description="These phases organize the detected issues into a practical order based on urgency, business impact, and implementation effort."
      icon={Target}
    >
      {mode === "public" ? (
        <InfoPanel
          icon={LockKeyhole}
          title="Roadmap preview"
          description="The free audit shows the strongest starting points. The full strategy review includes every action, detailed recommendations, implementation effort, and execution guidance."
          tone="primary"
        />
      ) : null}

      <div className="mt-7 space-y-6">
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
                className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm"
              >
                <div className="grid lg:grid-cols-[110px_1fr_auto]">
                  <div className="flex items-center justify-center border-b border-border bg-brand px-5 py-6 text-white lg:border-b-0 lg:border-r lg:border-slate-800">
                    <div className="text-center">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-300">
                        Phase
                      </p>

                      <p className="mt-1 font-heading text-3xl font-bold">
                        {String(
                          index + 1,
                        ).padStart(
                          2,
                          "0",
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="p-5 sm:p-6">
                    <div className="flex flex-wrap items-center gap-2">
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
                      />
                    </div>

                    <h3 className="mt-4 font-heading text-2xl font-semibold tracking-tight text-brand">
                      {phase.title}
                    </h3>

                    <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
                      {phase.description}
                    </p>
                  </div>

                  {config.showEstimatedTime ? (
                    <div className="border-t border-border bg-slate-50/70 p-5 lg:border-l lg:border-t-0 lg:p-6">
                      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                        <CalendarClock
                          aria-hidden="true"
                          className="size-4 text-brand-blue"
                        />

                        Estimated effort
                      </div>

                      <p className="mt-2 font-heading text-xl font-semibold text-brand">
                        {formatMinutes(
                          phase.estimatedFixMinutes,
                        )}
                      </p>
                    </div>
                  ) : null}
                </div>

                <div className="border-t border-border bg-slate-50/40 p-5 sm:p-6">
                  <div className="space-y-3">
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
                            ? "action"
                            : "actions"
                        } in this phase`}
                        description="The full strategy review includes the complete action list, detailed recommendations, estimated effort, and execution guidance."
                        tone="primary"
                      />
                    </div>
                  ) : null}
                </div>
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
                ? "phase"
                : "phases"
            } available`}
            description="The complete roadmap continues beyond the immediate fixes into broader optimization and long-term growth improvements."
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
  const config = getReportConfig(
    mode,
  );

  return (
    <div className="rounded-xl border border-border bg-white p-4">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-600">
          <CheckCircle2
            aria-hidden="true"
            className="size-4"
          />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="font-heading font-semibold text-brand">
              {finding.title}
            </h4>

            {config.showQuickWins &&
            finding.quickWin ? (
              <StatBadge
                label="Quick win"
                tone="success"
              />
            ) : null}
          </div>

          <p className="mt-2 text-sm leading-6 text-muted">
            {finding.description}
          </p>

          {config.showRecommendations &&
          finding.recommendation ? (
            <div className="mt-4 flex items-start gap-3 rounded-xl border border-brand-blue/10 bg-brand-blue/[0.04] p-4 text-sm leading-6 text-brand">
              <ArrowRight
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0 text-brand-blue"
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
                title="Implementation guidance"
                description="AI-generated execution steps and technical guidance will appear here once the client AI layer is enabled."
                tone="primary"
              />
            </div>
          ) : null}
        </div>

        {config.showEstimatedTime ? (
          <span className="shrink-0 rounded-full border border-border bg-slate-50 px-2.5 py-1 text-xs font-medium text-muted">
            {formatMinutes(
              finding.estimatedFixMinutes,
            )}
          </span>
        ) : null}
      </div>
    </div>
  );
}