import { load } from "cheerio";

import { extractVisibleText } from "../content-extract";
import { CONTENT_THIN_WARNING_THRESHOLD } from "../page-content";
import {
  JACCARD_SIMILARITY_THRESHOLD,
  MIN_CONTENT_TOKENS_FOR_SIMILARITY,
  SITE_FINDING_EXAMPLE_CAP,
} from "./constants";
import type {
  AuditSiteBrokenLinkExample,
  AuditSiteContentSummary,
  AuditSiteConversionSummary,
  AuditSiteData,
  AuditSiteDuplicateGroup,
  AuditSiteHeadingSummary,
  AuditSiteIndexabilitySummary,
  AuditSiteLinkSummary,
  AuditSiteLocalSummary,
  AuditSiteMetadataSummary,
  AuditSitePageSnapshot,
  AuditSiteSimilarPagePair,
} from "./types";
import { SITE_IMPORTANT_INDEXABLE_TYPES, SITE_KEY_PAGE_TYPES } from "./types";
import { crawlIdentity, normalizeCrawlUrl } from "./urls";

function normalizeComparableText(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const normalized = value.replace(/\s+/g, " ").trim().toLowerCase();
  return normalized.length > 0 ? normalized : null;
}

function capExamples(paths: string[]): string[] {
  return [...new Set(paths)].slice(0, SITE_FINDING_EXAMPLE_CAP);
}

function duplicateGroups(
  pages: AuditSitePageSnapshot[],
  read: (page: AuditSitePageSnapshot) => string | null,
): AuditSiteDuplicateGroup[] {
  const groups = new Map<string, string[]>();

  for (const page of pages) {
    if (page.fetchStatus !== "success") {
      continue;
    }

    const value = normalizeComparableText(read(page));

    if (!value) {
      continue;
    }

    const current = groups.get(value) ?? [];
    current.push(page.path);
    groups.set(value, current);
  }

  return [...groups.entries()]
    .filter(([, paths]) => paths.length >= 2)
    .map(([value, paths]) => ({
      value,
      count: paths.length,
      paths: capExamples(paths),
    }))
    .sort((left, right) => right.count - left.count || left.value.localeCompare(right.value));
}

function uniqueNonEmptyCount(
  pages: AuditSitePageSnapshot[],
  read: (page: AuditSitePageSnapshot) => string | null,
): number {
  const unique = new Set<string>();

  for (const page of pages) {
    if (page.fetchStatus !== "success") {
      continue;
    }

    const value = normalizeComparableText(read(page));

    if (value) {
      unique.add(value);
    }
  }

  return unique.size;
}

function jaccardSimilarity(left: string[], right: string[]): number {
  const leftSet = new Set(left);
  const rightSet = new Set(right);
  let intersection = 0;

  for (const token of leftSet) {
    if (rightSet.has(token)) {
      intersection += 1;
    }
  }

  const union = leftSet.size + rightSet.size - intersection;

  if (union === 0) {
    return 0;
  }

  return intersection / union;
}

function homeIdentity(pages: AuditSitePageSnapshot[]): string | null {
  const home = pages.find(
    (page) => page.pageType === "home" && page.fetchStatus === "success",
  );

  if (home) {
    return home.identity;
  }

  const seed = pages.find((page) => page.selectionReason === "seed");

  if (!seed) {
    return null;
  }

  try {
    const url = new URL(seed.finalUrl);
    url.pathname = "/";
    url.search = "";
    url.hash = "";
    return crawlIdentity(url);
  } catch {
    return null;
  }
}

function canonicalIdentity(
  page: AuditSitePageSnapshot,
): string | null {
  if (!page.canonicalUrl) {
    return null;
  }

  const normalized = normalizeCrawlUrl(page.canonicalUrl, page.finalUrl);
  return normalized?.identity ?? null;
}

export function attachIncomingLinkCounts(
  pages: AuditSitePageSnapshot[],
): AuditSitePageSnapshot[] {
  const identityByPath = new Map<string, string>();
  const byIdentity = new Map<string, AuditSitePageSnapshot>();

  for (const page of pages) {
    byIdentity.set(page.identity, page);
    identityByPath.set(page.path, page.identity);
  }

  const incoming = new Map<string, number>();

  for (const page of pages) {
    if (page.fetchStatus !== "success") {
      continue;
    }

    for (const destinationPath of page.outgoingInternalPaths) {
      const identity = identityByPath.get(destinationPath);

      if (!identity || identity === page.identity) {
        continue;
      }

      if (!byIdentity.has(identity)) {
        continue;
      }

      incoming.set(identity, (incoming.get(identity) ?? 0) + 1);
    }
  }

  return pages.map((page) => ({
    ...page,
    incomingInternalCount: incoming.get(page.identity) ?? 0,
  }));
}

export function collectBrokenInternalLinks(
  pages: AuditSitePageSnapshot[],
): AuditSiteBrokenLinkExample[] {
  const byIdentity = new Map(
    pages.map((page) => [page.identity, page]),
  );
  const byPath = new Map(pages.map((page) => [page.path, page]));
  const examples: AuditSiteBrokenLinkExample[] = [];
  const seen = new Set<string>();

  for (const source of pages) {
    if (source.fetchStatus !== "success") {
      continue;
    }

    for (const destinationPath of source.outgoingInternalPaths) {
      const destination = byPath.get(destinationPath);

      if (!destination || destination.fetchStatus !== "failed") {
        continue;
      }

      const key = `${source.path}→${destinationPath}`;

      if (seen.has(key)) {
        continue;
      }

      seen.add(key);
      examples.push({
        sourcePath: source.path,
        destinationPath,
        destinationUrl: destination.finalUrl,
        statusCode: destination.statusCode,
        errorCode: destination.errorCode,
      });

      if (examples.length >= SITE_FINDING_EXAMPLE_CAP) {
        return examples;
      }
    }
  }

  void byIdentity;
  return examples;
}

function similarPairs(
  pages: AuditSitePageSnapshot[],
): AuditSiteSimilarPagePair[] {
  const eligible = pages.filter(
    (page) =>
      page.fetchStatus === "success" &&
      page.wordCount >= CONTENT_THIN_WARNING_THRESHOLD &&
      page.contentTokens.length >= MIN_CONTENT_TOKENS_FOR_SIMILARITY &&
      (page.pageType === "service" ||
        page.pageType === "location" ||
        page.pageType === "service-area"),
  );

  const pairs: AuditSiteSimilarPagePair[] = [];

  for (let i = 0; i < eligible.length; i += 1) {
    for (let j = i + 1; j < eligible.length; j += 1) {
      const left = eligible[i];
      const right = eligible[j];

      if (!left || !right) {
        continue;
      }

      const similarity = jaccardSimilarity(
        left.contentTokens,
        right.contentTokens,
      );

      if (similarity >= JACCARD_SIMILARITY_THRESHOLD) {
        pairs.push({
          pathA: left.path,
          pathB: right.path,
          similarity: Math.round(similarity * 100) / 100,
        });
      }

      if (pairs.length >= SITE_FINDING_EXAMPLE_CAP) {
        return pairs;
      }
    }
  }

  return pairs;
}

function buildMetadata(
  pages: AuditSitePageSnapshot[],
): AuditSiteMetadataSummary {
  return {
    uniqueTitleCount: uniqueNonEmptyCount(pages, (page) => page.title),
    uniqueDescriptionCount: uniqueNonEmptyCount(
      pages,
      (page) => page.metaDescription,
    ),
    duplicateTitleGroups: duplicateGroups(pages, (page) => page.title),
    duplicateDescriptionGroups: duplicateGroups(
      pages,
      (page) => page.metaDescription,
    ),
  };
}

function buildHeadings(
  pages: AuditSitePageSnapshot[],
): AuditSiteHeadingSummary {
  const successful = pages.filter((page) => page.fetchStatus === "success");

  return {
    uniqueH1Count: uniqueNonEmptyCount(successful, (page) => page.h1),
    missingH1Count: successful.filter((page) => !page.h1).length,
    duplicateH1Groups: duplicateGroups(successful, (page) => page.h1),
  };
}

function buildContent(
  pages: AuditSitePageSnapshot[],
): AuditSiteContentSummary {
  const services = pages.filter(
    (page) => page.fetchStatus === "success" && page.pageType === "service",
  );
  const locations = pages.filter(
    (page) =>
      page.fetchStatus === "success" &&
      (page.pageType === "location" || page.pageType === "service-area"),
  );
  const thinServices = services.filter(
    (page) => page.wordCount < CONTENT_THIN_WARNING_THRESHOLD,
  );
  const thinLocations = locations.filter(
    (page) => page.wordCount < CONTENT_THIN_WARNING_THRESHOLD,
  );

  return {
    servicePageCount: services.length,
    thinServicePageCount: thinServices.length,
    thinServicePaths: capExamples(thinServices.map((page) => page.path)),
    locationPageCount: locations.length,
    thinLocationPageCount: thinLocations.length,
    thinLocationPaths: capExamples(thinLocations.map((page) => page.path)),
    similarPagePairs: similarPairs(pages),
  };
}

function buildConversion(
  pages: AuditSitePageSnapshot[],
): AuditSiteConversionSummary {
  const keyPages = pages.filter(
    (page) =>
      page.fetchStatus === "success" &&
      SITE_KEY_PAGE_TYPES.includes(page.pageType),
  );
  const missingConversion = keyPages.filter((page) => !page.hasConversionPath);
  const home = keyPages.find((page) => page.pageType === "home");
  const keyWithoutTel = keyPages.filter(
    (page) =>
      page.pageType !== "home" &&
      (page.pageType === "service" ||
        page.pageType === "location" ||
        page.pageType === "service-area") &&
      !page.hasTelLink &&
      !page.hasClickToCall,
  );
  const trustOnKeyPages = keyPages.filter(
    (page) => page.trustCategoryCount > 0,
  ).length;

  return {
    keyPageCount: keyPages.length,
    keyPagesWithConversionPath: keyPages.filter((page) => page.hasConversionPath)
      .length,
    keyPagesMissingConversionPath: capExamples(
      missingConversion.map((page) => page.path),
    ),
    clickToCallOnHome: Boolean(
      home?.hasClickToCall || home?.hasTelLink,
    ),
    keyPagesMissingTel: capExamples(keyWithoutTel.map((page) => page.path)),
    trustOnKeyPages,
  };
}

function buildLocal(pages: AuditSitePageSnapshot[]): AuditSiteLocalSummary {
  const successful = pages.filter((page) => page.fetchStatus === "success");
  const mentions = new Set<string>();

  for (const page of successful) {
    for (const mention of page.serviceAreaMentions) {
      mentions.add(mention.toLowerCase());
    }
  }

  const keyPages = successful.filter((page) =>
    SITE_KEY_PAGE_TYPES.includes(page.pageType),
  );
  const withPhone = keyPages.filter((page) => page.hasPhoneSignal);
  const inconsistentContact =
    keyPages.length >= 3 &&
    withPhone.length > 0 &&
    withPhone.length < keyPages.length - 1;

  return {
    contactPageFound: successful.some((page) => page.pageType === "contact"),
    aboutPageFound: successful.some((page) => page.pageType === "about"),
    servicesIndexFound: successful.some(
      (page) => page.pageType === "services-index",
    ),
    locationPageCount: successful.filter((page) => page.pageType === "location")
      .length,
    serviceAreaPageCount: successful.filter(
      (page) => page.pageType === "service-area",
    ).length,
    mentionedServiceAreaCount: mentions.size,
    localBusinessLikely: successful.some((page) => page.likelyLocalBusiness),
    inconsistentContact,
  };
}

function buildIndexability(
  pages: AuditSitePageSnapshot[],
): AuditSiteIndexabilitySummary {
  const successful = pages.filter((page) => page.fetchStatus === "success");
  const homepage = homeIdentity(pages);
  const important = successful.filter((page) =>
    SITE_IMPORTANT_INDEXABLE_TYPES.includes(page.pageType),
  );

  const canonicalToHomePaths: string[] = [];
  const offsiteCanonicalPaths: string[] = [];

  for (const page of important) {
    if (page.pageType === "home") {
      continue;
    }

    const canonical = canonicalIdentity(page);

    if (
      homepage &&
      canonical &&
      canonical === homepage &&
      page.canonicalSelfReferencing === false
    ) {
      canonicalToHomePaths.push(page.path);
    }

    if (page.canonicalSameOrigin === false && page.canonicalUrl) {
      offsiteCanonicalPaths.push(page.path);
    }
  }

  return {
    importantNoindexPaths: capExamples(
      important
        .filter((page) => page.indexable === false)
        .map((page) => page.path),
    ),
    canonicalToHomePaths: capExamples(canonicalToHomePaths),
    offsiteCanonicalPaths: capExamples(offsiteCanonicalPaths),
    missingSelfCanonicalCount: important.filter(
      (page) => !page.canonicalUrl,
    ).length,
  };
}

function buildLinks(pages: AuditSitePageSnapshot[]): AuditSiteLinkSummary {
  const broken = collectBrokenInternalLinks(pages);
  const weaklyLinked = pages.filter((page) => {
    if (page.fetchStatus !== "success" || page.selectionReason === "seed") {
      return false;
    }

    if (page.pageType === "home") {
      return false;
    }

    if (
      page.pageType !== "service" &&
      page.pageType !== "location" &&
      page.pageType !== "service-area" &&
      page.pageType !== "contact"
    ) {
      return false;
    }

    return page.incomingInternalCount <= 0;
  });

  const crawledEdgeCount = pages.reduce((total, page) => {
    if (page.fetchStatus !== "success") {
      return total;
    }

    return (
      total +
      page.outgoingInternalPaths.filter((path) =>
        pages.some((other) => other.path === path && other.identity !== page.identity),
      ).length
    );
  }, 0);

  return {
    verifiedBrokenCount: broken.length,
    brokenExamples: broken,
    weaklyLinkedImportantPaths: capExamples(
      weaklyLinked.map((page) => page.path),
    ),
    crawledEdgeCount,
  };
}

export function aggregateSiteData(options: {
  seedUrl: string;
  pages: AuditSitePageSnapshot[];
  discoveredUrls: string[];
  skippedUrls: AuditSiteData["skippedUrls"];
  truncated: boolean;
  truncationReasons: AuditSiteData["crawl"]["truncationReasons"];
  maxPages: number;
  maxDepth: number;
  runtimeMs: number;
}): AuditSiteData {
  const pages = attachIncomingLinkCounts(options.pages);
  const crawledCount = pages.filter(
    (page) => page.fetchStatus === "success",
  ).length;
  const failedCount = pages.filter(
    (page) => page.fetchStatus === "failed",
  ).length;

  return {
    crawl: {
      seedUrl: options.seedUrl,
      discoveredCount: options.discoveredUrls.length,
      crawledCount,
      failedCount,
      skippedCount: options.skippedUrls.length,
      truncated: options.truncated,
      truncationReasons: options.truncationReasons,
      maxPages: options.maxPages,
      maxDepth: options.maxDepth,
      runtimeMs: options.runtimeMs,
    },
    discoveredUrls: options.discoveredUrls,
    skippedUrls: options.skippedUrls,
    pages,
    metadata: buildMetadata(pages),
    headings: buildHeadings(pages),
    links: buildLinks(pages),
    content: buildContent(pages),
    conversion: buildConversion(pages),
    local: buildLocal(pages),
    indexability: buildIndexability(pages),
  };
}

export function visibleTextFromHtml(html: string): string {
  return extractVisibleText(load(html));
}
