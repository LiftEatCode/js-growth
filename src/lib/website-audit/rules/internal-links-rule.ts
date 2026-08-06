import {
    createFinding,
    type AuditRule,
  } from "../engine/types";
  
  export const internalLinksRule: AuditRule = {
    id: "internal-links",
    category: "seo",
    title: "Internal Links",
  
    evaluate({ pageData }) {
      if (pageData.internalLinkCount === 0) {
        return createFinding({
          id: "missing-internal-links",
          title: "Internal links were not detected",
          description:
            "The page does not appear to link to other pages on the same website.",
          status: "fail",
          category: "seo",
          scoreImpact: 4,
          recommendation:
            "Add useful internal links to service pages, location pages, blog posts, and contact pages.",
        });
      }
  
      if (pageData.internalLinkCount < 3) {
        return createFinding({
          id: "limited-internal-links",
          title: "Internal linking is limited",
          description: `The page contains ${pageData.internalLinkCount} internal links.`,
          status: "warning",
          category: "seo",
          scoreImpact: 4,
          recommendation:
            "Increase contextual internal links to improve navigation and distribute page authority throughout the website.",
        });
      }
  
      return createFinding({
        id: "internal-links-present",
        title: "Internal links are present",
        description: `The page contains ${pageData.internalLinkCount} internal links.`,
        status: "pass",
        category: "seo",
        scoreImpact: 4,
      });
    },
  };