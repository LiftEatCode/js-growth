import {
  createFinding,
  type AuditRule,
} from "../engine/types";

export const titleRule: AuditRule = {
  id: "title",
  category: "seo",
  title: "Page title",

  evaluate({ pageData }) {
    const title = pageData.title?.trim() ?? "";

    if (!title) {
      return createFinding({
        id: "missing-title",
        title: "Page title is missing",
        description:
          "The page does not include a title element.",
        status: "fail",
        category: "seo",
        scoreImpact: 5,
        recommendation:
          "Add a unique, descriptive page title that reflects the page topic and primary search intent.",
      });
    }

    if (title.length < 20 || title.length > 65) {
      return createFinding({
        id: "title-length",
        title: "Page title could be improved",
        description: `The page title contains ${title.length} characters.`,
        status: "warning",
        category: "seo",
        scoreImpact: 5,
        recommendation:
          "Use a concise, descriptive title that clearly communicates the page topic without unnecessary wording.",
      });
    }

    return createFinding({
      id: "title-present",
      title: "Page title is present",
      description:
        "The page includes a descriptive title within a reasonable length.",
      status: "pass",
      category: "seo",
      scoreImpact: 5,
    });
  },
};