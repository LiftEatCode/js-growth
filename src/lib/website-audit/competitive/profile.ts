import { LOCAL_BUSINESS_SCHEMA_TYPES } from "../page-local";
import { CONTENT_THIN_WARNING_THRESHOLD } from "../page-content";
import type { AuditPageData, AuditPerformanceRiskLevel } from "../types";
import {
  SITE_IMPORTANT_INDEXABLE_TYPES,
  SITE_KEY_PAGE_TYPES,
  type AuditSiteData,
  type AuditSitePageSnapshot,
  type AuditSitePageType,
} from "../site/types";
import { siteHostKey } from "../site/urls";
import { roundMetric } from "./median";
import type { CompetitiveSiteProfile } from "./types";

const USEFUL_SCHEMA_FAMILIES: Array<{
  id: string;
  types: Set<string>;
}> = [
  { id: "localBusiness", types: LOCAL_BUSINESS_SCHEMA_TYPES },
  { id: "organization", types: new Set(["Organization"]) },
  { id: "service", types: new Set(["Service"]) },
  { id: "faq", types: new Set(["FAQPage"]) },
  { id: "breadcrumb", types: new Set(["BreadcrumbList"]) },
];

const COMMERCIAL_PAGE_TYPES: AuditSitePageType[] = [
  "home",
  "service",
  "services-index",
  "location",
  "service-area",
];

function successful(pages: AuditSitePageSnapshot[]): AuditSitePageSnapshot[] {
  return pages.filter((page) => page.fetchStatus === "success");
}

function ofTypes(
  pages: AuditSitePageSnapshot[],
  types: AuditSitePageType[],
): AuditSitePageSnapshot[] {
  return pages.filter((page) => types.includes(page.pageType));
}

function uniquenessPercent(
  pages: AuditSitePageSnapshot[],
  read: (page: AuditSitePageSnapshot) => string | null,
): number | null {
  const values = pages
    .map((page) => read(page)?.trim().toLowerCase() ?? "")
    .filter(Boolean);

  if (values.length < 2) {
    return null;
  }

  return roundMetric((new Set(values).size / values.length) * 100, 1);
}

function percent(numerator: number, denominator: number): number | null {
  if (denominator <= 0) {
    return null;
  }

  return roundMetric((numerator / denominator) * 100, 1);
}

function medianOf(values: number[]): number | null {
  if (values.length === 0) {
    return null;
  }

  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  const midValue = sorted[middle];

  if (midValue === undefined) {
    return null;
  }

  if (sorted.length % 2 === 1) {
    return midValue;
  }

  const lower = sorted[middle - 1];
  return lower === undefined ? midValue : (lower + midValue) / 2;
}

function hostnameFrom(url: string | null): string {
  if (!url) {
    return "unknown";
  }

  try {
    return siteHostKey(new URL(url).hostname);
  } catch {
    return "unknown";
  }
}

function countTypes(
  pages: AuditSitePageSnapshot[],
): CompetitiveSiteProfile["pages"] {
  const scanned = successful(pages);
  const byType = (type: AuditSitePageType) =>
    scanned.filter((page) => page.pageType === type).length;

  const location =
    byType("location") + byType("service-area");
  const blog = byType("blog") + byType("article");
  const counted =
    byType("home") +
    byType("service") +
    byType("services-index") +
    location +
    byType("contact") +
    byType("about") +
    blog;
  const other = Math.max(0, scanned.length - counted);

  return {
    total: scanned.length,
    service: byType("service"),
    serviceIndex: byType("services-index"),
    location,
    contact: byType("contact"),
    about: byType("about"),
    blog,
    other,
  };
}

export function usefulSchemaFamilyCount(types: string[]): number {
  const normalized = new Set(
    types.map((type) => type.replace(/^https?:\/\/schema\.org\//i, "")),
  );

  return USEFUL_SCHEMA_FAMILIES.filter((family) =>
    [...family.types].some((type) => normalized.has(type)),
  ).length;
}

function hasLocalSchema(pageData?: AuditPageData): boolean {
  if (!pageData) {
    return false;
  }

  if (pageData.local?.schema.hasLocalBusinessSchema) {
    return true;
  }

  return pageData.structuredDataTypes.some((type) =>
    LOCAL_BUSINESS_SCHEMA_TYPES.has(
      type.replace(/^https?:\/\/schema\.org\//i, ""),
    ),
  );
}

function emptyCrawl() {
  return {
    discoveredCount: 0,
    scannedCount: 0,
    failedCount: 0,
    truncated: false,
  };
}

function risk(
  value: AuditPerformanceRiskLevel | undefined,
): AuditPerformanceRiskLevel | null {
  return value ?? null;
}

export function emptyCompetitiveProfile(
  submittedUrl: string,
  status: CompetitiveSiteProfile["status"],
  finalUrl: string | null = null,
): CompetitiveSiteProfile {
  const hostname = hostnameFrom(finalUrl ?? submittedUrl);

  return {
    status,
    submittedUrl,
    finalUrl,
    hostname,
    displayName: hostname,
    crawl: emptyCrawl(),
    pages: {
      total: 0,
      service: 0,
      serviceIndex: 0,
      location: 0,
      contact: 0,
      about: 0,
      blog: 0,
      other: 0,
    },
    search: {
      uniqueTitlePercent: null,
      uniqueDescriptionPercent: null,
      uniqueH1Percent: null,
      indexabilityIssuePercent: null,
    },
    content: {
      medianServiceWordCount: null,
      thinCommercialPercent: null,
      similarCommercialPairCount: 0,
    },
    conversion: {
      keyPageCount: 0,
      ctaCoveragePercent: null,
      clickToCallCoveragePercent: null,
      formOrContactPathPercent: null,
    },
    local: {
      substantiveLocationPages: 0,
      localRelevancePercent: null,
      contactPageFound: false,
      localSchemaPresent: false,
      inconsistentContact: false,
    },
    technical: {
      weaklyLinkedServicePercent: null,
      verifiedBrokenLinkCount: 0,
      brokenLinkRatePercent: null,
      usefulSchemaFamilyCount: 0,
    },
    performance: {
      optimizationRisk: null,
      blockingScriptCandidates: null,
      uniqueExternalOriginCount: null,
      htmlBytes: null,
    },
    trust: {
      keyPageTrustPercent: null,
      aboutPageFound: false,
    },
  };
}

export function buildCompetitiveProfile(options: {
  submittedUrl: string;
  siteData: AuditSiteData;
  seedPageData?: AuditPageData;
}): CompetitiveSiteProfile {
  const { submittedUrl, siteData, seedPageData } = options;
  const finalUrl = siteData.crawl.seedUrl;
  const hostname = hostnameFrom(finalUrl || submittedUrl);
  const pages = siteData.pages;
  const scanned = successful(pages);
  const commercial = ofTypes(scanned, COMMERCIAL_PAGE_TYPES);
  const keyPages = ofTypes(scanned, SITE_KEY_PAGE_TYPES);
  const services = scanned.filter((page) => page.pageType === "service");
  const locationPages = scanned.filter(
    (page) =>
      page.pageType === "location" || page.pageType === "service-area",
  );
  const commercialForThin = [...services, ...locationPages];
  const thinCommercial = commercialForThin.filter(
    (page) => page.wordCount < CONTENT_THIN_WARNING_THRESHOLD,
  );
  const substantiveLocations = locationPages.filter(
    (page) => page.wordCount >= CONTENT_THIN_WARNING_THRESHOLD,
  );
  const important = ofTypes(scanned, SITE_IMPORTANT_INDEXABLE_TYPES);
  const indexabilityIssues = important.filter(
    (page) =>
      page.indexable === false ||
      page.canonicalSameOrigin === false,
  ).length;
  const serviceWordCounts = services.map((page) => page.wordCount);
  const linkedServices = services.filter(
    (page) => page.incomingInternalCount > 0,
  );
  const localRelevant = keyPages.filter(
    (page) =>
      page.likelyLocalBusiness ||
      page.hasServiceAreaLanguage ||
      page.hasAddressSignal ||
      page.locationPage,
  );
  const performance = seedPageData?.performance;

  return {
    status: "analyzed",
    submittedUrl,
    finalUrl,
    hostname,
    displayName: hostname,
    crawl: {
      discoveredCount: siteData.crawl.discoveredCount,
      scannedCount: siteData.crawl.crawledCount,
      failedCount: siteData.crawl.failedCount,
      truncated: siteData.crawl.truncated,
    },
    pages: countTypes(pages),
    search: {
      uniqueTitlePercent: uniquenessPercent(commercial, (page) => page.title),
      uniqueDescriptionPercent: uniquenessPercent(
        commercial,
        (page) => page.metaDescription,
      ),
      uniqueH1Percent: uniquenessPercent(commercial, (page) => page.h1),
      indexabilityIssuePercent: percent(indexabilityIssues, important.length),
    },
    content: {
      medianServiceWordCount:
        medianOf(serviceWordCounts) === null
          ? null
          : Math.round(medianOf(serviceWordCounts) ?? 0),
      thinCommercialPercent: percent(
        thinCommercial.length,
        commercialForThin.length,
      ),
      similarCommercialPairCount: siteData.content.similarPagePairs.length,
    },
    conversion: {
      keyPageCount: keyPages.length,
      ctaCoveragePercent: percent(
        keyPages.filter((page) => page.hasConversionPath).length,
        keyPages.length,
      ),
      clickToCallCoveragePercent: percent(
        keyPages.filter((page) => page.hasTelLink || page.hasClickToCall)
          .length,
        keyPages.length,
      ),
      formOrContactPathPercent: percent(
        keyPages.filter((page) => page.hasLeadForm || page.hasConversionPath)
          .length,
        keyPages.length,
      ),
    },
    local: {
      substantiveLocationPages: substantiveLocations.length,
      localRelevancePercent: percent(localRelevant.length, keyPages.length),
      contactPageFound: siteData.local.contactPageFound,
      localSchemaPresent: hasLocalSchema(seedPageData),
      inconsistentContact: siteData.local.inconsistentContact,
    },
    technical: {
      weaklyLinkedServicePercent:
        services.length >= 2
          ? percent(services.length - linkedServices.length, services.length)
          : null,
      verifiedBrokenLinkCount: siteData.links.verifiedBrokenCount,
      brokenLinkRatePercent: percent(
        siteData.links.verifiedBrokenCount,
        Math.max(siteData.crawl.crawledCount, 1),
      ),
      usefulSchemaFamilyCount: usefulSchemaFamilyCount(
        seedPageData?.structuredDataTypes ?? [],
      ),
    },
    performance: {
      optimizationRisk: risk(performance?.optimizationRisk),
      blockingScriptCandidates:
        performance?.scripts.blockingHeadCandidates ?? null,
      uniqueExternalOriginCount:
        performance?.origins.uniqueExternalOriginCount ?? null,
      htmlBytes: performance?.htmlBytes ?? null,
    },
    trust: {
      keyPageTrustPercent: percent(
        keyPages.filter((page) => page.trustCategoryCount > 0).length,
        keyPages.length,
      ),
      aboutPageFound: siteData.local.aboutPageFound,
    },
  };
}
