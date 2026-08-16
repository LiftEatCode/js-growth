import {
  createFinding,
  type AuditRule,
} from "../../engine/types";
import { formatPathExamples } from "./evidence";

export const siteInternalLinkSupportRule: AuditRule = {
  id: "site-weak-internal-link-support",
  category: "seo",
  title: "Internal-link support",

  evaluate({ siteData }) {
    if (!siteData) {
      return [];
    }

    const paths = siteData.links.weaklyLinkedImportantPaths;

    if (paths.length === 0) {
      return [];
    }

    return createFinding({
      id: "site-weak-internal-link-support",
      title: "Important pages received limited internal-link support",
      description: `Within the pages scanned, ${paths.length} important URL${paths.length === 1 ? "" : "s"} received no internal links from the other crawled pages. Navigation may still exist outside this sample, so this is not proof that the page is orphaned.\n${formatPathExamples(paths)}`,
      recommendation:
            "Link to important service, location, and contact pages from primary navigation or relevant service content so visitors and search engines can find them.",
      status: "warning",
      category: "seo",
      scoreImpact: 4,
      priority: "medium",
      businessImpact: "medium",
      difficulty: "easy",
      estimatedFixMinutes: 30,
      quickWin: true,
    });
  },
};
