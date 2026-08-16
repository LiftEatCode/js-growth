import { analyzeHtml } from "../analyze-html";
import { buildAuditRobotsData } from "../robots";
import { isPathBlockedByRobots } from "../site-discovery/robots-txt";
import type {
  AuditPageData,
  AuditSiteDiscoveryData,
} from "../types";
import { aggregateSiteData, visibleTextFromHtml } from "./aggregate";
import {
  crawlPriorityScore,
  guessPageTypeFromSignals,
  isBlogLikePageType,
  selectionReasonFor,
  type CrawlPriorityPreset,
} from "./classify-page";
import { compactFailedPage, compactSitePage } from "./compact";
import {
  MAX_BLOG_PAGES,
  MAX_CRAWL_DEPTH,
  MAX_CRAWLED_PAGES,
  MAX_DISCOVERED_URLS,
  MAX_OUTGOING_PATHS_STORED,
  MAX_SITE_CRAWL_MS,
  MAX_SKIPPED_URLS_RECORDED,
  SITE_FETCH_CONCURRENCY,
} from "./constants";
import {
  extractSiteLinkCandidates,
  isPrimaryNavLocation,
} from "./extract-candidates";
import { fetchSitePage, type SitePageFetcher } from "./fetch-page";
import { runWithConcurrency } from "./pool";
import {
  collectSitemapCandidates,
  type SitemapBodyFetcher,
} from "./sitemap-urls";
import type {
  AuditSiteData,
  AuditSiteLinkLocation,
  AuditSitePageSnapshot,
  AuditSiteSelectionReason,
  AuditSiteSkipReason,
  AuditSiteTruncationReason,
  AuditSkippedUrl,
} from "./types";
import { crawlIdentity, normalizeCrawlUrl } from "./urls";

interface FrontierItem {
  href: string;
  identity: string;
  path: string;
  depth: number;
  source: "sitemap" | "navigation" | "link";
  location: AuditSiteLinkLocation;
  anchorText: string;
  inPrimaryNav: boolean;
}

interface CrawlLimits {
  maxPages: number;
  maxDepth: number;
  maxDiscovered: number;
  maxBlogPages: number;
  concurrency: number;
  maxMs: number;
}

const DEFAULT_LIMITS: CrawlLimits = {
  maxPages: MAX_CRAWLED_PAGES,
  maxDepth: MAX_CRAWL_DEPTH,
  maxDiscovered: MAX_DISCOVERED_URLS,
  maxBlogPages: MAX_BLOG_PAGES,
  concurrency: SITE_FETCH_CONCURRENCY,
  maxMs: MAX_SITE_CRAWL_MS,
};

export interface CrawlSiteOptions {
  seedRequestedUrl: string;
  seedFinalUrl: string;
  seedHtml: string;
  seedPageData: AuditPageData;
  seedStatusCode: number;
  siteDiscovery?: AuditSiteDiscoveryData;
  fetchPage?: SitePageFetcher;
  fetchSitemapBody?: SitemapBodyFetcher;
  now?: () => number;
  limits?: Partial<CrawlLimits>;
  priorityPreset?: CrawlPriorityPreset;
}

function robotsRules(
  siteDiscovery: AuditSiteDiscoveryData | undefined,
) {
  return siteDiscovery?.robotsTxt.wildcardRules ?? [];
}

function rememberSkip(
  skipped: AuditSkippedUrl[],
  skippedCount: { value: number },
  url: string,
  reason: AuditSiteSkipReason,
): void {
  skippedCount.value += 1;

  if (skipped.length < MAX_SKIPPED_URLS_RECORDED) {
    skipped.push({ url, reason });
  }
}

function rememberDiscovered(
  discovered: Map<string, string>,
  identity: string,
  href: string,
  limits: CrawlLimits,
  skipped: AuditSkippedUrl[],
  skippedCount: { value: number },
): boolean {
  if (discovered.has(identity)) {
    return false;
  }

  if (discovered.size >= limits.maxDiscovered) {
    rememberSkip(skipped, skippedCount, href, "max-discovered");
    return false;
  }

  discovered.set(identity, href);
  return true;
}

function withCrawlOutgoing(
  snapshot: AuditSitePageSnapshot,
  html: string,
  pageUrl: string,
  seedUrl: string,
): AuditSitePageSnapshot {
  const links = extractSiteLinkCandidates(html, pageUrl, seedUrl, 0);
  const paths: string[] = [];
  const seen = new Set<string>();

  for (const link of links) {
    if (seen.has(link.normalized.path) || link.normalized.path === snapshot.path) {
      continue;
    }

    seen.add(link.normalized.path);
    paths.push(link.normalized.path);

    if (paths.length >= MAX_OUTGOING_PATHS_STORED) {
      break;
    }
  }

  return {
    ...snapshot,
    outgoingInternalCount: seen.size,
    outgoingInternalPaths: paths,
  };
}

function mergeFrontier(
  frontier: Map<string, FrontierItem>,
  item: FrontierItem,
): void {
  const existing = frontier.get(item.identity);

  if (!existing) {
    frontier.set(item.identity, item);
    return;
  }

  const nextNav = existing.inPrimaryNav || item.inPrimaryNav;
  const nextDepth = Math.min(existing.depth, item.depth);
  const nextAnchor =
    item.anchorText.length > existing.anchorText.length
      ? item.anchorText
      : existing.anchorText;
  const nextSource =
    item.source === "navigation" || existing.source === "navigation"
      ? "navigation"
      : existing.source === "sitemap" || item.source === "sitemap"
        ? "sitemap"
        : existing.source;

  frontier.set(item.identity, {
    ...existing,
    depth: nextDepth,
    inPrimaryNav: nextNav,
    location: nextNav ? existing.location : item.location,
    anchorText: nextAnchor,
    source: nextSource,
  });
}

function enqueueLinks(options: {
  html: string;
  pageUrl: string;
  seedUrl: string;
  depth: number;
  limits: CrawlLimits;
  discovered: Map<string, string>;
  frontier: Map<string, FrontierItem>;
  crawled: Set<string>;
  skipped: AuditSkippedUrl[];
  skippedCount: { value: number };
  wildcardRules: NonNullable<AuditSiteDiscoveryData["robotsTxt"]["wildcardRules"]>;
}): void {
  if (options.depth > options.limits.maxDepth) {
    return;
  }

  const links = extractSiteLinkCandidates(
    options.html,
    options.pageUrl,
    options.seedUrl,
    options.discovered.size,
  );

  for (const link of links) {
    if (options.crawled.has(link.normalized.identity)) {
      continue;
    }

    if (options.depth > options.limits.maxDepth) {
      rememberSkip(
        options.skipped,
        options.skippedCount,
        link.normalized.href,
        "max-depth",
      );
      continue;
    }

    if (
      options.wildcardRules.length > 0 &&
      isPathBlockedByRobots(
        link.normalized.href,
        options.wildcardRules,
      )
    ) {
      rememberSkip(
        options.skipped,
        options.skippedCount,
        link.normalized.href,
        "robots-disallow",
      );
      continue;
    }

    rememberDiscovered(
      options.discovered,
      link.normalized.identity,
      link.normalized.href,
      options.limits,
      options.skipped,
      options.skippedCount,
    );

    if (options.discovered.has(link.normalized.identity)) {
      mergeFrontier(options.frontier, {
        href: link.normalized.href,
        identity: link.normalized.identity,
        path: link.normalized.path,
        depth: options.depth,
        source: isPrimaryNavLocation(link.location)
          ? "navigation"
          : "link",
        location: link.location,
        anchorText: link.anchorText,
        inPrimaryNav: isPrimaryNavLocation(link.location),
      });
    }
  }
}

function compareFrontier(
  left: FrontierItem,
  right: FrontierItem,
  preset: CrawlPriorityPreset = "default",
): number {
  const leftType = guessPageTypeFromSignals({
    path: left.path,
    anchorText: left.anchorText,
  });
  const rightType = guessPageTypeFromSignals({
    path: right.path,
    anchorText: right.anchorText,
  });
  const leftScore = crawlPriorityScore({
    pageType: leftType,
    depth: left.depth,
    inPrimaryNav: left.inPrimaryNav,
    source: left.source,
    isSeed: false,
    preset,
  });
  const rightScore = crawlPriorityScore({
    pageType: rightType,
    depth: right.depth,
    inPrimaryNav: right.inPrimaryNav,
    source: right.source,
    isSeed: false,
    preset,
  });

  if (rightScore !== leftScore) {
    return rightScore - leftScore;
  }

  return left.href.localeCompare(right.href);
}

function selectionReasonFromItem(
  item: FrontierItem,
): AuditSiteSelectionReason {
  const pageType = guessPageTypeFromSignals({
    path: item.path,
    anchorText: item.anchorText,
  });

  return selectionReasonFor(
    pageType,
    item.source,
    item.inPrimaryNav,
  );
}

function analyzeFetchedPage(
  html: string,
  finalUrl: string,
  xRobotsTag: string | null,
  document: Parameters<typeof analyzeHtml>[2],
): AuditPageData {
  const { robotsMetaRaw, ...htmlPageData } = analyzeHtml(
    html,
    finalUrl,
    document,
  );

  return {
    ...htmlPageData,
    robots: buildAuditRobotsData(robotsMetaRaw, xRobotsTag),
  };
}

export async function crawlSite(
  options: CrawlSiteOptions,
): Promise<AuditSiteData> {
  const limits: CrawlLimits = { ...DEFAULT_LIMITS, ...options.limits };
  const priorityPreset = options.priorityPreset ?? "default";
  const now = options.now ?? Date.now;
  const startedAt = now();
  const fetchPage = options.fetchPage ?? fetchSitePage;
  const truncationReasons: AuditSiteTruncationReason[] = [];
  const skipped: AuditSkippedUrl[] = [];
  const skippedCount = { value: 0 };
  const discovered = new Map<string, string>();
  const frontier = new Map<string, FrontierItem>();
  const crawledIdentities = new Set<string>();
  const pages: AuditSitePageSnapshot[] = [];
  const wildcardRules = robotsRules(options.siteDiscovery);

  const seedNormalized =
    normalizeCrawlUrl(options.seedFinalUrl, options.seedFinalUrl) ??
    normalizeCrawlUrl(options.seedRequestedUrl, options.seedRequestedUrl);

  const seedIdentity =
    seedNormalized?.identity ?? crawlIdentity(new URL(options.seedFinalUrl));

  discovered.set(seedIdentity, options.seedFinalUrl);
  crawledIdentities.add(seedIdentity);

  pages.push(
    withCrawlOutgoing(
      compactSitePage({
        requestedUrl: options.seedRequestedUrl,
        finalUrl: options.seedFinalUrl,
        depth: 0,
        pageData: options.seedPageData,
        fetchStatus: "success",
        statusCode: options.seedStatusCode,
        errorCode: null,
        selectionReason: "seed",
        inPrimaryNav: true,
        contentText: visibleTextFromHtml(options.seedHtml),
      }),
      options.seedHtml,
      options.seedFinalUrl,
      options.seedFinalUrl,
    ),
  );

  enqueueLinks({
    html: options.seedHtml,
    pageUrl: options.seedFinalUrl,
    seedUrl: options.seedFinalUrl,
    depth: 1,
    limits,
    discovered,
    frontier,
    crawled: crawledIdentities,
    skipped,
    skippedCount,
    wildcardRules,
  });

  const sitemapUrls = (options.siteDiscovery?.sitemaps ?? [])
    .filter((sitemap) => sitemap.accessible)
    .map((sitemap) => sitemap.url);

  if (sitemapUrls.length > 0 && now() - startedAt < limits.maxMs) {
    try {
      const sitemapCandidates = await collectSitemapCandidates({
        seedUrl: options.seedFinalUrl,
        sitemapUrls,
        discoveredCount: discovered.size,
        fetchBody: options.fetchSitemapBody,
      });

      for (const candidate of sitemapCandidates) {
        if (crawledIdentities.has(candidate.identity)) {
          continue;
        }

        if (
          wildcardRules.length > 0 &&
          isPathBlockedByRobots(candidate.href, wildcardRules)
        ) {
          rememberSkip(skipped, skippedCount, candidate.href, "robots-disallow");
          continue;
        }

        rememberDiscovered(
          discovered,
          candidate.identity,
          candidate.href,
          limits,
          skipped,
          skippedCount,
        );

        if (discovered.has(candidate.identity)) {
          mergeFrontier(frontier, {
            href: candidate.href,
            identity: candidate.identity,
            path: candidate.path,
            depth: 1,
            source: "sitemap",
            location: "other",
            anchorText: "",
            inPrimaryNav: false,
          });
        }
      }
    } catch {
      // Sitemap assistance is optional; the seed-page crawl can still continue.
    }
  }

  let blogPages = pages.filter((page) =>
    isBlogLikePageType(page.pageType),
  ).length;

  while (pages.length < limits.maxPages) {
    if (now() - startedAt >= limits.maxMs) {
      truncationReasons.push("time-budget");
      break;
    }

    const remainingSlots = limits.maxPages - pages.length;
    const batchSize = Math.min(limits.concurrency, remainingSlots);
    const ranked = [...frontier.values()]
      .filter((item) => !crawledIdentities.has(item.identity))
      .sort((left, right) => compareFrontier(left, right, priorityPreset));

    const batch: FrontierItem[] = [];
    let blogsInBatch = 0;

    for (const item of ranked) {
      if (batch.length >= batchSize) {
        break;
      }

      const guessed = guessPageTypeFromSignals({
        path: item.path,
        anchorText: item.anchorText,
      });

      if (isBlogLikePageType(guessed)) {
        if (blogPages + blogsInBatch >= limits.maxBlogPages) {
          frontier.delete(item.identity);
          rememberSkip(skipped, skippedCount, item.href, "blog-cap");
          continue;
        }

        blogsInBatch += 1;
      }

      frontier.delete(item.identity);
      crawledIdentities.add(item.identity);
      batch.push(item);
    }

    if (batch.length === 0) {
      break;
    }

    const fetched = await runWithConcurrency(
      batch,
      limits.concurrency,
      async (item) => ({ item, result: await fetchPage(item.href) }),
    );

    const seenFinalInBatch = new Set<string>();

    for (const { item, result } of fetched) {
      if (pages.length >= limits.maxPages) {
        break;
      }

      if (!result.ok) {
        if (result.nonHtml) {
          rememberSkip(skipped, skippedCount, item.href, "non-html");
          crawledIdentities.delete(item.identity);
          continue;
        }

        pages.push(
          compactFailedPage({
            requestedUrl: item.href,
            finalUrl: result.finalUrl,
            depth: item.depth,
            statusCode: result.statusCode,
            errorCode: result.errorCode,
            selectionReason: selectionReasonFromItem(item),
            inPrimaryNav: item.inPrimaryNav,
            anchorText: item.anchorText,
          }),
        );
        continue;
      }

      const finalNormalized = normalizeCrawlUrl(result.finalUrl, result.finalUrl);
      const finalIdentity = finalNormalized?.identity ?? item.identity;

      if (
        (finalIdentity !== item.identity &&
          pages.some((page) => page.identity === finalIdentity)) ||
        seenFinalInBatch.has(finalIdentity)
      ) {
        rememberSkip(skipped, skippedCount, item.href, "duplicate-final");
        crawledIdentities.add(finalIdentity);
        continue;
      }

      seenFinalInBatch.add(finalIdentity);
      crawledIdentities.add(finalIdentity);

      const pageData = analyzeFetchedPage(
        result.html,
        result.finalUrl,
        result.xRobotsTag,
        result.document,
      );

      const snapshot = withCrawlOutgoing(
        compactSitePage({
          requestedUrl: result.requestedUrl,
          finalUrl: result.finalUrl,
          depth: item.depth,
          pageData,
          fetchStatus: "success",
          statusCode: result.statusCode,
          errorCode: null,
          selectionReason: selectionReasonFromItem(item),
          inPrimaryNav: item.inPrimaryNav,
          anchorText: item.anchorText,
          contentText: visibleTextFromHtml(result.html),
        }),
        result.html,
        result.finalUrl,
        options.seedFinalUrl,
      );

      pages.push(snapshot);

      if (isBlogLikePageType(snapshot.pageType)) {
        blogPages += 1;
      }

      if (item.depth < limits.maxDepth) {
        enqueueLinks({
          html: result.html,
          pageUrl: result.finalUrl,
          seedUrl: options.seedFinalUrl,
          depth: item.depth + 1,
          limits,
          discovered,
          frontier,
          crawled: crawledIdentities,
          skipped,
          skippedCount,
          wildcardRules,
        });
      }
    }
  }

  if (pages.length >= limits.maxPages && frontier.size > 0) {
    truncationReasons.push("page-cap");
  }

  if (discovered.size >= limits.maxDiscovered) {
    truncationReasons.push("discovery-cap");
  }

  const uniqueReasons = [...new Set(truncationReasons)];

  return aggregateSiteData({
    seedUrl: options.seedFinalUrl,
    pages,
    discoveredUrls: [...discovered.values()],
    skippedUrls: skipped,
    truncated: uniqueReasons.length > 0,
    truncationReasons: uniqueReasons,
    maxPages: limits.maxPages,
    maxDepth: limits.maxDepth,
    runtimeMs: Math.max(0, now() - startedAt),
  });
}
