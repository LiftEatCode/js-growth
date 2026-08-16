/**
 * Competitive Intelligence V1 limits.
 *
 * Competitor scans are smaller than the customer Multi-Page crawl so a
 * free audit with optional competitors stays reasonably fast and cheap.
 * Do not hard-code these values inside loops.
 */

export const MAX_COMPETITORS = 3;

export const MAX_COMPETITOR_PAGES = 6;
export const MAX_COMPETITOR_DEPTH = 2;
export const MAX_COMPETITOR_DISCOVERED_URLS = 50;
export const MAX_COMPETITOR_BLOG_PAGES = 1;
export const COMPETITOR_FETCH_CONCURRENCY = 2;
export const MAX_COMPETITOR_CRAWL_MS = 8_000;
export const MAX_TOTAL_COMPETITIVE_CRAWL_MS = 25_000;

export const MIN_REMAINING_COMPETITOR_MS = 1_500;

export const MAX_COMPETITIVE_OPPORTUNITIES = 5;
export const MAX_SURFACED_STRENGTHS = 5;
export const MAX_SURFACED_GAPS = 8;

export const COMPETITOR_FORM_FIELDS = [
  "competitorUrl1",
  "competitorUrl2",
  "competitorUrl3",
] as const;

export const COMPETITIVE_DISCLOSURE =
  "Competitive comparisons are based on a prioritized sample of publicly accessible pages from the supplied websites. They do not represent search rankings, traffic, revenue, backlinks, or complete website inventories.";
