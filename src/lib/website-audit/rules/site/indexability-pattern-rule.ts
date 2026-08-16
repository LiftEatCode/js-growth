import {
  createFinding,
  type AuditRule,
} from "../../engine/types";
import { formatPathExamples } from "./evidence";

export const siteIndexabilityPatternRule: AuditRule = {
  id: "site-indexability-pattern",
  category: "technical",
  title: "Site-wide indexability",

  evaluate({ siteData }) {
    if (!siteData) {
      return [];
    }

    const paths = siteData.indexability.importantNoindexPaths;

    if (paths.length === 0) {
      return [];
    }

    const count = paths.length;
    const noun = count === 1 ? "important page is" : "important pages are";

    return createFinding({
      id: "site-indexability-pattern",
      title: "Important pages appear blocked from search indexing",
      description: `Within this representative crawl, ${count} ${noun} marked noindex (service, location, contact, or home pages). That can keep commercially important URLs out of search results.\n${formatPathExamples(paths)}`,
      recommendation:
        "Confirm that noindex is intentional on those URLs. Public service, location, and contact pages that should attract customers usually should remain indexable.",
      status: "fail",
      category: "technical",
      scoreImpact: 10,
      priority: "critical",
      businessImpact: "high",
      difficulty: "easy",
      estimatedFixMinutes: 20,
      quickWin: true,
    });
  },
};
