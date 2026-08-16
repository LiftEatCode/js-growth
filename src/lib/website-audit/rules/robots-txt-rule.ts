import {
  createFinding,
  type AuditRule,
} from "../engine/types";

export const robotsTxtRule: AuditRule = {
  id: "robots-txt",
  category: "technical",
  title: "robots.txt availability",

  evaluate({ siteDiscovery }) {
    if (!siteDiscovery) {
      return [];
    }

    const { robotsTxt } = siteDiscovery;

    if (robotsTxt.accessible) {
      return createFinding({
        id: "robots-txt-accessible",
        title: "robots.txt is accessible",
        description:
          "Search engines can read the site's robots.txt file, which helps them understand what they are allowed to crawl and where to find the sitemap.",
        status: "pass",
        category: "technical",
        scoreImpact: 3,
      });
    }

    const statusCode = robotsTxt.statusCode;

    if (statusCode === 401 || statusCode === 403) {
      return createFinding({
        id: "robots-txt-forbidden",
        title: "robots.txt could not be accessed",
        description:
          "The site appears to have a robots.txt file, but search engines may not be able to access it. That can interfere with how crawlers understand which parts of the site they should visit, and it can hide sitemap instructions from search engines.",
        status: "fail",
        category: "technical",
        scoreImpact: 5,
        priority: "high",
        businessImpact: "medium",
        difficulty: "medium",
        estimatedFixMinutes: 20,
        quickWin: false,
        recommendation:
          "Allow public access to robots.txt at the site root. Search engines need to read this file without logging in. Check hosting, firewall, password-protection, and CDN rules that might be blocking it.",
      });
    }

    if (
      (statusCode !== null && statusCode >= 500) ||
      robotsTxt.fetchError === "TIMEOUT" ||
      robotsTxt.fetchError === "FETCH_FAILED"
    ) {
      return createFinding({
        id: "robots-txt-unavailable",
        title: "robots.txt did not respond reliably",
        description:
          "The site's crawler instructions could not be retrieved because the server did not respond reliably. Search engines may have the same problem, which can slow or confuse crawling until the file is consistently available.",
        status: "warning",
        category: "technical",
        scoreImpact: 5,
        priority: "medium",
        businessImpact: "medium",
        difficulty: "medium",
        estimatedFixMinutes: 20,
        quickWin: false,
        recommendation:
          "Confirm that https://your-domain/robots.txt loads quickly for visitors and search engines. Check for server errors, downtime, or CDN issues affecting that file.",
      });
    }

    if (
      robotsTxt.fetchError === "PRIVATE_NETWORK" ||
      robotsTxt.fetchError === "UNSUPPORTED_PROTOCOL"
    ) {
      return createFinding({
        id: "robots-txt-invalid-destination",
        title: "robots.txt points to an unusable location",
        description:
          "robots.txt could not be retrieved because it redirected or resolved to a location that search engines cannot use. That can prevent crawlers from reading crawl instructions and sitemap locations.",
        status: "warning",
        category: "technical",
        scoreImpact: 5,
        recommendation:
          "Make sure robots.txt stays on a public website address and does not redirect to an internal or unsupported destination.",
      });
    }

    if (robotsTxt.fetchError) {
      return createFinding({
        id: "robots-txt-unavailable",
        title: "robots.txt did not respond reliably",
        description:
          "The site's crawler instructions could not be retrieved. Search engines may have the same problem, which can slow or confuse crawling until robots.txt is consistently available.",
        status: "warning",
        category: "technical",
        scoreImpact: 5,
        recommendation:
          "Confirm that robots.txt loads quickly at the site root for visitors and search engines.",
      });
    }

    return createFinding({
      id: "robots-txt-missing",
      title: "No robots.txt file was found",
      description:
        "The site does not currently provide a robots.txt file. That does not automatically block the site from search, but it does make it harder to give crawlers clear guidance and to advertise a sitemap.",
      status: "warning",
      category: "technical",
      scoreImpact: 3,
      priority: "low",
      businessImpact: "low",
      difficulty: "easy",
      estimatedFixMinutes: 15,
      quickWin: true,
      recommendation:
        "Add a public robots.txt file at the site root. For most marketing websites, allow crawling of public pages and include a Sitemap line that points to the XML sitemap.",
    });
  },
};
