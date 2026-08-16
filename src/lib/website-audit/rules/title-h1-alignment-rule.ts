import {
  createFinding,
  type AuditRule,
} from "../engine/types";
import {
  TITLE_H1_ALIGNMENT_THRESHOLD,
  computeTokenOverlap,
  isAuditTitleData,
} from "../page-metadata";

export const titleH1AlignmentRule: AuditRule = {
  id: "title-h1-alignment",
  category: "seo",
  title: "Title and heading alignment",

  evaluate({ pageData }) {
    const { title, h1Values } = pageData;

    if (!isAuditTitleData(title) || !title.value) {
      return [];
    }

    const nonEmptyH1s = (h1Values ?? []).filter(
      (value) => value.length > 0,
    );

    if (
      title.count !== 1 ||
      title.isEmpty ||
      !title.value ||
      nonEmptyH1s.length !== 1
    ) {
      return [];
    }

    const h1 = nonEmptyH1s[0];

    if (!h1) {
      return [];
    }

    const overlap = computeTokenOverlap(title.value, h1);

    if (overlap === null) {
      return [];
    }

    if (overlap < TITLE_H1_ALIGNMENT_THRESHOLD) {
      return createFinding({
        id: "title-h1-mismatch",
        title: "Title and main heading appear disconnected",
        description: `The page title and H1 use few of the same meaningful words, so searchers may see one topic in results and another on the page. Title: "${title.value}". Heading: "${h1}".`,
        status: "warning",
        category: "seo",
        scoreImpact: 3,
        priority: "medium",
        businessImpact: "medium",
        difficulty: "easy",
        estimatedFixMinutes: 20,
        quickWin: true,
        recommendation:
          "Align the title and the main heading around the same service or topic. Brand names can stay in the title even if they are not repeated in the H1.",
      });
    }

    return createFinding({
      id: "title-h1-aligned",
      title: "Title and main heading appear aligned",
      description:
        "The page title and H1 share enough meaningful wording that they appear to describe the same topic. This is a structural check, not a guarantee of keyword optimization.",
      status: "pass",
      category: "seo",
      scoreImpact: 3,
    });
  },
};
