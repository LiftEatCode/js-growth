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
  
      if (pageData.h1Count === 0) {
        findings.push(
          createFinding({
            id: "missing-h1",
            title: "Primary heading is missing",
            description:
              "The page does not contain an H1 heading.",
            status: "fail",
            category: "content",
            scoreImpact: 5,
            recommendation:
              "Add one descriptive H1 that clearly identifies the primary topic of the page.",
          }),
        );
      } else if (pageData.h1Count > 1) {
        findings.push(
          createFinding({
            id: "multiple-h1",
            title: "Multiple H1 headings detected",
            description: `The page contains ${pageData.h1Count} H1 headings.`,
            status: "warning",
            category: "content",
            scoreImpact: 5,
            recommendation:
              "Use one primary H1 and organize remaining sections with H2 and H3 headings.",
          }),
        );
      } else {
        findings.push(
          createFinding({
            id: "single-h1",
            title: "Primary heading is configured",
            description:
              "The page contains one H1 heading.",
            status: "pass",
            category: "content",
            scoreImpact: 5,
          }),
        );
      }
  
      if (pageData.h2Count === 0) {
        findings.push(
          createFinding({
            id: "missing-h2",
            title: "Supporting headings are limited",
            description:
              "No H2 headings were detected.",
            status: "warning",
            category: "content",
            scoreImpact: 3,
            recommendation:
              "Break larger sections into logical H2 headings to improve readability and SEO.",
          }),
        );
      } else {
        findings.push(
          createFinding({
            id: "h2-present",
            title: "Supporting headings are present",
            description: `The page contains ${pageData.h2Count} H2 headings.`,
            status: "pass",
            category: "content",
            scoreImpact: 3,
          }),
        );
      }
  
      return findings;
    },
  };