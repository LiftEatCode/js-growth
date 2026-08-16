import {
  createFinding,
  type AuditRule,
} from "../../engine/types";
import type { AuditFinding } from "../../types";
import { formatPathExamples } from "./evidence";

export const siteDuplicateMetadataRule: AuditRule = {
  id: "site-duplicate-metadata",
  category: "seo",
  title: "Site-wide metadata",

  evaluate({ siteData }) {
    if (!siteData) {
      return [];
    }

    const findings: AuditFinding[] = [];
    const scanned = siteData.crawl.crawledCount;
    const titleGroups = siteData.metadata.duplicateTitleGroups;
    const descriptionGroups = siteData.metadata.duplicateDescriptionGroups;
    const h1Groups = siteData.headings.duplicateH1Groups;

    if (titleGroups.length > 0) {
      const group = titleGroups[0];
      const extra =
        titleGroups.length > 1
          ? ` ${titleGroups.length} duplicate-title groups were found.`
          : "";

      findings.push(
        createFinding({
          id: "site-duplicate-titles",
          title: "Several scanned pages use the same page title",
          description: `Within this representative crawl, ${group.count} pages share the title "${group.value}".${extra} Search engines and visitors get less page-specific context when distinct URLs reuse one title. This is not a claim that duplicate titles cause a ranking penalty.\n${formatPathExamples(group.paths)}`,
          recommendation:
            "Give commercially important pages a unique title that names the service, location, or purpose of that page.",
          status: "warning",
          category: "seo",
          scoreImpact: 6,
          priority: "high",
          businessImpact: "medium",
          difficulty: "easy",
          estimatedFixMinutes: 30,
          quickWin: true,
        }),
      );
    } else if (scanned >= 2 && siteData.metadata.uniqueTitleCount >= scanned) {
      findings.push(
        createFinding({
          id: "site-unique-titles",
          title: "Scanned pages use distinct titles",
          description:
            "Within this representative crawl, the scanned pages have unique titles. That helps search engines and visitors understand what each page is about.",
          status: "pass",
          category: "seo",
          scoreImpact: 4,
        }),
      );
    }

    if (descriptionGroups.length > 0) {
      const group = descriptionGroups[0];

      findings.push(
        createFinding({
          id: "site-duplicate-descriptions",
          title: "Several scanned pages reuse the same meta description",
          description: `Within this representative crawl, ${group.count} pages share one meta description. Distinct pages usually convert and rank more clearly when their descriptions match their specific offer.\n${formatPathExamples(group.paths)}`,
          recommendation:
            "Write a unique meta description for each important service, location, and contact page.",
          status: "warning",
          category: "seo",
          scoreImpact: 5,
          priority: "medium",
          businessImpact: "medium",
          difficulty: "easy",
          estimatedFixMinutes: 30,
          quickWin: true,
        }),
      );
    }

    if (h1Groups.length > 0) {
      const group = h1Groups[0];

      findings.push(
        createFinding({
          id: "site-duplicate-h1s",
          title: "Several scanned pages use the same H1",
          description: `Within this representative crawl, ${group.count} pages share the heading "${group.value}". Repeating the same H1 across distinct URLs can make the pages feel interchangeable.\n${formatPathExamples(group.paths)}`,
          recommendation:
            "Use an H1 that matches the unique subject of each page, especially on service and location URLs.",
          status: "warning",
          category: "seo",
          scoreImpact: 4,
          priority: "medium",
          businessImpact: "medium",
          difficulty: "easy",
          estimatedFixMinutes: 25,
          quickWin: true,
        }),
      );
    }

    return findings;
  },
};
