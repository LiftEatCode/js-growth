import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

const DEFAULT_TIMEOUT_MS = 12_000;
const DEFAULT_MAX_REDIRECTS = 5;

export const AUDIT_USER_AGENT =
  "JS-Solutions-Website-Audit/1.0 (+https://js-growth.com)";

export type SecureFetchErrorCode =
  | "INVALID_URL"
  | "UNSUPPORTED_PROTOCOL"
  | "PRIVATE_NETWORK"
  | "FETCH_FAILED"
  | "RESPONSE_TOO_LARGE"
  | "REDIRECT_LOOP"
  | "INVALID_REDIRECT"
  | "TOO_MANY_REDIRECTS"
  | "TIMEOUT";

export interface FetchedPublicResource {
  requestedUrl: string;
  finalUrl: string;
  statusCode: number;
  contentType: string | null;
  xRobotsTag: string | null;
  contentEncoding: string | null;
  cacheControl: string | null;
  expires: string | null;
  etag: string | null;
  lastModified: string | null;
  advertisedContentLength: number | null;
  responseDurationMs: number;
  body: string;
}

export type FetchPublicResourceResult =
  | {
      ok: true;
      data: FetchedPublicResource;
    }
  | {
      ok: false;
      requestedUrl: string;
      finalUrl: string | null;
      statusCode: number | null;
      contentType: string | null;
      error: {
        code: SecureFetchErrorCode;
        message: string;
      };
    };

export interface FetchPublicResourceOptions {
  accept: string;
  maxResponseBytes: number;
  timeoutMs?: number;
  maxRedirects?: number;
  /**
   * Whether to download the response body after a non-redirect response.
   * Sitemap existence checks cancel the body to stay bounded.
   */
  readBody?: (info: {
    statusCode: number;
    contentType: string | null;
    contentLength: number | null;
  }) => boolean;
}

function stripIpv6Brackets(hostname: string): string {
  if (hostname.startsWith("[") && hostname.endsWith("]")) {
    return hostname.slice(1, -1);
  }

  return hostname;
}

function ipv4FromMappedIpv6(address: string): string | null {
  const dotted = address.match(
    /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i,
  );

  if (dotted?.[1]) {
    return dotted[1];
  }

  const hex = address.match(
    /^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/i,
  );

  if (!hex?.[1] || !hex[2]) {
    return null;
  }

  const high = Number.parseInt(hex[1], 16);
  const low = Number.parseInt(hex[2], 16);

  return [
    (high >> 8) & 255,
    high & 255,
    (low >> 8) & 255,
    low & 255,
  ].join(".");
}

function isPrivateIpv4(address: string): boolean {
  const octets = address.split(".").map(Number);

  if (octets.length !== 4 || octets.some(Number.isNaN)) {
    return true;
  }

  const [first, second] = octets;

  return (
    first === 0 ||
    first === 10 ||
    first === 127 ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168) ||
    (first === 100 && second >= 64 && second <= 127) ||
    first >= 224
  );
}

function isPrivateIpv6(address: string): boolean {
  const normalized = address.toLowerCase();
  const mappedIpv4 = ipv4FromMappedIpv6(normalized);

  if (mappedIpv4) {
    return isPrivateIpv4(mappedIpv4);
  }

  return (
    normalized === "::" ||
    normalized === "::1" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    normalized.startsWith("fe8") ||
    normalized.startsWith("fe9") ||
    normalized.startsWith("fea") ||
    normalized.startsWith("feb") ||
    normalized.startsWith("ff") ||
    normalized.startsWith("::ffff:127.") ||
    normalized.startsWith("::ffff:10.") ||
    normalized.startsWith("::ffff:192.168.") ||
    /^::ffff:172\.(1[6-9]|2\d|3[01])\./.test(normalized)
  );
}

function isPrivateIpAddress(address: string): boolean {
  const normalized = stripIpv6Brackets(address.toLowerCase());
  const version = isIP(normalized);

  if (version === 4) {
    return isPrivateIpv4(normalized);
  }

  if (version === 6) {
    return isPrivateIpv6(normalized);
  }

  return true;
}

function isHttpProtocol(url: URL): boolean {
  return url.protocol === "http:" || url.protocol === "https:";
}

/**
 * Rejects localhost, private IPs, link-local, and internal DNS names
 * before any request is sent. Called again for every redirect hop.
 *
 * Node's URL parser keeps brackets around IPv6 hostnames (`[::1]`),
 * so brackets are stripped before IP classification.
 */
export async function validatePublicDestination(
  url: URL,
): Promise<void> {
  const hostname = stripIpv6Brackets(
    url.hostname.toLowerCase().replace(/\.$/, ""),
  );

  if (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal")
  ) {
    throw new Error("PRIVATE_NETWORK");
  }

  if (isIP(hostname)) {
    if (isPrivateIpAddress(hostname)) {
      throw new Error("PRIVATE_NETWORK");
    }

    return;
  }

  const addresses = await lookup(hostname, {
    all: true,
    verbatim: true,
  });

  if (addresses.length === 0) {
    throw new Error("DNS_LOOKUP_FAILED");
  }

  if (addresses.some(({ address }) => isPrivateIpAddress(address))) {
    throw new Error("PRIVATE_NETWORK");
  }
}

function isRedirectStatus(statusCode: number): boolean {
  return [301, 302, 303, 307, 308].includes(statusCode);
}

async function readLimitedResponseBody(
  response: Response,
  maxResponseBytes: number,
): Promise<string> {
  if (!response.body) {
    return "";
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const chunks: string[] = [];

  let receivedBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      receivedBytes += value.byteLength;

      if (receivedBytes > maxResponseBytes) {
        await reader.cancel();

        throw new Error("RESPONSE_TOO_LARGE");
      }

      chunks.push(decoder.decode(value, { stream: true }));
    }

    chunks.push(decoder.decode());

    return chunks.join("");
  } finally {
    reader.releaseLock();
  }
}

async function discardResponseBody(
  response: Response,
): Promise<void> {
  if (!response.body) {
    return;
  }

  await response.body.cancel();
}

function createFailure(
  requestedUrl: string,
  code: SecureFetchErrorCode,
  message: string,
  extras?: {
    finalUrl?: string | null;
    statusCode?: number | null;
    contentType?: string | null;
  },
): FetchPublicResourceResult {
  return {
    ok: false,
    requestedUrl,
    finalUrl: extras?.finalUrl ?? null,
    statusCode: extras?.statusCode ?? null,
    contentType: extras?.contentType ?? null,
    error: {
      code,
      message,
    },
  };
}

function mapCaughtError(
  requestedUrl: string,
  error: unknown,
  finalUrl: string | null,
): FetchPublicResourceResult {
  if (error instanceof Error && error.message === "PRIVATE_NETWORK") {
    return createFailure(
      requestedUrl,
      "PRIVATE_NETWORK",
      "Private and internal network addresses cannot be requested.",
      { finalUrl },
    );
  }

  if (error instanceof Error && error.message === "RESPONSE_TOO_LARGE") {
    return createFailure(
      requestedUrl,
      "RESPONSE_TOO_LARGE",
      "The response is too large to process safely.",
      { finalUrl },
    );
  }

  if (
    error instanceof DOMException &&
    error.name === "AbortError"
  ) {
    return createFailure(
      requestedUrl,
      "TIMEOUT",
      "The request took too long to respond.",
      { finalUrl },
    );
  }

  return createFailure(
    requestedUrl,
    "FETCH_FAILED",
    "The URL could not be reached.",
    { finalUrl },
  );
}

/**
 * Fetch an HTTP(S) URL with the same SSRF, redirect, timeout, and
 * size protections used for the audited webpage.
 */
export async function fetchPublicHttpResource(
  requestedUrl: string,
  options: FetchPublicResourceOptions,
): Promise<FetchPublicResourceResult> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxRedirects = options.maxRedirects ?? DEFAULT_MAX_REDIRECTS;
  const shouldReadBody =
    options.readBody ??
    (() => true);

  let currentUrl: URL;

  try {
    currentUrl = new URL(requestedUrl);
  } catch {
    return createFailure(
      requestedUrl,
      "INVALID_URL",
      "The URL is invalid.",
    );
  }

  if (!isHttpProtocol(currentUrl)) {
    return createFailure(
      requestedUrl,
      "UNSUPPORTED_PROTOCOL",
      "Only HTTP and HTTPS URLs are supported.",
    );
  }

  const visitedUrls = new Set<string>();
  const startedAt = Date.now();

  try {
    for (
      let redirectCount = 0;
      redirectCount <= maxRedirects;
      redirectCount += 1
    ) {
      if (visitedUrls.has(currentUrl.toString())) {
        return createFailure(
          requestedUrl,
          "REDIRECT_LOOP",
          "The URL entered a redirect loop.",
          { finalUrl: currentUrl.toString() },
        );
      }

      visitedUrls.add(currentUrl.toString());

      await validatePublicDestination(currentUrl);

      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        timeoutMs,
      );

      let response: Response;

      try {
        response = await fetch(currentUrl, {
          method: "GET",
          redirect: "manual",
          signal: controller.signal,
          headers: {
            Accept: options.accept,
            "User-Agent": AUDIT_USER_AGENT,
          },
          cache: "no-store",
        });
      } finally {
        clearTimeout(timeoutId);
      }

      if (isRedirectStatus(response.status)) {
        await discardResponseBody(response);

        const location = response.headers.get("location");

        if (!location) {
          return createFailure(
            requestedUrl,
            "INVALID_REDIRECT",
            "The URL returned an invalid redirect.",
            {
              finalUrl: currentUrl.toString(),
              statusCode: response.status,
            },
          );
        }

        if (redirectCount === maxRedirects) {
          return createFailure(
            requestedUrl,
            "TOO_MANY_REDIRECTS",
            "The URL redirected too many times.",
            {
              finalUrl: currentUrl.toString(),
              statusCode: response.status,
            },
          );
        }

        currentUrl = new URL(location, currentUrl);

        if (!isHttpProtocol(currentUrl)) {
          return createFailure(
            requestedUrl,
            "UNSUPPORTED_PROTOCOL",
            "The URL redirected to an unsupported protocol.",
            { finalUrl: currentUrl.toString() },
          );
        }

        continue;
      }

      const contentType = response.headers.get("content-type");
      const xRobotsTag = response.headers.get("x-robots-tag");
      const contentEncoding = response.headers.get("content-encoding");
      const cacheControl = response.headers.get("cache-control");
      const expires = response.headers.get("expires");
      const etag = response.headers.get("etag");
      const lastModified = response.headers.get("last-modified");
      const declaredLength = Number(
        response.headers.get("content-length"),
      );
      const contentLength = Number.isFinite(declaredLength)
        ? declaredLength
        : null;
      const headerFields = {
        contentEncoding,
        cacheControl,
        expires,
        etag,
        lastModified,
        advertisedContentLength: contentLength,
      };
      const readBody = shouldReadBody({
        statusCode: response.status,
        contentType,
        contentLength,
      });

      if (!readBody) {
        await discardResponseBody(response);

        return {
          ok: true,
          data: {
            requestedUrl,
            finalUrl: currentUrl.toString(),
            statusCode: response.status,
            contentType,
            xRobotsTag,
            ...headerFields,
            responseDurationMs: Math.max(0, Date.now() - startedAt),
            body: "",
          },
        };
      }

      if (
        contentLength !== null &&
        contentLength > options.maxResponseBytes
      ) {
        await discardResponseBody(response);

        return createFailure(
          requestedUrl,
          "RESPONSE_TOO_LARGE",
          "The response is too large to process safely.",
          {
            finalUrl: currentUrl.toString(),
            statusCode: response.status,
            contentType,
          },
        );
      }

      const body = await readLimitedResponseBody(
        response,
        options.maxResponseBytes,
      );

      return {
        ok: true,
        data: {
          requestedUrl,
          finalUrl: currentUrl.toString(),
          statusCode: response.status,
          contentType,
          xRobotsTag,
          ...headerFields,
          responseDurationMs: Math.max(0, Date.now() - startedAt),
          body,
        },
      };
    }

    return createFailure(
      requestedUrl,
      "FETCH_FAILED",
      "The URL could not be fetched.",
    );
  } catch (error) {
    return mapCaughtError(
      requestedUrl,
      error,
      currentUrl?.toString() ?? null,
    );
  }
}
