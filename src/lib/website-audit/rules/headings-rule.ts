import {
  createFinding,
  type AuditRule,
} from "../engine/types";

export const headingsRule: AuditRule = {
  id: "headings",
  category: "content",
  title: "Heading Structure",

  evaluate({ pageData }) {
    const findings = [];
    const headings = pageData.headings;
    const h1Count = headings?.h1Count ?? pageData.h1Count;
    const h1Values = headings?.h1Values ?? pageData.h1Values ?? [];
    const nonEmptyH1Count = h1Values.filter(
      (value) => value.length > 0,
    ).length;
    const emptyHeadingCount = headings?.emptyHeadingCount ?? 0;
    const skippedLevelCount = headings?.skippedLevelCount ?? 0;

    if (h1Count === 0 || nonEmptyH1Count === 0) {
      findings.push(
        createFinding({
          id: "missing-h1",
          title: "Primary heading is missing",
          description:
            "The page does not contain a meaningful H1 heading. That makes it harder for visitors and search engines to quickly understand the main topic or service.",
          status: "fail",
          category: "content",
          scoreImpact: 5,
          priority: "high",
          businessImpact: "medium",
          difficulty: "easy",
          estimatedFixMinutes: 15,
          quickWin: true,
          recommendation:
            "Add one descriptive H1 that clearly identifies the primary offering on the page.",
        }),
      );
    } else if (h1Count > 1) {
      findings.push(
        createFinding({
          id: "multiple-h1",
          title: "Multiple primary headings were found",
          description: `The page contains ${h1Count} H1 headings. Multiple primary headings can make the page's main topic less clear to users and search engines, particularly when they represent unrelated topics.`,
          status: "warning",
          category: "content",
          scoreImpact: 3,
          priority: "medium",
          businessImpact: "medium",
          difficulty: "easy",
          estimatedFixMinutes: 20,
          quickWin: true,
          recommendation:
            "Use one primary H1 for the page topic and organize remaining sections with H2 and H3 headings.",
        }),
      );
    } else {
      findings.push(
        createFinding({
          id: "single-h1",
          title: "Primary heading is configured",
          description:
            "The page contains one H1 heading, which helps make the main topic clear.",
          status: "pass",
          category: "content",
          scoreImpact: 5,
        }),
      );
    }

    const emptyH1Count = h1Values.filter((value) => value.length === 0)
      .length;
    const emptyHeadingsAreOnlyMissingH1 =
      nonEmptyH1Count === 0 &&
      emptyHeadingCount > 0 &&
      emptyHeadingCount === emptyH1Count;

    if (
      emptyHeadingCount > 0 &&
      !emptyHeadingsAreOnlyMissingH1
    ) {
      findings.push(
        createFinding({
          id: "empty-headings",
          title: "Empty headings were found",
          description: `${emptyHeadingCount} heading ${emptyHeadingCount === 1 ? "element contains" : "elements contain"} no meaningful text. Empty headings create structure without explaining a section, which can confuse visitors and assistive technology.`,
          status: "warning",
          category: "content",
          scoreImpact: 2,
          priority: "low",
          businessImpact: "low",
          difficulty: "easy",
          estimatedFixMinutes: 10,
          quickWin: true,
          recommendation:
            "Remove empty headings or replace them with useful section titles.",
        }),
      );
    }

    if (skippedLevelCount > 0) {
      findings.push(
        createFinding({
          id: "skipped-heading-levels",
          title: "Heading levels skip in the page outline",
          description: `The heading outline jumps down by more than one level ${skippedLevelCount === 1 ? "once" : `${skippedLevelCount} times`} (for example H1 to H3). A logical hierarchy makes longer pages easier to scan and can improve accessibility.`,
          status: "warning",
          category: "content",
          scoreImpact: 2,
          priority: "low",
          businessImpact: "low",
          difficulty: "easy",
          estimatedFixMinutes: 15,
          quickWin: true,
          recommendation:
            "Keep heading levels sequential. After an H1, the next deeper heading should usually be an H2 rather than jumping to H3 or H4.",
        }),
      );
    }

    return findings;
  },
};
