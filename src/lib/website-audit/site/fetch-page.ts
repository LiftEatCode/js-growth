import { fetchPublicHttpResource } from "../secure-fetch";
import type { AuditPerformanceDocumentContext } from "../types";

const MAX_HTML_RESPONSE_BYTES = 2_000_000;

const ALLOWED_CONTENT_TYPES = [
  "text/html",
  "application/xhtml+xml",
];

export function isAllowedHtmlContentType(
  contentType: string | null,
): boolean {
  if (!contentType) {
    return false;
  }

  const normalized = contentType.toLowerCase();
  return ALLOWED_CONTENT_TYPES.some((allowed) =>
    normalized.includes(allowed),
  );
}

export type SitePageFetchSuccess = {
  ok: true;
  requestedUrl: string;
  finalUrl: string;
  statusCode: number;
  contentType: string | null;
  xRobotsTag: string | null;
  html: string;
  document: AuditPerformanceDocumentContext;
};

export type SitePageFetchFailure = {
  ok: false;
  requestedUrl: string;
  finalUrl: string | null;
  statusCode: number | null;
  contentType: string | null;
  errorCode: string;
  nonHtml?: boolean;
};

export type SitePageFetchResult = SitePageFetchSuccess | SitePageFetchFailure;

export type SitePageFetcher = (url: string) => Promise<SitePageFetchResult>;

function isHttpSuccess(statusCode: number): boolean {
  return statusCode >= 200 && statusCode < 300;
}

/**
 * Same-site HTML fetch for the bounded crawl.
 * Reuses secure-fetch; never uses raw fetch().
 */
export async function fetchSitePage(
  requestedUrl: string,
): Promise<SitePageFetchResult> {
  const result = await fetchPublicHttpResource(requestedUrl, {
    accept:
      "text/html,application/xhtml+xml;q=0.9,*/*;q=0.1",
    maxResponseBytes: MAX_HTML_RESPONSE_BYTES,
    readBody: ({ contentType, statusCode }) =>
      isHttpSuccess(statusCode) && isAllowedHtmlContentType(contentType),
  });

  if (!result.ok) {
    return {
      ok: false,
      requestedUrl,
      finalUrl: result.finalUrl,
      statusCode: result.statusCode,
      contentType: result.contentType,
      errorCode: result.error.code,
    };
  }

  const { statusCode, contentType, finalUrl } = result.data;

  if (!isHttpSuccess(statusCode)) {
    return {
      ok: false,
      requestedUrl,
      finalUrl,
      statusCode,
      contentType,
      errorCode:
        statusCode === 404 || statusCode === 410
          ? "HTTP_NOT_FOUND"
          : "HTTP_ERROR",
    };
  }

  if (!isAllowedHtmlContentType(contentType)) {
    return {
      ok: false,
      requestedUrl,
      finalUrl,
      statusCode,
      contentType,
      errorCode: "INVALID_CONTENT_TYPE",
      nonHtml: true,
    };
  }

  return {
    ok: true,
    requestedUrl: result.data.requestedUrl,
    finalUrl,
    statusCode,
    contentType,
    xRobotsTag: result.data.xRobotsTag,
    html: result.data.body,
    document: {
      advertisedContentLength: result.data.advertisedContentLength,
      contentEncoding: result.data.contentEncoding,
      cacheControl: result.data.cacheControl,
      expires: result.data.expires,
      etag: result.data.etag,
      lastModified: result.data.lastModified,
      documentFetchDurationMs: result.data.responseDurationMs,
    },
  };
}
