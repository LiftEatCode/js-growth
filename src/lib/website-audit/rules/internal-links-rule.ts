import {
  createFinding,
  type AuditRule,
} from "../engine/types";
import {
  GENERIC_ANCHOR_MIN_COUNT,
  GENERIC_ANCHOR_RATE_THRESHOLD,
  LOW_INTERNAL_DIVERSITY_MAX,
  LOW_INTERNAL_DIVERSITY_MIN_WORDS,
} from "../page-content";

export const internalLinksRule: AuditRule = {
  id: "internal-links",
  category: "seo",
  title: "Internal Links",

  evaluate({ pageData }) {
    const findings = [];
    const links = pageData.links;
    const uniqueDestinations =
      links?.uniqueInternalDestinationCount ??
      pageData.internalLinkCount;
    const genericAnchorCount = links?.genericAnchorCount ?? 0;
    const emptyAnchorCount = links?.emptyAnchorCount ?? 0;
    const pageToPageCount =
      links?.internalLinkCount ?? pageData.internalLinkCount;
    const mainContentWordCount =
      pageData.content?.mainContentWordCount ?? 0;

    if (uniqueDestinations === 0) {
      findings.push(
        createFinding({
          id: "missing-internal-links",
          title: "The page does not link to other site pages",
          description:
            "Internal links help visitors discover services and help search engines understand how pages on the site relate to one another. Same-page jump links do not substitute for links to other useful pages.",
          status: "warning",
          category: "seo",
          scoreImpact: 4,
          priority: "medium",
          businessImpact: "medium",
          difficulty: "easy",
          estimatedFixMinutes: 20,
          quickWin: true,
          recommendation:
            "Add descriptive links to important service, contact, or supporting pages. Use specific wording rather than generic phrases like \"click here.\"",
        }),
      );

      return findings;
    }

    if (
      uniqueDestinations <= LOW_INTERNAL_DIVERSITY_MAX &&
      mainContentWordCount >= LOW_INTERNAL_DIVERSITY_MIN_WORDS
    ) {
      findings.push(
        createFinding({
          id: "limited-internal-link-diversity",
          title: "Internal links point to very few other pages",
          description: `The page links to ${uniqueDestinations} other URL ${uniqueDestinations === 1 ? "destination" : "destinations"} on this site. On a page with substantial content, more internal links can help visitors find related services and help search engines understand the site.`,
          status: "warning",
          category: "seo",
          scoreImpact: 2,
          priority: "low",
          businessImpact: "low",
          difficulty: "easy",
          estimatedFixMinutes: 20,
          quickWin: true,
          recommendation:
            "Link naturally to a few related service, location, or resource pages where it would help a visitor take the next step.",
        }),
      );
    }

    const genericRate =
      pageToPageCount > 0 ? genericAnchorCount / pageToPageCount : 0;

    if (
      genericAnchorCount >= GENERIC_ANCHOR_MIN_COUNT &&
      genericRate >= GENERIC_ANCHOR_RATE_THRESHOLD
    ) {
      findings.push(
        createFinding({
          id: "generic-internal-anchors",
          title: "Many internal links use generic wording",
          description: `${genericAnchorCount} of ${pageToPageCount} links to other site pages use generic phrases such as "learn more" or "click here." Specific link text helps visitors and search engines understand the destination.`,
          status: "warning",
          category: "seo",
          scoreImpact: 2,
          priority: "low",
          businessImpact: "low",
          difficulty: "easy",
          estimatedFixMinutes: 20,
          quickWin: true,
          recommendation:
            'Replace generic phrases with the name of the destination, such as "Brake repair services" instead of "Learn more."',
        }),
      );
    }

    if (emptyAnchorCount > 0) {
      findings.push(
        createFinding({
          id: "empty-internal-links",
          title: "Some internal links have no useful label",
          description: `${emptyAnchorCount} internal ${emptyAnchorCount === 1 ? "link has" : "links have"} no meaningful text and no useful image alt text. That makes the destination unclear for visitors and assistive technology.`,
          status: "warning",
          category: "seo",
          scoreImpact: 3,
          priority: "medium",
          businessImpact: "medium",
          difficulty: "easy",
          estimatedFixMinutes: 15,
          quickWin: true,
          recommendation:
            "Give every link visible text or a descriptive image alt that names the destination. Empty alt is fine on decorative images, but not when the image is the only link content.",
        }),
      );
    }

    if (findings.length === 0) {
      findings.push(
        createFinding({
          id: "internal-links-present",
          title: "Internal links point to other site pages",
          description: `The page includes ${pageToPageCount} internal ${pageToPageCount === 1 ? "link" : "links"} across ${uniqueDestinations} unique ${uniqueDestinations === 1 ? "destination" : "destinations"} on this site.`,
          status: "pass",
          category: "seo",
          scoreImpact: 4,
        }),
      );
    }

    return findings;
  },
};
