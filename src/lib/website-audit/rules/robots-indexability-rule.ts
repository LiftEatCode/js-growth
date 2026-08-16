import {
  createFinding,
  type AuditRule,
} from "../engine/types";
import { normalizeAuditRobotsData } from "../robots";
import type { AuditRobotsData } from "../types";

function describeRestrictiveSources(
  robots: AuditRobotsData,
  directive: "noindex" | "nofollow" | "nosnippet",
): string {
  const fromHtml = robots.meta[directive];
  const fromHeader = robots.header[directive];

  if (fromHtml && fromHeader) {
    return "both the page HTML and the HTTP X-Robots-Tag header";
  }

  if (fromHeader) {
    return "the HTTP X-Robots-Tag header";
  }

  return "the page HTML";
}

function getPassDescription(
  robots: AuditRobotsData,
): string {
  const htmlRaw = robots.meta.raw;
  const headerRaw = robots.header.raw;

  if (htmlRaw && headerRaw) {
    return `We checked the page HTML and the HTTP X-Robots-Tag header. The HTML declares "${htmlRaw}" and the header declares "${headerRaw}", and neither one blocks this page from appearing in search results.`;
  }

  if (htmlRaw) {
    return `We checked the page HTML and the HTTP X-Robots-Tag header. The HTML declares "${htmlRaw}" and no server header is blocking this page from search results.`;
  }

  if (headerRaw) {
    return `We checked the page HTML and the HTTP X-Robots-Tag header. The header declares "${headerRaw}" and it does not prevent this page from appearing in search results.`;
  }

  return "We checked the page HTML and the HTTP X-Robots-Tag header. Neither one prevents search engines from indexing this page.";
}

export const robotsIndexabilityRule: AuditRule = {
  id: "robots-indexability",
  category: "technical",
  title: "Search indexability",

  evaluate({ pageData }) {
    const robots = normalizeAuditRobotsData(pageData.robots);
    const { effective } = robots;

    if (effective.noindex) {
      const sources = describeRestrictiveSources(
        robots,
        "noindex",
      );

      return createFinding({
        id: "robots-noindex",
        title: "Page is blocked from search indexing",
        description: `Search engines are being told not to index this page by ${sources}. That can keep the page out of organic search results, which can reduce visibility and the chance of attracting new leads from search.`,
        status: "fail",
        category: "technical",
        scoreImpact: 12,
        priority: "critical",
        businessImpact: "high",
        difficulty: "easy",
        estimatedFixMinutes: 15,
        quickWin: true,
        recommendation:
          "Confirm that keeping this page out of search is intentional. If it should attract customers from search, remove the noindex instruction from the page HTML and check server or CDN configuration for an X-Robots-Tag header that may also be blocking indexing.",
      });
    }

    if (effective.nofollow) {
      const sources = describeRestrictiveSources(
        robots,
        "nofollow",
      );

      return createFinding({
        id: "robots-nofollow",
        title: "Page tells search engines not to follow links",
        description: `Search engines are being told not to follow links on this page by ${sources}. That can make it harder for other pages on the site to be discovered through this page, which can limit broader organic visibility.`,
        status: "warning",
        category: "technical",
        scoreImpact: 6,
        priority: "high",
        businessImpact: "medium",
        difficulty: "easy",
        estimatedFixMinutes: 15,
        quickWin: true,
        recommendation:
          "Confirm that the nofollow instruction is intentional. For public marketing pages, allowing crawlers to follow internal links generally helps search engines discover the rest of the site. Check both the page HTML and any X-Robots-Tag header set by the server or CDN.",
      });
    }

    if (effective.nosnippet) {
      const sources = describeRestrictiveSources(
        robots,
        "nosnippet",
      );

      return createFinding({
        id: "robots-nosnippet",
        title: "Search snippets are restricted",
        description: `A nosnippet instruction from ${sources} can prevent search engines from showing descriptive text or rich snippets for this page. Less informative search listings can reduce clicks from people looking for this service.`,
        status: "warning",
        category: "seo",
        scoreImpact: 3,
        priority: "medium",
        businessImpact: "medium",
        difficulty: "easy",
        estimatedFixMinutes: 10,
        quickWin: true,
        recommendation:
          "Confirm that suppressing search-result snippets is intentional. Public service and landing pages usually benefit from allowing search engines to generate useful result snippets. Check both the page HTML and server or CDN X-Robots-Tag settings.",
      });
    }

    return createFinding({
      id: "robots-indexable",
      title: "Page appears indexable",
      description: getPassDescription(robots),
      status: "pass",
      category: "technical",
      scoreImpact: 12,
    });
  },
};
