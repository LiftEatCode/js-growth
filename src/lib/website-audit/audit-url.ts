import {
  fetchPublicHttpResource,
  type SecureFetchErrorCode,
} from "./secure-fetch";
import type { WebsiteAuditError } from "./types";

const MAX_HTML_RESPONSE_BYTES = 2_000_000;

const ALLOWED_CONTENT_TYPES = [
  "text/html",
  "application/xhtml+xml",
];

export interface FetchedWebsitePage {
  requestedUrl: string;
  finalUrl: string;
  statusCode: number;
  contentType: string | null;
  xRobotsTag: string | null;
  html: string;
  fetchedAt: string;
  contentEncoding: string | null;
  cacheControl: string | null;
  expires: string | null;
  etag: string | null;
  lastModified: string | null;
  advertisedContentLength: number | null;
  documentFetchDurationMs: number | null;
}

export type FetchWebsiteResult =
  | {
      success: true;
      data: FetchedWebsitePage;
    }
  | WebsiteAuditError;

function createError(
  code: WebsiteAuditError["error"]["code"],
  message: string,
): WebsiteAuditError {
  return {
    success: false,
    error: {
      code,
      message,
    },
  };
}

function isAllowedContentType(contentType: string | null): boolean {
  if (!contentType) {
    return false;
  }

  const normalizedContentType = contentType.toLowerCase();

  return ALLOWED_CONTENT_TYPES.some((allowedType) =>
    normalizedContentType.includes(allowedType),
  );
}

function mapSecureFetchError(
  code: SecureFetchErrorCode,
): WebsiteAuditError {
  switch (code) {
    case "INVALID_URL":
      return createError(
        "INVALID_URL",
        "The submitted website URL is invalid.",
      );
    case "UNSUPPORTED_PROTOCOL":
      return createError(
        "UNSUPPORTED_PROTOCOL",
        "The website redirected to an unsupported protocol.",
      );
    case "PRIVATE_NETWORK":
      return createError(
        "PRIVATE_NETWORK",
        "Private and internal network addresses cannot be audited.",
      );
    case "RESPONSE_TOO_LARGE":
      return createError(
        "RESPONSE_TOO_LARGE",
        "The webpage is too large to audit safely.",
      );
    case "TIMEOUT":
      return createError(
        "FETCH_FAILED",
        "The website took too long to respond. Check the address and try again.",
      );
    case "REDIRECT_LOOP":
      return createError(
        "FETCH_FAILED",
        "The website entered a redirect loop.",
      );
    case "INVALID_REDIRECT":
      return createError(
        "FETCH_FAILED",
        "The website returned an invalid redirect.",
      );
    case "TOO_MANY_REDIRECTS":
      return createError(
        "FETCH_FAILED",
        "The website redirected too many times.",
      );
    default:
      return createError(
        "FETCH_FAILED",
        "The website could not be reached. Verify the URL and try again.",
      );
  }
}

export async function fetchWebsitePage(
  requestedUrl: string,
  options?: {
    timeoutMs?: number;
  },
): Promise<FetchWebsiteResult> {
  const result = await fetchPublicHttpResource(requestedUrl, {
    accept:
      "text/html,application/xhtml+xml;q=0.9,*/*;q=0.1",
    maxResponseBytes: MAX_HTML_RESPONSE_BYTES,
    timeoutMs: options?.timeoutMs,
    readBody: ({ contentType }) =>
      isAllowedContentType(contentType),
  });

  if (!result.ok) {
    return mapSecureFetchError(result.error.code);
  }

  if (!isAllowedContentType(result.data.contentType)) {
    return createError(
      "INVALID_CONTENT_TYPE",
        "This URL did not return a webpage we can audit. Enter a homepage such as example.com and try again.",
    );
  }

  return {
    success: true,
    data: {
      requestedUrl: result.data.requestedUrl,
      finalUrl: result.data.finalUrl,
      statusCode: result.data.statusCode,
      contentType: result.data.contentType,
      xRobotsTag: result.data.xRobotsTag,
      html: result.data.body,
      fetchedAt: new Date().toISOString(),
      contentEncoding: result.data.contentEncoding,
      cacheControl: result.data.cacheControl,
      expires: result.data.expires,
      etag: result.data.etag,
      lastModified: result.data.lastModified,
      advertisedContentLength: result.data.advertisedContentLength,
      documentFetchDurationMs: result.data.responseDurationMs,
    },
  };
}
