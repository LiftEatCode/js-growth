import {
    createFinding,
    type AuditRule,
  } from "../engine/types";
  
  export const viewportRule: AuditRule = {
    id: "viewport",
    category: "technical",
    title: "Mobile viewport",
  
    evaluate({ pageData }) {
      const viewport = pageData.viewport?.trim() ?? "";
  
      if (!viewport) {
        return createFinding({
          id: "missing-viewport",
          title: "Mobile viewport is missing",
          description:
            "The page does not include a viewport meta tag.",
          status: "fail",
          category: "technical",
          scoreImpact: 4,
          recommendation:
            'Add <meta name="viewport" content="width=device-width, initial-scale=1"> to support responsive layouts.',
        });
      }
  
      const normalizedViewport = viewport.toLowerCase();
  
      const hasDeviceWidth =
        normalizedViewport.includes("width=device-width");
  
      const hasInitialScale =
        normalizedViewport.includes("initial-scale=1");
  
      if (!hasDeviceWidth || !hasInitialScale) {
        return createFinding({
          id: "viewport-incomplete",
          title: "Mobile viewport could be improved",
          description: `The page includes the viewport value "${viewport}", but it may not fully support responsive rendering.`,
          status: "warning",
          category: "technical",
          scoreImpact: 4,
          recommendation:
            'Use a standard viewport declaration such as <meta name="viewport" content="width=device-width, initial-scale=1">.',
        });
      }
  
      return createFinding({
        id: "viewport-present",
        title: "Mobile viewport is configured",
        description:
          "The page includes a standard responsive viewport declaration.",
        status: "pass",
        category: "technical",
        scoreImpact: 4,
      });
    },
  };