"use server";

import { parseCampaignAttributionFromFormData } from "@/lib/growth/attribution";
import { buildCompetitiveIntelligence } from "@/lib/website-audit/competitive/crawl-competitor";
import {
  collectCompetitorRawUrls,
  parseCompetitorInputs,
} from "@/lib/website-audit/competitive/input";
import { parseWebsiteAuditInput } from "@/lib/website-audit/schema";
import {
  auditReportRepository,
  createAuditReport,
} from "@/lib/website-audit/storage";
import { toClientWebsiteAuditResult } from "@/lib/website-audit/report-free-payload";
import { buildGrowthReportViewModel } from "@/lib/website-audit/report-view";
import { runDeterministicWebsiteAudit } from "@/lib/website-audit/run-deterministic-audit";
import type {
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

  const deterministic = await runDeterministicWebsiteAudit(
    parsedInput.data.url,
  );

  if (!deterministic.success) {
    console.info("[audit] fetch failed", {
      code: deterministic.error.code,
    });
    return deterministic;
  }

  try {
    const auditResult: WebsiteAuditResult = {
      ...deterministic.audit,
    };

    try {
      const parsedCompetitors = parseCompetitorInputs(
        collectCompetitorRawUrls(formData),
        auditResult.metadata.finalUrl,
      );

      if (parsedCompetitors.attempted && auditResult.siteData) {
        auditResult.competitiveData = await buildCompetitiveIntelligence({
          customerUrl: auditResult.metadata.finalUrl,
          customerSiteData: auditResult.siteData,
          customerPageData: auditResult.pageData,
          accepted: parsedCompetitors.accepted,
          skipped: parsedCompetitors.skipped,
          submittedCount: parsedCompetitors.submittedCount,
        });
      }
    } catch (error) {
      console.error("Website audit competitive comparison failed:", error);
    }

    const attribution = parseCampaignAttributionFromFormData(formData);

    const report = createAuditReport(auditResult, "public", {
      attribution,
    });

    try {
      await auditReportRepository.save(report);
    } catch (error) {
      console.error("Website audit report save failed:", error);

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
      ...toClientWebsiteAuditResult(
        auditResult,
        buildGrowthReportViewModel(auditResult, "public"),
      ),
      reportId: report.id,
    };
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
