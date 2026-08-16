import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

import type { WebsiteAuditError } from "./types";

const REQUEST_TIMEOUT_MS = 12_000;
const MAX_RESPONSE_BYTES = 2_000_000;
const MAX_REDIRECTS = 5;

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
  const version = isIP(address);

  if (version === 4) {
    return isPrivateIpv4(address);
  }

  if (version === 6) {
    return isPrivateIpv6(address);
  }

  return true;
}

async function validatePublicDestination(url: URL): Promise<void> {
  const hostname = url.hostname.toLowerCase().replace(/\.$/, "");

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

function isAllowedContentType(contentType: string | null): boolean {
  if (!contentType) {
    return false;
  }

  const normalizedContentType = contentType.toLowerCase();

  return ALLOWED_CONTENT_TYPES.some((allowedType) =>
    normalizedContentType.includes(allowedType),
  );
}

async function readLimitedResponseBody(
  response: Response,
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

      if (receivedBytes > MAX_RESPONSE_BYTES) {
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

export async function fetchWebsitePage(
  requestedUrl: string,
): Promise<FetchWebsiteResult> {
  let currentUrl: URL;

  try {
    currentUrl = new URL(requestedUrl);
  } catch {
    return createError(
      "INVALID_URL",
      "The submitted website URL is invalid.",
    );
  }

  const visitedUrls = new Set<string>();

  try {
    for (
      let redirectCount = 0;
      redirectCount <= MAX_REDIRECTS;
      redirectCount += 1
    ) {
      if (visitedUrls.has(currentUrl.toString())) {
        return createError(
          "FETCH_FAILED",
          "The website entered a redirect loop.",
        );
      }

      visitedUrls.add(currentUrl.toString());

      await validatePublicDestination(currentUrl);

      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        REQUEST_TIMEOUT_MS,
      );

      let response: Response;

      try {
        response = await fetch(currentUrl, {
          method: "GET",
          redirect: "manual",
          signal: controller.signal,
          headers: {
            Accept:
              "text/html,application/xhtml+xml;q=0.9,*/*;q=0.1",
            "User-Agent":
              "JS-Solutions-Website-Audit/1.0 (+https://js-growth.com)",
          },
          cache: "no-store",
        });
      } finally {
        clearTimeout(timeoutId);
      }

      if (isRedirectStatus(response.status)) {
        const location = response.headers.get("location");

        if (!location) {
          return createError(
            "FETCH_FAILED",
            "The website returned an invalid redirect.",
          );
        }

        if (redirectCount === MAX_REDIRECTS) {
          return createError(
            "FETCH_FAILED",
            "The website redirected too many times.",
          );
        }

        currentUrl = new URL(location, currentUrl);

        if (
          currentUrl.protocol !== "http:" &&
          currentUrl.protocol !== "https:"
        ) {
          return createError(
            "UNSUPPORTED_PROTOCOL",
            "The website redirected to an unsupported protocol.",
          );
        }

        continue;
      }

      const contentType = response.headers.get("content-type");

      if (!isAllowedContentType(contentType)) {
        return createError(
          "INVALID_CONTENT_TYPE",
          "The URL did not return an HTML webpage.",
        );
      }

      const declaredLength = Number(
        response.headers.get("content-length"),
      );

      if (
        Number.isFinite(declaredLength) &&
        declaredLength > MAX_RESPONSE_BYTES
      ) {
        return createError(
          "RESPONSE_TOO_LARGE",
          "The webpage is too large to audit safely.",
        );
      }

      const html = await readLimitedResponseBody(response);

      return {
        success: true,
        data: {
          requestedUrl,
          finalUrl: currentUrl.toString(),
          statusCode: response.status,
          contentType,
          xRobotsTag: response.headers.get("x-robots-tag"),
          html,
          fetchedAt: new Date().toISOString(),
        },
      };
    }

    return createError(
      "FETCH_FAILED",
      "The website could not be fetched.",
    );
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "PRIVATE_NETWORK"
    ) {
      return createError(
        "PRIVATE_NETWORK",
        "Private and internal network addresses cannot be audited.",
      );
    }

    if (
      error instanceof Error &&
      error.message === "RESPONSE_TOO_LARGE"
    ) {
      return createError(
        "RESPONSE_TOO_LARGE",
        "The webpage is too large to audit safely.",
      );
    }

    if (
      error instanceof DOMException &&
      error.name === "AbortError"
    ) {
      return createError(
        "FETCH_FAILED",
        "The website took too long to respond.",
      );
    }

    return createError(
      "FETCH_FAILED",
      "The website could not be reached. Verify the URL and try again.",
    );
  }
}