import {
  createFinding,
  type AuditRule,
} from "../../engine/types";
import type { AuditFinding } from "../../types";
import { formatPathExamples } from "./evidence";

export const siteCanonicalPatternRule: AuditRule = {
  id: "site-canonical-pattern",
  category: "technical",
  title: "Site-wide canonical signals",

  evaluate({ siteData }) {
    if (!siteData) {
      return [];
    }

    const findings: AuditFinding[] = [];
    const toHome = siteData.indexability.canonicalToHomePaths;
    const offsite = siteData.indexability.offsiteCanonicalPaths;
    const missing = siteData.indexability.missingSelfCanonicalCount;

    if (toHome.length >= 2) {
      findings.push(
        createFinding({
          id: "site-canonical-pattern",
          title: "Several important pages canonicalize to the homepage",
          description: `Within this representative crawl, ${toHome.length} important pages point their canonical tag at the homepage instead of themselves. Search engines may treat those URLs as duplicates of the home page rather than unique service or location pages.\n${formatPathExamples(toHome)}`,
          recommendation:
            "Use a self-referencing canonical on each public service and location page unless you intentionally want search engines to consolidate that URL to the homepage.",
          status: "fail",
          category: "technical",
          scoreImpact: 8,
          priority: "high",
          businessImpact: "high",
          difficulty: "medium",
          estimatedFixMinutes: 40,
          quickWin: false,
        }),
      );
    }

    if (offsite.length > 0) {
      findings.push(
        createFinding({
          id: "site-canonical-offsite",
          title: "Canonical tags point off-site on scanned pages",
          description: `Within this representative crawl, ${offsite.length} important pages canonicalize to a different site. That can send search visibility away from this website.\n${formatPathExamples(offsite)}`,
          recommendation:
            "Point canonical tags at the preferred URL on this website unless there is a deliberate cross-domain consolidation strategy.",
          status: "warning",
          category: "technical",
          scoreImpact: 6,
          priority: "high",
          businessImpact: "high",
          difficulty: "easy",
          estimatedFixMinutes: 25,
          quickWin: true,
        }),
      );
    }

    if (missing >= 3 && toHome.length < 2) {
      findings.push(
        createFinding({
          id: "site-canonical-missing-pattern",
          title: "Several important pages are missing a canonical URL",
          description: `Within this representative crawl, ${missing} important pages do not declare a canonical URL. A self-referencing canonical is optional on every page, but it is useful when templates, tracking parameters, or similar URLs exist.`,
          recommendation:
            "Add one self-referencing canonical on key service, location, and contact templates.",
          status: "warning",
          category: "technical",
          scoreImpact: 4,
          priority: "medium",
          businessImpact: "low",
          difficulty: "easy",
          estimatedFixMinutes: 25,
          quickWin: true,
        }),
      );
    }

    return findings;
  },
};
