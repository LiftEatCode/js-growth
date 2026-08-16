import { fetchPublicHttpResource } from "../secure-fetch";
import { MAX_SITEMAP_BODY_BYTES, MAX_SITEMAP_LOC_CANDIDATES } from "./constants";
import { classifySkipReason } from "./urls";
import type { NormalizedCrawlUrl } from "./urls";

const LOC_PATTERN = /<loc>\s*([^<]+)\s*<\/loc>/gi;

const SKIP_SITEMAP_LOC_EXTENSIONS = new Set([
  "xml",
  "gz",
  "pdf",
  "jpg",
  "jpeg",
  "png",
  "gif",
  "webp",
  "svg",
  "mp4",
  "mp3",
  "zip",
  "rss",
  "atom",
]);

export type SitemapBodyFetcher = (url: string) => Promise<string | null>;

export async function fetchSitemapBody(
  sitemapUrl: string,
): Promise<string | null> {
  const result = await fetchPublicHttpResource(sitemapUrl, {
    accept:
      "application/xml, text/xml, application/rss+xml, application/octet-stream, text/*, */*;q=0.1",
    maxResponseBytes: MAX_SITEMAP_BODY_BYTES,
    readBody: ({ statusCode }) => statusCode >= 200 && statusCode < 300,
  });

  if (!result.ok || result.data.statusCode < 200 || result.data.statusCode >= 300) {
    return null;
  }

  return result.data.body || null;
}

export function parseSitemapLocs(body: string): string[] {
  const urls: string[] = [];
  const seen = new Set<string>();

  LOC_PATTERN.lastIndex = 0;
  let match: RegExpExecArray | null = LOC_PATTERN.exec(body);

  while (match && urls.length < MAX_SITEMAP_LOC_CANDIDATES) {
    const loc = match[1]?.trim();
    match = LOC_PATTERN.exec(body);

    if (!loc || seen.has(loc)) {
      continue;
    }

    seen.add(loc);
    urls.push(loc);
  }

  return urls;
}

export function sitemapLocToCandidate(
  loc: string,
  seedUrl: string,
  discoveredCount: number,
): NormalizedCrawlUrl | null {
  const lower = loc.toLowerCase();

  if (
    lower.includes("/image-sitemap") ||
    (lower.includes("sitemap") && lower.endsWith(".xml")) ||
    lower.endsWith(".xml.gz")
  ) {
    return null;
  }

  const decision = classifySkipReason({
    href: loc,
    baseUrl: seedUrl,
    seedUrl,
    discoveredCount,
  });

  if (!decision.ok) {
    return null;
  }

  const last = decision.url.path.split("/").filter(Boolean).at(-1);
  const extension = last?.includes(".")
    ? last.split(".").pop()?.toLowerCase()
    : null;

  if (extension && SKIP_SITEMAP_LOC_EXTENSIONS.has(extension)) {
    return null;
  }

  return decision.url;
}

export async function collectSitemapCandidates(options: {
  seedUrl: string;
  sitemapUrls: string[];
  discoveredCount: number;
  fetchBody?: SitemapBodyFetcher;
}): Promise<NormalizedCrawlUrl[]> {
  const fetchBody = options.fetchBody ?? fetchSitemapBody;
  const candidates: NormalizedCrawlUrl[] = [];
  const seen = new Set<string>();
  let discoveredCount = options.discoveredCount;

  for (const sitemapUrl of options.sitemapUrls.slice(0, 3)) {
    const body = await fetchBody(sitemapUrl);

    if (!body) {
      continue;
    }

    for (const loc of parseSitemapLocs(body)) {
      const candidate = sitemapLocToCandidate(
        loc,
        options.seedUrl,
        discoveredCount,
      );

      if (!candidate || seen.has(candidate.identity)) {
        continue;
      }

      seen.add(candidate.identity);
      candidates.push(candidate);
      discoveredCount += 1;

      if (candidates.length >= MAX_SITEMAP_LOC_CANDIDATES) {
        return candidates;
      }
    }
  }

  return candidates;
}
