import { load } from "cheerio";

import { MAX_INTERNAL_LINK_DETAILS } from "../page-content";
import { normalizeWhitespace } from "../page-metadata";
import { classifySkipReason } from "./urls";
import type { AuditSiteLinkLocation } from "./types";
import type { NormalizedCrawlUrl } from "./urls";

export interface SiteLinkCandidate {
  rawHref: string;
  normalized: NormalizedCrawlUrl;
  anchorText: string;
  location: AuditSiteLinkLocation;
}

export function extractSiteLinkCandidates(
  html: string,
  pageUrl: string,
  seedUrl: string,
  discoveredCount: number,
): SiteLinkCandidate[] {
  const $ = load(html);
  const candidates: SiteLinkCandidate[] = [];
  const seen = new Set<string>();
  let inspected = 0;

  $("a[href]").each((_, element) => {
    if (inspected >= MAX_INTERNAL_LINK_DETAILS) {
      return;
    }

    const href = $(element).attr("href")?.trim();

    if (!href) {
      return;
    }

    inspected += 1;

    const decision = classifySkipReason({
      href,
      baseUrl: pageUrl,
      seedUrl,
      discoveredCount,
    });

    if (!decision.ok) {
      return;
    }

    if (seen.has(decision.url.identity)) {
      return;
    }

    seen.add(decision.url.identity);

    const node = $(element);
    const clone = node.clone();
    clone.find("script, style, noscript").remove();

    let location: AuditSiteLinkLocation = "other";

    if (node.closest("footer").length > 0) {
      location = "footer";
    } else if (node.closest("header").length > 0) {
      location = "header";
    } else if (node.closest("nav").length > 0) {
      location = "nav";
    } else if (node.closest("main").length > 0) {
      location = "main";
    }

    candidates.push({
      rawHref: href,
      normalized: decision.url,
      anchorText: normalizeWhitespace(clone.text()),
      location,
    });
  });

  return candidates;
}

export function isPrimaryNavLocation(
  location: AuditSiteLinkLocation,
): boolean {
  return (
    location === "header" || location === "nav" || location === "main"
  );
}
