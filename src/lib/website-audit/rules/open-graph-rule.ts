import {
    createFinding,
    type AuditRule,
  } from "../engine/types";
  
  export const openGraphRule: AuditRule = {
    id: "open-graph",
    category: "seo",
    title: "Open Graph metadata",
  
    evaluate({ pageData }) {
      const presentCount = [
        pageData.hasOpenGraphTitle,
        pageData.hasOpenGraphDescription,
        pageData.hasOpenGraphImage,
      ].filter(Boolean).length;
  
      if (presentCount === 3) {
        return createFinding({
          id: "open-graph-complete",
          title: "Social sharing metadata is configured",
          description:
            "Open Graph title, description, and image tags were detected.",
          status: "pass",
          category: "seo",
          scoreImpact: 3,
        });
      }
  
      return createFinding({
        id: "open-graph-incomplete",
        title: "Social sharing metadata is incomplete",
        description: `${presentCount} of 3 core Open Graph tags were detected.`,
        status: presentCount === 0 ? "fail" : "warning",
        category: "seo",
        scoreImpact: 3,
        recommendation:
          "Add Open Graph title, description, and image metadata so shared links display consistently.",
      });
    },
  };