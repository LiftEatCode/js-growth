import {
  createFinding,
  type AuditRule,
} from "../../engine/types";
import type { AuditFinding } from "../../types";

export const siteLocalPatternRule: AuditRule = {
  id: "site-local-pattern",
  category: "local",
  title: "Site-wide local consistency",

  evaluate({ siteData }) {
    if (!siteData) {
      return [];
    }

    const findings: AuditFinding[] = [];
    const local = siteData.local;

    if (local.inconsistentContact) {
      findings.push(
        createFinding({
          id: "site-local-consistency",
          title: "Local contact information is inconsistently presented",
          description:
            "Within this representative crawl, phone or contact signals appear on some key pages and are missing on others. This compares on-site pages only. It is not an external NAP-consistency or citation audit.",
          recommendation:
            "Use the same public phone number and a consistent way to request service on the homepage and service or location templates.",
          status: "warning",
          category: "local",
          scoreImpact: 5,
          priority: "medium",
          businessImpact: "medium",
          difficulty: "easy",
          estimatedFixMinutes: 30,
          quickWin: true,
        }),
      );
    }

    const locationTotal = local.locationPageCount + local.serviceAreaPageCount;

    if (
      local.localBusinessLikely &&
      local.mentionedServiceAreaCount >= 3 &&
      locationTotal <= 1
    ) {
      findings.push(
        createFinding({
          id: "site-local-page-coverage",
          title: "Service areas are mentioned with limited dedicated local pages",
          description: `The site mentions several service areas (${local.mentionedServiceAreaCount} unique place names in this scan), but the crawl found ${locationTotal} dedicated location or service-area page${locationTotal === 1 ? "" : "s"}. This is an observation about on-site coverage, not a requirement to create a page for every city.`,
          recommendation:
            "If those communities are commercially important, add or strengthen a small number of genuine local pages — or make service-area coverage clearer on existing pages. Do not manufacture thin city pages only to chase rankings.",
          status: "warning",
          category: "local",
          scoreImpact: 3,
          priority: "low",
          businessImpact: "medium",
          difficulty: "medium",
          estimatedFixMinutes: 60,
          quickWin: false,
        }),
      );
    }

    if (
      !local.aboutPageFound &&
      siteData.conversion.trustOnKeyPages <= 1 &&
      siteData.conversion.keyPageCount >= 3 &&
      (local.localBusinessLikely || siteData.content.servicePageCount > 0)
    ) {
      findings.push(
        createFinding({
          id: "site-about-trust-opportunity",
          title: "No about page and limited trust evidence",
          description:
            "This crawl did not find an about, team, or company page, and trust signals are also limited on the key pages that were scanned. An about page is not required when other proof is strong.",
          recommendation:
            "Add a short about or team page, or include authentic experience and proof on the homepage if that better matches how customers buy.",
          status: "warning",
          category: "cro",
          scoreImpact: 3,
          priority: "low",
          businessImpact: "low",
          difficulty: "easy",
          estimatedFixMinutes: 40,
          quickWin: false,
        }),
      );
    }

    const distinctLocationContent =
      local.locationPageCount + local.serviceAreaPageCount >= 2 &&
      siteData.content.thinLocationPageCount === 0 &&
      siteData.headings.duplicateH1Groups.every((group) => {
        const locationPaths = new Set(
          siteData.pages
            .filter(
              (page) =>
                page.pageType === "location" ||
                page.pageType === "service-area",
            )
            .map((page) => page.path),
        );

        return !group.paths.some((path) => locationPaths.has(path));
      });

    if (distinctLocationContent) {
      findings.push(
        createFinding({
          id: "site-distinct-location-content",
          title: "Location pages have distinct local content",
          description:
            "Within this representative crawl, scanned location or service-area pages are not thin copies of one another based on word count and H1 text.",
          status: "pass",
          category: "local",
          scoreImpact: 4,
        }),
      );
    }

    return findings;
  },
};
