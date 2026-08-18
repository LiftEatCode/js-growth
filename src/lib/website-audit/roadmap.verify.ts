import {
  buildRoadmap,
  formatRoadmapPhaseTitle,
} from "./roadmap";
import type { AuditFinding } from "./types";

function assert(condition: unknown, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function finding(
  partial: Partial<AuditFinding> & Pick<AuditFinding, "id" | "title">,
): AuditFinding {
  return {
    description: partial.description ?? partial.title,
    recommendation: "Do the recommended fix.",
    status: "warning",
    category: "seo",
    scoreImpact: 4,
    priority: "medium",
    businessImpact: "medium",
    difficulty: "medium",
    estimatedFixMinutes: 20,
    quickWin: false,
    ...partial,
  };
}

assert(
  formatRoadmapPhaseTitle(1, "Search Optimization") ===
    "Phase 1 · Search Optimization",
  "phase titles are built from a single number + name",
);

const skippedCritical = buildRoadmap([
  finding({
    id: "title",
    title: "Title is disconnected",
    category: "seo",
  }),
  finding({
    id: "images",
    title: "No images were detected",
    category: "content",
  }),
  finding({
    id: "css",
    title: "Large CSS blocks are embedded",
    category: "performance",
    priority: "low",
    businessImpact: "low",
  }),
]);

assert(skippedCritical[0]?.phaseNumber === 1, "first remaining phase is 1");
assert(
  skippedCritical[0]?.title === "Phase 1 · Search Optimization",
  "sidebar and heading share sequential Phase 1 after empty critical",
);
assert(skippedCritical[1]?.phaseNumber === 2, "content becomes phase 2");
assert(
  skippedCritical[1]?.title === formatRoadmapPhaseTitle(2, skippedCritical[1]!.name),
  "title uses the same phaseNumber as the sidebar",
);
assert(skippedCritical[2]?.phaseNumber === 3, "experience becomes phase 3");
assert(
  skippedCritical.every(
    (phase, index) =>
      phase.phaseNumber === index + 1 &&
      phase.title === formatRoadmapPhaseTitle(phase.phaseNumber, phase.name),
  ),
  "every displayed phase uses one sequential number",
);
assert(
  skippedCritical.every((phase) => !phase.title.includes("Phase 5")),
  "empty later template phases are not shown as Phase 5",
);

const withCritical = buildRoadmap([
  finding({
    id: "blocked",
    title: "Page is blocked from indexing",
    category: "technical",
    status: "fail",
    priority: "critical",
    businessImpact: "high",
  }),
  finding({
    id: "title-2",
    title: "Title is disconnected",
    category: "seo",
  }),
]);

assert(withCritical[0]?.title === "Phase 1 · Critical Fixes", "critical stays phase 1");
assert(
  withCritical[1]?.title === "Phase 2 · Search Optimization",
  "search stays phase 2 when critical exists",
);

console.log("roadmap.verify.ts passed");
