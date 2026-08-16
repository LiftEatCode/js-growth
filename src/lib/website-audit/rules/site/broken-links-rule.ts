import {
  createFinding,
  type AuditRule,
} from "../../engine/types";

export const siteBrokenLinksRule: AuditRule = {
  id: "site-broken-internal-links",
  category: "technical",
  title: "Broken internal links",

  evaluate({ siteData }) {
    if (!siteData) {
      return [];
    }

    const { verifiedBrokenCount, brokenExamples } = siteData.links;

    if (verifiedBrokenCount === 0) {
      if (siteData.crawl.crawledCount < 2) {
        return [];
      }

      return createFinding({
        id: "site-no-verified-broken-links",
        title: "No verified broken internal links in this scan",
        description:
          "Within the pages that were actually fetched, internal links to those destinations did not return verified HTTP failures. URLs that were discovered but not crawled because of the page cap are not treated as broken.",
        status: "pass",
        category: "technical",
        scoreImpact: 4,
      });
    }

    const examples = brokenExamples
      .map(
        (item) =>
          `- ${item.sourcePath} → ${item.destinationPath}${
            item.statusCode ? ` (${item.statusCode})` : ""
          }`,
      )
      .join("\n");

    return createFinding({
      id: "site-broken-internal-links",
      title: "Verified broken internal links were found",
      description: `Within this representative crawl, ${verifiedBrokenCount} internal destination${verifiedBrokenCount === 1 ? " was" : "s were"} fetched and failed (for example 404 or 410). Pages that were only skipped because of the page cap are not counted as broken.\n${examples}`,
      recommendation:
        "Update or remove internal links that point at missing pages so visitors and search engines land on live destinations.",
      status: "fail",
      category: "technical",
      scoreImpact: Math.min(8, 4 + verifiedBrokenCount),
      priority: "high",
      businessImpact: "medium",
      difficulty: "easy",
      estimatedFixMinutes: 30,
      quickWin: true,
    });
  },
};
