import type { AuditFinding } from "./types";

export interface RoadmapPhase {
  id: string;
  title: string;
  description: string;
  findings: AuditFinding[];
  estimatedFixMinutes: number;
  priority:
    | "critical"
    | "high"
    | "medium"
    | "low";
}

function addFindingToPhase(
  phase: RoadmapPhase,
  finding: AuditFinding,
): void {
  phase.findings.push(finding);
  phase.estimatedFixMinutes +=
    finding.estimatedFixMinutes;
}

export function buildRoadmap(
  findings: AuditFinding[],
): RoadmapPhase[] {
  const actionable = findings.filter(
    (finding) => finding.status !== "pass",
  );

  const criticalPhase: RoadmapPhase = {
    id: "critical",
    title: "Phase 1 · Critical Fixes",
    description:
      "Resolve the highest-priority issues first to remove the biggest barriers to website performance and growth.",
    priority: "critical",
    findings: [],
    estimatedFixMinutes: 0,
  };

  const searchPhase: RoadmapPhase = {
    id: "search",
    title: "Phase 2 · Search Optimization",
    description:
      "Strengthen search visibility, technical SEO, and local relevance.",
    priority: "high",
    findings: [],
    estimatedFixMinutes: 0,
  };

  const contentPhase: RoadmapPhase = {
    id: "content",
    title: "Phase 3 · Content Improvements",
    description:
      "Improve content structure, clarity, relevance, and search usefulness.",
    priority: "medium",
    findings: [],
    estimatedFixMinutes: 0,
  };

  const experiencePhase: RoadmapPhase = {
    id: "experience",
    title: "Phase 4 · Performance & User Experience",
    description:
      "Improve accessibility, usability, performance, and the overall visitor experience.",
    priority: "low",
    findings: [],
    estimatedFixMinutes: 0,
  };

  for (const finding of actionable) {
    if (finding.priority === "critical") {
      addFindingToPhase(
        criticalPhase,
        finding,
      );

      continue;
    }

    if (
      finding.priority === "high" &&
      finding.businessImpact === "high"
    ) {
      addFindingToPhase(
        criticalPhase,
        finding,
      );

      continue;
    }

    if (
      finding.category === "seo" ||
      finding.category === "local" ||
      finding.category === "technical"
    ) {
      addFindingToPhase(
        searchPhase,
        finding,
      );

      continue;
    }

    if (finding.category === "content") {
      addFindingToPhase(
        contentPhase,
        finding,
      );

      continue;
    }

    addFindingToPhase(
      experiencePhase,
      finding,
    );
  }

  const phases = [
    criticalPhase,
    searchPhase,
    contentPhase,
    experiencePhase,
  ];

  return phases
    .filter(
      (phase) =>
        phase.findings.length > 0,
    )
    .map((phase) => ({
      ...phase,

      findings: [...phase.findings].sort(
        (a, b) => {
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

          const impactOrder = {
            high: 3,
            medium: 2,
            low: 1,
          };

          const impactDifference =
            impactOrder[
              b.businessImpact
            ] -
            impactOrder[
              a.businessImpact
            ];

          if (impactDifference !== 0) {
            return impactDifference;
          }

          if (a.quickWin !== b.quickWin) {
            return Number(b.quickWin) -
              Number(a.quickWin);
          }

          return (
            b.scoreImpact -
            a.scoreImpact
          );
        },
      ),
    }));
}