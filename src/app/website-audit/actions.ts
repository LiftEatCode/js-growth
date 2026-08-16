"use server";

import { analyzeHtml } from "@/lib/website-audit/analyze-html";
import { fetchWebsitePage } from "@/lib/website-audit/audit-url";
import { buildAuditRobotsData } from "@/lib/website-audit/robots";
import { parseWebsiteAuditInput } from "@/lib/website-audit/schema";
import { scoreWebsiteAudit } from "@/lib/website-audit/scoring";
import { discoverSite } from "@/lib/website-audit/site-discovery";
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
    return fetchResult;
  }

  try {
    const {
      robotsMetaRaw,
      ...htmlPageData
    } = analyzeHtml(
      fetchResult.data.html,
      fetchResult.data.finalUrl,
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

    const scoring = scoreWebsiteAudit(
      pageData,
      fetchResult.data.finalUrl,
      siteDiscovery,
    );

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