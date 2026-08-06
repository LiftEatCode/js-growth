import {
    createFinding,
    type AuditRule,
  } from "../engine/types";
  
  export const structuredDataRule: AuditRule = {
    id: "structured-data",
    category: "technical",
    title: "Structured Data",
  
    evaluate({ pageData }) {
      if (!pageData.hasStructuredData) {
        return createFinding({
          id: "missing-structured-data",
          title: "Structured data was not detected",
          description:
            "The page does not appear to include JSON-LD structured data.",
          status: "warning",
          category: "technical",
          scoreImpact: 5,
          recommendation:
            "Add structured data such as Organization, LocalBusiness, Service, FAQPage, or BreadcrumbList.",
        });
      }
  
      const detectedTypes =
        pageData.structuredDataTypes.length > 0
          ? pageData.structuredDataTypes.join(", ")
          : "JSON-LD";
  
      return createFinding({
        id: "structured-data-present",
        title: "Structured data is present",
        description: `Detected schema types: ${detectedTypes}.`,
        status: "pass",
        category: "technical",
        scoreImpact: 5,
      });
    },
  };