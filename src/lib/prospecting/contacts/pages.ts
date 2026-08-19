import {
  isSameCrawlSite,
  normalizePathname,
  siteHostKey,
} from "@/lib/website-audit/site/urls";

import { MAX_CONTACT_PAGES_PER_PROSPECT } from "./constants";
import type { ContactSourceType } from "./types";

interface RankedContactPage {
  href: string;
  rank: number;
  sourceType: ContactSourceType;
}

const PAGE_PATTERNS: Array<{
  pattern: RegExp;
  rank: number;
  sourceType: ContactSourceType;
}> = [
  {
    pattern: /^\/contact(-us)?(\/|$)/,
    rank: 100,
    sourceType: "WEBSITE_CONTACT_PAGE",
  },
  {
    pattern: /^\/(get-in-touch|reach-us|contactus)(\/|$)/,
    rank: 90,
    sourceType: "WEBSITE_CONTACT_PAGE",
  },
  {
    pattern: /^\/about(-us)?(\/|$)/,
    rank: 80,
    sourceType: "WEBSITE_ABOUT_PAGE",
  },
  {
    pattern: /^\/company(\/|$)/,
    rank: 75,
    sourceType: "WEBSITE_ABOUT_PAGE",
  },
  {
    pattern: /^\/(our-)?team(\/|$)/,
    rank: 70,
    sourceType: "WEBSITE_TEAM_PAGE",
  },
  {
    pattern: /^\/staff(\/|$)/,
    rank: 65,
    sourceType: "WEBSITE_TEAM_PAGE",
  },
];

export function classifyContactPage(
  pageUrl: string,
  homepageUrl: string,
): ContactSourceType {
  try {
    const page = new URL(pageUrl);
    const home = new URL(homepageUrl);
    const path = normalizePathname(page.pathname).toLowerCase();
    const homePath = normalizePathname(home.pathname).toLowerCase();

    if (
      siteHostKey(page.hostname) === siteHostKey(home.hostname) &&
      path === homePath
    ) {
      return "WEBSITE_HOMEPAGE";
    }

    for (const entry of PAGE_PATTERNS) {
      if (entry.pattern.test(path)) {
        return entry.sourceType;
      }
    }
  } catch {
    return "WEBSITE_OTHER";
  }

  return "WEBSITE_OTHER";
}

export function rankContactPage(pageUrl: string): number {
  try {
    const path = normalizePathname(new URL(pageUrl).pathname).toLowerCase();

    for (const entry of PAGE_PATTERNS) {
      if (entry.pattern.test(path)) {
        return entry.rank;
      }
    }
  } catch {
    return 0;
  }

  return 0;
}

export function selectContactPagesToFetch(options: {
  homepageUrl: string;
  linkedHrefs: string[];
  maxPages?: number;
}): RankedContactPage[] {
  const maxPages = options.maxPages ?? MAX_CONTACT_PAGES_PER_PROSPECT;
  let homepage: URL;

  try {
    homepage = new URL(options.homepageUrl);
  } catch {
    return [];
  }

  const selected: RankedContactPage[] = [
    {
      href: homepage.href,
      rank: 1_000,
      sourceType: "WEBSITE_HOMEPAGE",
    },
  ];
  const seen = new Set([homepage.href]);

  const ranked = options.linkedHrefs
    .map((href) => {
      try {
        const url = new URL(href, homepage);

        if (!isSameCrawlSite(url, homepage)) {
          return null;
        }

        const rank = rankContactPage(url.href);

        if (rank <= 0) {
          return null;
        }

        return {
          href: url.href,
          rank,
          sourceType: classifyContactPage(url.href, homepage.href),
        } satisfies RankedContactPage;
      } catch {
        return null;
      }
    })
    .filter((row): row is RankedContactPage => row !== null)
    .sort((left, right) => right.rank - left.rank || left.href.localeCompare(right.href));

  for (const page of ranked) {
    if (selected.length >= maxPages) {
      break;
    }

    if (seen.has(page.href)) {
      continue;
    }

    seen.add(page.href);
    selected.push(page);
  }

  return selected.slice(0, maxPages);
}

export function isSameHostUrl(left: string, right: string): boolean {
  try {
    return isSameCrawlSite(new URL(left), new URL(right));
  } catch {
    return false;
  }
}
