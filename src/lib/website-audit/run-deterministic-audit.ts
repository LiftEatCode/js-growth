import { analyzeHtml } from "@/lib/website-audit/analyze-html";
import {
  fetchWebsitePage,
  type FetchedWebsitePage,
} from "@/lib/website-audit/audit-url";
import { buildAuditRobotsData } from "@/lib/website-audit/robots";
import { interpretPublicWebsiteUrl } from "@/lib/website-audit/schema";
import { scoreWebsiteAudit } from "@/lib/website-audit/scoring";
import { discoverSite } from "@/lib/website-audit/site-discovery";
import { crawlSite, type CrawlSiteOptions } from "@/lib/website-audit/site/crawl";
import type {
  AuditPageData,
  WebsiteAuditError,
  WebsiteAuditResult,
} from "@/lib/website-audit/types";

export type DeterministicAuditOutcome =
  | { success: true; audit: WebsiteAuditResult }
  | WebsiteAuditError;

export interface DeterministicAuditFromPageOptions {
  crawl?: Pick<CrawlSiteOptions, "fetchPage" | "fetchSitemapBody" | "now" | "limits">;
  discoverSite?: typeof discoverSite;
}

/**
 * Deterministic Website Growth Audit used by the public funnel and
 * internal prospecting. Does not run competitive analysis, Stripe, AI,
 * analytics, email, or lead capture.
 */
export async function runDeterministicWebsiteAudit(
  url: string,
): Promise<DeterministicAuditOutcome> {
  const parsed = interpretPublicWebsiteUrl(url);

  if (!parsed.success) {
    return {
      success: false,
      error: {
        code: "INVALID_URL",
        message: parsed.error,
      },
    };
  }

  const fetchResult = await fetchWebsitePage(parsed.url);

  if (!fetchResult.success) {
    return fetchResult;
  }

  try {
    const audit = await runDeterministicWebsiteAuditFromFetchedPage(
      fetchResult.data,
    );
    return { success: true, audit };
  } catch (error) {
    console.error("Website audit analysis failed:", error);
    return {
      success: false,
      error: {
        code: "ANALYSIS_FAILED",
        message:
          "The website was fetched successfully, but an error occurred while analyzing the page.",
      },
    };
  }
}

export async function runDeterministicWebsiteAuditFromFetchedPage(
  page: FetchedWebsitePage,
  options: DeterministicAuditFromPageOptions = {},
): Promise<WebsiteAuditResult> {
  const { robotsMetaRaw, ...htmlPageData } = analyzeHtml(
    page.html,
    page.finalUrl,
    {
      advertisedContentLength: page.advertisedContentLength,
      contentEncoding: page.contentEncoding,
      cacheControl: page.cacheControl,
      expires: page.expires,
      etag: page.etag,
      lastModified: page.lastModified,
      documentFetchDurationMs: page.documentFetchDurationMs,
    },
  );

  const pageData: AuditPageData = {
    ...htmlPageData,
    robots: buildAuditRobotsData(robotsMetaRaw, page.xRobotsTag),
  };

  const discover = options.discoverSite ?? discoverSite;
  const siteDiscovery = await discover(page.finalUrl);

  let siteData: WebsiteAuditResult["siteData"];

  try {
    siteData = await crawlSite({
      seedRequestedUrl: page.requestedUrl,
      seedFinalUrl: page.finalUrl,
      seedHtml: page.html,
      seedPageData: pageData,
      seedStatusCode: page.statusCode,
      siteDiscovery,
      ...options.crawl,
    });
  } catch (error) {
    console.error("Website audit site crawl failed:", error);
  }

  const scoring = scoreWebsiteAudit(
    pageData,
    page.finalUrl,
    siteDiscovery,
    siteData,
  );

  return {
    success: true,
    metadata: {
      requestedUrl: page.requestedUrl,
      finalUrl: page.finalUrl,
      statusCode: page.statusCode,
      contentType: page.contentType,
      fetchedAt: page.fetchedAt,
    },
    pageData,
    siteDiscovery,
    siteData,
    findings: scoring.findings,
    categoryScores: scoring.categoryScores,
    overallScore: scoring.overallScore,
    summary: scoring.summary,
    opportunity: scoring.opportunity,
  };
}
