"use server";

import { analyzeHtml } from "@/lib/website-audit/analyze-html";
import { fetchWebsitePage } from "@/lib/website-audit/audit-url";
import { buildCompetitiveIntelligence } from "@/lib/website-audit/competitive/crawl-competitor";
import {
  collectCompetitorRawUrls,
  parseCompetitorInputs,
} from "@/lib/website-audit/competitive/input";
import { buildAuditRobotsData } from "@/lib/website-audit/robots";
import { parseWebsiteAuditInput } from "@/lib/website-audit/schema";
import { scoreWebsiteAudit } from "@/lib/website-audit/scoring";
import { discoverSite } from "@/lib/website-audit/site-discovery";
import { crawlSite } from "@/lib/website-audit/site/crawl";
import {
  auditReportRepository,
  createAuditReport,
} from "@/lib/website-audit/storage";
import type {
  AuditPageData,
  WebsiteAuditResponse,
  WebsiteAuditResult,
} from "@/lib/website-audit/types";

export async function auditWebsite(
  formData: FormData,
): Promise<WebsiteAuditResponse> {
  const parsedInput = parseWebsiteAuditInput({
    url: formData.get("url"),
  });

  if (!parsedInput.success) {
    return {
      success: false,
      error: {
        code: "INVALID_URL",
        message: parsedInput.error,
      },
    };
  }

    const fetchResult = await fetchWebsitePage(
      parsedInput.data.url,
    );

    if (!fetchResult.success) {
      console.info("[audit] fetch failed", {
        code: fetchResult.error.code,
      });
      return fetchResult;
    }

    try {
      const {
        robotsMetaRaw,
        ...htmlPageData
      } = analyzeHtml(
        fetchResult.data.html,
        fetchResult.data.finalUrl,
        {
          advertisedContentLength:
            fetchResult.data.advertisedContentLength,
          contentEncoding:
            fetchResult.data.contentEncoding,
          cacheControl:
            fetchResult.data.cacheControl,
          expires: fetchResult.data.expires,
          etag: fetchResult.data.etag,
          lastModified: fetchResult.data.lastModified,
          documentFetchDurationMs:
            fetchResult.data.documentFetchDurationMs,
        },
      );

      const pageData: AuditPageData = {
        ...htmlPageData,
        robots: buildAuditRobotsData(
          robotsMetaRaw,
          fetchResult.data.xRobotsTag,
        ),
      };

      const siteDiscovery = await discoverSite(
        fetchResult.data.finalUrl,
      );

      let siteData: WebsiteAuditResult["siteData"];

      try {
        siteData = await crawlSite({
          seedRequestedUrl: fetchResult.data.requestedUrl,
          seedFinalUrl: fetchResult.data.finalUrl,
          seedHtml: fetchResult.data.html,
          seedPageData: pageData,
          seedStatusCode: fetchResult.data.statusCode,
          siteDiscovery,
        });
      } catch (error) {
        console.error("Website audit site crawl failed:", error);
      }

      const scoring = scoreWebsiteAudit(
        pageData,
        fetchResult.data.finalUrl,
        siteDiscovery,
        siteData,
      );

      let competitiveData: WebsiteAuditResult["competitiveData"];

      try {
        const parsedCompetitors = parseCompetitorInputs(
          collectCompetitorRawUrls(formData),
          fetchResult.data.finalUrl,
        );

        if (parsedCompetitors.attempted && siteData) {
          competitiveData = await buildCompetitiveIntelligence({
            customerUrl: fetchResult.data.finalUrl,
            customerSiteData: siteData,
            customerPageData: pageData,
            accepted: parsedCompetitors.accepted,
            skipped: parsedCompetitors.skipped,
            submittedCount: parsedCompetitors.submittedCount,
          });
        }
      } catch (error) {
        console.error("Website audit competitive comparison failed:", error);
      }

      const auditResult: WebsiteAuditResult = {
        success: true,

        metadata: {
          requestedUrl:
            fetchResult.data.requestedUrl,

          finalUrl:
            fetchResult.data.finalUrl,

          statusCode:
            fetchResult.data.statusCode,

          contentType:
            fetchResult.data.contentType,

          fetchedAt:
            fetchResult.data.fetchedAt,
        },

        pageData,

        siteDiscovery,

        siteData,

        competitiveData,

        findings:
          scoring.findings,

        categoryScores:
          scoring.categoryScores,

        overallScore:
          scoring.overallScore,

        summary:
          scoring.summary,

        opportunity:
          scoring.opportunity,
      };

    const report = createAuditReport(
      auditResult,
      "public",
    );

    try {
      await auditReportRepository.save(
        report,
      );
    } catch (error) {
      console.error(
        "Website audit report save failed:",
        error,
      );

      return {
        success: false,
        error: {
          code: "REPORT_SAVE_FAILED",
          message:
            "The website audit completed successfully, but the report could not be saved.",
        },
      };
    }

    return {
      ...auditResult,
      reportId: report.id,
    };
  } catch (error) {
    console.error(
      "Website audit analysis failed:",
      error,
    );

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