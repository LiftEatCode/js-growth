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

/** Hosts allowed to use the zero-network fixture audit under test mocks. */
const GROWTH_TEST_MOCK_AUDIT_HOSTS = new Set([
  "example.com",
  "www.example.com",
  "growth-acceptance.test",
]);

const GROWTH_TEST_MOCK_AUDIT_HTML = `<!doctype html>
<html>
  <head>
    <title>Growth Acceptance Fixture</title>
    <meta name="description" content="Deterministic fixture for growth acceptance audits.">
    <meta name="viewport" content="width=device-width, initial-scale=1">
  </head>
  <body>
    <main>
      <h1>Growth Acceptance Fixture</h1>
      <p>${Array.from({ length: 120 }, (_, i) => `word${i + 1}`).join(" ")}</p>
      <p><a href="/contact">Contact</a></p>
    </main>
  </body>
</html>`;

function growthTestMockAuditEnabled(): boolean {
  return (
    process.env.GROWTH_TEST_MOCK_AUDIT === "1" ||
    process.env.COMMERCIAL_TEST_MOCK_EXTERNALS === "1"
  );
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

  // Acceptance / E2E: zero live crawl when mocks are enabled for allowlisted hosts.
  if (growthTestMockAuditEnabled()) {
    try {
      const hostname = new URL(parsed.url).hostname.toLowerCase();
      if (GROWTH_TEST_MOCK_AUDIT_HOSTS.has(hostname)) {
        const page: FetchedWebsitePage = {
          requestedUrl: parsed.url,
          finalUrl: parsed.url.startsWith("http")
            ? parsed.url
            : `https://${hostname}/`,
          statusCode: 200,
          contentType: "text/html",
          xRobotsTag: null,
          html: GROWTH_TEST_MOCK_AUDIT_HTML,
          fetchedAt: new Date().toISOString(),
          contentEncoding: null,
          cacheControl: null,
          expires: null,
          etag: null,
          lastModified: null,
          advertisedContentLength: null,
          documentFetchDurationMs: 1,
        };
        const audit = await runDeterministicWebsiteAuditFromFetchedPage(page);
        return { success: true, audit };
      }
    } catch (error) {
      console.error("Growth test mock audit failed:", error);
    }
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
