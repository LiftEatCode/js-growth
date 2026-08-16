import { fetchPublicHttpResource } from "../secure-fetch";
import type {
  AuditRobotsTxtData,
  AuditSiteDiscoveryData,
  AuditSitemapCheck,
} from "../types";
import {
  getSiteOrigin,
  isPathBlockedByRobots,
  parseRobotsTxt,
} from "./robots-txt";

export const MAX_SITEMAP_CHECKS = 3;
const MAX_ROBOTS_TXT_BYTES = 256 * 1024;
const MAX_SITEMAP_BYTES = 512 * 1024;

function isSuccessStatus(statusCode: number): boolean {
  return statusCode >= 200 && statusCode < 300;
}

function emptyRobotsTxt(
  url: string,
  overrides: Partial<AuditRobotsTxtData> = {},
): AuditRobotsTxtData {
  return {
    url,
    found: false,
    accessible: false,
    statusCode: null,
    contentType: null,
    sitemapUrls: [],
    blocksAuditedPage: false,
    fetchError: null,
    ...overrides,
  };
}

async function fetchRobotsTxt(
  robotsTxtUrl: string,
  origin: string,
  auditedPageUrl: string,
): Promise<AuditRobotsTxtData> {
  try {
    const result = await fetchPublicHttpResource(robotsTxtUrl, {
      accept: "text/plain, text/*, */*;q=0.1",
      maxResponseBytes: MAX_ROBOTS_TXT_BYTES,
      readBody: ({ statusCode }) => isSuccessStatus(statusCode),
    });

    if (!result.ok) {
      return emptyRobotsTxt(robotsTxtUrl, {
        statusCode: result.statusCode,
        contentType: result.contentType,
        found:
          result.statusCode !== null &&
          isSuccessStatus(result.statusCode),
        fetchError: result.error.code,
      });
    }

    const { statusCode, contentType, body } = result.data;

    if (!isSuccessStatus(statusCode)) {
      return emptyRobotsTxt(robotsTxtUrl, {
        statusCode,
        contentType,
        found: false,
        accessible: false,
      });
    }

    const parsed = parseRobotsTxt(body, origin);

    return {
      url: robotsTxtUrl,
      found: true,
      accessible: true,
      statusCode,
      contentType,
      sitemapUrls: parsed.sitemapUrls,
      blocksAuditedPage: isPathBlockedByRobots(
        auditedPageUrl,
        parsed.wildcardRules,
      ),
      wildcardRules: parsed.wildcardRules,
      fetchError: null,
    };
  } catch {
    return emptyRobotsTxt(robotsTxtUrl, {
      fetchError: "FETCH_FAILED",
    });
  }
}

async function fetchSitemapCheck(
  sitemapUrl: string,
  source: AuditSitemapCheck["source"],
): Promise<AuditSitemapCheck> {
  try {
    const result = await fetchPublicHttpResource(sitemapUrl, {
      accept:
        "application/xml, text/xml, application/rss+xml, application/octet-stream, text/*, */*;q=0.1",
      maxResponseBytes: MAX_SITEMAP_BYTES,
      readBody: () => false,
    });

    if (!result.ok) {
      return {
        url: sitemapUrl,
        source,
        found: false,
        accessible: false,
        statusCode: result.statusCode,
        contentType: result.contentType,
        fetchError: result.error.code,
      };
    }

    const found = isSuccessStatus(result.data.statusCode);

    return {
      url: sitemapUrl,
      source,
      found,
      accessible: found,
      statusCode: result.data.statusCode,
      contentType: result.data.contentType,
      fetchError: null,
    };
  } catch {
    return {
      url: sitemapUrl,
      source,
      found: false,
      accessible: false,
      statusCode: null,
      contentType: null,
      fetchError: "FETCH_FAILED",
    };
  }
}

function uniqueSitemapUrls(urls: string[]): string[] {
  const seen = new Set<string>();
  const unique: string[] = [];

  for (const url of urls) {
    if (seen.has(url)) {
      continue;
    }

    seen.add(url);
    unique.push(url);
  }

  return unique;
}

/**
 * Site-level robots.txt and sitemap checks.
 * Failures are recorded as data so the main audit can continue.
 * Sitemap indexes are not recursively crawled.
 */
export async function discoverSite(
  auditedPageUrl: string,
): Promise<AuditSiteDiscoveryData> {
  try {
    const origin = getSiteOrigin(auditedPageUrl);
    const robotsTxtUrl = new URL("/robots.txt", origin).toString();

    const robotsTxt = await fetchRobotsTxt(
      robotsTxtUrl,
      origin,
      auditedPageUrl,
    );

    const declaredSitemaps = uniqueSitemapUrls(
      robotsTxt.sitemapUrls,
    );

    const sitemapSource: AuditSitemapCheck["source"] =
      declaredSitemaps.length > 0
        ? "robots.txt"
        : "conventional";

    const sitemapCandidates =
      declaredSitemaps.length > 0
        ? declaredSitemaps
        : [new URL("/sitemap.xml", origin).toString()];

    const sitemapChecks = await Promise.all(
      sitemapCandidates
        .slice(0, MAX_SITEMAP_CHECKS)
        .map((sitemapUrl) =>
          fetchSitemapCheck(sitemapUrl, sitemapSource),
        ),
    );

    return {
      robotsTxt,
      sitemaps: sitemapChecks,
      hasSitemap: sitemapChecks.some((sitemap) => sitemap.found),
      hasAccessibleSitemap: sitemapChecks.some(
        (sitemap) => sitemap.accessible,
      ),
    };
  } catch {
    return createUnavailableSiteDiscovery(auditedPageUrl);
  }
}

export function createUnavailableSiteDiscovery(
  auditedPageUrl: string,
): AuditSiteDiscoveryData {
  let robotsTxtUrl = "/robots.txt";

  try {
    robotsTxtUrl = new URL(
      "/robots.txt",
      getSiteOrigin(auditedPageUrl),
    ).toString();
  } catch {
    // Keep a relative fallback if the audited URL cannot be parsed.
  }

  return {
    robotsTxt: emptyRobotsTxt(robotsTxtUrl, {
      fetchError: "FETCH_FAILED",
    }),
    sitemaps: [],
    hasSitemap: false,
    hasAccessibleSitemap: false,
  };
}
