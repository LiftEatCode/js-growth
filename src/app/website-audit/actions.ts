"use server";

import { analyzeHtml } from "@/lib/website-audit/analyze-html";
import { fetchWebsitePage } from "@/lib/website-audit/audit-url";
import { parseWebsiteAuditInput } from "@/lib/website-audit/schema";
import { scoreWebsiteAudit } from "@/lib/website-audit/scoring";
import type { WebsiteAuditResponse } from "@/lib/website-audit/types";

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
    const pageData = analyzeHtml(
      fetchResult.data.html,
      fetchResult.data.finalUrl,
    );

    const scoring = scoreWebsiteAudit(
      pageData,
      fetchResult.data.finalUrl,
    );

    return {
      success: true,
      metadata: {
        requestedUrl:
          fetchResult.data.requestedUrl,
        finalUrl: fetchResult.data.finalUrl,
        statusCode:
          fetchResult.data.statusCode,
        contentType:
          fetchResult.data.contentType,
        fetchedAt:
          fetchResult.data.fetchedAt,
      },
      pageData,
      findings: scoring.findings,
      categoryScores:
        scoring.categoryScores,
      overallScore:
        scoring.overallScore,
      summary: scoring.summary,
      opportunity: scoring.opportunity,
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