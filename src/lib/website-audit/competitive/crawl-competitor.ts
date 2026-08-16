import { analyzeHtml } from "../analyze-html";
import { buildAuditRobotsData } from "../robots";
import { discoverSite } from "../site-discovery";
import { crawlSite } from "../site/crawl";
import {
  fetchSitePage,
  type SitePageFetcher,
} from "../site/fetch-page";
import type { SitemapBodyFetcher } from "../site/sitemap-urls";
import type {
  AuditPageData,
  AuditSiteDiscoveryData,
} from "../types";
import type { AuditSiteData } from "../site/types";
import { siteHostKey } from "../site/urls";
import {
  COMPETITIVE_DISCLOSURE,
  COMPETITOR_FETCH_CONCURRENCY,
  MAX_COMPETITOR_BLOG_PAGES,
  MAX_COMPETITOR_CRAWL_MS,
  MAX_COMPETITOR_DEPTH,
  MAX_COMPETITOR_DISCOVERED_URLS,
  MAX_COMPETITOR_PAGES,
  MAX_TOTAL_COMPETITIVE_CRAWL_MS,
  MIN_REMAINING_COMPETITOR_MS,
} from "./constants";
import { compareCompetitiveProfiles } from "./compare";
import { skipFor } from "./input";
import {
  buildCompetitiveProfile,
  emptyCompetitiveProfile,
} from "./profile";
import type {
  CompetitiveData,
  CompetitiveSiteProfile,
  CompetitiveSkip,
  CompetitorInput,
} from "./types";

export interface CompetitiveCrawlHooks {
  fetchPage?: SitePageFetcher;
  fetchSitemapBody?: SitemapBodyFetcher;
  discoverSite?: (
    url: string,
  ) => Promise<AuditSiteDiscoveryData | undefined>;
  now?: () => number;
}

function hostKey(url: string | null): string | null {
  if (!url) {
    return null;
  }

  try {
    return siteHostKey(new URL(url).hostname);
  } catch {
    return null;
  }
}

function failedStatusFromError(
  errorCode: string,
): CompetitiveSiteProfile["status"] {
  if (/TIMEOUT|TIMED_OUT/i.test(errorCode)) {
    return "timeout";
  }

  if (/PRIVATE|SSRF|LOCAL|BLOCKED/i.test(errorCode)) {
    return "blocked";
  }

  return "failed";
}

async function crawlOneCompetitor(options: {
  input: CompetitorInput;
  remainingMs: number;
  seenHostKeys: Set<string>;
  customerHostKey: string | null;
  hooks: CompetitiveCrawlHooks;
}): Promise<{
  profile: CompetitiveSiteProfile;
  skip?: CompetitiveSkip;
  hostKey?: string;
}> {
  const fetchPage = options.hooks.fetchPage ?? fetchSitePage;
  const fetchResult = await fetchPage(options.input.submittedUrl);

  if (!fetchResult.ok) {
    const status = failedStatusFromError(fetchResult.errorCode);
    return {
      profile: emptyCompetitiveProfile(
        options.input.submittedUrl,
        status,
        fetchResult.finalUrl,
      ),
      skip: skipFor(
        options.input.submittedUrl,
        status === "timeout"
          ? "timeout"
          : status === "blocked"
            ? "blocked"
            : "fetch-failed",
      ),
    };
  }

  const finalHost = hostKey(fetchResult.finalUrl);

  if (finalHost && options.customerHostKey === finalHost) {
    return {
      profile: emptyCompetitiveProfile(
        options.input.submittedUrl,
        "duplicate",
        fetchResult.finalUrl,
      ),
      skip: skipFor(options.input.submittedUrl, "same-site-as-customer"),
    };
  }

  if (finalHost && options.seenHostKeys.has(finalHost)) {
    return {
      profile: emptyCompetitiveProfile(
        options.input.submittedUrl,
        "duplicate",
        fetchResult.finalUrl,
      ),
      skip: skipFor(options.input.submittedUrl, "redirect-duplicate"),
    };
  }

  const { robotsMetaRaw, ...htmlPageData } = analyzeHtml(
    fetchResult.html,
    fetchResult.finalUrl,
    fetchResult.document,
  );
  const seedPageData: AuditPageData = {
    ...htmlPageData,
    robots: buildAuditRobotsData(robotsMetaRaw, fetchResult.xRobotsTag),
  };

  let siteDiscovery: AuditSiteDiscoveryData | undefined;

  try {
    const discover = options.hooks.discoverSite ?? discoverSite;
    siteDiscovery = await discover(fetchResult.finalUrl);
  } catch {
    siteDiscovery = undefined;
  }

  const competitorMaxMs = Math.max(
    500,
    Math.min(MAX_COMPETITOR_CRAWL_MS, options.remainingMs),
  );

  const siteData = await crawlSite({
    seedRequestedUrl: fetchResult.requestedUrl,
    seedFinalUrl: fetchResult.finalUrl,
    seedHtml: fetchResult.html,
    seedPageData,
    seedStatusCode: fetchResult.statusCode,
    siteDiscovery,
    fetchPage,
    fetchSitemapBody: options.hooks.fetchSitemapBody,
    now: options.hooks.now,
    priorityPreset: "competitor-commercial",
    limits: {
      maxPages: MAX_COMPETITOR_PAGES,
      maxDepth: MAX_COMPETITOR_DEPTH,
      maxDiscovered: MAX_COMPETITOR_DISCOVERED_URLS,
      maxBlogPages: MAX_COMPETITOR_BLOG_PAGES,
      concurrency: COMPETITOR_FETCH_CONCURRENCY,
      maxMs: competitorMaxMs,
    },
  });

  return {
    profile: buildCompetitiveProfile({
      submittedUrl: options.input.submittedUrl,
      siteData,
      seedPageData,
    }),
    hostKey: finalHost ?? undefined,
  };
}

export async function buildCompetitiveIntelligence(options: {
  customerUrl: string;
  customerSiteData: AuditSiteData;
  customerPageData: AuditPageData;
  accepted: CompetitorInput[];
  skipped: CompetitiveSkip[];
  submittedCount: number;
  hooks?: CompetitiveCrawlHooks;
}): Promise<CompetitiveData> {
  const now = options.hooks?.now ?? Date.now;
  const startedAt = now();
  const deadline = startedAt + MAX_TOTAL_COMPETITIVE_CRAWL_MS;
  const customerHost = hostKey(options.customerUrl);
  const seenHostKeys = new Set<string>();
  const competitors: CompetitiveSiteProfile[] = [];
  const skipped = [...options.skipped];

  const customer = buildCompetitiveProfile({
    submittedUrl: options.customerUrl,
    siteData: options.customerSiteData,
    seedPageData: options.customerPageData,
  });

  for (const input of options.accepted) {
    const remainingMs = deadline - now();

    if (remainingMs < MIN_REMAINING_COMPETITOR_MS) {
      competitors.push(
        emptyCompetitiveProfile(input.submittedUrl, "timeout"),
      );
      skipped.push(skipFor(input.submittedUrl, "time-budget"));
      continue;
    }

    try {
      const result = await crawlOneCompetitor({
        input,
        remainingMs,
        seenHostKeys,
        customerHostKey: customerHost,
        hooks: options.hooks ?? {},
      });

      competitors.push(result.profile);

      if (result.skip) {
        skipped.push(result.skip);
      }

      if (result.hostKey) {
        seenHostKeys.add(result.hostKey);
      }
    } catch {
      competitors.push(emptyCompetitiveProfile(input.submittedUrl, "failed"));
      skipped.push(skipFor(input.submittedUrl, "fetch-failed"));
    }
  }

  const suppliedCount = options.accepted.length;

  return compareCompetitiveProfiles({
    customer,
    competitors,
    skipped,
    submittedCount: options.submittedCount,
    suppliedCount,
    disclosure: COMPETITIVE_DISCLOSURE,
    runtimeMs: now() - startedAt,
  });
}
