import {
    createFinding,
    type AuditRule,
  } from "../engine/types";
  
  export const metaDescriptionRule: AuditRule = {
    id: "meta-description",
    category: "seo",
    title: "Meta description",
  
    evaluate({ pageData }) {
      const description =
        pageData.metaDescription?.trim() ?? "";
  
      if (!description) {
        return createFinding({
          id: "missing-meta-description",
          title: "Meta description is missing",
          description:
            "The page does not include a meta description.",
          status: "fail",
          category: "seo",
          scoreImpact: 4,
          recommendation:
            "Add a unique meta description that summarizes the page and encourages qualified searchers to click.",
        });
      }
  
      if (
        description.length < 70 ||
        description.length > 170
      ) {
        return createFinding({
          id: "meta-description-length",
          title: "Meta description length could be improved",
          description: `The meta description contains ${description.length} characters.`,
          status: "warning",
          category: "seo",
          scoreImpact: 4,
          recommendation:
            "Rewrite the description so it clearly summarizes the page and remains concise enough for search results.",
        });
      }
  
      return createFinding({
        id: "meta-description-present",
        title: "Meta description is present",
        description:
          "The page includes a descriptive meta description.",
        status: "pass",
        category: "seo",
        scoreImpact: 4,
      });
    },
  };