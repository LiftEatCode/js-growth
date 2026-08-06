import {
    createFinding,
    type AuditRule,
  } from "../engine/types";
  
  export const localSignalsRule: AuditRule = {
    id: "local-signals",
    category: "local",
    title: "Local SEO Signals",
  
    evaluate({ pageData }) {
      const findings = [];
  
      if (pageData.hasPhysicalAddressSignals) {
        findings.push(
          createFinding({
            id: "address-signals-present",
            title: "Physical address signals are present",
            description:
              "The page appears to include geographic or address information.",
            status: "pass",
            category: "local",
            scoreImpact: 4,
          }),
        );
      } else {
        findings.push(
          createFinding({
            id: "address-signals-missing",
            title: "Physical address signals were not detected",
            description:
              "The page does not appear to contain a physical address.",
            status: "warning",
            category: "local",
            scoreImpact: 4,
            recommendation:
              "Display a consistent business address or clearly define your service area.",
          }),
        );
      }
  
      if (pageData.hasLocalBusinessSignals) {
        findings.push(
          createFinding({
            id: "local-business-signals-present",
            title: "Local business signals are present",
            description:
              "The page contains local business information or structured data.",
            status: "pass",
            category: "local",
            scoreImpact: 5,
          }),
        );
      } else {
        findings.push(
          createFinding({
            id: "local-business-signals-missing",
            title: "Local relevance could be strengthened",
            description:
              "Strong local business signals were not detected.",
            status: "fail",
            category: "local",
            scoreImpact: 5,
            recommendation:
              "Add LocalBusiness schema, service areas, city names, and complete business information.",
          }),
        );
      }
  
      return findings;
    },
  };