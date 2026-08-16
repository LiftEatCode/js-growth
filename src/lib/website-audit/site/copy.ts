import { SITE_SCAN_DISCLOSURE } from "./constants";
import type { AuditSiteData } from "./types";

export function formatSiteScanSummary(siteData: AuditSiteData): string {
  const { crawl } = siteData;
  const capNote =
    crawl.truncated && crawl.truncationReasons.includes("page-cap")
      ? ` Scan capped at ${crawl.maxPages} prioritized pages.`
      : "";

  return `This audit scanned ${crawl.crawledCount} prioritized pages from ${crawl.discoveredCount} internal URLs discovered. The scan focuses on important service, location, contact, and navigation pages and is not a complete crawl of every URL.${capNote}`;
}

export function formatFreeSiteScanLine(siteData: AuditSiteData): string {
  return `Representative site scan: ${siteData.crawl.crawledCount} pages`;
}

export { SITE_SCAN_DISCLOSURE };
