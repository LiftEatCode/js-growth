import {
  createFinding,
  type AuditRule,
} from "../engine/types";

export const sitemapRule: AuditRule = {
  id: "sitemap",
  category: "technical",
  title: "XML sitemap availability",

  evaluate({ siteDiscovery }) {
    if (!siteDiscovery) {
      return [];
    }

    if (siteDiscovery.hasAccessibleSitemap) {
      return createFinding({
        id: "sitemap-accessible",
        title: "XML sitemap is available",
        description:
          "Search engines can use an XML sitemap from this site, which helps them discover important pages more efficiently as the site grows.",
        status: "pass",
        category: "technical",
        scoreImpact: 4,
      });
    }

    const declaredSitemapCount =
      siteDiscovery.robotsTxt.sitemapUrls.length;

    if (declaredSitemapCount > 0) {
      return createFinding({
        id: "sitemap-declared-inaccessible",
        title: "Declared XML sitemap is not accessible",
        description:
          "robots.txt points search engines to a sitemap, but that sitemap could not be retrieved. Advertising a broken sitemap can waste crawl time and make it harder for important pages to be discovered in search.",
        status: "fail",
        category: "technical",
        scoreImpact: 5,
        priority: "high",
        businessImpact: "medium",
        difficulty: "medium",
        estimatedFixMinutes: 25,
        quickWin: false,
        recommendation:
          "Open each Sitemap URL listed in robots.txt and confirm it loads for the public. Replace broken links, fix server errors, and keep sitemap files on a publicly reachable HTTP or HTTPS address.",
      });
    }

    return createFinding({
      id: "sitemap-missing",
      title: "No XML sitemap was found",
      description:
        "No XML sitemap was listed in robots.txt, and a conventional sitemap.xml file was not found. A sitemap helps search engines efficiently discover important pages, especially as the website adds services, locations, or content.",
      status: "warning",
      category: "technical",
      scoreImpact: 4,
      priority: "medium",
      businessImpact: "medium",
      difficulty: "easy",
      estimatedFixMinutes: 30,
      quickWin: true,
      recommendation:
        "Create an XML sitemap of public pages and add a Sitemap line to robots.txt so search engines can find it.",
    });
  },
};
