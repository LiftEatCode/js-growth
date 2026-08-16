import {
  createFinding,
  type AuditRule,
} from "../engine/types";

export const robotsCrawlabilityRule: AuditRule = {
  id: "robots-crawlability",
  category: "technical",
  title: "robots.txt crawlability",

  evaluate({ siteDiscovery }) {
    if (!siteDiscovery?.robotsTxt.blocksAuditedPage) {
      return [];
    }

    return createFinding({
      id: "robots-txt-page-blocked",
      title: "robots.txt may block this page from search engines",
      description:
        "The site's robots.txt file tells generic search crawlers not to visit this page. That is different from a noindex tag: it can prevent search engines from crawling the page at all, which can limit or prevent organic search visibility and reduce leads from search.",
      status: "fail",
      category: "technical",
      scoreImpact: 10,
      priority: "critical",
      businessImpact: "high",
      difficulty: "easy",
      estimatedFixMinutes: 20,
      quickWin: true,
      recommendation:
        "If this page should appear in search results, update robots.txt so the generic User-agent: * group does not Disallow this page. Confirm that public service and homepage URLs remain allowed to crawl.",
    });
  },
};
