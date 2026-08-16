import {
  createFinding,
  type AuditRule,
} from "../../engine/types";
import type { AuditFinding } from "../../types";
import { formatPathExamples } from "./evidence";

export const siteContentPatternRule: AuditRule = {
  id: "site-content-pattern",
  category: "content",
  title: "Site-wide content patterns",

  evaluate({ siteData }) {
    if (!siteData) {
      return [];
    }

    const findings: AuditFinding[] = [];
    const {
      servicePageCount,
      thinServicePageCount,
      thinServicePaths,
      locationPageCount,
      thinLocationPageCount,
      thinLocationPaths,
      similarPagePairs,
    } = siteData.content;

    if (thinServicePageCount >= 2) {
      findings.push(
        createFinding({
          id: "site-thin-service-pages",
          title: "Several service pages provide very little unique information",
          description: `Within this representative crawl, ${thinServicePageCount} of ${servicePageCount} service pages have fewer than 200 words of main content.\n${formatPathExamples(thinServicePaths)}`,
          recommendation:
            "Expand each service page with the problems you solve, the process, and what happens after someone requests work. Avoid copying the same short paragraph onto every service URL.",
          status: "warning",
          category: "content",
          scoreImpact: 7,
          priority: "high",
          businessImpact: "high",
          difficulty: "medium",
          estimatedFixMinutes: 90,
          quickWin: false,
        }),
      );
    }

    if (thinLocationPageCount >= 2) {
      findings.push(
        createFinding({
          id: "site-thin-location-pages",
          title: "Several location pages provide limited local detail",
          description: `Within this representative crawl, ${thinLocationPageCount} of ${locationPageCount} location or service-area pages have fewer than 200 words of main content.\n${formatPathExamples(thinLocationPaths)}`,
          recommendation:
            "Add place-specific details such as the area served, common jobs in that community, and a clear way to request service. Do not publish near-identical pages with only the city name swapped if you can add genuine local context.",
          status: "warning",
          category: "local",
          scoreImpact: 6,
          priority: "medium",
          businessImpact: "medium",
          difficulty: "medium",
          estimatedFixMinutes: 75,
          quickWin: false,
        }),
      );
    }

    if (similarPagePairs.length > 0) {
      const examples = similarPagePairs
        .map(
          (pair) =>
            `- ${pair.pathA} and ${pair.pathB} (similarity ${Math.round(pair.similarity * 100)}%)`,
        )
        .join("\n");

      findings.push(
        createFinding({
          id: "site-highly-similar-pages",
          title: "Some scanned pages appear highly similar",
          description: `Within this representative crawl, some service or location pages share most of the same wording. This is a conservative text comparison, not a plagiarism claim.\n${examples}`,
          recommendation:
            "Differentiate overlapping pages with unique explanations, proof, and local or service-specific details.",
          status: "warning",
          category: "content",
          scoreImpact: 4,
          priority: "medium",
          businessImpact: "medium",
          difficulty: "medium",
          estimatedFixMinutes: 60,
          quickWin: false,
        }),
      );
    }

    return findings;
  },
};
