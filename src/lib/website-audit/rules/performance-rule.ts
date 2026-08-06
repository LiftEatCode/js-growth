import {
    createFinding,
    type AuditRule,
  } from "../engine/types";
  
  export const performanceRule: AuditRule = {
    id: "performance",
    category: "performance",
    title: "Performance analysis",
  
    evaluate({ pageData }) {
      const hasBasicMobileSupport = Boolean(
        pageData.viewport,
      );
  
      return createFinding({
        id: "performance-limited-analysis",
        title: "Performance testing is limited in this audit",
        description: hasBasicMobileSupport
          ? "The page includes mobile viewport support, but runtime performance metrics require a browser-based Lighthouse test."
          : "The page lacks a mobile viewport, and runtime performance metrics require a browser-based Lighthouse test.",
        status: hasBasicMobileSupport
          ? "warning"
          : "fail",
        category: "performance",
        scoreImpact: 10,
        recommendation:
          "Run Lighthouse or PageSpeed Insights to measure Core Web Vitals, JavaScript execution, image loading, and rendering performance.",
      });
    },
  };